// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import ELK from 'elkjs';
import { create } from '@bufbuild/protobuf';
import { NodeLayoutSchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { ResolvedDiagram } from '../resolver/resolved_diagram';
import { ResolvedEdge } from '../resolver/resolved_edge';
import { ResolvedNode } from '../resolver/resolved_node';
import { seedNewcomers } from './seed_newcomers';

const vec = (x: number, y: number) => create(Vec2Schema, { x, y });

const node = (id: string, at?: { x: number; y: number }) => init(new ResolvedNode(), {
  id, shape: {} as never, typography: {} as never, label: [],
  ...(at === undefined ? {} : { layout: create(NodeLayoutSchema, { position: vec(at.x, at.y), size: vec(120, 40) }) }),
});

const edge = (id: string, source: string, target: string) =>
  init(new ResolvedEdge(), { id, source, target, label: [], connection: {} as never, typography: {} as never });

describe('newcomers hanging off one pinned element', () => {
  test('several unpinned nodes sharing a single anchor get distinct positions', async () => {
    const diagram = init(new ResolvedDiagram(), {
      id: 'd', canvas: {} as never, annotations: {}, groups: {},
      nodes: {
        hub: node('hub', { x: 100, y: 100 }),
        a: node('a'), b: node('b'), c: node('c'),
      },
      edges: {
        hub__a: edge('hub__a', 'hub', 'a'),
        hub__b: edge('hub__b', 'hub', 'b'),
        hub__c: edge('hub__c', 'hub', 'c'),
      },
    });

    const seeded = await seedNewcomers(diagram, new Map([['hub', vec(100, 100)]]), new ELK());
    const placed = ['a', 'b', 'c'].map((id) => {
      const at = seeded.get(id);
      if (at === undefined) { throw new Error(`no seed for ${id}`); }
      return `${at.x},${at.y}`;
    });

    expect(new Set(placed).size).toBe(3);
  });
});
