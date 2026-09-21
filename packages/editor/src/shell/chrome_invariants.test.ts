// SPDX-License-Identifier: AGPL-3.0-or-later
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
  test('every island root carries the class the rule keys on', () => {
    const roots = ['toolbar.tsx', 'zoom_island.tsx', 'state_island.tsx', 'undo_island.tsx', 'file_island.tsx'];
    for (const file of roots) {
      expect(read(file)).toContain('class="ag-island"');
    }
    expect(readFileSync(join(here, '../inspector/inspector.tsx'), 'utf8')).toContain('class="ag-island"');
  });

  test('no island component is added without the class', () => {
    // The list above is a allowlist and goes stale. This catches a NEW island
    // file that forgets the class entirely.
    const suspects = readdirSync(here).filter(
      (f) => (f.endsWith('_island.tsx') || f === 'toolbar.tsx') && !f.includes('.test.'),
    );
    for (const file of suspects) {
      expect({ file, hasClass: read(file).includes('class="ag-island"') })
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
