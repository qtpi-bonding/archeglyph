# Spec v1 — `MethodDecl` shape and generics

**Date:** 2026-05-10
**Source:** archeglyph dogfood
**Status:** Feedback / design discussion seed (not a proposal we're committed to)

---

## Context

We hit this while authoring archeglyph's resolver pillar against the new
`archegraph_spec_v1.proto` schema. The schema redesign at
`docs/superpowers/specs/2026-05-08-spec-schema-redesign.md` cleanly closes the
gaps that were motivating this dogfood (free fns, constants, type aliases,
mixed-export modules) — we want to start there: the substrate is right.

What surfaced as we moved from "imagined authoring" to "actually authoring":
two related tensions in `MethodDecl`'s field shape, both inside Path B''
rather than challenging it. Filing as feedback because they showed up
fast enough that other dogfood projects will likely hit them too.

---

## Issue 1 — Opaque `signature` string loses cross-message validation

In the old `(archegraph.spec.opts)` surface, rpc input/output types were
named messages:

```proto
service TodoService {
  rpc listTodos(ListTodosRequest) returns (ListTodosResponse);
  //            ^^^^^^^^^^^^^^^^^         ^^^^^^^^^^^^^^^^^^
  // protoc resolved these across imports — typos failed at parse time.
}
```

In v1, the same intent becomes:

```textproto
methods: [
  { name: "listTodos"
    signature: "(request: ListTodosRequest): Promise<ListTodosResponse>"
    is_async: true }
]
```

`signature` is opaque language syntax. Textproto's parser validates the
schema (field names, structure) but doesn't reach into the string. Typos
in type names (`ListTodosResponze`) survive parse, survive compose name
resolution (assuming compose treats signature as a pass-through to
codegen), and only surface when emitted code hits the language compiler.

This is a real regression in the dev loop. Old: error at protoc
invocation, instant. New: full compose + codegen + typecheck round trip.

**Inconsistency with FieldDecl.** `FieldDecl.type` is structured
(`TypeRef`), validated structurally. `MethodDecl.signature` is opaque.
There's no principled reason for the asymmetry — both are "the type of
this thing" at the spec layer. Treating them differently means readers
have to remember which one validates and which doesn't.

### Proposed change (additive, v1.1)

Replace `MethodDecl.signature` with structured fields:

```proto
message MethodDecl {
  string name = 1;
  repeated Param inputs = 2;       // NEW
  TypeRef output = 3;              // NEW
  string doc = 4;
  // is_async, uses, change_type, checks, nuance — unchanged
}

message Param {
  string name = 1;
  TypeRef type = 2;
  bool is_optional = 3;
  string default_value = 4;        // language-syntax literal when set
}
```

`signature` either goes away or stays as an optional rendering hint
(probably goes away — codegen can always reconstruct the language-flavor
string from the structured form, and having both invites drift).

**What's gained:**

- Compose-time validation: every `TypeRef.named` resolves against the
  spec set (same way StructDecl/InterfaceDecl/EnumDecl names are resolved).
- Cross-language portability: same MethodDecl renders as TS / Rust /
  Python / Dart by language-specific stringification at codegen. Today's
  signature is whichever language the author wrote it in.
- Tooling introspection: API diff tools, doc generators, code-review
  summarizers all consume structured input rather than parsing per-language
  signature strings.
- Consistency: matches FieldDecl's existing structured shape.

**What's lost:**

- ~3 extra lines of textproto per method. Annoying, not deal-breaking.
  Editor tooling (templates / snippets) absorbs most of it.
- Generics get less natural inline (see Issue 2 — they get a clean home
  separately, but the inline `function map<T, U>(...)` flow is gone).

---

## Issue 2 — Generics are structurally invisible

Today generics live in `TypeScriptNuance.generic_bounds` /
`RustNuance.generic_bounds` as opaque string lists:

```proto
message TypeScriptNuance {
  // ...
  repeated string generic_bounds = 4;  // ["T extends Comparable<T>", "U"]
}
```

Two problems:

1. The bound strings carry types that aren't validated against the spec
   set (`Comparable` could be a typo).
2. Generic *uses* — `Promise<T>`, `Map<K, V>`, `Array<T>` (or `T[]`) —
   today live inside `signature` as opaque substrings. Compose can't
   resolve `Promise` against an external_package_imports entry; can't
   resolve `T` against the enclosing scope's bounds; can't validate
   anything about generics at all.

This is the same regression as Issue 1, manifesting one layer deeper.

### Proposed change (additive, v1.1)

Add structured generic support to `TypeRef`:

```proto
message TypeRef {
  oneof reference {
    PrimitiveKind primitive  = 1;
    string        named      = 2;
    string        expression = 3;     // escape hatch (unchanged)
    GenericRef    generic    = 4;     // NEW
  }
}

message GenericRef {
  string name = 1;                    // "Map", "Promise", "Array"
  repeated TypeRef args = 2;          // [K, V] — recursively structured
}
```

Hoist generic *parameters* (the declaration site `<T, U>`) out of nuance
into first-class `TypeParam` entries on `MethodDecl`, `StructDecl`,
`InterfaceDecl`:

```proto
message MethodDecl {
  string name = 1;
  repeated TypeParam type_params = 2;   // NEW: <T, U extends Foo>
  repeated Param inputs = 3;
  TypeRef output = 4;
  // ...
}

message TypeParam {
  string name = 1;
  TypeRef bound = 2;                    // optional: extends Comparable
  TypeRef default = 3;                  // optional: = string
}
```

Now `T` is a declared name in the MethodDecl's scope. Compose validates
`{ named: "T" }` either resolves to a top-level decl OR a `type_param`
in scope. Bounds validate the same way recursively.

`TypeScriptNuance.generic_bounds` and `RustNuance.generic_bounds` become
vestigial — removable in a follow-up cleanup.

**Concrete examples:**

`Promise<ListTodosResponse>`:
```textproto
output: { generic: { name: "Promise", args: [{ named: "ListTodosResponse" }] } }
```

`Map<string, Todo[]>`:
```textproto
output: {
  generic: {
    name: "Map"
    args: [
      { primitive: CHARACTER },
      { generic: { name: "Array", args: [{ named: "Todo" }] } }
    ]
  }
}
```

A generic function `map<T, U>(arr: T[], fn: (t: T) => U): U[]` with a
function-typed parameter:

```textproto
{ name: "map"
  type_params: [{ name: "T" }, { name: "U" }]
  inputs: [
    { name: "arr", type: { generic: { name: "Array", args: [{ named: "T" }] } } }
    # The (t: T) => U callback falls back to expression — see "stopping point" below.
    { name: "fn", type: { expression: "(t: T) => U" } }
  ]
  output: { generic: { name: "Array", args: [{ named: "U" }] } }
}
```

---

## Where to stop

We considered going further (FunctionRef for callback types,
IntersectionRef for `A & B`, etc.) and decided against it — diminishing
returns plus rapidly growing schema surface. The line we'd draw:

| Construct | Structured? | Rationale |
|---|---|---|
| Primitive types (`number`, `string`, `bool`) | yes (existing `primitive`) | already there |
| Named types (`Todo`, `User`) | yes (existing `named`) | already there |
| Generic uses (`Map<K, V>`) | **yes (proposed)** | most common, validation worth it |
| Generic params (`<T, U>`) | **yes (proposed)** | unblocks generic-use validation |
| Callback types (`(t: T) => U`) | no — expression hatch | covered by methods elsewhere; rare in field positions |
| Conditional / mapped types | no — expression hatch | TS-specific, exotic, no cross-language analog |
| Intersection / union (`A & B`, `A \| B`) | no — expression hatch | StructDecl alias mode handles top-level unions cleanly |

Rule of thumb: structure it if it appears in the indexer's NodeKind
palette or if it has a cross-language analog. Otherwise, expression
hatch.

---

## Together, these are one coherent change

- Replace `MethodDecl.signature` with structured `inputs` + `output`
- Extend `TypeRef` with `GenericRef`
- Hoist generic params out of nuance into `TypeParam` lists on
  `MethodDecl` / `StructDecl` / `InterfaceDecl`
- Deprecate `*Nuance.generic_bounds` (mark unused; remove later)

All additive — existing v1 specs that use `expression: "Promise<X>"`
keep working until they migrate. New specs use structured form when
natural.

Migration story for existing specs: a one-shot tool that parses
`signature` strings (per-language) into structured form, falling back
to `expression` for anything it can't structure. Rough — but the v1
schema is days old, so the pool of specs to migrate is small.

---

## What we haven't done / haven't checked

- We haven't run the new flow end-to-end. Compose semantics around
  `signature` (does compose try to parse it for type extraction, or
  just pass through to codegen?) is inferred from reading
  `archegraph_spec_v1.proto` comments + the example `.spec.textproto`
  files, not verified empirically.
- We haven't measured author-experience friction with structured
  `inputs`/`output` in practice. The "~3 extra lines per method" is a
  reading from the example file; might feel different across a
  realistic spec set.
- We haven't thought through how `is_async` should interact with the
  structured form. Today: `is_async: true` + `Promise<T>` in signature
  is redundant. Under structured form: should `output: { generic: {
  name: "Promise", args: [...] } }` and `is_async: true` both be
  required? One implies the other? Open question.
- We haven't addressed whether `StructDecl`'s alias-mode `body` field
  (which carries the same kind of opaque language syntax as `signature`
  does today) should also get the structured-vs-expression treatment.
  Probably yes for the same reasons — but that's a separate discussion.

---

## How we got here

Brainstorming the resolver pillar, we mapped all the friction points
where archegraph's old `(archegraph.spec.opts)` envelope didn't fit TS
naturally — free functions, constants, discriminated unions,
mixed-export modules, the TS impl-block self-referential workaround.
That walk-through happened on 2026-05-10 just before we discovered the
v1 schema redesign had landed. It absorbed every gap we'd identified
except this one: the regression in cross-message type validation that
came with collapsing rpc input/output types into an opaque
`signature` string.

So this isn't a critique of B'' — B'' is the right substrate. It's a
pushback on one specific design call within B'' (signature as opaque
string), and a proposal for the smallest schema extension that gets
validation back.
