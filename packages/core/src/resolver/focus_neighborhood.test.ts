// SPDX-License-Identifier: MPL-2.0
//
// "This and what it touches, n hops out." Distance is measured on the view you
// can see: the picks and their opened contents are the centre, and each hop
// follows the edges as drawn -- including edges lifted onto closed blocks -- to
// the next visible element. What is further than that is hidden, together with
// its contents, and the containers that still hold something stay.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementRole, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { ElementStyleEntrySchema, GroupRenderMode, NodeVisibility, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilterRequest } from './filter_request';
import { type FilteredDiagram } from './filtered_diagram';
import { hiddenOutside, openSet } from './focus';
import { VisibilityFilterImpl } from './visibility_filter';

// A (picked) > A1.   B > B1, in the same directory as A.   C > C1.
// X > X1 is unrelated, in its own directory.   Y > Y1.
// Edges: A1-B1, B1-C1 (so C is two hops from A), Y1-A1, and X1-X1 (a self-loop).
const parents: Record<string, string | undefined> = {
  dir: undefined, A: 'dir', A1: 'A', B: 'dir', B1: 'B',
  C: undefined, C1: 'C',
  dirX: undefined, X: 'dirX', X1: 'X',
  Y: undefined, Y1: 'Y',
};
const edges: Record<string, [string, string]> = {
  a: ['A1', 'B1'], b: ['B1', 'C1'], c: ['Y1', 'A1'], x: ['X1', 'X1'],
};

function diagram(): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'hops',
    graph: {
      elements: Object.fromEntries(Object.entries(parents).map(([id, parent]) => [id, {
        label: [], tags: {}, parent, role: id.startsWith('dir') ? ElementRole.GROUPING : ElementRole.ENTITY,
      }])),
      edges: Object.fromEntries(Object.entries(edges).map(([id, [source, target]]) => [id, { source, target, label: [], ordinal: 0, tags: {} }])),
    },
  });
}

function sheet(open: Iterable<string>, hidden: Iterable<string> = []) {
  const entries: Record<string, ReturnType<typeof create<typeof ElementStyleEntrySchema>>> = {};
  for (const id of open) {
    entries[id] = create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.OPEN });
  }
  for (const id of hidden) {
    entries[id] = create(ElementStyleEntrySchema, { ...entries[id], visibility: NodeVisibility.HIDDEN });
  }
  return create(StylesheetSchema, { schemaVersion: 2, openDepth: 1, elements: entries });
}

function filter(s: ReturnType<typeof sheet>): FilteredDiagram {
  const r = new VisibilityFilterImpl().filter(init(new FilterRequest(), { diagram: diagram(), stylesheet: s }));
  if (r.kind !== 'ok') {
    throw new Error(`expected ok: ${r.error.message}`);
  }
  return r.value;
}

/** The view for these picks, then the same view with everything past `hops` hidden. */
function view(picks: string[], depth: number, hops: number): { hidden: string[]; shown: string[]; edges: string[] } {
  const elements = diagram().graph!.elements;
  const open = openSet(elements, picks, depth);
  const hidden = hiddenOutside(elements, filter(sheet(open)), picks, hops).sort();
  const f = filter(sheet(open, hidden));
  return {
    hidden,
    shown: [...Object.keys(f.nodes), ...Object.keys(f.groups)].sort(),
    edges: Object.keys(f.edges).sort(),
  };
}

describe('hiddenOutside', () => {
  test('0 hops keeps only the pick, its contents and the containers above it', () => {
    const v = view(['A'], 1, 0);
    expect(v.shown).toEqual(['A', 'A1', 'dir']);
    expect(v.edges).toEqual([]);
  });

  test('1 hop adds what the pick touches, in either direction', () => {
    const v = view(['A'], 1, 1);
    expect(v.shown).toEqual(['A', 'A1', 'B', 'Y', 'dir']);
    expect(v.edges).toEqual(['a', 'c']);
  });

  test('2 hops reaches the next ring', () => {
    const v = view(['A'], 1, 2);
    expect(v.shown).toEqual(['A', 'A1', 'B', 'C', 'Y', 'dir']);
    expect(v.edges).toEqual(['a', 'b', 'c']);
  });

  test('more hops than there is graph stops at what is connected: the unrelated part is still hidden', () => {
    const v = view(['A'], 1, 9);
    expect(v.shown).toEqual(['A', 'A1', 'B', 'C', 'Y', 'dir']);
    expect(v.hidden).toContain('dirX');
  });

  test('a hidden part is hidden as a whole, at its top, not element by element', () => {
    const v = view(['A'], 1, 1);
    expect(v.hidden).toEqual(['C', 'dirX']);
  });

  test('a container whose contents are all hidden goes too, rather than staying as an empty box', () => {
    const v = view(['A'], 1, 0);
    expect(v.shown).not.toContain('dirX');
    expect(v.hidden).toContain('dirX');
  });

  test('a pick opened to depth 0 is one block and is still the centre', () => {
    const v = view(['A'], 0, 1);
    expect(v.shown).toEqual(['A', 'B', 'Y', 'dir']);
    expect(v.edges).toEqual(['a', 'c']);
  });

  test('several picks are all centres', () => {
    const v = view(['A', 'C'], 1, 0);
    expect(v.shown).toEqual(['A', 'A1', 'C', 'C1', 'dir']);
  });

  test('a self-loop does not pull its element into anyone else\'s neighbourhood', () => {
    expect(view(['A'], 1, 9).shown).not.toContain('X');
  });

  test('the same picks give the same hidden set', () => {
    expect(view(['A'], 1, 1).hidden).toEqual(view(['A'], 1, 1).hidden);
  });
});
