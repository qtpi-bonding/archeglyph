// SPDX-License-Identifier: MPL-2.0
// Source-level: happy-dom implements neither pointer-events nor layout.

import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname;
const read = (rel: string): string => readFileSync(join(here, rel), 'utf8');

describe('floating islands are clickable', () => {
  // pointer-events inherits from the slot's `none`; a root without this is
  // rendered and unclickable.
  test('styles.css re-enables pointer events on .ag-island', () => {
    const css = read('styles.css');
    const rule = css.slice(css.indexOf('.ag-island'));

    expect(css).toContain('.ag-island');
    expect(rule.slice(0, 120)).toContain('pointer-events: auto');
  });

  test('IslandFrame still relies on that, so the rule cannot be dropped', () => {
    expect(read('island_frame.tsx')).toContain("'pointer-events': 'none'");
  });

  // The rule alone is not enough: the class has to be on every root.
  // Matched against the class LIST, not an exact attribute: a root may carry
  // a second class, as the inspector does.
  const hasIslandClass = (source: string): boolean =>
    /class="[^"]*\bag-island\b[^"]*"/.test(source);

  test('every island root carries the class the rule keys on', () => {
    const roots = ['toolbar.tsx', 'zoom_island.tsx', 'state_island.tsx', 'undo_island.tsx', 'file_island.tsx'];
    for (const file of roots) {
      expect({ file, ok: hasIslandClass(read(file)) }).toEqual({ file, ok: true });
    }
    expect(hasIslandClass(readFileSync(join(here, '../inspector/inspector.tsx'), 'utf8'))).toBe(true);
  });

  test('no island component is added without the class', () => {
    // The list above is a allowlist and goes stale. This catches a NEW island
    // file that forgets the class entirely.
    const suspects = readdirSync(here).filter(
      (f) => (f.endsWith('_island.tsx') || f === 'toolbar.tsx') && !f.includes('.test.'),
    );
    for (const file of suspects) {
      expect({ file, hasClass: hasIslandClass(read(file)) })
        .toEqual({ file, hasClass: true });
    }
  });
});

describe('overlays are bounded and scrollable', () => {
  // A centred scrim means an uncapped surface overflows both edges, so
  // neither end is reachable.
  const bounded = (source: string): boolean =>
    source.includes('max-height') && /overflow(-y)?'?:/.test(source);

  test('the command palette caps its height and scrolls', () => {
    const src = read('command_palette.tsx');
    expect(bounded(src)).toBe(true);
    // The list scrolls, not the whole surface, so the input stays pinned --
    // and a flex child needs min-height:0 or it refuses to shrink.
    expect(src).toContain("'min-height': '0'");
  });

  test('the context menu caps its height and scrolls', () => {
    expect(bounded(read('context_menu.tsx'))).toBe(true);
  });

  test('the help sheet still does, which is where the pattern came from', () => {
    expect(bounded(read('help_sheet.tsx'))).toBe(true);
  });
});

describe('direct manipulation gestures are wired', () => {
  const canvas = (): string =>
    readFileSync(join(here, '../canvas/canvas.tsx'), 'utf8');

  test('double-click on the canvas opens the annotation editor', () => {
    const src = canvas();
    expect(src).toContain("addEventListener('dblclick'");

    const handler = src.slice(src.indexOf('const onDoubleClick'), src.indexOf("addEventListener('dblclick'"));
    expect(handler).toContain('beginTextEdit');
    expect(handler).toContain("!== 'annotation'");
  });

  test('it is removed on cleanup, like every other canvas listener', () => {
    expect(canvas()).toContain("removeEventListener('dblclick'");
  });
});

describe('the inline text editor hides what it replaces', () => {
  const editor = (): string =>
    readFileSync(join(here, '../canvas/text_editor.tsx'), 'utf8');

  test('the textarea is not transparent', () => {
    const src = editor();
    expect(src).toContain("'background-color': props.background");
    expect(src).not.toContain("'background-color': 'transparent'");
  });

  test('the canvas supplies the annotation its own resolved fill', () => {
    const src = readFileSync(join(here, '../canvas/canvas.tsx'), 'utf8');
    expect(src).toContain('background={editorBackground(');

    const fn = src.slice(src.indexOf('function editorBackground'), src.indexOf('function annotationText'));
    expect(fn).toContain("paint?.case === 'color'");
    expect(fn).toContain('EDITOR_FALLBACK_BACKGROUND');
  });
});

describe('no component freezes a prop at setup', () => {
  // Setup scope is the two-space indent: deeper is inside a function, where
  // the read is tracked. A createSignal initialiser is meant to read once.
  const frozen = (source: string): Array<string> =>
    source
      .split('\n')
      .filter((line: string): boolean => {
        if (!/^ {2}(const|let|var|if|return) .*\bprops\./.test(line)) { return false; }
        if (line.includes('=>')) { return false; }
        if (/createSignal|createMemo|createStore/.test(line)) { return false; }
        return true;
      });

  const componentFiles = (dir: string): Array<string> =>
    readdirSync(join(here, dir), { recursive: true, encoding: 'utf8' })
      .filter((f: string): boolean => f.endsWith('.tsx') && !f.includes('.test.'))
      .map((f: string): string => join(dir, f));

  test('no editor component reads props in its body', () => {
    const files = ['.', '../canvas', '../inspector', '../pending'].flatMap(componentFiles);
    const offenders = files.flatMap((f: string): Array<string> =>
      frozen(readFileSync(join(here, f), 'utf8')).map((line: string): string => `${f}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });
});


describe('the ghost layer shares the diagram layer frame', () => {
  // The renderer emits a whole <svg viewBox width height>. Kept, it becomes a
  // NESTED viewport: the ghost is rescaled against its own viewBox, so it no
  // longer registers with the diagram it is a diff of, and the background
  // <rect> it carries paints an opaque slab over the canvas. The two layers
  // must therefore be injected the same way.
  const ghost = (): string =>
    readFileSync(join(here, '../canvas/ghost_layer.tsx'), 'utf8');

  test('it unwraps through injectDiagram rather than innerHTML', () => {
    const src = ghost();
    expect(src).toContain('injectDiagram(host');
    expect(/innerHTML=/.test(src)).toBe(false);
  });

  test('injectDiagram keeps defs and groups and drops the background rect', () => {
    const src = readFileSync(join(here, '../canvas/diagram_layer.tsx'), 'utf8');
    const fn = src.slice(src.indexOf('export function injectDiagram'), src.indexOf('/** Solid component'));
    expect(fn).toContain("child.tagName === 'defs' || child.tagName === 'g'");
  });
});

describe('proposals and the inspector do not compete for one slot', () => {
  test('the inspector is not unmounted while proposals are expanded', () => {
    // A review compares a node's fields against the proposal that changes
    // them, so both have to be on screen at once.
    const src = read('app.tsx');
    const slot = src.slice(src.indexOf('inspector={'), src.indexOf('file={'));

    expect(slot).toContain('<Inspector');
    expect(slot).not.toContain('expanded()');
    expect(slot).not.toContain('PendingPanel');
  });

  test('the frame gives proposals a slot of their own', () => {
    const frame = read('island_frame.tsx');
    expect(frame).toContain('pending?: JSX.Element');
    expect(frame).toContain('{props.pending}');
  });
});
