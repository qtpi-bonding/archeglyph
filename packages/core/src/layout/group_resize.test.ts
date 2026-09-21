// SPDX-License-Identifier: AGPL-3.0-or-later
// A group's size override reaches ELK as a MINIMUM, so it grows on request and
// stops at the extent of its children rather than clipping them.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import {
  GroupLayoutSchema,
  GroupStyleEntrySchema,
  StylesheetSchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { layoutPipeline } from '../pipeline';
import { LayoutEngineImpl } from './layout_engine/impl';
import { ElkAdapterImpl } from './layout_adapter/impl';

const require_ = createRequire(import.meta.url);
const newElk = (): unknown =>
  new (ElkConstructor as unknown as new (o: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });

const CONTENT = {
  schemaVersion: 1,
  id: 'g',
  graph: {
    nodes: {
      a: { label: [{ locale: 'en', source: 'a' }], parentGroup: 'box' },
      b: { label: [{ locale: 'en', source: 'b' }], parentGroup: 'box' },
    },
    groups: { box: { label: [{ locale: 'en', source: 'box' }] } },
  },
};

async function groupSize(size?: { x: number; y: number }): Promise<{ x: number; y: number }> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(CONTENT));
  const sheet = create(StylesheetSchema, {
    schemaVersion: 1,
    groups: {
      box: create(GroupStyleEntrySchema, {
        layout: size === undefined
          ? create(GroupLayoutSchema, {})
          : create(GroupLayoutSchema, { size: create(Vec2Schema, size) }),
      }),
    },
  });
  const theme = blueprintTheme();
  const result = await layoutPipeline(
    diagram,
    seedComponentBindings(diagram, sheet, theme),
    theme,
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (result.kind === 'err') {
    throw new Error(`layout failed: ${result.error.stage}`);
  }
  return result.value.groups['box'].size;
}

describe('resizing a group', () => {
  test('a requested size larger than the children is honoured', async () => {
    const derived = await groupSize();
    const grown = await groupSize({ x: 600, y: 400 });

    expect(grown.x).toBe(600);
    expect(grown.y).toBe(400);
    expect(grown.x).toBeGreaterThan(derived.x);
  });

  test('a requested size smaller than the children clamps to them', async () => {
    const derived = await groupSize();
    const shrunk = await groupSize({ x: 10, y: 10 });

    // Not 10x10: the group still contains everything it did before.
    expect(shrunk.x).toBe(derived.x);
    expect(shrunk.y).toBe(derived.y);
  });

  test('one axis can grow while the other clamps', async () => {
    const derived = await groupSize();
    const mixed = await groupSize({ x: 600, y: 10 });

    expect(mixed.x).toBe(600);
    expect(mixed.y).toBe(derived.y);
  });
});
