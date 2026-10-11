// SPDX-License-Identifier: MPL-2.0
//
// Choosing a view of a big diagram: pick some elements and how deep into
// their contents to show. The picks and the containers above them are opened,
// and everything else stays visible as closed blocks, so what a pick talks to
// is still on the page. The view is a stylesheet; nothing about the diagram
// changes.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementRole, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { ElementStyleEntrySchema, GroupRenderMode, StylesheetSchema, type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilterRequest } from './filter_request';
import { type FilteredDiagram } from './filtered_diagram';
import { openSet } from './focus';
import { VisibilityFilterImpl } from './visibility_filter';

// file F > class C > method M > param P, plus a second file G > class D > method D1, and a
// loose file H. F and G sit under a GROUPING directory `dir`.
const parents: Record<string, string | undefined> = {
  dir: undefined,
  F: 'dir', C: 'F', M: 'C', P: 'M', C2: 'F',
  G: 'dir', D: 'G', D1: 'D',
  H: undefined,
};

function diagram(): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'focus',
    graph: {
      elements: Object.fromEntries(Object.entries(parents).map(([id, parent]) => [id, {
        label: [], tags: {}, parent, role: id === 'dir' ? ElementRole.GROUPING : ElementRole.ENTITY,
      }])),
      edges: {
        e1: { source: 'P', target: 'D', label: [], ordinal: 0, tags: {} },
        e2: { source: 'H', target: 'M', label: [], ordinal: 0, tags: {} },
      },
    },
  });
}

describe('openSet', () => {
  const els = diagram().graph!.elements;
  const set = (picks: string[], depth: number): string[] => [...openSet(els, picks, depth)].sort();

  test('a pick with depth 1 is opened, and so are the containers above it', () => {
    expect(set(['C'], 1)).toEqual(['C', 'F', 'dir']);
  });

  test('depth 0 leaves the pick closed but still opens the containers above it', () => {
    expect(set(['C'], 0)).toEqual(['F', 'dir']);
  });

  test('each further depth opens the next level of containers inside the pick', () => {
    expect(set(['F'], 1)).toEqual(['F', 'dir']);
    expect(set(['F'], 2)).toEqual(['C', 'F', 'dir']);
    expect(set(['F'], 3)).toEqual(['C', 'F', 'M', 'dir']);
  });

  test('a leaf is never in the set, since there is nothing to open, but its ancestors are', () => {
    expect(set(['P'], 5)).toEqual(['C', 'F', 'M', 'dir']);
  });

  test('several picks give the union', () => {
    expect(set(['C', 'D'], 1)).toEqual(['C', 'D', 'F', 'G', 'dir']);
  });

  test('a pick that another pick sits inside is held open for it, even at depth 0', () => {
    expect(set(['C', 'M'], 0)).toEqual(['C', 'F', 'dir']);
  });

  test('a root pick has no containers above it', () => {
    expect(set(['H'], 1)).toEqual([]);
  });

  test('picking nothing opens nothing', () => {
    expect(set([], 3)).toEqual([]);
  });
});

describe('the view a pick produces', () => {
  function view(picks: string[], depth: number): FilteredDiagram {
    const entries = Object.fromEntries([...openSet(diagram().graph!.elements, picks, depth)].map((id) => [
      id, create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.OPEN }),
    ]));
    const sheet: Stylesheet = create(StylesheetSchema, { schemaVersion: 2, openDepth: 1, elements: entries });
    const r = new VisibilityFilterImpl().filter(init(new FilterRequest(), { diagram: diagram(), stylesheet: sheet }));
    if (r.kind !== 'ok') {
      throw new Error(`expected ok: ${r.error.message}`);
    }
    return r.value;
  }
  const boxes = (f: FilteredDiagram): string[] => Object.values(f.groups).filter((g) => !g.isSuperNode).map((g) => g.id).sort();
  const blocks = (f: FilteredDiagram): string[] => Object.values(f.groups).filter((g) => g.isSuperNode).map((g) => g.id).sort();

  test('the picked file is open and what it contains is shown as closed blocks', () => {
    const f = view(['F'], 1);
    expect(boxes(f)).toEqual(['F', 'dir']);
    expect(blocks(f)).toEqual(['C', 'G']);
  });

  test('two levels opens the next layer too', () => {
    const f = view(['F'], 2);
    expect(boxes(f)).toEqual(['C', 'F', 'dir']);
    expect(blocks(f)).toEqual(['G', 'M']);
  });

  test('everything not picked is still on the page, closed', () => {
    const f = view(['F'], 1);
    expect(Object.keys(f.nodes)).toContain('H');
    expect(blocks(f)).toContain('G');
  });

  test('an edge from inside the pick to outside it lands on the outside block', () => {
    const f = view(['F'], 3);
    const e1 = f.edges['e1'];
    expect(e1.source).toBe('P');
    expect(e1.target).toBe('G');
  });

  test('an edge from outside into a closed part of the pick lands on that block', () => {
    const f = view(['F'], 1);
    expect(f.edges['e2'].target).toBe('C');
  });

  test('depth 0 shows the pick as one closed block with its context open', () => {
    const f = view(['C'], 0);
    expect(blocks(f)).toContain('C');
    expect(boxes(f)).toEqual(['F', 'dir']);
    expect(f.edges['e2'].target).toBe('C');
  });

  test('the same picks give the same view', () => {
    expect(JSON.stringify(view(['F', 'D'], 2))).toBe(JSON.stringify(view(['F', 'D'], 2)));
  });
});
