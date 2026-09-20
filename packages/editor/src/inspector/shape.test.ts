// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Shape and Line sections' decisions. As with the rest of the inspector,
// they live in pure functions because there is no DOM harness here.
//
// The headline claim is the one docs/editor-ui-review.md §P4 names and that
// nothing has proven yet: "changing fill on three selected nodes is one edit".
//
// The enum tests deliberately assert the MAPPING, not the derivation. The
// generated member names are not uniform -- protobuf-es strips an enum's
// prefix only when it matches that enum's own name, so ShapeType keeps
// SHAPE_RECT while StrokePattern becomes DASHED -- so any rule of the form
// "strip the prefix" is wrong for some of them. What must hold is that the
// name the UI shows maps back to the right enum value.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ColorSchema,
  FillSchema,
  Glyph1DSchema,
  Glyph2DSchema,
  NodeStyleEntrySchema,
  ShapeType,
  StrokeSchema,
  StylesheetSchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';

import { buildSceneGeometry, type SceneGeometry } from '../scene/scene';
import type { ElementRef } from '../ui_state/ui_state';
import { inspectorModel } from './model';
import { SHAPE_TABLE } from './models/shape_names';
import { shapeModel } from './models/shape_model';
import { commitShape } from './models/shape_commit';
import { ARROWHEAD_TABLE, PATTERN_TABLE } from './models/line_names';

const namesOf = (table: ReadonlyArray<{ name: string }>): string[] =>
  table.map((entry) => entry.name);

const vec = (x: number, y: number): Vec2 => ({ x, y });

function node(id: string, shape?: ReturnType<typeof create>): LaidOutNode {
  return Object.assign(new LaidOutNode(), {
    id,
    position: vec(0, 0),
    size: vec(100, 50),
    shape: shape ?? create(Glyph2DSchema, {}),
  });
}

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item: T): [string, T] => [item.id, item]));

function geometryFrom(nodes: LaidOutNode[]): SceneGeometry {
  return buildSceneGeometry(Object.assign(new LaidOutDiagram(), { nodes: byId(nodes) }), '<svg/>');
}

const refs = (kind: ElementRef['kind'], ...ids: string[]): Array<ElementRef> =>
  ids.map((id) => ({ id, kind }));

// ---------------------------------------------------------------------------
// The headline claim.
// ---------------------------------------------------------------------------

describe('commitShape', () => {
  test('changing fill on three selected nodes is ONE edit', () => {
    const model = inspectorModel(refs('node', 'a', 'b', 'c'))!;
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });

    const edit = commitShape(model, sheet, 'fill', '#ff0000');

    expect(edit).toBeDefined();
    expect(edit!.nodeChanges).toHaveLength(3);
    expect(edit!.nodeChanges.map((c) => c.nodeId).sort()).toEqual(['a', 'b', 'c']);
  });

  test('changing one Glyph2D field preserves the rest of the message', () => {
    // The builders take a WHOLE Glyph2D. Sending a fresh one silently clears
    // stroke, fill, glow and decorations at once.
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {
        n1: create(NodeStyleEntrySchema, {
          shape: create(Glyph2DSchema, {
            shapeKind: { case: 'standard', value: ShapeType.SHAPE_HEXAGON },
            cornerRadius: 4,
            stroke: create(StrokeSchema, { width: 3 }),
          }),
        }),
      },
    });
    const model = inspectorModel(refs('node', 'n1'))!;

    const after = commitShape(model, sheet, 'fill', '#ff0000')!.nodeChanges[0].after!;

    expect(after.shape?.shapeKind.value).toBe(ShapeType.SHAPE_HEXAGON);
    expect(after.shape?.cornerRadius).toBe(4);
    expect(after.shape?.stroke?.width).toBe(3);
  });

  test('every table name maps to the enum value the table pairs it with', () => {
    // The table is the single source for both directions, so this is the
    // property that makes reject-unknown-name meaningful.
    for (const entry of SHAPE_TABLE) {
      const sheet = create(StylesheetSchema, { schemaVersion: 1 });
      const model = inspectorModel(refs('node', 'n1'))!;
      const after = commitShape(model, sheet, 'shape', entry.name)!.nodeChanges[0].after!;
      expect(after.shape?.shapeKind.value).toBe(entry.value);
    }
  });

  test('a shape name round-trips to its enum value', () => {
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = inspectorModel(refs('node', 'n1'))!;

    const after = commitShape(model, sheet, 'shape', 'rect')!.nodeChanges[0].after!;

    expect(after.shape?.shapeKind.case).toBe('standard');
    expect(after.shape?.shapeKind.value).toBe(ShapeType.SHAPE_RECT);
  });

  test('an unrecognised shape name commits nothing rather than resetting the shape', () => {
    // Writing SHAPE_UNSPECIFIED would look like a successful edit and
    // silently clear the shape.
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = inspectorModel(refs('node', 'n1'))!;

    expect(commitShape(model, sheet, 'shape', 'trapezoid')).toBeUndefined();
  });

  test('committing the value already set writes nothing', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {
        n1: create(NodeStyleEntrySchema, {
          shape: create(Glyph2DSchema, { cornerRadius: 8 }),
        }),
      },
    });
    const model = inspectorModel(refs('node', 'n1'))!;

    expect(commitShape(model, sheet, 'cornerRadius', 8)).toBeUndefined();
  });
});

describe('shapeModel', () => {
  test('SHAPE_UNSPECIFIED reads as no value, not as a selectable name', () => {
    // The zero value means "renderer picks", which is what an absent
    // override already means.
    const laidOut = node('n1', create(Glyph2DSchema, {
      shapeKind: { case: 'standard', value: ShapeType.SHAPE_UNSPECIFIED },
    }));
    const model = shapeModel(
      inspectorModel(refs('node', 'n1'))!,
      geometryFrom([laidOut]),
      create(StylesheetSchema, { schemaVersion: 1 }),
    );

    expect(model.shape.override).toBeUndefined();
    expect(model.shape.effective).toBeUndefined();
  });

  test('a resolved fill colour is the effective value', () => {
    const laidOut = node('n1', create(Glyph2DSchema, {
      fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#123456' }) } }),
    }));
    const model = shapeModel(
      inspectorModel(refs('node', 'n1'))!,
      geometryFrom([laidOut]),
      create(StylesheetSchema, { schemaVersion: 1 }),
    );

    expect(model.fill.effective).toBe('#123456');
  });

  test('a GRADIENT fill contributes no colour, rather than a wrong one', () => {
    const laidOut = node('n1', create(Glyph2DSchema, {
      fill: create(FillSchema, { paint: { case: 'gradient', value: { stops: [] } as never } }),
    }));
    const model = shapeModel(
      inspectorModel(refs('node', 'n1'))!,
      geometryFrom([laidOut]),
      create(StylesheetSchema, { schemaVersion: 1 }),
    );

    expect(model.fill.effective).toBeUndefined();
  });
});

describe('enum name tables', () => {
  test('shape names offer rect and ellipse and exclude the unspecified zero value', () => {
    const names = namesOf(SHAPE_TABLE);
    expect(names).toContain('rect');
    expect(names).toContain('ellipse');
    expect(names.some((n) => n.includes('unspecified'))).toBe(false);
  });

  test('pattern names are the three dash styles', () => {
    expect(namesOf(PATTERN_TABLE).sort()).toEqual(['dashed', 'dotted', 'solid']);
  });

  test('arrowhead names drop the ARROWHEAD_ prefix that protobuf-es keeps', () => {
    // ArrowheadVariant members are ARROWHEAD_NONE etc -- the prefix is NOT
    // stripped by codegen, because it does not match the enum's own name.
    const names = namesOf(ARROWHEAD_TABLE);
    expect(names).toContain('none');
    expect(names).toContain('filled');
    expect(names.some((n) => n.startsWith('arrowhead'))).toBe(false);
  });
});
