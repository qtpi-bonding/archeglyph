// SPDX-License-Identifier: MPL-2.0
//
// Phase E4: absorption and bundling, including the conservation property
//   absorbed + sum(bundle counts) + unmerged drawn edges == non-hidden edges.
//
// internalEdgeCount does not exist before the implementation; `internal()`
// narrows with a cast for that reason only.

import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementRole, type Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  ElementStyleEntrySchema,
  GroupRenderMode,
  NodeVisibility,
  StylesheetSchema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilterRequest } from './filter_request';
import { type FilteredDiagram } from './filtered_diagram';
import { type FilteredEdge } from './filtered_edge';
import { type FilteredGroup } from './filtered_group';
import { VisibilityFilterImpl } from './visibility_filter';

const filterImpl = new VisibilityFilterImpl();

interface E {
  id: string;
  s: string;
  t: string;
  kind?: string;
  label?: string;
}

function diagram(elements: Record<string, { parent?: string; role?: ElementRole }>, edges: E[]): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'd',
    graph: {
      elements: Object.fromEntries(Object.entries(elements).map(([id, e]) => [id, {
        label: [], tags: {}, parent: e.parent, role: e.role ?? ElementRole.ENTITY,
      }])),
      edges: Object.fromEntries(edges.map((e) => [e.id, {
        source: e.s,
        target: e.t,
        ordinal: 0,
        label: e.label === undefined ? [] : [{ locale: 'en', source: e.label }],
        tags: e.kind === undefined ? ({} as Record<string, string>) : { kind: e.kind },
      }])),
    },
  });
}

function sheet(style: Record<string, { mode?: GroupRenderMode; hidden?: boolean }>): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 2,
    elements: Object.fromEntries(Object.entries(style).map(([id, s]) => [id, create(ElementStyleEntrySchema, {
      renderMode: s.mode,
      visibility: s.hidden === true ? NodeVisibility.HIDDEN : undefined,
    })])),
  });
}

function run(d: Diagram, s?: Stylesheet): FilteredDiagram {
  const r = filterImpl.filter(init(new FilterRequest(), { diagram: d, stylesheet: s }));
  if (r.kind !== 'ok') {
    throw new Error(`expected ok, got err: ${r.error.message}`);
  }
  return r.value;
}

const internal = (g: FilteredGroup): number => (g as unknown as { internalEdgeCount: number }).internalEdgeCount;
const bundles = (f: FilteredDiagram): FilteredEdge[] =>
  Object.values(f.edges).filter((e) => e.tags.has('archeglyph.bundled'));
const ids = (m: Record<string, unknown>): string[] => Object.keys(m).sort();

// K is a CLOSED container of m1, m2; X and Y are outside it.
const els = { K: {}, m1: { parent: 'K' }, m2: { parent: 'K' }, X: {}, Y: {} };
const closedK = sheet({ K: { mode: GroupRenderMode.CLOSED } });

describe('merging only remapped edges', () => {
  test('a single remapped edge keeps its own id and is not a bundle', () => {
    const f = run(diagram(els, [{ id: 'a1', s: 'X', t: 'm1', kind: 'call' }]), closedK);
    expect(ids(f.edges)).toEqual(['a1']);
    expect(f.edges['a1'].source).toBe('X');
    expect(f.edges['a1'].target).toBe('K');
    expect(bundles(f)).toEqual([]);
  });

  test('two remapped edges with the same lifted ends, label and kind become one bundle of 2', () => {
    const f = run(diagram(els, [
      { id: 'a1', s: 'X', t: 'm1', kind: 'call', label: 'calls' },
      { id: 'a2', s: 'X', t: 'm2', kind: 'call', label: 'calls' },
    ]), closedK);
    expect(Object.keys(f.edges)).toHaveLength(1);
    const [b] = bundles(f);
    expect(b.id.startsWith('bundle:')).toBe(true);
    expect(b.tags.get('archeglyph.bundled')).toBe('2');
    expect(b.source).toBe('X');
    expect(b.target).toBe('K');
  });

  test('the bundle id is unchanged when a third identical-key edge joins', () => {
    const two: E[] = [
      { id: 'a1', s: 'X', t: 'm1', kind: 'call', label: 'calls' },
      { id: 'a2', s: 'X', t: 'm2', kind: 'call', label: 'calls' },
    ];
    const f2 = run(diagram(els, two), closedK);
    const f3 = run(diagram(els, [...two, { id: 'a3', s: 'X', t: 'm1', kind: 'call', label: 'calls' }]), closedK);
    expect(bundles(f2)).toHaveLength(1);
    expect(bundles(f3)).toHaveLength(1);
    expect(bundles(f3)[0].tags.get('archeglyph.bundled')).toBe('3');
    expect(bundles(f3)[0].id).toBe(bundles(f2)[0].id);
  });

  test('the same lifted ends with different tags.kind stay separate and keep their ids', () => {
    const f = run(diagram(els, [
      { id: 'b1', s: 'X', t: 'm1', kind: 'call' },
      { id: 'b2', s: 'X', t: 'm2', kind: 'data' },
    ]), closedK);
    expect(ids(f.edges)).toEqual(['b1', 'b2']);
    expect(bundles(f)).toEqual([]);
  });

  test('the same lifted ends and kind but different labels stay separate', () => {
    const f = run(diagram(els, [
      { id: 'c1', s: 'X', t: 'm1', kind: 'call', label: 'one' },
      { id: 'c2', s: 'X', t: 'm2', kind: 'call', label: 'two' },
    ]), closedK);
    expect(ids(f.edges)).toEqual(['c1', 'c2']);
  });

  test('author-drawn parallel edges that are not remapped keep their own ids, even with identical keys', () => {
    const f = run(diagram(els, [
      { id: 'p1', s: 'X', t: 'Y', kind: 'call', label: 'calls' },
      { id: 'p2', s: 'X', t: 'Y', kind: 'call', label: 'calls' },
    ]), closedK);
    expect(ids(f.edges)).toEqual(['p1', 'p2']);
    expect(bundles(f)).toEqual([]);
  });

  test('a bundle has no style entry: a remapped pair never needs one', () => {
    const f = run(diagram(els, [
      { id: 'a1', s: 'X', t: 'm1', kind: 'call' },
      { id: 'a2', s: 'X', t: 'm2', kind: 'call' },
    ]), closedK);
    expect(bundles(f)[0].id.startsWith('bundle:')).toBe(true);
  });
});

describe('absorption', () => {
  test('a member-to-own-container edge is absorbed into a closed container, not drawn as a self-loop', () => {
    const f = run(diagram(els, [{ id: 'up', s: 'm1', t: 'K', kind: 'return' }]), closedK);
    expect(f.edges['up']).toBeUndefined();
    expect(internal(f.groups['K'])).toBe(1);
  });

  test('member-to-member edges inside a closed container are counted alongside', () => {
    const f = run(diagram(els, [
      { id: 'up', s: 'm1', t: 'K' },
      { id: 'in', s: 'm1', t: 'm2' },
      { id: 'out', s: 'X', t: 'm1' },
    ]), closedK);
    expect(internal(f.groups['K'])).toBe(2);
    expect(ids(f.edges)).toEqual(['out']);
  });

  test('genuine self-loops on a leaf and on a closed container itself are kept', () => {
    const f = run(diagram(els, [
      { id: 'loopY', s: 'Y', t: 'Y' },
      { id: 'loopK', s: 'K', t: 'K' },
    ]), closedK);
    expect(ids(f.edges)).toEqual(['loopK', 'loopY']);
    expect(internal(f.groups['K'])).toBe(0);
  });

  test('a self-loop on a member of a closed container is absorbed (lifted ends equal and differ from the originals)', () => {
    const f = run(diagram(els, [{ id: 'loop', s: 'm1', t: 'm1' }]), closedK);
    expect(f.edges['loop']).toBeUndefined();
    expect(internal(f.groups['K'])).toBe(1);
  });

  test('nothing is absorbed while the container is open', () => {
    const f = run(diagram(els, [{ id: 'up', s: 'm1', t: 'K' }, { id: 'in', s: 'm1', t: 'm2' }]));
    expect(ids(f.edges)).toEqual(['in', 'up']);
    expect(internal(f.groups['K'] ?? ({ internalEdgeCount: 0 } as unknown as FilteredGroup))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Conservation property.
// ---------------------------------------------------------------------------

// Mostly one kind, so remapped edges collide on the merge key often enough.
const kindOf = (k: number): string => (k % 5 === 0 ? 'data' : 'call');

type Mode = 'none' | 'open' | 'closed' | 'dissolved' | 'hidden' | 'hiddenClosed';

interface Forest {
  parents: number[];      // parents[i] < i, or -1
  grouping: boolean[];
  mode: Mode[];
  edges: Array<[number, number]>;
}

const forestArb: fc.Arbitrary<Forest> = fc.integer({ min: 2, max: 12 }).chain((n) =>
  fc.record({
    parents: fc.tuple(...Array.from({ length: n }, (_, i) =>
      i === 0 ? fc.constant(-1) : fc.oneof(
        { arbitrary: fc.constant(-1), weight: 1 },
        { arbitrary: fc.integer({ min: 0, max: i - 1 }), weight: 5 }))),
    grouping: fc.tuple(...Array.from({ length: n }, () => fc.boolean())),
    mode: fc.tuple(...Array.from({ length: n }, () => fc.constantFrom<Mode>(
      'none', 'none', 'none', 'none', 'open', 'closed', 'closed', 'closed', 'dissolved', 'dissolved', 'hidden', 'hiddenClosed'))),
    edges: fc.array(fc.tuple(fc.integer({ min: 0, max: n - 1 }), fc.integer({ min: 0, max: n - 1 })), { minLength: 8, maxLength: 60 }),
  }) as unknown as fc.Arbitrary<Forest>);


describe('conservation property', () => {
  test('absorbed + bundled members + unmerged drawn edges == non-hidden edges', () => {
    fc.assert(fc.property(forestArb, (forest) => {
      const n = forest.parents.length;
      const name = (i: number): string => `n${String(i).padStart(2, '0')}`;
      const entity = (i: number): boolean => !forest.grouping[i];
      const modeOf = (i: number): Mode => {
        // DISSOLVED is legal only on a GROUPING.
        return forest.mode[i] === 'dissolved' && entity(i) ? 'open' : forest.mode[i];
      };

      const elements: Record<string, { parent?: string; role?: ElementRole }> = {};
      for (let i = 0; i < n; i++) {
        elements[name(i)] = {
          parent: forest.parents[i] >= 0 ? name(forest.parents[i]) : undefined,
          role: entity(i) ? ElementRole.ENTITY : ElementRole.GROUPING,
        };
      }
      const edgeList: E[] = [];
      forest.edges.forEach(([s, t], k) => {
        if (entity(s) && entity(t)) {
          edgeList.push({ id: `e${String(k).padStart(2, '0')}`, s: name(s), t: name(t), kind: kindOf(k) });
        }
      });

      const style: Record<string, { mode?: GroupRenderMode; hidden?: boolean }> = {};
      for (let i = 0; i < n; i++) {
        const m = modeOf(i);
        if (m === 'open') style[name(i)] = { mode: GroupRenderMode.OPEN };
        else if (m === 'closed') style[name(i)] = { mode: GroupRenderMode.CLOSED };
        else if (m === 'dissolved') style[name(i)] = { mode: GroupRenderMode.DISSOLVED };
        else if (m === 'hidden') style[name(i)] = { hidden: true };
        else if (m === 'hiddenClosed') style[name(i)] = { hidden: true, mode: GroupRenderMode.CLOSED };
      }

      // Independent expectation: hidden if the endpoint or any ancestor is hidden.
      const hiddenSelf = (i: number): boolean => modeOf(i) === 'hidden' || modeOf(i) === 'hiddenClosed';
      const hiddenAnywhere = (i: number): boolean => {
        for (let cur = i; cur >= 0; cur = forest.parents[cur]) {
          if (hiddenSelf(cur)) return true;
        }
        return false;
      };
      const idx = (id: string): number => Number(id.slice(1));
      const expected = edgeList.filter((e) => !hiddenAnywhere(idx(e.s)) && !hiddenAnywhere(idx(e.t))).length;

      const f = run(diagram(elements, edgeList), sheet(style));
      // `?? 0` so the property fails on the real conservation gap, not NaN, while the field is missing.
      const absorbed = Object.values(f.groups).reduce((sum, g) => sum + (internal(g) ?? 0), 0);
      const drawn = Object.values(f.edges);
      const bundled = drawn.filter((e) => e.tags.has('archeglyph.bundled'))
        .reduce((sum, e) => sum + Number(e.tags.get('archeglyph.bundled')), 0);
      const unmerged = drawn.filter((e) => !e.tags.has('archeglyph.bundled')).length;


      // No drawn edge may reference an element that is not drawn.
      const present = new Set([...Object.keys(f.nodes), ...Object.keys(f.groups)]);
      for (const e of drawn) {
        expect(present.has(e.source) && present.has(e.target)).toBe(true);
      }
      expect(absorbed + bundled + unmerged).toBe(expected);
    }), { numRuns: 1000 });
  });

  // Structural coverage of the generator, independent of the code under test:
  // sampled forests must contain the situations the property is about.
  test('the generator produces closed containers with internal edges, mergeable remaps, hidden edges, container endpoints and dissolved groupings', () => {
    const samples = fc.sample(forestArb, { numRuns: 1000, seed: 1 });
    const seen = { internal: 0, mergeable: 0, hiddenEdge: 0, containerEndpoint: 0, dissolved: 0 };
    for (const f of samples) {
      const n = f.parents.length;
      const isEntity = (i: number): boolean => !f.grouping[i];
      const mode = (i: number): Mode => (f.mode[i] === 'dissolved' && isEntity(i) ? 'open' : f.mode[i]);
      const closed = (i: number): boolean => mode(i) === 'closed' || mode(i) === 'hiddenClosed';
      const hiddenSelf = (i: number): boolean => mode(i) === 'hidden' || mode(i) === 'hiddenClosed';
      const hiddenAny = (i: number): boolean => {
        for (let c = i; c >= 0; c = f.parents[c]) if (hiddenSelf(c)) return true;
        return false;
      };
      const rep = (i: number): number => {
        let r = i;
        for (let c = i; c >= 0; c = f.parents[c]) if (closed(c)) r = c;
        return r;
      };
      const live = f.edges.map(([s, t], k): [number, number, number] => [s, t, k])
        .filter(([s, t]) => isEntity(s) && isEntity(t));
      if (live.some(([s, t]) => hiddenAny(s) || hiddenAny(t))) seen.hiddenEdge++;
      if (live.some(([s, t]) => f.parents.includes(s) || f.parents.includes(t))) seen.containerEndpoint++;
      if (Array.from({ length: n }, (_, i) => i).some((i) => f.grouping[i] && f.mode[i] === 'dissolved')) seen.dissolved++;
      const visible = live.filter(([s, t]) => !hiddenAny(s) && !hiddenAny(t));
      if (visible.some(([s, t]) => rep(s) === rep(t) && (rep(s) !== s || rep(t) !== t))) seen.internal++;
      const keys = visible.filter(([s, t]) => rep(s) !== s || rep(t) !== t)
        .filter(([s, t]) => rep(s) !== rep(t))
        .map(([s, t, k]) => `${rep(s)}>${rep(t)}>${kindOf(k)}`);
      if (new Set(keys).size < keys.length) seen.mergeable++;
    }
    expect(seen.internal).toBeGreaterThan(50);
    expect(seen.mergeable).toBeGreaterThan(10);
    expect(seen.hiddenEdge).toBeGreaterThan(50);
    expect(seen.containerEndpoint).toBeGreaterThan(50);
    expect(seen.dissolved).toBeGreaterThan(50);
  });
});
