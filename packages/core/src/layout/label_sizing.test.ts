// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { NodeLayoutSchema, TypographySchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { init } from '@archeglyph/proto/util/init';
import { ResolvedDiagram } from '../resolver/resolved_diagram';
import { ResolvedGroup } from '../resolver/resolved_group';
import { ResolvedNode } from '../resolver/resolved_node';
import { ElkAdapterImpl } from './layout_adapter/impl';
import { LayoutEngineImpl } from './layout_engine/impl';
import { LayoutRequest } from './layout_request';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from './default_size';
import { measureLabel } from '../text/font_metrics';

const FONT_SIZE = 16;
const LONG = 'importer-archegraph';

const typography = () => create(TypographySchema, { size: FONT_SIZE });
const label = (text: string) => [create(LocalizationSchema, { locale: 'en', source: text })];

async function elkGraph(diagram: ResolvedDiagram): Promise<{ children: { id: string; width: number; height: number }[] }> {
  let captured: unknown;
  const mockElk = { layout: async (graph: unknown): Promise<unknown> => { captured = graph; return graph; } };
  const result = await new ElkAdapterImpl(mockElk as never).runLayout(diagram);
  expect(result.kind).toBe('ok');
  return captured as { children: { id: string; width: number; height: number }[] };
}

const find = (graph: { children: { id: string; width: number; height: number }[] }, id: string) => {
  const found = graph.children.find((child) => child.id === id);
  if (found === undefined) { throw new Error(`no elk child ${id}`); }
  return found;
};

describe('an unpinned box is sized to hold its own label', () => {
  test('a long node label widens the box past the default', async () => {
    const node = init(new ResolvedNode(), {
      id: 'long', shape: {} as never, typography: typography(), label: label(LONG),
    });
    const graph = await elkGraph(init(new ResolvedDiagram(), {
      id: 'd', canvas: {} as never, nodes: { long: node }, edges: {}, groups: {}, annotations: {},
    }));

    expect(find(graph, 'long').width).toBeGreaterThanOrEqual(measureLabel(LONG, '', FONT_SIZE).x);
  });

  test('a short label leaves the default alone, rather than shrinking to the text', async () => {
    const node = init(new ResolvedNode(), {
      id: 'short', shape: {} as never, typography: typography(), label: label('a'),
    });
    const graph = await elkGraph(init(new ResolvedDiagram(), {
      id: 'd', canvas: {} as never, nodes: { short: node }, edges: {}, groups: {}, annotations: {},
    }));

    expect(find(graph, 'short').width).toBe(DEFAULT_WIDTH);
    expect(find(graph, 'short').height).toBe(DEFAULT_HEIGHT);
  });

  test('an explicit size still wins over the measurement', async () => {
    const node = init(new ResolvedNode(), {
      id: 'pinned', shape: {} as never, typography: typography(), label: label(LONG),
      layout: create(NodeLayoutSchema, { size: create(Vec2Schema, { x: 64, y: 20 }) }),
    });
    const graph = await elkGraph(init(new ResolvedDiagram(), {
      id: 'd', canvas: {} as never, nodes: { pinned: node }, edges: {}, groups: {}, annotations: {},
    }));

    expect(find(graph, 'pinned').width).toBe(64);
  });

  test('the pinned path and the ELK path agree on the size', async () => {
    const unpinned = init(new ResolvedNode(), {
      id: 'n', shape: {} as never, typography: typography(), label: label(LONG),
    });
    const pinned = init(new ResolvedNode(), {
      id: 'n', shape: {} as never, typography: typography(), label: label(LONG),
      layout: create(NodeLayoutSchema, { position: create(Vec2Schema, { x: 0, y: 0 }) }),
    });
    const diagram = (node: ResolvedNode) => init(new ResolvedDiagram(), {
      id: 'd', canvas: {} as never, nodes: { n: node }, edges: {}, groups: {}, annotations: {},
    });

    const viaElk = find(await elkGraph(diagram(unpinned)), 'n');
    const engine = new LayoutEngineImpl(new ElkAdapterImpl({} as never));
    const viaPins = await engine.layout(init(new LayoutRequest(), { diagram: diagram(pinned) }));
    if (viaPins.kind !== 'ok') { throw new Error('pinned layout failed'); }

    expect(viaPins.value.nodes['n'].size.x).toBe(viaElk.width);
    expect(viaPins.value.nodes['n'].size.y).toBe(viaElk.height);
  });

  test('a group label widens its box too', async () => {
    const group = init(new ResolvedGroup(), {
      id: 'g', shape: {} as never, typography: typography(), label: label(LONG),
      isSuperNode: false, hiddenDescendantCount: 0,
    });
    const graph = await elkGraph(init(new ResolvedDiagram(), {
      id: 'd', canvas: {} as never, nodes: {}, edges: {}, groups: { g: group }, annotations: {},
    }));

    expect(find(graph, 'g').width).toBeGreaterThanOrEqual(measureLabel(LONG, '', FONT_SIZE).x);
  });
});
