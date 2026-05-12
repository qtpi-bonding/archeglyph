# Classifier: greenfield ADD StructDecl-with-`implements` never triggers agent

**Date:** 2026-05-11
**Source:** archeglyph dogfood — resolver pillar second build attempt (after `ccc64f1` fix)
**Status:** Bug report. Blocks any greenfield TS project authored in v1.1 from getting agent-filled impl bodies via the canonical StructDecl-with-`implements` pattern.
**Build:** archeglyph commit `f8ce3a8` · archegraph vendored `ccc64f1` · build_id `2323062c-4749-4149-bd38-55e17c81aae2`

---

## Symptom

Three TS impl-class StructDecls in the resolver pillar (`VisibilityFilterImpl`,
`StyleCascadeImpl`, `TokenResolverImpl`) — each authored per the canonical
TS v1.1 pattern (StructDecl with `implements: [...]` and `methods: [...]`)
— ran codegen successfully but **the agent never ran on any of them**.
All three `impl.ts` files ended up with `{ throw new Error('not implemented'); }`
method bodies in their final state.

archebuild scheduler log shows the classification:

```
scheduler: per-node strategy
  symbol=packages/core/src/resolver/visibility_filter/impl.ts/VisibilityFilterImpl#
  strategy=CodeGen  has_codegen=true
  target="packages/core/src/resolver/visibility_filter/impl.ts"
```

`strategy=CodeGen` (not `CodeGenThenAgentGen`), one attempt total per
node, no agent invocation. sqlite confirms:

```sql
sqlite> SELECT symbol, attempt, success, length(output)
   FROM results WHERE build_id = '2323062c-…' AND symbol LIKE '%Impl#';

VisibilityFilterImpl# | 1 | 0 |    0   (-- failed, but for a separate worktree-race bug)
StyleCascadeImpl#     | 1 | 1 |    0   (-- succeeded as scaffold-only; no agent attempt)
TokenResolverImpl#    | 1 | 1 |    0
```

Compare to canonical TS example (`examples/todo-api-brownfield/archebuild.db`)
which DID get an agent run on the same shape of decl:

```sql
TodoServiceMemory# | 1 | 0 |    0    (-- attempt 1 fails: scaffolding pseudo-record)
TodoServiceMemory# | 2 | 1 | 1582    (-- attempt 2: agent runs, 1582 bytes of output)
```

---

## Root cause (best read of the source)

`crates/build-core/src/classify.rs::classify(...)`:

```rust
// kind_label == "ImplBlock" is the marker that triggers
// CodeGenThenAgentGen for impl-block-style nodes.
if node.kind_label == "ImplBlock" {
    return BuildStrategy::CodeGenThenAgentGen;
}

let kind = NodeKind::try_from(node.kind).unwrap_or(NodeKind::Unspecified);
match kind {
    NodeKind::File | NodeKind::Namespace => BuildStrategy::CodeGen,
    NodeKind::Struct | NodeKind::Interface | NodeKind::Enum => BuildStrategy::CodeGen,
    NodeKind::Method => BuildStrategy::CodeGenThenAgentGen,
    // ...
}
```

`crates/intent/src/spec_v1_translator.rs:752`:

```
// Stamp kind_label="ImplBlock" on impl-block namespace nodes so [classifier picks them up]
```

The kind_label="ImplBlock" stamp **only fires for NamespaceDecl(impl: ImplIdentity{...})**
— the Rust trait-impl-block syntactic pattern. For TypeScript, the
canonical pattern (per the skill and per `examples/todo-api-brownfield/spec/todo_service_memory.spec.textproto`)
is **StructDecl with `implements: [...]`**, which goes through the
generic NodeKind::Struct path and classifies as plain `CodeGen`.

Greenfield ADD path is also missing: brownfield check fires only when
`change_type == Modified` AND `implement_location` exists on disk. For
a new TS impl class authored greenfield, neither holds, so classification
falls through to NodeKind::Struct rule.

The canonical TS example's `TodoServiceMemory#` got `CodeGenThenAgentGen`
somehow — but I can't reproduce that classification in our build with
ostensibly the same spec shape. Either:
- Canonical was built against an earlier version of the classifier
  that had a path we no longer hit, or
- There's a subtle compose-time / gcode-state difference between
  brownfield-todo-api and our greenfield-resolver setup that causes
  the canonical to be tagged as Modified for that struct.

In either case the bug-from-archeglyph's-perspective is the same:
**greenfield TS projects authored per the v1.1 StructDecl-with-`implements`
pattern can't get agent-filled bodies through the spec flow today.**

---

## Suggested fixes (pick one)

**A. Stamp `kind_label="ImplBlock"` on StructDecl-with-`implements` too.**
   The TS canonical pattern's structural intent is identical to the Rust
   NamespaceDecl(impl)'s: "this is the implementation half of a contract
   declared elsewhere." Treat them identically downstream by tagging both
   with the same kind_label at translation time. Minimal classifier
   change (existing rule fires for both shapes).

**B. Refine the classifier to recognise Struct-with-`implements` + non-empty `methods` directly.**
   Add a rule before the kind dispatch:

   ```rust
   if matches!(kind, NodeKind::Struct)
       && has_implements_with_methods(node)
   {
       return BuildStrategy::CodeGenThenAgentGen;
   }
   ```

   No translator change; logic lives in classify.rs.

**C. Hybrid: tag at translator AND honour in classifier.**
   Pick whichever surface is more idiomatic for archegraph's invariants.

(A) feels right to me — the existing `ImplBlock` label was already
intended as the marker for "needs an agent half," and conceptually a
TS class implementing an interface IS the language-specific surface
form of the same idea.

---

## Adjacent question — were these decls being lifted to ImplBlock nodes earlier?

The canonical's `TodoServiceMemory#` clearly classified as `CodeGenThenAgentGen`
at the time its build ran. If you bisect classify.rs and spec_v1_translator.rs
history against the commit hash of the canonical's saved archebuild.db,
the lost path should pop out.

---

## Repro

```bash
cd <local-path>
git checkout resolver-pre-build
archebuild-server &
archegraph-cli compose \
  $(ls .archegraph/specs/resolver/*.spec.textproto | sed 's|^|--spec-file |' | tr '\n' ' ') \
  --gcode .archegraph/gcode.pb \
  --spec resolver \
  --dag-output .archegraph/specs/resolver/dag.pb
archegraph-cli submit-dag \
  --dag .archegraph/specs/resolver/dag.pb \
  --context .archegraph/specs/resolver/gcontract.pb \
  --config archebuild.yaml \
  --server http://localhost:50051

# Build completes ~15s. Inspect resulting impl.ts files in the build worktree:
ls .archebuild/worktrees/archebuild-*-_dag/packages/core/src/resolver/visibility_filter/impl.ts
# ...contains `{ throw new Error('not implemented'); }` instead of agent-filled body.

# Compare classification:
sqlite3 archebuild.db "SELECT symbol, attempt, length(output) FROM results WHERE symbol LIKE '%Impl#'"
# Single attempt with 0 output bytes = agent did not run.
```
