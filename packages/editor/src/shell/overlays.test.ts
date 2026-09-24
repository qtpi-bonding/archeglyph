// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { Bounds } from '@archeglyph/core/geometry/bounds';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import { init } from '@archeglyph/proto/util/init';
import { localized } from '../state/edits/annotation';
import { filterPaletteItems } from './palette_search';
import { commandPaletteItems, elementPaletteItems } from './palette_items';
import { formatChord } from './chord_label';
import type { PaletteItem } from './palette_item';
import { centerBoundsInRect } from '../ui_state/viewport_math';

function item(label: string): PaletteItem {
  return { key: label, label, detail: '', action: { kind: 'command', command: 'undo' } };
}

describe('filterPaletteItems', () => {
  test('an empty query keeps every item, in the order given', () => {
    const items = [item('Undo'), item('Redo')];
    expect(filterPaletteItems(items, '').map((i) => i.label)).toEqual(['Undo', 'Redo']);
    expect(filterPaletteItems(items, '   ').map((i) => i.label)).toEqual(['Undo', 'Redo']);
  });

  test('a prefix match outranks a mere substring match', () => {
    // 'Node A' contains 'a' but does not start with it, so both of the others
    // come first -- and they keep their input order relative to each other.
    const items = [item('Node A'), item('Annotate'), item('Auto-layout')];
    expect(filterPaletteItems(items, 'a').map((i) => i.label))
      .toEqual(['Annotate', 'Auto-layout', 'Node A']);
  });

  test('matching is case-insensitive', () => {
    expect(filterPaletteItems([item('Undo')], 'UND')).toHaveLength(1);
  });

  test('no subsequence matching: "nd" does not match "Node"', () => {
    // A subsequence matcher scores, and a score that moves on every keystroke
    // reorders rows under someone still typing.
    expect(filterPaletteItems([item('Node')], 'nd')).toEqual([]);
  });

  test('a query matching nothing yields nothing, rather than everything', () => {
    expect(filterPaletteItems([item('Undo')], 'zzz')).toEqual([]);
  });
});

describe('commandPaletteItems', () => {
  const commands = [
    { id: 'undo', label: 'Undo', appliesTo: 'global', run: (): void => undefined },
    { id: 'nudge-up', label: 'Nudge up', run: (): void => undefined },
  ] as never;
  const keymap = [
    { chord: { key: 'z', meta: true }, command: 'undo' },
  ] as never;

  test('a chord renders with its modifiers, not just its key', () => {
    // Rendering chord.key alone turns Cmd+Z into "z", which is bound to
    // nothing -- so the hint names a chord that does not work.
    const [undo] = commandPaletteItems(commands, keymap);
    expect(undo.detail).not.toBe('z');
    expect(undo.detail.toLowerCase()).toContain('z');
    expect(undo.detail.length).toBeGreaterThan(1);
  });

  test('excluded commands are not offered as rows', () => {
    const labels = commandPaletteItems(commands, keymap).map((i) => i.label);
    expect(labels).toContain('Undo');
    expect(labels).not.toContain('Nudge up');
  });
});

describe('elementPaletteItems', () => {
  function diagram(): LaidOutDiagram {
    const node = (id: string, label?: string): LaidOutNode =>
      init(new LaidOutNode(), {
        id,
        position: { x: 0, y: 0 },
        size: { x: 10, y: 10 },
        ...(label === undefined ? {} : { label: localized(label) }),
      });
    return init(new LaidOutDiagram(), {
      // Numeric-looking ids on purpose: Object.values enumerates integer-like
      // keys first in ascending numeric order, whatever the insertion order,
      // so an unsorted implementation passes for small alphabetic fixtures
      // and reorders itself the moment an id is renamed to a number.
      nodes: { '10': node('10'), '2': node('2'), core: node('core', 'Core Service') },
    });
  }

  test('an element with a label shows the label, not the opaque id', () => {
    const items = elementPaletteItems(diagram());
    const core = items.find((i) => i.action.kind === 'element' && i.action.ref.id === 'core');
    expect(core?.label).toBe('Core Service');
  });

  test('an element with no label falls back to its id', () => {
    const items = elementPaletteItems(diagram());
    const bare = items.find((i) => i.action.kind === 'element' && i.action.ref.id === '2');
    expect(bare?.label).toBe('2');
  });

  test('rows come back in a stable order that numeric ids cannot disturb', () => {
    const keys = elementPaletteItems(diagram()).map((i) => i.key);
    expect(keys).toEqual([...keys].sort());
  });

  test('edges are not offered, because nothing could pan to them', () => {
    // buildSceneGeometry indexes nodes, groups and annotations into byKey;
    // an edge has no bounds entry, so a go-to-edge row could never navigate.
    const items = elementPaletteItems(diagram());
    expect(items.every((i) => i.action.kind === 'element' && i.action.ref.kind !== 'edge')).toBe(true);
  });
});

describe('centerBoundsInRect', () => {
  const rect = { left: 0, top: 0, width: 800, height: 600 };
  const bounds: Bounds = { minX: 100, minY: 100, maxX: 200, maxY: 200 };

  test('the centre of the bounds lands at the centre of the rect', () => {
    const next = centerBoundsInRect({ panX: 0, panY: 0, zoom: 1 }, bounds, rect);
    expect(150 * next.zoom + next.panX).toBeCloseTo(400, 9);
    expect(150 * next.zoom + next.panY).toBeCloseTo(300, 9);
  });

  test('zoom is preserved -- going to an element moves the camera, not the lens', () => {
    const next = centerBoundsInRect({ panX: 17, panY: -4, zoom: 2.5 }, bounds, rect);
    expect(next.zoom).toBe(2.5);
  });

  test('it still centres when the incoming pan is not the origin', () => {
    const next = centerBoundsInRect({ panX: 999, panY: -999, zoom: 2 }, bounds, rect);
    expect(150 * 2 + next.panX).toBeCloseTo(400, 9);
    expect(150 * 2 + next.panY).toBeCloseTo(300, 9);
  });

  test('an unmeasured container leaves the viewport alone', () => {
    const viewport = { panX: 12, panY: 34, zoom: 1.5 };
    expect(centerBoundsInRect(viewport, bounds, { left: 0, top: 0, width: 0, height: 0 }))
      .toEqual(viewport);
  });
});

describe('formatChord', () => {
  test('a modified chord names its modifier', () => {
    expect(formatChord({ key: 'z', meta: true }).length).toBeGreaterThan(1);
  });

  test('a bare key is upper-cased', () => {
    expect(formatChord({ key: 'v' })).toBe('V');
  });

  test('a named key is spelled as a word, not as its raw event value', () => {
    expect(formatChord({ key: 'ArrowUp' })).not.toContain('Arrow');
  });
});
