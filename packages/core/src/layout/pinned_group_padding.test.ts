// SPDX-License-Identifier: MPL-2.0
// A pinned group is sized from its children. The ELK path pads a group by one
// font size on every side; the pinned path once measured only to the children's
// far edge, so the group border sat flush against the widest child (and its
// stroke overhung it). The two paths must leave the same room.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  BoxLayoutSchema,
  ElementStyleEntrySchema,
  ElementLayoutSchema,
  StylesheetSchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { layoutPipeline } from '../pipeline';
import { LayoutEngineImpl } from './layout_engine/impl';

const CONTENT = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  id: 'g',
  graph: {
    elements: {
      a: { label: [{ locale: 'en', source: 'a' }], parent: 'box' },
      b: { label: [{ locale: 'en', source: 'b' }], parent: 'box' },
      box: { label: [{ locale: 'en', source: 'box' }], role: 'ELEMENT_ROLE_GROUPING' },
    },
  },
};

const at = (x: number, y: number) => create(Vec2Schema, { x, y });
const node = (x: number, y: number) =>
  create(ElementStyleEntrySchema, { layout: create(ElementLayoutSchema, { position: at(x, y) }) });

async function pinned() {
  const diagram = fromJson(DiagramSchema, JSON.stringify(CONTENT));
  const sheet = create(StylesheetSchema, {
    schemaVersion: STYLE_SCHEMA_VERSION,
    elements: {
      box: create(ElementStyleEntrySchema, { boxLayout: create(BoxLayoutSchema, { position: at(100, 100) }) }),
      a: node(16, 40),
      b: node(16, 120),
    },
  });
  const theme = blueprintTheme();
  // Everything is pinned, so layout never reaches the adapter.
  const unreachable = { runLayout: () => { throw new Error('adapter reached'); } } as never;
  const result = await layoutPipeline(
    diagram,
    seedComponentBindings(diagram, sheet, theme),
    new Map([['default', theme]]),
    new LayoutEngineImpl(unreachable),
  );
  if (result.kind === 'err') {
    throw new Error(`layout failed: ${result.error.stage}`);
  }
  return result.value;
}

describe('a pinned group is padded past its children', () => {
  test('the far edges leave room, not a flush border', async () => {
    const laid = await pinned();
    const box = laid.groups['box'];
    for (const id of ['a', 'b']) {
      const child = laid.nodes[id];
      const right = child.position.x + child.size.x;
      const bottom = child.position.y + child.size.y;
      expect(box.position.x + box.size.x).toBeGreaterThan(right);
      expect(box.position.y + box.size.y).toBeGreaterThan(bottom);
    }
  });

  test('the room matches the near side: the font size ELK uses', async () => {
    const laid = await pinned();
    const box = laid.groups['box'];
    const a = laid.nodes['a'];
    const inset = laid.groups['box'].typography?.size ?? 13;
    expect(box.position.x + box.size.x - (a.position.x + a.size.x)).toBe(inset);
  });
});
