// SPDX-License-Identifier: AGPL-3.0-or-later

// Coordinate-frame regressions, which are the ones that look right in every
// signal except the picture. tsc cannot see them, archegraph verify cannot see
// them (the wiring is correct; only the numbers are wrong), and the symptom —
// arrows drawn between nodes they do not connect — reads as a routing bug
// rather than a frame bug.
//
// Two real defects are pinned here:
//
//   1. ELK reports an edge's sections in the frame of the lowest common
//      ancestor of its endpoints. Nothing converted them, so every edge inside
//      a group drew at its group-local offset.
//   2. elk.layered refuses to route an edge whose endpoints differ in depth
//      unless hierarchyHandling is INCLUDE_CHILDREN, returning empty sections
//      that the renderer emitted as d="".
//
// The assertion is deliberately about the relationship rather than about
// literal coordinates: an edge must START on its source and END on its target.
// Pinning exact numbers would break every time ELK's tuning changes, and would
// not have caught either bug more clearly than this does.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import { StylesheetSchema, Vec2 } from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { layoutPipeline } from '../pipeline';
import { SvgRendererImpl } from '../renderer/svg_renderer';
import { LaidOutDiagram } from './laid_out_diagram';
import { LayoutEngineImpl } from './layout_engine/impl';
import { ElkAdapterImpl } from './layout_adapter/impl';

const require_ = createRequire(import.meta.url);

/** A node inside a group, a node outside it, and edges of both kinds. */
const GROUPED = {
  schemaVersion: 1,
  id: 'grouped',
  graph: {
    nodes: {
      outside: { id: 'outside', label: [{ locale: 'en', source: 'outside' }] },
      inner_a: { id: 'inner_a', label: [{ locale: 'en', source: 'a' }], parentGroup: 'box' },
      inner_b: { id: 'inner_b', label: [{ locale: 'en', source: 'b' }], parentGroup: 'box' },
    },
    edges: {
      // crosses the group boundary — bug 2
      crossing: { id: 'crossing', source: 'outside', target: 'inner_a' },
      // lives entirely inside the group — bug 1
      internal: { id: 'internal', source: 'inner_a', target: 'inner_b' },
    },
    groups: { box: { id: 'box', label: [{ locale: 'en', source: 'box' }] } },
  },
  metadata: { canonicalLocale: 'en' },
};

async function layout(json: unknown): Promise<LaidOutDiagram> {
  const elk = new (ElkConstructor as unknown as new (opts: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });
  const result = await layoutPipeline(
    fromJson(DiagramSchema, JSON.stringify(json)),
    create(StylesheetSchema, { schemaVersion: 1 }),
    blueprintTheme(),
    new LayoutEngineImpl(new ElkAdapterImpl(elk)),
  );
  if (result.kind === 'err') {
    throw new Error(`layout failed at ${result.error.stage}`);
  }
  return result.value;
}

/** Whether `point` lies on or just inside the box of the node called `id`. */
function touches(diagram: LaidOutDiagram, point: Vec2, id: string): boolean {
  const node = diagram.nodes.find((candidate) => candidate.id === id);
  if (node === undefined) {
    return false;
  }
  const slack = 3;
  return point.x >= node.position.x - slack
    && point.x <= node.position.x + node.size.x + slack
    && point.y >= node.position.y - slack
    && point.y <= node.position.y + node.size.y + slack;
}

function polyline(diagram: LaidOutDiagram, edgeId: string): Vec2[] {
  const edge = diagram.edges.find((candidate) => candidate.id === edgeId);
  if (edge === undefined) {
    throw new Error(`no edge ${edgeId}`);
  }
  return edge.sections.flatMap((section) => [section.startPoint, ...section.bendPoints, section.endPoint]);
}

describe('edge coordinate frame', () => {
  test('an edge inside a group is in canvas coordinates, not group-local', async () => {
    const diagram = await layout(GROUPED);
    const points = polyline(diagram, 'internal');
    expect(points.length).toBeGreaterThan(0);
    expect(touches(diagram, points[0], 'inner_a')).toBe(true);
    expect(touches(diagram, points[points.length - 1], 'inner_b')).toBe(true);
  });

  test('an edge crossing a group boundary is routed at all', async () => {
    const diagram = await layout(GROUPED);
    const points = polyline(diagram, 'crossing');
    expect(points.length).toBeGreaterThan(0);
    expect(touches(diagram, points[0], 'outside')).toBe(true);
    expect(touches(diagram, points[points.length - 1], 'inner_a')).toBe(true);
  });

  test('a grouped node sits inside its own group', async () => {
    const diagram = await layout(GROUPED);
    const group = diagram.groups.find((candidate) => candidate.id === 'box');
    const node = diagram.nodes.find((candidate) => candidate.id === 'inner_a');
    expect(group).toBeDefined();
    expect(node!.position.x).toBeGreaterThanOrEqual(group!.position.x);
    expect(node!.position.y).toBeGreaterThanOrEqual(group!.position.y);
  });
});

describe('group label placement', () => {
  test('sits at the top-left inset, not centred over its own children', async () => {
    const diagram = await layout(GROUPED);
    const rendered = new SvgRendererImpl().render(diagram);
    expect(rendered.kind).toBe('ok');
    const svg = rendered.kind === 'ok' ? rendered.value : '';

    const group = diagram.groups.find((candidate) => candidate.id === 'box')!;
    const label = svg.match(/<g id="group-box"[\s\S]*?<text x="([\d.]+)" y="([\d.]+)"/);
    expect(label).not.toBeNull();

    const x = Number(label![1]);
    const y = Number(label![2]);
    expect(x).toBeLessThan(group.position.x + group.size.x / 2);
    expect(y).toBeLessThan(group.position.y + group.size.y / 2);
    // and anchored to read rightward from that point
    expect(svg).toContain('text-anchor="start"');
  });
});

describe('theme reaches the rendered output', () => {
  test('node labels carry an explicit fill', async () => {
    // Without Typography.color on the node component the renderer emits <text>
    // with no fill, which defaults to black and is unreadable on blueprint's
    // navy ground. Identical from the CLI, so it is a theme bug, not a UI one.
    const diagram = await layout(GROUPED);
    const rendered = new SvgRendererImpl().render(diagram);
    const svg = rendered.kind === 'ok' ? rendered.value : '';
    const nodeLabel = svg.match(/<g id="node-outside"[\s\S]*?<text[^>]*>/);
    expect(nodeLabel).not.toBeNull();
    expect(nodeLabel![0]).toContain('fill=');
  });

  test('the canvas background resolves to the theme token', async () => {
    const diagram = await layout(GROUPED);
    expect(diagram.canvas?.background?.value).toBe('#0f1a2b');
  });
});
