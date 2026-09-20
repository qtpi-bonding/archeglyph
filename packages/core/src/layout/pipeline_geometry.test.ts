// SPDX-License-Identifier: AGPL-3.0-or-later

// Correctness tests for the layout -> render leg of the pipeline
// (layoutPipeline in packages/core/src/pipeline, SvgRendererImpl in
// packages/core/src/renderer/svg_renderer).
//
// Expectations are derived from, in order: docs/design.md (data model +
// §5 "Layout pipeline (detail)"), proto/style.proto + proto/content.proto
// field comments, and the .archegraph/specs/{layout,renderer,layout-edge-frame}
// textprotos. Implementation bodies were read only for signatures/imports.
//
// Per instructions: failing tests are left in place, not adjusted to match
// whatever the implementation currently does. See the final chat report for
// the list of failures and their evidence.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import {
  ArrowheadVariant,
  ArrowheadsSchema,
  ColorSchema,
  EdgeStyleEntrySchema,
  Glyph1DSchema,
  GroupLayoutSchema,
  GroupRenderMode,
  GroupStyleEntrySchema,
  StrokeSchema,
  type Stylesheet,
  StylesheetSchema,
  Vec2,
} from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { layoutPipeline } from '../pipeline';
import { SvgRendererImpl } from '../renderer/svg_renderer';
import { LaidOutDiagram } from './laid_out_diagram';
import { LayoutEngineImpl } from './layout_engine/impl';
import { ElkAdapterImpl } from './layout_adapter/impl';

const require_ = createRequire(import.meta.url);

function newElk(): unknown {
  return new (ElkConstructor as unknown as new (opts: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });
}

// Component bindings are seeded from the theme's declared defaults before the
// pipeline runs -- the same step the CLI ops and the editor perform on load.
// The resolver assumes no binding of its own, so rendering a diagram against a
// literally empty stylesheet is not a configuration any caller produces; the
// "unseeded renders unstyled" case is pinned explicitly below instead.
async function layout(json: unknown, stylesheet?: Stylesheet): Promise<LaidOutDiagram> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(json));
  const theme = blueprintTheme();
  const seeded = seedComponentBindings(
    diagram,
    stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 }),
    theme,
  );
  const result = await layoutPipeline(
    diagram,
    seeded,
    theme,
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (result.kind === 'err') {
    throw new Error(`layout failed at ${result.error.stage}`);
  }
  return result.value;
}

function renderOk(diagram: LaidOutDiagram): string {
  const rendered = new SvgRendererImpl().render(diagram);
  if (rendered.kind === 'err') {
    throw new Error(`render failed: ${rendered.error.message}`);
  }
  return rendered.value;
}

function bbox(diagram: LaidOutDiagram): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const el of [...diagram.nodes, ...diagram.groups, ...diagram.annotations]) {
    minX = Math.min(minX, el.position.x);
    minY = Math.min(minY, el.position.y);
    maxX = Math.max(maxX, el.position.x + el.size.x);
    maxY = Math.max(maxY, el.position.y + el.size.y);
  }
  return { minX, minY, maxX, maxY };
}

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Two levels of nesting: outer > mid > inner, plus a top-level node, and
 * edges at every depth combination. design.md §4.2.x: "NodeLayout.position
 * semantics: relative to parent ... GroupLayout.position semantics: same",
 * and laid_out_node.spec.textproto / layout_engine.spec.textproto document
 * that after layoutPipeline these become canvas-absolute. If two-level
 * nesting behaves like one-level nesting, an innermost node's absolute
 * position must still land inside both its immediate parent's box AND its
 * grandparent's box. */
const DEEP_NESTING = {
  schemaVersion: 1,
  id: 'deep-nesting',
  graph: {
    nodes: {
      top: { label: [{ locale: 'en', source: 'top' }] },
      mid_node: { label: [{ locale: 'en', source: 'mid' }], parentGroup: 'outer' },
      deep: { label: [{ locale: 'en', source: 'deep' }], parentGroup: 'inner' },
    },
    edges: {
      top_to_deep: { source: 'top', target: 'deep' },
      mid_to_deep: { source: 'mid_node', target: 'deep' },
    },
    groups: {
      outer: { label: [{ locale: 'en', source: 'outer' }] },
      inner: { label: [{ locale: 'en', source: 'inner' }], parentGroup: 'outer' },
    },
  },
  metadata: { canonicalLocale: 'en' },
};

/** A small diagram with an edge that should carry an arrowhead marker. */
function diagramWithArrowhead() {
  return {
    schemaVersion: 1,
    id: 'arrowed',
    graph: {
      nodes: {
        a: { label: [{ locale: 'en', source: 'a' }] },
        b: { label: [{ locale: 'en', source: 'b' }] },
      },
      edges: {
        a_b: { source: 'a', target: 'b' },
      },
      groups: {},
    },
    metadata: { canonicalLocale: 'en' },
  };
}

function stylesheetWithArrowhead() {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    edges: {
      a_b: create(EdgeStyleEntrySchema, {
        connection: create(Glyph1DSchema, {
          stroke: create(StrokeSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#ff0000' }) } }),
          arrowheads: create(ArrowheadsSchema, { end: ArrowheadVariant.ARROWHEAD_FILLED }),
        }),
      }),
    },
  });
}

const SIMPLE_UNSTYLED = {
  schemaVersion: 1,
  id: 'unstyled',
  graph: {
    nodes: {
      lonely: { label: [{ locale: 'en', source: 'lonely' }] },
    },
    edges: {},
    groups: {},
  },
  metadata: { canonicalLocale: 'en' },
};

const MANY_ELEMENTS = {
  schemaVersion: 1,
  id: 'many',
  graph: {
    nodes: {
      n1: { label: [{ locale: 'en', source: 'n1' }], parentGroup: 'g1' },
      n2: { label: [{ locale: 'en', source: 'n2' }], parentGroup: 'g1' },
      n3: { label: [{ locale: 'en', source: 'n3' }] },
    },
    edges: {
      e1: { source: 'n1', target: 'n2' },
      e2: { source: 'n2', target: 'n3' },
    },
    groups: {
      g1: { label: [{ locale: 'en', source: 'g1' }] },
    },
  },
  metadata: { canonicalLocale: 'en' },
};

// ---------------------------------------------------------------------------
// Every declared element appears in output
// ---------------------------------------------------------------------------

describe('completeness', () => {
  test('every node, edge and group in the content file appears in the laid-out diagram', async () => {
    const diagram = await layout(MANY_ELEMENTS);
    expect(diagram.nodes.map((n) => n.id).sort()).toEqual(['n1', 'n2', 'n3']);
    expect(diagram.edges.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
    expect(diagram.groups.map((g) => g.id).sort()).toEqual(['g1']);
  });

  test('every node, edge and group appears as its own element in the SVG', async () => {
    const diagram = await layout(MANY_ELEMENTS);
    const svg = renderOk(diagram);
    for (const id of ['n1', 'n2', 'n3']) {
      expect(svg).toContain(`data-element-id="${id}"`);
      expect(svg).toContain('data-kind="node"');
    }
    for (const id of ['e1', 'e2']) {
      expect(svg).toContain(`data-element-id="${id}"`);
    }
    expect(svg).toContain('data-element-id="g1"');
    expect(svg).toContain('data-kind="group"');
  });
});

// ---------------------------------------------------------------------------
// Nesting: two levels should behave like one level, repeated
// ---------------------------------------------------------------------------

describe('nested group frames (design.md §4.2.x, laid_out_node/laid_out_group specs)', () => {
  test('a node nested two levels deep sits inside its immediate parent AND its grandparent', async () => {
    const diagram = await layout(DEEP_NESTING);
    const outer = diagram.groups.find((g) => g.id === 'outer')!;
    const inner = diagram.groups.find((g) => g.id === 'inner')!;
    const deepNode = diagram.nodes.find((n) => n.id === 'deep')!;

    expect(outer).toBeDefined();
    expect(inner).toBeDefined();
    expect(deepNode).toBeDefined();

    // inner group itself must be inside outer (one level of nesting, applied once)
    expect(inner.position.x).toBeGreaterThanOrEqual(outer.position.x);
    expect(inner.position.y).toBeGreaterThanOrEqual(outer.position.y);
    expect(inner.position.x + inner.size.x).toBeLessThanOrEqual(outer.position.x + outer.size.x + 0.01);
    expect(inner.position.y + inner.size.y).toBeLessThanOrEqual(outer.position.y + outer.size.y + 0.01);

    // deep node must be inside inner (one level of nesting, applied again)
    expect(deepNode.position.x).toBeGreaterThanOrEqual(inner.position.x);
    expect(deepNode.position.y).toBeGreaterThanOrEqual(inner.position.y);
    expect(deepNode.position.x + deepNode.size.x).toBeLessThanOrEqual(inner.position.x + inner.size.x + 0.01);
    expect(deepNode.position.y + deepNode.size.y).toBeLessThanOrEqual(inner.position.y + inner.size.y + 0.01);

    // and therefore also inside outer, transitively — nesting composes
    expect(deepNode.position.x).toBeGreaterThanOrEqual(outer.position.x);
    expect(deepNode.position.y).toBeGreaterThanOrEqual(outer.position.y);
    expect(deepNode.position.x + deepNode.size.x).toBeLessThanOrEqual(outer.position.x + outer.size.x + 0.01);
    expect(deepNode.position.y + deepNode.size.y).toBeLessThanOrEqual(outer.position.y + outer.size.y + 0.01);
  });

  test('an edge between a top-level node and a doubly-nested node still meets both endpoints', async () => {
    const diagram = await layout(DEEP_NESTING);
    const points = polyline(diagram, 'top_to_deep');
    expect(points.length).toBeGreaterThan(0);
    expect(touches(diagram, points[0], 'top')).toBe(true);
    expect(touches(diagram, points[points.length - 1], 'deep')).toBe(true);
  });

  test('an edge between a one-deep node and a two-deep node meets both endpoints', async () => {
    const diagram = await layout(DEEP_NESTING);
    const points = polyline(diagram, 'mid_to_deep');
    expect(points.length).toBeGreaterThan(0);
    expect(touches(diagram, points[0], 'mid_node')).toBe(true);
    expect(touches(diagram, points[points.length - 1], 'deep')).toBe(true);
  });

  test('GroupLayout.size left unset auto-fits: the group bbox contains all its direct children with positive padding', async () => {
    // design.md L993: "GroupLayout.size is optional. Absent = auto-fit
    // (renderer computes bounding box of children + padding)."
    const diagram = await layout(DEEP_NESTING);
    const outer = diagram.groups.find((g) => g.id === 'outer')!;
    const midNode = diagram.nodes.find((n) => n.id === 'mid_node')!;
    const inner = diagram.groups.find((g) => g.id === 'inner')!;

    // outer must contain mid_node and inner with some margin, not be exactly
    // flush with either child's bbox (that would mean no padding at all).
    const containsWithPadding = (
      childPos: Vec2, childSize: Vec2,
    ): boolean => {
      const left = childPos.x - outer.position.x;
      const top = childPos.y - outer.position.y;
      const right = (outer.position.x + outer.size.x) - (childPos.x + childSize.x);
      const bottom = (outer.position.y + outer.size.y) - (childPos.y + childSize.y);
      return left >= 0 && top >= 0 && right >= 0 && bottom >= 0 && (left + top + right + bottom) > 0;
    };
    expect(containsWithPadding(midNode.position, midNode.size)).toBe(true);
    expect(containsWithPadding(inner.position, inner.size)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// viewBox must actually contain the drawn content
// ---------------------------------------------------------------------------

describe('viewBox correctness (svg_painter.spec.textproto §viewBox)', () => {
  test('viewBox bounds enclose every node/group bbox, with the documented 16px padding', async () => {
    const diagram = await layout(DEEP_NESTING);
    const svg = renderOk(diagram);
    const match = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
    expect(match).not.toBeNull();
    const [, minXs, minYs, ws, hs] = match!;
    const minX = Number(minXs);
    const minY = Number(minYs);
    const w = Number(ws);
    const h = Number(hs);

    const content = bbox(diagram);
    // viewBox must fully enclose the drawn content bbox.
    expect(minX).toBeLessThanOrEqual(content.minX);
    expect(minY).toBeLessThanOrEqual(content.minY);
    expect(minX + w).toBeGreaterThanOrEqual(content.maxX);
    expect(minY + h).toBeGreaterThanOrEqual(content.maxY);
  });

  test('the <svg> tag carries explicit width/height matching the viewBox extent', async () => {
    // svg_renderer.spec.textproto step 6: "explicit width/height ... parse
    // the 3rd/4th space-separated tokens for the width/height attribute
    // values."
    const diagram = await layout(DEEP_NESTING);
    const svg = renderOk(diagram);
    const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
    const wh = svg.match(/<svg[^>]*\swidth="([\d.]+)"\s+height="([\d.]+)"/);
    expect(vb).not.toBeNull();
    expect(wh).not.toBeNull();
    expect(Number(wh![1])).toBeCloseTo(Number(vb![3]), 2);
    expect(Number(wh![2])).toBeCloseTo(Number(vb![4]), 2);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism (design.md L43: "Same inputs → same SVG, byte-for-byte")', () => {
  test('running the full pipeline twice on identical input produces byte-identical SVG', async () => {
    const first = renderOk(await layout(MANY_ELEMENTS));
    const second = renderOk(await layout(MANY_ELEMENTS));
    expect(first).toBe(second);
  });

  test('running layout twice on identical input produces identical coordinates', async () => {
    const a = await layout(DEEP_NESTING);
    const b = await layout(DEEP_NESTING);
    const coords = (d: LaidOutDiagram) => d.nodes.map((n) => `${n.id}:${n.position.x},${n.position.y},${n.size.x},${n.size.y}`).sort();
    expect(coords(a)).toEqual(coords(b));
  });

  test('all coordinates in the emitted SVG are rounded to at most 2 decimal places', async () => {
    // svg_painter.spec.textproto: "Floats must be rounded to 2 decimal
    // places throughout ... This is the archeglyph determinism guarantee."
    const diagram = await layout(MANY_ELEMENTS);
    const svg = renderOk(diagram);
    const numbers = svg.match(/-?\d+\.\d+/g) ?? [];
    for (const n of numbers) {
      const decimals = n.split('.')[1];
      expect(decimals.length).toBeLessThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------
// Text must be readable; unstyled elements must still render
// ---------------------------------------------------------------------------

describe('readability and graceful defaults', () => {
  test('a node with no stylesheet entry at all still renders a shape and a label', async () => {
    // "no explicit styling" per NodeStyleEntry — the resolver cascade section
    // of design.md: absent component => "the element starts unstyled" but the
    // renderer must still emit *something* (renderer code defaults per
    // svg_painter.spec.textproto's shapePath: unset shape_kind -> SHAPE_RECT).
    const diagram = await layout(SIMPLE_UNSTYLED);
    const svg = renderOk(diagram);
    expect(svg).toContain('data-element-id="lonely"');
    const nodeGroup = svg.match(/<g id="node-lonely"[\s\S]*?<\/g>/);
    expect(nodeGroup).not.toBeNull();
    // Must contain a shape primitive (rect/ellipse/polygon) and a label.
    expect(nodeGroup![0]).toMatch(/<rect|<ellipse|<polygon/);
    expect(nodeGroup![0]).toContain('<text');
    expect(nodeGroup![0]).toContain('lonely');
  });

  test('node label text carries an explicit fill color (theme-bound)', async () => {
    const diagram = await layout(MANY_ELEMENTS);
    const svg = renderOk(diagram);
    const nodeLabel = svg.match(/<g id="node-n1"[\s\S]*?<text[^>]*>/);
    expect(nodeLabel).not.toBeNull();
    expect(nodeLabel![0]).toContain('fill=');
  });

  test('group label text carries an explicit fill color (theme-bound)', async () => {
    const diagram = await layout(MANY_ELEMENTS);
    const svg = renderOk(diagram);
    const groupLabel = svg.match(/<g id="group-g1"[\s\S]*?<text[^>]*>/);
    expect(groupLabel).not.toBeNull();
    expect(groupLabel![0]).toContain('fill=');
  });
});

// ---------------------------------------------------------------------------
// Edge markup correctness: real <path> elements, hit-stroke, arrowheads
// ---------------------------------------------------------------------------

describe('edge markup (svg_renderer.spec.textproto step 4)', () => {
  test('every edge is wrapped in a real <path> element, not a bare path-data string', async () => {
    // The spec calls out an actual historical bug: edgePath()'s bare `d=`
    // string concatenated directly into <g>...</g> with no <path> around it,
    // making every edge invisible. Assert the fix's observable contract.
    const diagram = await layout(MANY_ELEMENTS);
    const svg = renderOk(diagram);
    const edgeGroup = svg.match(/<g id="edge-e1"[\s\S]*?<\/g>/);
    expect(edgeGroup).not.toBeNull();
    expect(edgeGroup![0]).toMatch(/<path\s+d="[^"]+"/);
  });

  test('each edge draws a transparent wide hit-stroke twin under the visible stroked path', async () => {
    const diagram = await layout(MANY_ELEMENTS);
    const svg = renderOk(diagram);
    const edgeGroup = svg.match(/<g id="edge-e1"[\s\S]*?<\/g>/)![0];
    const paths = [...edgeGroup.matchAll(/<path[^>]*>/g)].map((m) => m[0]);
    expect(paths.length).toBeGreaterThanOrEqual(2);
    const hitStroke = paths.find((p) => p.includes('stroke="transparent"'));
    expect(hitStroke).toBeDefined();
    expect(hitStroke).toContain('pointer-events: stroke');
  });

  test('an edge with an explicit FILLED end-arrowhead references a marker that is actually defined in <defs>', async () => {
    const diagram = await layout(diagramWithArrowhead(), stylesheetWithArrowhead());
    const svg = renderOk(diagram);
    const edgeGroup = svg.match(/<g id="edge-a_b"[\s\S]*?<\/g>/);
    expect(edgeGroup).not.toBeNull();
    const markerRef = edgeGroup![0].match(/marker-end="url\(#([^)]+)\)"/);
    expect(markerRef).not.toBeNull();
    const markerId = markerRef![1];
    const defs = svg.match(/<defs>[\s\S]*?<\/defs>/);
    expect(defs).not.toBeNull();
    expect(defs![0]).toContain(`id="${markerId}"`);
    expect(defs![0]).toContain('<marker');
  });

  test('an edge with arrowheads explicitly set to NONE emits no marker reference', async () => {
    // svg_painter.spec.textproto arrowMarkers: "ARROWHEAD_NONE -> no marker
    // emitted". Note: blueprintTheme's edge component binds a FILLED end
    // arrowhead by default (packages/themes/src/index.ts blueprintEdgeComponent),
    // so an edge with an unset style entry is NOT a valid probe for "no
    // arrowheads" — it must explicitly override both ends to NONE.
    const stylesheet = create(StylesheetSchema, {
      schemaVersion: 1,
      edges: {
        e1: create(EdgeStyleEntrySchema, {
          connection: create(Glyph1DSchema, {
            arrowheads: create(ArrowheadsSchema, {
              start: ArrowheadVariant.ARROWHEAD_NONE,
              end: ArrowheadVariant.ARROWHEAD_NONE,
            }),
          }),
        }),
      },
    });
    const diagram = await layout(MANY_ELEMENTS, stylesheet);
    const svg = renderOk(diagram);
    const edgeGroup = svg.match(/<g id="edge-e1"[\s\S]*?<\/g>/)![0];
    expect(edgeGroup).not.toMatch(/marker-(start|end)=/);
  });
});

// ---------------------------------------------------------------------------
// CONTRACTED group render mode (laid_out_group.spec.textproto)
// ---------------------------------------------------------------------------

describe('group render modes', () => {
  test('a CONTRACTED group becomes a super-node and hides its children', async () => {
    const stylesheet = create(StylesheetSchema, {
      schemaVersion: 1,
      groups: {
        g1: create(GroupStyleEntrySchema, {
          layout: create(GroupLayoutSchema, { renderMode: GroupRenderMode.CONTRACTED }),
        }),
      },
    });
    const diagram = await layout(MANY_ELEMENTS, stylesheet);
    const group = diagram.groups.find((g) => g.id === 'g1');
    expect(group).toBeDefined();
    expect(group!.isSuperNode).toBe(true);
    expect(group!.hiddenDescendantCount).toBe(2); // n1, n2
    expect(diagram.nodes.find((n) => n.id === 'n1')).toBeUndefined();
    expect(diagram.nodes.find((n) => n.id === 'n2')).toBeUndefined();
    // n3 (outside the group) is untouched.
    expect(diagram.nodes.find((n) => n.id === 'n3')).toBeDefined();
  });
});
