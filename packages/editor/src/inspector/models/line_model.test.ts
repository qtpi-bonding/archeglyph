// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ColorSchema,
  EdgeStyleEntrySchema,
  Glyph1DSchema,
  StrokeSchema,
  StrokePattern,
  ArrowheadVariant,
  ArrowheadsSchema,
  StylesheetSchema,
  AnnotationEntrySchema,
} from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutEdge } from '@archeglyph/core/layout/laid_out_edge';
import { LaidOutAnnotation } from '@archeglyph/core/layout/laid_out_annotation';

import type { SceneGeometry } from '../../scene/scene';
import type { ElementRef } from '../../ui_state/ui_state';
import { inspectorModel } from '../model';
import { lineModel } from './line_model';
import { ARROWHEAD_TABLE, PATTERN_TABLE } from './line_names';

function edge(id: string): LaidOutEdge {
  return Object.assign(new LaidOutEdge(), {
    id,
    source: 'a',
    target: 'b',
    connection: create(Glyph1DSchema, {}),
  });
}

function annotation(id: string): LaidOutAnnotation {
  return Object.assign(new LaidOutAnnotation(), {
    id,
    position: { x: 0, y: 0 },
    size: { x: 100, y: 50 },
    shape: create(Glyph1DSchema, {}),
  });
}

function geometryFrom(edges: LaidOutEdge[], annotations: LaidOutAnnotation[]): SceneGeometry {
  const diagram = Object.assign(new LaidOutDiagram(), { edges, annotations, nodes: [], groups: [] });
  return {
    diagram,
    index: [],
    byKey: {},
    edgePolylines: {},
    contentBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    svg: '<svg/>',
  };
}

const refs = (kind: ElementRef['kind'], ...ids: string[]): Array<ElementRef> =>
  ids.map((id) => ({ id, kind }));

describe('lineModel', () => {
  test('PATTERN_TABLE contains the expected values', () => {
    expect(PATTERN_TABLE.find((e) => e.name === 'dashed')?.value).toBe(StrokePattern.DASHED);
    expect(PATTERN_TABLE.find((e) => e.name === 'solid')?.value).toBe(StrokePattern.SOLID);
  });

  test('edge with solid stroke reads color and width as effective values', () => {
    const laidOut = edge('e1');
    laidOut.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#ff0000' }) },
        width: 2,
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.strokeColor.effective).toBe('#ff0000');
    expect(model.strokeWidth.effective).toBe(2);
  });

  test('edge with solid pattern reads pattern display name', () => {
    const solidEntry = PATTERN_TABLE.find((e) => e.name === 'solid');
    expect(solidEntry).toBeDefined();

    const laidOut = Object.assign(new LaidOutEdge(), {
      id: 'e1',
      source: 'a',
      target: 'b',
      connection: create(Glyph1DSchema, {
        stroke: create(StrokeSchema, {
          dashing: { case: 'pattern', value: solidEntry!.value },
        }),
      }),
    });

    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.pattern.effective).toBe('solid');
  });

  test('edge with arrowheads reads display names', () => {
    const laidOut = edge('e1');
    laidOut.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {}),
      arrowheads: create(ArrowheadsSchema, {
        start: ArrowheadVariant.ARROWHEAD_OPEN,
        end: ArrowheadVariant.ARROWHEAD_FILLED,
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.arrowStart.effective).toBe('open');
    expect(model.arrowEnd.effective).toBe('filled');
  });

  test('annotation with callout reads stroke styling', () => {
    const laidOut = annotation('a1');
    laidOut.callout = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#0000ff' }) },
        width: 1.5,
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('annotation', 'a1'))!,
      geometryFrom([], [laidOut]),
      sheet,
    );

    expect(model.strokeColor.effective).toBe('#0000ff');
    expect(model.strokeWidth.effective).toBe(1.5);
  });

  test('annotation without callout reads as undefined', () => {
    const laidOut = annotation('a1');
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('annotation', 'a1'))!,
      geometryFrom([], [laidOut]),
      sheet,
    );

    expect(model.strokeColor.effective).toBeUndefined();
    expect(model.strokeWidth.effective).toBeUndefined();
    expect(model.pattern.effective).toBeUndefined();
    expect(model.arrowStart.effective).toBeUndefined();
    expect(model.arrowEnd.effective).toBeUndefined();
  });

  test('gradient paint contributes no color', () => {
    const laidOut = edge('e1');
    laidOut.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'gradient', value: { stops: [] } as never },
        width: 2,
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.strokeColor.effective).toBeUndefined();
    expect(model.strokeWidth.effective).toBe(2);
  });

  test('custom dasharray contributes no pattern', () => {
    const laidOut = edge('e1');
    laidOut.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        dashing: { case: 'customDasharray', value: '5,5' },
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.pattern.effective).toBeUndefined();
  });

  test('unset stroke reads as all undefined', () => {
    const laidOut = edge('e1');
    laidOut.connection = create(Glyph1DSchema, {});
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.strokeColor.effective).toBeUndefined();
    expect(model.strokeWidth.effective).toBeUndefined();
    expect(model.pattern.effective).toBeUndefined();
  });

  test('arrowhead none displays as none', () => {
    const laidOut = edge('e1');
    laidOut.connection = create(Glyph1DSchema, {
      arrowheads: create(ArrowheadsSchema, {
        start: ArrowheadVariant.ARROWHEAD_NONE,
        end: ArrowheadVariant.ARROWHEAD_NONE,
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1'))!,
      geometryFrom([laidOut], []),
      sheet,
    );

    expect(model.arrowStart.effective).toBe('none');
    expect(model.arrowEnd.effective).toBe('none');
  });

  test('multiple selected edges with same stroke values shows common effective value', () => {
    const e1 = edge('e1');
    e1.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#ff0000' }) },
        width: 2,
      }),
    });
    const e2 = edge('e2');
    e2.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#ff0000' }) },
        width: 2,
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1', 'e2'))!,
      geometryFrom([e1, e2], []),
      sheet,
    );

    expect(model.strokeColor.effective).toBe('#ff0000');
    expect(model.strokeWidth.effective).toBe(2);
    expect(model.strokeColor.mixed).toBe(false);
  });

  test('multiple selected edges with different stroke colors shows mixed', () => {
    const e1 = edge('e1');
    e1.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#ff0000' }) },
      }),
    });
    const e2 = edge('e2');
    e2.connection = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#0000ff' }) },
      }),
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = lineModel(
      inspectorModel(refs('edge', 'e1', 'e2'))!,
      geometryFrom([e1, e2], []),
      sheet,
    );

    expect(model.strokeColor.effective).toBeUndefined();
    expect(model.strokeColor.mixed).toBe(true);
  });
});
