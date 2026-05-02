# archeglyph — project-layer pipeline for Koine lifting

**Status:** forward-looking note. Not required for v1 implementation; required before archeglyph's TS source can be lifted into Koine's Archelemma IR as a unit. Capture now so the requirement isn't lost when we get there.
**Date:** 2026-05-02

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

## Required code-style constraints

For project-layer stitching to work, archeglyph code must follow three rules from day one. These are cheap to follow and expensive to retrofit:

1. **No namespace imports** — `import * as ns from './foo'; ns.bar()` doesn't lift (the namespace `ns` has no value-type the typechecker can model). Use **named imports** instead:
   - ❌ `import * as utils from './utils'; utils.helper()`
   - ✅ `import { helper } from './utils'; helper()`

2. **No re-exports** — `export * from './sub'` and `export { x } from './sub'` aren't modeled. Each `index.ts` (if used at all) must re-import + re-declare/re-export explicitly, or consumers import directly from sub-paths:
   - ❌ `export * from './loaders';` (in `core/src/index.ts`)
   - ✅ Consumers import from `'@archeglyph/core/loaders'` directly
   - ✅ Or: `import { loadDiagram } from './loaders'; export { loadDiagram };` (explicit re-export)

3. **No `export default`** — works for named exports; default-export shape is "untested" per Koine docs. Use named exports throughout:
   - ❌ `export default function render(...) { ... }`
   - ✅ `export function render(...) { ... }`

These constraints affect package public-API ergonomics slightly (more verbose imports) but don't affect anything else. They're consistent with the broader "explicit over implicit" style that the lifter rewards.

## Lifter feature requirements

The pipeline assumes some Koine lifter features land that are not yet shipped. See the parallel discussion of priorities. Minimum requirements for archeglyph to lift its core logic:

- `Option<T>` as a built-in Coproduct (or: archeglyph's protobuf codegen emits `Option<T>` directly instead of `T | undefined`)
- `Result<T, E>` as a built-in Coproduct (archeglyph uses Result-style error handling instead of try/catch)
- `Map<K, V>` as a built-in type (many proto `map<K, V>` fields)
- Unary operators (`!`, `-`, `+`)
- Type assertions (`as T`) — lift as identity at FFI seams

The pipeline can run today with current lifter capabilities; it just produces more `Unsupported` holes per file. As lifter features land, the same pipeline produces denser IR with no archeglyph-side changes.

## Code patterns to avoid (cause cascading IR holes)

Beyond the import constraints, archeglyph code should also avoid the three patterns that cause **block-level or scope-level cascading losses** in lifted IR (vs single-point losses, which are tolerable):

1. **Mutated `let`** — one reassignment cascades through the entire scope (variable + every reference becomes Unsupported). Use `const` + recursion or fold helpers.
2. **`break` / `continue` / early `return` inside loops** — the entire loop becomes one Unsupported statement. Use recursive helpers or accumulate-then-process patterns.
3. **`try` / `catch`** — entire try block becomes Unsupported. Use `Result<T, E>` everywhere and avoid try/catch except at the very outer JS-interop boundary (where the loss is bounded).

Single-point losses are acceptable (async/await, throw, optional chaining, type assertions, null/undefined literals at JS seams). The function's structural shape lifts cleanly around them; only the specific expression becomes a leaf-level Unsupported.

## Implementation notes (when this work begins)

- Reference implementation: the stub resolver in `koine/crates/lifter-ts/tests/support/mod.rs`.
- The pipeline can be a thin Bun/TypeScript script that orchestrates a Rust-side Koine lifter binary (or a Wasm-compiled library, if available).
- FQN-map construction can use TypeScript's compiler API (`ts.createProgram`) to walk imports — same machinery `tsc` uses internally.
- The output Archelemma module is the input to archegraph's analysis (or any other Archelemma consumer).

## When this work happens

Not v1. v1 ships the archeglyph CLI + editor + core engine without any Koine integration. The lift pipeline becomes relevant when:

- archeglyph is mature enough that lift-clean source is worth the discipline overhead, AND
- Koine lifter has shipped enough features that lifting archeglyph produces useful IR (rather than mostly-Unsupported placeholder forests).

Until then, the value of this doc is: **don't paint into a corner**. Apply the three code-style constraints (no namespace imports, no re-exports, no `export default`) from day one of archeglyph implementation, and avoid the three cascading-loss patterns (mutated `let`, break-in-loop, try/catch wrapping logic). These are cheap discipline; retrofitting them later is expensive.
