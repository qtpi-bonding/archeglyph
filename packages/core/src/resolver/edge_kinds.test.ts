// SPDX-License-Identifier: MPL-2.0
//
// A view can name the edge kinds to draw. Edges of any other kind are left out
// before anything is lifted onto a closed block or bundled, as if they were not
// in the diagram, so they are not drawn, counted, merged or followed by a hop.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, EdgeSchema, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { ElementStyleEntrySchema, GroupRenderMode, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilterRequest } from './filter_request';
import { type FilteredDiagram } from './filtered_diagram';
import { hiddenOutside } from './focus';
import { VisibilityFilterImpl } from './visibility_filter';

// A > A1, A2.   B > B1.   C (leaf).
// a1 A1->B1 invocation   a2 A2->B1 invocation   a3 A1->B1 uses
// a4 A1->C dependency    a5 A2->C (no kind)     a6 C->A1 invocation
const parents: Record<string, string | undefined> = { A: undefined, A1: 'A', A2: 'A', B: undefined, B1: 'B', C: undefined };
const edges: Record<string, [string, string, string | undefined]> = {
  a1: ['A1', 'B1', 'invocation'],
  a2: ['A2', 'B1', 'invocation'],
  a3: ['A1', 'B1', 'uses'],
  a4: ['A1', 'C', 'dependency'],
  a5: ['A2', 'C', undefined],
  a6: ['C', 'A1', 'invocation'],
};

function diagram(): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'kinds',
    graph: {
      elements: Object.fromEntries(Object.entries(parents).map(([id, parent]) => [id, { label: [], tags: {}, parent }])),
      edges: Object.fromEntries(Object.entries(edges).map(([id, [source, target, kind]]) => [id, {
        source, target, label: [], ordinal: 0, tags: (kind === undefined ? {} : { kind }) as Record<string, string>,
      }])),
    },
  });
}

function run(shown: string[], closed: string[] = []): FilteredDiagram {
  const sheet = create(StylesheetSchema, {
    schemaVersion: 2,
    shownEdgeKinds: shown,
    elements: Object.fromEntries(closed.map((id) => [id, create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.CLOSED })])),
  });
  const r = new VisibilityFilterImpl().filter(init(new FilterRequest(), { diagram: diagram(), stylesheet: sheet }));
  if (r.kind !== 'ok') {
    throw new Error(`expected ok: ${r.error.message}`);
  }
  return r.value;
}

const ids = (f: FilteredDiagram): string[] => Object.keys(f.edges).sort();

describe('shown_edge_kinds', () => {
  test('empty draws every edge, as before', () => {
    expect(ids(run([]))).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6']);
  });

  test('one kind draws only the edges of that kind', () => {
    expect(ids(run(['invocation']))).toEqual(['a1', 'a2', 'a6']);
  });

  test('several kinds draw the edges of any of them', () => {
    expect(ids(run(['uses', 'dependency']))).toEqual(['a3', 'a4']);
  });

  test('an edge with no kind is only drawn when no kinds are named', () => {
    expect(ids(run(['invocation', 'dependency', 'uses']))).not.toContain('a5');
    expect(ids(run([]))).toContain('a5');
  });

  test('a kind no edge has leaves nothing drawn', () => {
    expect(ids(run(['extends']))).toEqual([]);
  });

  test('the elements are all still there; only edges are filtered', () => {
    const f = run(['extends']);
    expect(Object.keys(f.nodes).sort()).toEqual(['A1', 'A2', 'B1', 'C']);
    expect(Object.keys(f.groups).sort()).toEqual(['A', 'B']);
  });
});

describe('shown_edge_kinds with a closed block', () => {
  test('the edges left out are not lifted, bundled or counted', () => {
    const f = run(['invocation'], ['A', 'B']);
    // a1 and a2 both lift to A -> B with the same kind, so they merge; a3, which
    // would have been a second kind between the same blocks, is not there.
    const bundles = Object.values(f.edges).filter((e) => e.id.startsWith('bundle:'));
    expect(bundles).toHaveLength(1);
    expect(bundles[0].tags.get('archeglyph.bundled')).toBe('2');
    expect(ids(f).filter((id) => !id.startsWith('bundle:'))).toEqual(['a6']);
  });

  test('an edge inside a closed block that is left out is not counted as absorbed', () => {
    const d = diagram();
    d.graph!.edges['inner'] = create(EdgeSchema, { source: 'A1', target: 'A2', tags: { kind: 'uses' } });
    const sheet = create(StylesheetSchema, {
      schemaVersion: 2,
      shownEdgeKinds: ['invocation'],
      elements: { A: create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.CLOSED }) },
    });
    const r = new VisibilityFilterImpl().filter(init(new FilterRequest(), { diagram: d, stylesheet: sheet }));
    if (r.kind !== 'ok') {
      throw new Error('expected ok');
    }
    expect((r.value.groups['A'] as unknown as { internalEdgeCount: number }).internalEdgeCount).toBe(0);
  });
});

describe('shown_edge_kinds and hops', () => {
  const elements = (): Record<string, never> => diagram().graph!.elements as never;

  test('a hop follows only the kinds that are drawn', () => {
    // From A: invocation reaches B (a1, a2) and C (a6); dependency alone reaches C (a4).
    const all = run([]);
    const viaCalls = run(['invocation']);
    const viaUses = run(['uses']);
    expect(hiddenOutside(elements(), all, ['A'], 1)).toEqual([]);
    expect(hiddenOutside(elements(), viaCalls, ['A'], 1)).toEqual([]);
    // `uses` links A1 to B1 only, so C is out of reach.
    expect(hiddenOutside(elements(), viaUses, ['A'], 1)).toEqual(['C']);
  });
});
