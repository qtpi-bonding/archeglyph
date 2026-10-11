// SPDX-License-Identifier: MPL-2.0
//
// Spec (elements-and-containers, "Layout"): for an edge where one endpoint is
// an ancestor of the other, ELK reports the route in the ANCESTOR's coordinate
// frame. The adapter must still hand back ABSOLUTE diagram coordinates, so each
// section endpoint has to land on the absolute rect of the element it joins.
// Real elkjs run, black-box through layoutPipeline.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import { BoxLayoutSchema, ElementLayoutSchema, ElementStyleEntrySchema, StylesheetSchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { layoutPipeline } from '../pipeline';
import { LaidOutDiagram } from './laid_out_diagram';
import { LayoutEngineImpl } from './layout_engine/impl';
import { ElkAdapterImpl } from './layout_adapter/impl';

const require_ = createRequire(import.meta.url);
const newElk = (): unknown =>
  new (ElkConstructor as unknown as new (o: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });

const el = (parent?: string) => ({ label: [{ locale: 'en', source: 'x' }], ...(parent === undefined ? {} : { parent }) });
const ed = (source: string, target: string) => ({ source, target });

// p is an OPEN box holding c and q; q is itself a box holding gc. `out` and
// `left` sit beside p so that p is not at the origin even when unpinned.
const CONTENT = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  id: 'ancestor-edges',
  graph: {
    elements: {
      left: el(), out: el(), p: el(),
      c: el('p'), q: el('p'), gc: el('q'),
    },
    edges: {
      a_child_to_ancestor: ed('c', 'p'),
      b_ancestor_to_child: ed('p', 'c'),
      c_grandchild_to_grandparent: ed('gc', 'p'),
      d_container_to_own_parent: ed('q', 'p'),
      e_sibling_to_sibling: ed('c', 'q'),
      f_outside_to_p: ed('out', 'p'),
      g_left_to_out: ed('left', 'out'),
    },
  },
  metadata: { canonicalLocale: 'en' },
};

async function layout(pinned: boolean): Promise<LaidOutDiagram> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(CONTENT));
  const theme = blueprintTheme();
  const sheet = create(StylesheetSchema, {
    schemaVersion: STYLE_SCHEMA_VERSION,
    elements: pinned
      ? {
          p: create(ElementStyleEntrySchema, { boxLayout: create(BoxLayoutSchema, { position: create(Vec2Schema, { x: 400, y: 250 }) }) }),
          q: create(ElementStyleEntrySchema, { boxLayout: create(BoxLayoutSchema, { position: create(Vec2Schema, { x: 220, y: 50 }) }) }),
          c: create(ElementStyleEntrySchema, { layout: create(ElementLayoutSchema, { position: create(Vec2Schema, { x: 30, y: 50 }) }) }),
          gc: create(ElementStyleEntrySchema, { layout: create(ElementLayoutSchema, { position: create(Vec2Schema, { x: 30, y: 50 }) }) }),
        }
      : {},
  });
  const result = await layoutPipeline(
    diagram,
    seedComponentBindings(diagram, sheet, theme),
    new Map([['default', theme]]),
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (result.kind === 'err') {
    throw new Error(`layout failed at ${result.error.stage}`);
  }
  return result.value;
}

interface Rect { x: number; y: number; w: number; h: number }
function rectOf(d: LaidOutDiagram, id: string): Rect {
  const e = d.nodes[id] ?? d.groups[id];
  if (e === undefined) {
    throw new Error(`no laid-out element ${id}`);
  }
  return { x: e.position.x, y: e.position.y, w: e.size.x, h: e.size.y };
}

const TOL = 2;
function distanceOutside(pt: { x: number; y: number }, r: Rect): number {
  const dx = Math.max(r.x - pt.x, 0, pt.x - (r.x + r.w));
  const dy = Math.max(r.y - pt.y, 0, pt.y - (r.y + r.h));
  return Math.max(dx, dy);
}

function expectEndpointsOnElements(d: LaidOutDiagram, edgeId: string, source: string, target: string): void {
  const edge = d.edges[edgeId];
  expect(edge?.sections.length ?? 0).toBeGreaterThan(0);
  const section = edge.sections[0];
  expect(distanceOutside(section.startPoint, rectOf(d, source))).toBeLessThanOrEqual(TOL);
  expect(distanceOutside(section.endPoint, rectOf(d, target))).toBeLessThanOrEqual(TOL);
}

const EDGES: Array<[string, string, string]> = [
  ['a_child_to_ancestor', 'c', 'p'],
  ['b_ancestor_to_child', 'p', 'c'],
  ['c_grandchild_to_grandparent', 'gc', 'p'],
  ['d_container_to_own_parent', 'q', 'p'],
];
const CONTROLS: Array<[string, string, string]> = [
  ['e_sibling_to_sibling', 'c', 'q'],
  ['f_outside_to_p', 'out', 'p'],
];

for (const pinned of [false, true]) {
  describe(`edges around an ancestor, ${pinned ? 'p pinned away from the origin' : 'unpinned'}`, () => {
    let d: LaidOutDiagram;
    const get = async (): Promise<LaidOutDiagram> => (d ??= await layout(pinned));

    test('the fixture puts p away from the origin and c inside it', async () => {
      const diagram = await get();
      const p = rectOf(diagram, 'p');
      const c = rectOf(diagram, 'c');
      expect(p.x + p.y).toBeGreaterThan(20);
      expect(c.x).toBeGreaterThanOrEqual(p.x);
      expect(c.y).toBeGreaterThanOrEqual(p.y);
      expect(c.x + c.w).toBeLessThanOrEqual(p.x + p.w);
      expect(c.y + c.h).toBeLessThanOrEqual(p.y + p.h);
    });

    for (const [id, s, t] of EDGES) {
      test(`ancestor edge ${id} ends are in absolute coordinates`, async () => {
        expectEndpointsOnElements(await get(), id, s, t);
      });
    }
    for (const [id, s, t] of CONTROLS) {
      test(`control ${id} ends are in absolute coordinates`, async () => {
        expectEndpointsOnElements(await get(), id, s, t);
      });
    }
  });
}
