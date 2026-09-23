# archeglyph

[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

A node-and-edge graph rendering tool with strict content/style separation — like LaTeX for diagrams.

The graph topology lives in one text file. The visual styling lives in a sidecar file. The tool deterministically renders an SVG you can commit to git and embed in PRs and docs.

![archeglyph's own package architecture](docs/img/architecture-blueprint.svg)

<sub>Not a drawing. [archegraph](#family) indexed this repository, the resulting
graph was rolled up to one node per workspace package, and archeglyph rendered
it in the `blueprint` theme — no hand-placed boxes, no hand-drawn lines. An
edge means one package references another somewhere in its source; the
reference counts are in
[`examples/archeglyph-architecture.diag.json`](examples/archeglyph-architecture.diag.json).
Regenerate with `bun run scripts/architecture_diagram.ts`.</sub>

**Status:** shipped — core engine, all seven CLI operations, and the visual editor. Full design spec in [`docs/design.md`](docs/design.md); current state in [`docs/status.md`](docs/status.md).

## What it is

Four properties, in order of importance:

1. **Content is canonical.** The text file *is* the graph. Topology cannot be edited via the visual editor. The visual editor only writes to the style sidecar.
2. **Output is deterministic.** Same `(content, style, theme, archeglyph version)` → byte-identical SVG. Git diffs of generated SVGs are meaningful.
3. **AI-compat is by design, not magic.** All edits are expressible as typed operations on the style file. AI agents read and write the same files humans do, through the same operations.
4. **Change is a first-class object.** `diff` computes a typed change set between two revisions of a diagram, and the renderer draws it — added, changed and deleted elements coloured in place, with deletions still shown rather than silently absent. A diagram becomes reviewable in a pull request rather than a before-and-after a reader has to hold in their head.

archeglyph is a kernel + adapters: a general-purpose node/edge engine, with importers for archegraph and (later) DOT/Mermaid/JSON. It is not coupled to archegraph; archegraph is one consumer.

## Install

**Requires [Bun](https://bun.sh) 1.3 or newer.** The CLI is TypeScript executed
directly by Bun; there is no build step and no compiled binary.

```bash
git clone https://github.com/qtpi-bonding/archeglyph
cd archeglyph
bun install
```

There is no npm package yet — every workspace package is still at `0.0.0`, so
`bunx archeglyph` does not work. Cloning is the only supported route today.

Confirm it works by rendering a bundled example:

```bash
bun run archeglyph render \
  --diagram examples/checkout.diag.json \
  --style   examples/checkout.style.json \
  --theme   blueprint \
  --out     checkout.svg
```

For the visual editor, which writes only to the stylesheet:

```bash
bun run dev:editor
```

It serves locally at the address Vite prints. There is no hosted instance yet.

**Everything else is in
[`skills/archeglyph-manual/SKILL.md`](skills/archeglyph-manual/SKILL.md)** —
every subcommand and flag, with types, defaults, and which are required. It is
generated from the same operation registry the CLI parses its flags from, so it
cannot document something that does not exist, and CI fails when it falls
behind. `archeglyph <subcommand> --help` prints the same content at a terminal.

It is written as an agent skill because coding agents are a first-class caller
here: point one at that file and it has the whole surface.

## Family

archeglyph is part of the `arche-` family of tools (Greek *archē* = origin/principle):

- **archegraph** — the originating code-architecture graph
- **archescope** — the explorer/visualizer for archegraph
- **archebuild** — build orchestration over archegraph
- **archeglyph** — the carved (rendered) form of an `arche-` graph

Etymology: *archē* (ἀρχή, origin/principle) + *glyphē* (γλυφή, carving/inscription) — "the carved form of the origin graph."

## How it works (overview)

```
content.diag.json    ──┐
                        ├─► loader ─► resolver ─► layout (elkjs) ─► renderer ─► output.svg
style.style.json     ──┤
                        │
theme.theme.json     ──┘
(optional)
```

- **content** — graph topology (nodes, edges, groups, localizable labels, tags)
- **style** — per-element layout, visual overrides, component bindings, annotations
- **theme** — design system: tokens (colors, fonts, sizes) + named components

All three files are canonical proto3 JSON. The renderer emits a deterministic SVG with an embedded provenance comment.

## File structure

```
archeglyph/
├── proto/                    # content/style/theme .proto — the on-disk file format
├── packages/
│   ├── proto/                # TypeScript generated from the protos by buf
│   ├── core/                 # loaders, resolver, layout, renderer, pipeline, geometry
│   ├── ops/                  # the seven operations, shared by CLI and MCP
│   ├── cli/                  # command dispatcher over the op registry
│   ├── editor/               # visual editor SPA (SolidJS), host-agnostic
│   ├── themes/               # bundled light / dark / blueprint themes
│   └── importer-archegraph/
├── examples/                 # sample diagrams
├── test/goldens/             # committed SVGs — the determinism gate
└── docs/design.md            # full design spec
```

## A note on agent-local files

This project is developed with AI coding agents, and is the first from-scratch
dogfood target for [archegraph](#family) — the `.archegraph/specs/**/*.spec.textproto`
files and the `spec/<pillar>-v1` tags are the record of that, and every pillar's
build can be reproduced from them.

Some files referenced in the design docs are deliberately not published, because
they only describe one machine's setup: `CLAUDE.md` (agent operating
instructions), `.claude/skills/` (a symlink into a sibling checkout), and
`docs/comparisons/`. Prose in `docs/` that points at them is a record of how the
work was done, not a broken link.

## Tech stack

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

## Design principles

See [`docs/design.md` §2](docs/design.md) for the full set. Highlights:

- **Content/style separation** — visual editor never writes to content
- **Schema-first extensibility** — schemas accommodate every planned feature; the implementation may be slimmer
- **Determinism** — same inputs → byte-identical SVG, with provenance comment
- **Kernel + adapters** — core is general; archegraph is one importer
- **Host-agnostic visual editor** — abstract HostAdapter; standalone web (v1), VS Code extension (later), native (later)
- **Structural defaults in code, stylistic in schema** — schema captures data; merge mechanics live in code

## License

**[GNU Affero General Public License v3.0 or later](LICENSE)** (AGPL-3.0-or-later).

Why AGPL: archeglyph is meant to stay open. AGPL ensures forks — including network-served forks like a hosted public instance — also remain open. You can use archeglyph freely (locally, in your project, on your own infra); modifications you distribute or host as a service must be shared back under the same license. Internal use is unrestricted.

Files include `SPDX-License-Identifier: AGPL-3.0-or-later` headers as a short-form indicator.
