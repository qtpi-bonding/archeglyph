---
name: archeglyph-manual
description: Command reference for the archeglyph CLI, generated from --help — do not edit by hand.
manual-source-hash: 9d8fb8f62a60be036b489dd6df2e580366624883b5f533aee007d19c9edafacd
---

# archeglyph command reference

Generated from the CLI's own `--help`, which is rendered from the operation
registry in `packages/ops`. It cannot describe a flag the CLI does not have.

Every operation takes named flags. There are no positional arguments.

`--theme` accepts a bundled name — `light`, `dark`, `blueprint` — or a path to
a `.theme.json`. Where `--style` is optional, omitting it lets the layout
engine place everything; where `--out` is optional, it defaults to the diagram
path with an `.svg` extension.

#### `archeglyph`

```text
archeglyph — node-and-edge graph rendering tool

Usage: archeglyph <subcommand> [options]

Subcommands:
  render    Render a diagram file to SVG
  validate  Validate a diagram file for structural correctness
  format    Pretty-print a diagram, stylesheet, or theme file as canonical JSON
  init      Scaffold a new diagram file
  bind      Bind a theme component to matching diagram elements in a stylesheet
  watch     Watch a diagram file and re-render on changes
  diff      Compare two diagram files and emit the change set between them
  mcp       Run the Model Context Protocol stdio server
  help      Show this help (or pass --help to any subcommand)

Run `archeglyph <subcommand> --help` for per-command details.
```

#### `archeglyph bind`

```text
archeglyph bind — Bind a theme component to matching diagram elements in a stylesheet

Usage: archeglyph bind [options]

Options:
  --diagram       string                 (no description)  [required]
  --style         string                 (no description)  [optional]
  --where         string                 (no description)  [required]
  --element-type  enum<node|edge|group>  (no description)  [default: node]
  --component     string                 (no description)  [required]
```

#### `archeglyph diff`

```text
archeglyph diff — Compare two diagram files and emit the change set between them

Usage: archeglyph diff [options]

Options:
  --base               string   Path to the diagram file to compare FROM.                                                [required]
  --target             string   Path to the diagram file to compare TO.                                                  [required]
  --out                string   Path to write the Delta JSON to; prints the summary only if omitted.                     [optional]
  --include-unchanged  boolean  Emit an UNCHANGED entry for every element that did not change, rather than omitting it.  [optional]
```

#### `archeglyph format`

```text
archeglyph format — Pretty-print a diagram, stylesheet, or theme file as canonical JSON

Usage: archeglyph format [options]

Options:
  --file  string  Path to the file to format (.diag.json, .style.json, or .theme.json).  [required]
```

#### `archeglyph init`

```text
archeglyph init — Scaffold a new diagram file

Usage: archeglyph init [options]

Options:
  --name  string  (no description)  [default: diagram]
```

#### `archeglyph render`

```text
archeglyph render — Render a diagram file to SVG

Usage: archeglyph render [options]

Options:
  --diagram  string  Path to the .arch diagram file to render.                                                                                                                                                            [required]
  --style    string  Path to a .style stylesheet; uses the diagram default if omitted.                                                                                                                                    [optional]
  --theme    string  Rebind one theme name: <name>=<theme>, or a bare <theme> to rebind `default`. The theme is a bundled name (light, dark, blueprint) or a path. Without this, the stylesheet's own bindings are used.  [optional]
  --delta    string  Path to a Delta JSON file from `archeglyph diff`. Draws the union of the diagram and what the Delta says was deleted, coloured by change type.                                                       [optional]
  --out      string  Output SVG path; defaults to the diagram path with a .svg extension.                                                                                                                                 [optional]
```

#### `archeglyph validate`

```text
archeglyph validate — Validate a diagram file for structural correctness

Usage: archeglyph validate [options]

Options:
  --diagram  string  Path to the .arch diagram file to validate.                                                                         [required]
  --style    string  Path to a .style stylesheet; uses the diagram default if omitted.                                                   [optional]
  --theme    string  Bundled theme name (light, dark, blueprint) or path to a .theme.json file; uses the bundled dark theme if omitted.  [optional]
```

#### `archeglyph watch`

```text
archeglyph watch — Watch a diagram file and re-render on changes

Usage: archeglyph watch [options]

Options:
  --diagram  string  Path to the .arch diagram file to watch and re-render on changes.     [required]
  --style    string  Path to a .style stylesheet; uses the diagram default if omitted.     [optional]
  --theme    string  Path to a .theme.json file; uses the bundled light theme if omitted.  [optional]
  --out      string  Output SVG path; defaults to the diagram path with a .svg extension.  [optional]
```
