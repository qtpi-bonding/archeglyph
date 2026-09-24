// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { NodeLayoutSchema, GroupLayoutSchema, TypographySchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { init } from '@archeglyph/proto/util/init';
import { ResolvedDiagram } from '../resolver/resolved_diagram';
import { ResolvedGroup } from '../resolver/resolved_group';
import { ResolvedNode } from '../resolver/resolved_node';
import { LayoutEngineImpl } from './layout_engine/impl';
import { ElkAdapterImpl } from './layout_adapter/impl';
import { LayoutRequest } from './layout_request';
import { measureLabel } from '../text/font_metrics';

const FONT_SIZE = 13;
const LONG = 'One VPS, Docker Compose';

const typography = () => create(TypographySchema, { size: FONT_SIZE });
const label = (text: string) => [create(LocalizationSchema, { locale: 'en', source: text })];
const vec = (x: number, y: number) => create(Vec2Schema, { x, y });

function pinned(): ResolvedDiagram {
  const child = init(new ResolvedNode(), {
    id: 'c', parentGroup: 'g', shape: {} as never, typography: typography(), label: label('x'),
    layout: create(NodeLayoutSchema, { position: vec(16, 40), size: vec(60, 30) }),
  });
  const group = init(new ResolvedGroup(), {
    id: 'g', shape: {} as never, typography: typography(), label: label(LONG),
    isSuperNode: false, hiddenDescendantCount: 0,
    layout: create(GroupLayoutSchema, { position: vec(0, 0) }),
  });
  return init(new ResolvedDiagram(), {
    id: 'd', canvas: {} as never, nodes: { c: child }, groups: { g: group }, edges: {}, annotations: {},
  });
}

describe('a group is wide enough for its own label', () => {
  test('a label wider than the children widens the box', async () => {
    const engine = new LayoutEngineImpl(new ElkAdapterImpl({} as never));
    const result = await engine.layout(init(new LayoutRequest(), { diagram: pinned() }));
    if (result.kind !== 'ok') { throw new Error('layout failed'); }

    expect(result.value.groups['g'].size.x).toBeGreaterThanOrEqual(measureLabel(LONG, '', FONT_SIZE).x);
  });
});
