# archeglyph

A node-and-edge graph rendering tool with strict content/style separation — like LaTeX for diagrams.

The graph topology lives in one text file. The visual styling lives in a sidecar file. The tool deterministically renders an SVG you can commit to git and embed in PRs and docs.

**Status:** design phase. Spec is in [`docs/design.md`](docs/design.md). Implementation has not started.

## What it is

Three properties, in order of importance:

1. **Content is canonical.** The text file *is* the graph. Topology cannot be edited via the visual editor. The visual editor only writes to the style sidecar.
2. **Output is deterministic.** Same `(content, style, theme, archeglyph version)` → byte-identical SVG. Git diffs of generated SVGs are meaningful.
3. **AI-compat is by design, not magic.** All edits are expressible as typed operations on the style file. AI agents read and write the same files humans do, through the same operations.

archeglyph is a kernel + adapters: a general-purpose node/edge engine, with importers for [archegraph](../archegraph) and (later) DOT/Mermaid/JSON. It is not coupled to archegraph; archegraph is one consumer.

## Family

archeglyph is part of the `arche-` family of tools (Greek *archē* = origin/principle):

- **[archegraph](../archegraph)** — the originating code-architecture graph
- **archescope** — the explorer/visualizer for archegraph
- **archebuild** — build orchestration over archegraph
- **archeglyph** — the carved (rendered) form of an `arche-` graph

Etymology: *archē* (ἀρχή, origin/principle) + *glyphē* (γλυφή, carving/inscription) — "the carved form of the origin graph."

## How it works (overview)

```
content.diag.txtpb   ──┐
                        ├─► loader ─► resolver ─► layout (elkjs) ─► renderer ─► output.svg
style.style.txtpb    ──┤
                        │
theme.theme.txtpb    ──┘
(optional)
```

- **content** — graph topology (nodes, edges, groups, localizable labels, tags)
- **style** — per-element layout, visual overrides, component bindings, annotations
- **theme** — design system: tokens (colors, fonts, sizes) + named components

All three files are textproto. The renderer emits a deterministic SVG with an embedded provenance comment.

## File structure (planned)

```
archeglyph/
├── proto/
│   ├── content.proto    # Diagram, Graph, Node/Edge/Group, Localization
│   ├── style.proto      # Stylesheet, *StyleEntry, *Layout, Glyph2D/Glyph1D/Typography
│   ├── theme.proto      # Theme, Tokens, NodeComponent/EdgeComponent/AnnotationComponent
│   └── ops.proto        # EditOp + Set/Unset variants
├── src/
│   ├── core/            # loaders, resolver, layout, renderer, ops
│   ├── cli/             # render, validate, init, format, watch, edit, bind
│   ├── editor/          # visual editor (web app) — host-agnostic
│   └── server/          # local Bun server for `edit` command
├── packages/
│   └── importer-archegraph/
├── themes/              # default-light / default-dark themes
├── examples/            # sample diagrams
└── docs/
    └── design.md        # full design spec
```

## Tech stack (planned)

- **Language:** TypeScript
- **Runtime:** [Bun](https://bun.sh)
- **Schemas:** Protocol Buffers via `@bufbuild/protobuf` + `buf` CLI
- **Layout engine:** [elkjs](https://github.com/kieler/elkjs)
- **SVG rendering:** hand-rolled (template strings)
- **Web framework (editor):** SolidJS
- **CLI parsing:** citty
- **Tests:** bun test + golden SVG snapshots

## Visual primitives

The styling vocabulary is organized as three orthogonal "glyph" types:

- **Glyph2D** — visual identity of a shape-based element (Node, Group, Annotation): geometry + outline + fill + halo + decorations
- **Glyph1D** — visual identity of a line-based element (Edge, Annotation callout): stroke + arrowheads + glow
- **Typography** — visual identity of text: font, color, size, weight, alignment, visibility

Themes ship reusable named components composing these glyphs. Stylesheets bind elements to theme components by name; binding logic (e.g., "all backend services use this preset") lives in tools (`archeglyph bind` CLI, importers, AI agents) which produce explicit per-element bindings as their output.

## CLI surface (planned for v1)

```
archeglyph render <content> [<style>] [--theme <theme>] [-o <out.svg>]
archeglyph validate <content> [<style>] [--theme <theme>]
archeglyph init [--name <name>]
archeglyph format <file>
archeglyph watch <content> [--style <…>] [--theme <…>] [-o <out.svg>]
archeglyph edit <content> [--style <…>]      # spin up local web editor
archeglyph bind <content> [<style>] --where <predicate> --component <name>
```

## Design principles

See [`docs/design.md` §2](docs/design.md) for the full set. Highlights:

- **Content/style separation** — visual editor never writes to content
- **Schema-first extensibility** — schemas accommodate every planned feature; v1 implementation may be slimmer
- **Determinism** — same inputs → byte-identical SVG, with provenance comment
- **Kernel + adapters** — core is general; archegraph is one importer
- **Host-agnostic visual editor** — abstract HostAdapter; standalone web (v1), VS Code extension (later), native (later)
- **Structural defaults in code, stylistic in schema** — schema captures data; merge mechanics live in code

## License

TBD.
