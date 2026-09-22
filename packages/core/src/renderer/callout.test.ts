// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The headline claim of the `annotation-anchor` pillar, as one concrete case:
// an annotation whose style entry carries an anchor renders a line to the
// element that anchor names.
//
// It is written end-to-end, from a Stylesheet through resolve + layout to the
// SVG string, because the defect this pillar fixes is not in any one of those
// stages. Each stage is individually correct; the anchor is simply dropped
// between them (resolver/style_cascade builds a ResolvedAnnotation without it,
// so layout has nothing to carry and the renderer has nothing to draw). A unit
// test of any single stage passes today.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationAnchorSchema,
  AnnotationEntrySchema,
  AnnotationLayoutSchema,
  RefKind,
  StylesheetSchema,
  Vec2Schema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema, LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { layoutPipeline } from '../pipeline';
import { SvgRendererImpl } from './svg_renderer';
import { LayoutEngineImpl } from '../layout/layout_engine/impl';
import { ElkAdapterImpl } from '../layout/layout_adapter/impl';
import { init } from '@archeglyph/proto/util/init';
import { LaidOutDiagram } from '../layout/laid_out_diagram';
import { LaidOutNode } from '../layout/laid_out_node';
import {
  CanvasStyleSchema,
  ColorSchema,
  Glyph2DSchema,
  type Stroke,
  StrokePattern,
  StrokeSchema,
  TypographySchema,
} from '@archeglyph/proto/gen/style_pb';

const require_ = createRequire(import.meta.url);

function newElk(): unknown {
  return new (ElkConstructor as unknown as new (opts: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });
}

const CONTENT = {
  schemaVersion: 1,
  id: 'anchored',
  graph: {
    nodes: {
      target: { label: [{ locale: 'en', source: 'target' }] },
    },
  },
};

// One annotation, explicitly positioned well clear of the node so the callout
// has a non-zero length whatever ELK does with the node.
function stylesheetWith(anchored: boolean): Stylesheet {
  const annotation = create(AnnotationEntrySchema, {
    content: [create(LocalizationSchema, { source: 'note' })],
    layout: create(AnnotationLayoutSchema, {
      position: create(Vec2Schema, { x: 400, y: 400 }),
      size: create(Vec2Schema, { x: 60, y: 20 }),
    }),
    anchor: anchored
      ? create(AnnotationAnchorSchema, { refId: 'target', refKind: RefKind.NODE })
      : undefined,
  });
  return create(StylesheetSchema, { schemaVersion: 1, annotations: { note: annotation } });
}

async function renderWith(anchored: boolean): Promise<string> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(CONTENT));
  const theme = blueprintTheme();
  const seeded = seedComponentBindings(diagram, stylesheetWith(anchored), theme);
  const laid = await layoutPipeline(
    diagram,
    seeded,
    new Map([['default', theme]]),
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (laid.kind === 'err') {
    throw new Error(`layout failed at ${laid.error.stage}`);
  }
  const rendered = new SvgRendererImpl().render(laid.value);
  if (rendered.kind === 'err') {
    throw new Error(`render failed: ${rendered.error.message}`);
  }
  return rendered.value;
}

// Everything between `<g id="annotation-note"...>` and its closing tag.
function annotationGroup(svg: string): string {
  const open = svg.indexOf('<g id="annotation-note"');
  expect(open).toBeGreaterThanOrEqual(0);
  const close = svg.indexOf('</g>', open);
  return svg.slice(open, close);
}

describe('anchored annotations render a callout line', () => {
  test('an anchored annotation emits a path inside its own group', async () => {
    const group = annotationGroup(await renderWith(true));
    expect(group).toContain('<path');
    // Two-point line: an `M` and exactly one `L`.
    const line = /d="M [-\d.]+,[-\d.]+ L [-\d.]+,[-\d.]+"/.exec(group);
    expect(line).not.toBeNull();
  });

  test('an unanchored annotation emits no such path', async () => {
    // Guards the assertion above against passing on the annotation's own
    // shape: if shapePath emitted a <path d="M ... L ...">, both cases would
    // match and the first test would prove nothing.
    const group = annotationGroup(await renderWith(false));
    expect(/d="M [-\d.]+,[-\d.]+ L [-\d.]+,[-\d.]+"/.test(group)).toBe(false);
  });

  test('the callout is painted in the theme callout stroke, not the fallback', async () => {
    // Guards the other half of this pillar. The blueprint annotation component
    // had no `callout` at all, so an anchored annotation resolved to an empty
    // Glyph1D and the edge-styling fallback painted #000000 at width 1 -- a
    // black hairline on D12b's #0f1a2b canvas. Every other part of the feature
    // would have been correct and the line invisible.
    // Read from the theme rather than repeating its hex here: the colour is a
    // design choice that moves, the "not the fallback" claim is not.
    // The component names a role, so follow the same hop: role -> palette.
    const theme = blueprintTheme();
    const themeCallout = theme.annotationComponents[0]?.callout?.stroke?.paint;
    const ref = themeCallout?.case === 'color' ? themeCallout.value.value : undefined;
    expect(ref).toBe('$roles.annotation_callout');
    const role = theme.tokens?.roles[ref!.slice('$roles.'.length)];
    const expected = theme.tokens?.palette[role!.slice('$palette.'.length)];
    expect(expected).toBeDefined();

    const group = annotationGroup(await renderWith(true));
    const path = /<path[^>]*d="M [-\d.]+,[-\d.]+ L [-\d.]+,[-\d.]+"[^>]*>/.exec(group);
    expect(path).not.toBeNull();
    expect(path![0]).toContain(expected!);
    expect(path![0]).not.toContain('#000000');
  });

  test('the callout starts on the annotation outline, not at its centre', async () => {
    const group = annotationGroup(await renderWith(true));
    const line = /d="M ([-\d.]+),([-\d.]+) L/.exec(group);
    expect(line).not.toBeNull();
    const x = Number(line![1]);
    const y = Number(line![2]);
    // Annotation box is (400,400) to (460,420). Its centre is (430,410); a
    // point ON the outline has x at 400 or 460, or y at 400 or 420.
    const onOutline = x === 400 || x === 460 || y === 400 || y === 420;
    expect(onOutline).toBe(true);
  });
});

describe('stroke dashing reaches the SVG', () => {
  const paintStrokeOnly = (stroke: Stroke): string => {
    const diagram = init(new LaidOutDiagram(), {
      id: 'd',
      canvas: create(CanvasStyleSchema, {}),
      nodes: {
        n: init(new LaidOutNode(), {
          id: 'n',
          position: { x: 0, y: 0 },
          size: { x: 10, y: 10 },
          shape: create(Glyph2DSchema, { stroke }),
          typography: create(TypographySchema, {}),
        }),
      },
    });
    const result = new SvgRendererImpl().render(diagram);
    if (result.kind === 'err') throw new Error(result.error.message);
    return result.value;
  };

  test('a custom dasharray is emitted verbatim', () => {
    expect(paintStrokeOnly(create(StrokeSchema, {
      paint: { case: 'color', value: create(ColorSchema, { value: '#000000' }) },
      dashing: { case: 'customDasharray', value: '5,4' },
    }))).toContain('stroke-dasharray="5,4"');
  });

  test('the DOTTED and DASHED patterns each emit a dasharray', () => {
    expect(paintStrokeOnly(create(StrokeSchema, {
      dashing: { case: 'pattern', value: StrokePattern.DOTTED },
    }))).toContain('stroke-dasharray="1,3"');
    expect(paintStrokeOnly(create(StrokeSchema, {
      dashing: { case: 'pattern', value: StrokePattern.DASHED },
    }))).toContain('stroke-dasharray="5,4"');
  });

  test('a solid stroke emits no dasharray at all', () => {
    expect(paintStrokeOnly(create(StrokeSchema, {
      paint: { case: 'color', value: create(ColorSchema, { value: '#000000' }) },
    }))).not.toContain('stroke-dasharray');
  });
});
