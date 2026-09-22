// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { NodeLayoutSchema, GroupLayoutSchema, Vec2Schema, type Vec2 } from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { ResolvedDiagram } from '../resolver/resolved_diagram';
import { ResolvedGroup } from '../resolver/resolved_group';
import { ResolvedNode } from '../resolver/resolved_node';
import { seedNewcomers } from './seed_newcomers';

// Never reached: a newcomer with no edges has no anchor to arrange against,
// so seeding places it without consulting ELK.
const noElk = { layout: async () => { throw new Error('ELK was consulted'); } } as never;

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

describe('seedNewcomers', () => {
  const diagram = init(new ResolvedDiagram(), {
    id: 'd',
    groups: byId([init(new ResolvedGroup(), {
      id: 'g',
      layout: create(GroupLayoutSchema, { position: create(Vec2Schema, { x: 100, y: 50 }) }),
    })]),
    nodes: byId([init(new ResolvedNode(), { id: 'inside', parentGroup: 'g' })]),
    edges: byId([]),
    annotations: byId([]),
  });
  const pinned = new Map<string, Vec2>([['g', create(Vec2Schema, { x: 100, y: 50 })]]);

  test('a seeded child is positioned relative to its parent group', async () => {
    const seeded = await seedNewcomers(diagram, pinned, noElk);
    const inside = seeded.get('inside');

    expect(inside).toBeDefined();
    expect(inside!.y).toBe(60);
    expect(inside!.x).toBe(-100);
  });

  test('a pinned element is never given a position', async () => {
    const seeded = await seedNewcomers(diagram, pinned, noElk);

    expect(seeded.has('g')).toBe(false);
  });
});
