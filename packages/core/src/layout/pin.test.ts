// SPDX-License-Identifier: MPL-2.0

// The invariant the pinning work exists for, written by hand because testgen
// dropped it.
//
// It was planned correctly -- `pinned-elements-never-move-when-adding-newcomer`
// -- but flagged `is_property: true`, and property generation is currently
// broken, so `skip_property_tests: true` removes such cases from the PLAN
// rather than merely from the emitted code. The single most important case in
// the pillar therefore vanished. The nearest survivor,
// `pinned-elements-passed-as-fixed-hints`, checks that positions are HANDED TO
// ELK, which is a different and much weaker claim: passing a hint does not
// establish that ELK honoured it, and whether it honours it is the entire
// question (D1b).
//
// What is being protected: a user arranges a diagram, adds one node, and
// everything they positioned must stay exactly where they put it. Not nearly.
// Exactly. It is the most destructive thing an auto-layout editor can get
// wrong, and it is invisible to tsc and to archegraph verify -- the wiring is
// identical whether ELK respects a pin or quietly shifts it by four pixels.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import { NodeLayoutSchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { ElkAdapterImpl } from './layout_adapter/impl';
import { LayoutEngineImpl } from './layout_engine/impl';
import { LayoutRequest } from './layout_request';
import { ResolvedDiagram } from '../resolver/resolved_diagram';
import { ResolvedNode } from '../resolver/resolved_node';
import { init } from '@archeglyph/proto/util/init';

const require_ = createRequire(import.meta.url);

function engine(): LayoutEngineImpl {
  const elk = new (ElkConstructor as unknown as new (opts: object) => never)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });
  return new LayoutEngineImpl(new ElkAdapterImpl(elk));
}

function pinnedNode(id: string, x: number, y: number): ResolvedNode {
  return init(new ResolvedNode(), {
    id,
    layout: create(NodeLayoutSchema, { position: create(Vec2Schema, { x, y }) }),
  });
}

function unpinnedNode(id: string): ResolvedNode {
  return init(new ResolvedNode(), { id });
}

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

function diagramOf(nodes: ResolvedNode[]): ResolvedDiagram {
  return init(new ResolvedDiagram(), {
    id: 'd', nodes: byId(nodes), edges: {}, groups: {}, annotations: {},
  });
}

async function layoutOf(nodes: ResolvedNode[]) {
  const request = init(new LayoutRequest(), { diagram: diagramOf(nodes) });
  const result = await engine().layout(request);
  if (result.kind === 'err') {
    throw new Error('layout failed');
  }
  return result.value;
}

describe('pin-on-touch: adding an element must not move a pinned one', () => {
  test('two pinned nodes keep their exact positions when a third is added', async () => {
    const before = await layoutOf([pinnedNode('a', 10, 20), pinnedNode('b', 300, 20)]);
    const after = await layoutOf([
      pinnedNode('a', 10, 20),
      pinnedNode('b', 300, 20),
      unpinnedNode('newcomer'),
    ]);

    for (const id of ['a', 'b']) {
      const was = before.nodes[id];
      const now = after.nodes[id];
      expect(now).toBeDefined();
      // Exact equality on purpose. A tolerance here would hide precisely the
      // failure this test exists to catch -- elk.layered treating a fixed
      // position as a preference and nudging it to satisfy its own ranking.
      expect(now!.position.x).toBe(was!.position.x);
      expect(now!.position.y).toBe(was!.position.y);
    }
  });

  test('pinned positions equal what the stylesheet declared, not merely what they were before', async () => {
    // Guards against both layouts being wrong in the same way, which the
    // previous test alone would not catch.
    const after = await layoutOf([
      pinnedNode('a', 10, 20),
      pinnedNode('b', 300, 20),
      unpinnedNode('newcomer'),
    ]);
    const a = after.nodes['a'];
    const b = after.nodes['b'];
    expect(a!.position.x).toBe(10);
    expect(a!.position.y).toBe(20);
    expect(b!.position.x).toBe(300);
    expect(b!.position.y).toBe(20);
  });

  test('the newcomer does not land on top of a pinned node', async () => {
    // THE ONE THAT MATTERS, and the reason fixed hints are needed rather than
    // just the override loop.
    //
    // Today layout runs ELK over everything and then OVERWRITES any element
    // that carries an explicit position. So pinned elements already land where
    // declared -- the two tests above pass against the current code. But ELK
    // never learns those positions, so it is free to place the newcomer
    // exactly where a pinned node is about to be put back, and the override
    // then drops one on top of the other.
    //
    // Passing pinned elements to ELK as fixed hints is what prevents that. It
    // is the difference between "the pins are respected" and "the layout makes
    // sense".
    const after = await layoutOf([
      pinnedNode('a', 10, 20),
      pinnedNode('b', 300, 20),
      unpinnedNode('newcomer'),
    ]);
    const newcomer = after.nodes['newcomer']!;
    for (const id of ['a', 'b']) {
      const pinned = after.nodes[id]!;
      const overlaps =
        newcomer.position.x < pinned.position.x + pinned.size.x &&
        newcomer.position.x + newcomer.size.x > pinned.position.x &&
        newcomer.position.y < pinned.position.y + pinned.size.y &&
        newcomer.position.y + newcomer.size.y > pinned.position.y;
      expect(overlaps).toBe(false);
    }
  });

  test('the newcomer is actually placed somewhere', async () => {
    // Otherwise "nothing moved" could be satisfied by doing no layout at all.
    const after = await layoutOf([pinnedNode('a', 10, 20), unpinnedNode('newcomer')]);
    const newcomer = after.nodes['newcomer'];
    expect(newcomer).toBeDefined();
    expect(Number.isFinite(newcomer!.position.x)).toBe(true);
    expect(Number.isFinite(newcomer!.position.y)).toBe(true);
  });
});
