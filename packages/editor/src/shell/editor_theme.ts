// SPDX-License-Identifier: MPL-2.0

/**
 * The editor's own chrome palette — islands, panels, fields, selection.
 *
 * Deliberately SEPARATE from the diagram theme, and not a view of it. The
 * diagram theme describes the document: it lives in the style file, it is part
 * of the file format, and `archeglyph render` must produce the same picture
 * from it with no editor present. The editor theme describes the application
 * around that document, and belongs to the person using it — the same way a
 * dark IDE will happily edit a light-background document.
 *
 * The two are free to disagree, and often should. Someone authoring a diagram
 * for a white paper wants the light document theme so the committed SVG is
 * right, and very likely still wants dark chrome at 1am.
 *
 * This is therefore an editor preference, not document data. It is never
 * written to the diagram or the style file, and nothing downstream of the
 * editor can see it. Colours from docs/design/editor-tokens.css (D12).
 */
export interface EditorTheme {
  /** Stable key, used for persistence and the picker. */
  name: string;
  /** Human label for the picker. */
  label: string;
  /** CSS custom property name -> value. Keys match shell/styles.css. */
  variables: Record<string, string>;
}

/** D12's "Storm x Blueprint, islands" — the default. */
function blueprintChrome(): EditorTheme {
  return {
    name: 'blueprint',
    label: 'Blueprint',
    variables: {
      '--ag-bg': '#0f1a2b',
      '--ag-panel': '#122238',
      '--ag-field': '#0d1727',
      '--ag-edge': '#1f3550',
      '--ag-fg': '#bfe3ff',
      '--ag-fg-2': '#7fb6e0',
      '--ag-fg-3': '#3f6a8f',
      '--ag-blue': '#7ab8ff',
      '--ag-blue-soft': 'rgba(122, 184, 255, 0.16)',
      '--ag-blue-glow': 'rgba(122, 184, 255, 0.50)',
      '--ag-teal': '#73daca',
      '--ag-purple': '#bb9af7',
      '--ag-grid-dot': '#2f5480',
      '--ag-grid-line': 'rgba(47, 84, 128, 0.28)',
      '--ag-danger': '#f7768e',
      '--ag-error': '#3a1f2b',
      '--ag-error-text': '#f7768e',
    },
  };
}

/** Neutral dark, for working on a document whose own palette is loud. */
function graphiteChrome(): EditorTheme {
  return {
    name: 'graphite',
    label: 'Graphite',
    variables: {
      '--ag-bg': '#16171b',
      '--ag-panel': '#1e1f24',
      '--ag-field': '#121316',
      '--ag-edge': '#2e3038',
      '--ag-fg': '#e4e5ea',
      '--ag-fg-2': '#a8abb5',
      '--ag-fg-3': '#6b6f7a',
      '--ag-blue': '#7aa2f7',
      '--ag-blue-soft': 'rgba(122, 162, 247, 0.16)',
      '--ag-blue-glow': 'rgba(122, 162, 247, 0.50)',
      '--ag-teal': '#73daca',
      '--ag-purple': '#bb9af7',
      '--ag-grid-dot': '#32343d',
      '--ag-grid-line': 'rgba(50, 52, 61, 0.55)',
      '--ag-danger': '#f7768e',
      '--ag-error': '#3a1f2b',
      '--ag-error-text': '#f7768e',
    },
  };
}

/** Light chrome, for bright rooms and for print work. */
function paperChrome(): EditorTheme {
  return {
    name: 'paper',
    label: 'Paper',
    variables: {
      '--ag-bg': '#eceef2',
      '--ag-panel': '#ffffff',
      '--ag-field': '#f6f7f9',
      '--ag-edge': '#d3d7e0',
      '--ag-fg': '#1b1d22',
      '--ag-fg-2': '#4a4f5a',
      '--ag-fg-3': '#7e848f',
      '--ag-blue': '#2f6fd0',
      '--ag-blue-soft': 'rgba(47, 111, 208, 0.14)',
      '--ag-blue-glow': 'rgba(47, 111, 208, 0.35)',
      '--ag-teal': '#2a9d8f',
      '--ag-purple': '#7b5bd6',
      '--ag-grid-dot': '#c3c8d2',
      '--ag-grid-line': 'rgba(195, 200, 210, 0.55)',
      '--ag-danger': '#c0392b',
      '--ag-error': '#fdeaea',
      '--ag-error-text': '#9b2c22',
    },
  };
}

/** Display order in the picker; the first is the default. */
export const EDITOR_THEMES: ReadonlyArray<EditorTheme> = [
  blueprintChrome(),
  graphiteChrome(),
  paperChrome(),
];

export const DEFAULT_EDITOR_THEME: string = 'blueprint';

/** Exact-name lookup; null for an unknown name so callers can fall back. */
export function findEditorTheme(name: string): EditorTheme | null {
  return EDITOR_THEMES.find((theme: EditorTheme): boolean => theme.name === name) ?? null;
}

/**
 * Write a chrome palette onto `root` as CSS custom properties.
 *
 * shell/styles.css still declares every variable, so it remains the fallback
 * and the single place the full set is documented; this only overrides. Safe
 * to call repeatedly — switching themes overwrites in place, and because every
 * theme defines the same keys, no stale value survives a switch.
 */
export function applyEditorTheme(theme: EditorTheme, root: HTMLElement): void {
  for (const [variable, value] of Object.entries(theme.variables)) {
    root.style.setProperty(variable, value);
  }
}
