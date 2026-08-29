# archeglyph — project-layer pipeline for Koine lifting

**Status:** forward-looking note. Not required for v1 implementation; required before archeglyph's TS source can be lifted into Koine's Archelemma IR as a unit. Capture now so the requirement isn't lost when we get there.
**Date:** 2026-05-02 (refreshed after Koine slices 1-7 shipped)

**Shelved (2026-08-29):** this TS-lift-through-a-project-pipeline path is no longer
the active plan. Koine is pursuing a direct `Archelemma → archeglyph.content.v1`
importer instead — Loganita is a native protobuf-graph producer, so bouncing
through TS lifting (and Archegraph's text-extraction machinery) to reach a
visualization consumer is an unnecessary hop. See `koine`'s
`docs/settled/DECISIONS-NEEDED.md` entry L-31. This doc may still become relevant
later if lifting archeglyph's own TS source is revisited, but it's not the
priority now.

## Context

The Koine TypeScript lifter (`koine-lifter-ts`) operates on a **single file at a time**. It deliberately doesn't model the module graph — imports as statements drop to `Unsupported` (harmless metadata), and uses of imported names lift as bare-name `VarRef` / `NamedTypeRef` references that the project layer is responsible for resolving.

For archeglyph to lift coherently as a multi-package monorepo, archeglyph itself must own the project-layer pipeline that walks the import graph and stitches per-file lift outputs into one Archelemma module. This is **archeglyph-side infrastructure**, distinct from any Koine lifter work.

A stub resolver lives in `koine/crates/lifter-ts/tests/support/mod.rs` (a `HashMap<String, String>` rewriting bare-name VarRefs/SetRefs to FQN-qualified forms). archeglyph's pipeline extends that pattern to the whole repo.

## What the pipeline does

For each lift run across the archeglyph monorepo:

1. **Walk the import graph** across packages (`@archeglyph/proto`, `@archeglyph/core`, `@archeglyph/cli`, `@archeglyph/editor`, `@archeglyph/importer-archegraph`, `@archeglyph/themes`).
2. **Build per-file FQN maps** — e.g. for `core/src/resolver.ts`:
   ```
   { "Diagram"        → "proto.content.Diagram",
     "Stylesheet"     → "proto.style.Stylesheet",
     "loadDiagram"    → "core.loaders.loadDiagram",
     "Vec2"           → "proto.style.Vec2",
     ... }
   ```
3. **Lift each file** with the Koine TS lifter, passing in its FQN map.
4. **Concatenate all `Definition`s** from every file into a single Archelemma module.
5. **Run the typechecker** against the merged symbol table.
6. **Surface diagnostics** — both lift diagnostics (per-file Unsupported reasons) and typecheck diagnostics (cross-file resolution failures).

Output: one Archelemma module representing the entire archeglyph repo's structural surface, with annotated holes where lifter coverage is incomplete.

## Code-style rules

Code-style rules — what does and doesn't lift, what's forbidden by design, what's engineering debt, and the cascading-loss patterns to avoid — live in **[`docs/style-guide.md`](./style-guide.md)**, the consolidated AI-facing guide.

Three pipeline-relevant constraints worth highlighting (full reasoning + alternatives in the style guide):

1. **No namespace imports** (`import * as ns from './foo'`) — the namespace `ns` has no value-type the typechecker can model.
2. **No re-exports** (`export * from './sub'`, `export { x } from './sub'`) — not modeled by the lifter; re-import + re-declare instead.
3. **No `export default`** — use named exports throughout.

These are cheap to follow from day one and expensive to retrofit. See style-guide §3.5–3.6 and §4 for the reasoning and full set of import/export constraints.

## Lifter feature requirements

As of 2026-05-02, **Koine lifter slices 1-7 have shipped**, covering most of the surface that archeglyph's pure-logic code needs:

- ✅ `Option<T>`, `Result<T, E>`, `Map<K, V>`, `Set<T>`, `Promise<T>` as built-in types
- ✅ `null` / `undefined` lift to `None`; `T | null` types collapse to `Option<T>`
- ✅ Optional chaining (`?.`) and nullish coalescing (`??`)
- ✅ Unary operators (`!`, `-`, `+`)
- ✅ Type assertions (`as T`, `as const`) — lift as identity at boundary calls
- ✅ Array indexing (`arr[i]` → `List.at`)
- ✅ `for...of` over arrays
- ✅ Index signatures (`interface M { [k]: V }` → `Map<K, V>` alias)
- ✅ `let` accumulator pattern (flat reassignment via SSA rewrite)
- ✅ `++` / `--` desugar
- ✅ LHS and parameter destructuring (basic shapes)
- ✅ `break` and `continue` inside loop bodies
- ✅ Class parameter properties, field initializers, static fields, static method calls
- ✅ Same-module interface inheritance

Items deferred (see style-guide §5 for workarounds): explicit enum values, bare `None` constructor recognition, auto-wrap `T → Some(T)`, cross-module interface inheritance, spread/rest, default parameters, per-method generics.

The pipeline can run today; as remaining items land, the same pipeline produces denser IR with no archeglyph-side changes.

## Implementation notes (when this work begins)

- Reference implementation: the stub resolver in `koine/crates/lifter-ts/tests/support/mod.rs`.
- The pipeline can be a thin Bun/TypeScript script that orchestrates a Rust-side Koine lifter binary (or a Wasm-compiled library, if available).
- FQN-map construction can use TypeScript's compiler API (`ts.createProgram`) to walk imports — same machinery `tsc` uses internally.
- The output Archelemma module is the input to archegraph's analysis (or any other Archelemma consumer).

## When this work happens

Not v1. v1 ships the archeglyph CLI + editor + core engine without any Koine integration. The lift pipeline becomes relevant when:

- archeglyph is mature enough that lift-clean source is worth the discipline overhead, AND
- the remaining engineering-debt items in style-guide §5 are far enough along that lifting archeglyph produces useful IR (rather than mostly-Unsupported placeholder forests).

Until then, the value of this doc is: **don't paint into a corner**. Apply the code-style rules in `style-guide.md` from day one. They're cheap discipline now; retrofitting them later is expensive.
