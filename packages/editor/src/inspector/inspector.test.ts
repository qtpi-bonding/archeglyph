// SPDX-License-Identifier: MPL-2.0
//
// The inspector's decisions, all of which live in pure functions so that they
// can be tested at all -- there is no DOM harness in this repo, and the old
// inspector put every one of these rules inside a component.
//
// The two claims this pillar exists for:
//   1. An unset field reports the value the diagram ACTUALLY uses, not zero.
//      The old inspector showed `size()?.x ?? 0` for an auto-sized node, so
//      typing into it resized from a baseline of zero (review §2.6).
//   2. One commit is one StyleEdit for the whole selection, whatever its
//      size. Three selected nodes given a width is one undo entry, not three.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ColorSchema,
  NodeLayoutSchema,
  NodeStyleEntrySchema,
  Stylesheet,
  StylesheetSchema,
  TypographySchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutGroup } from '@archeglyph/core/layout/laid_out_group';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';

import { buildSceneGeometry, type SceneGeometry } from '../scene/scene';
import type { ElementRef } from '../ui_state/ui_state';
import { inspectorModel } from './model';
import { numberField, textField } from './field_value';
import { commitLayout, commitTypography, layoutModel, typographyModel } from './sections_model';
import { init } from '@archeglyph/proto/util/init';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';

const v = (x: number, y: number) => create(Vec2Schema, { x, y });
const vec = (x: number, y: number) => create(Vec2Schema, { x, y });

function node(id: string, position: Vec2, size: Vec2, parentGroup?: string): LaidOutNode {
  return init(new LaidOutNode(), {
    id,
    parentGroup,
    position,
    size,
    typography: create(TypographySchema, { size: 14, color: create(ColorSchema, { value: '#e0e0e0' }) }),
  });
}

function group(id: string, position: Vec2, size: Vec2): LaidOutGroup {
  return init(new LaidOutGroup(), {
    id, position, size, isSuperNode: false, hiddenDescendantCount: 0,
  });
}

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

interface DiagramParts {
  nodes?: LaidOutNode[];
  groups?: LaidOutGroup[];
}

function geometryFrom(parts: DiagramParts): SceneGeometry {
  return buildSceneGeometry(
    init(new LaidOutDiagram(), {
      ...(parts.nodes === undefined ? {} : { nodes: byId(parts.nodes) }),
      ...(parts.groups === undefined ? {} : { groups: byId(parts.groups) }),
    }),
    '<svg/>',
  );
}

const refs = (kind: ElementRef['kind'], ...ids: string[]): Array<ElementRef> =>
  ids.map((id) => ({ id, kind }));

// ---------------------------------------------------------------------------

describe('inspectorModel', () => {
  test('a single node gets layout, shape and typography', () => {
    const model = inspectorModel(refs('node', 'n1'));
    expect(model?.kind).toBe('node');
    expect(model?.ids).toEqual(['n1']);
    expect(model?.sections).toEqual(['layout', 'shape', 'typography']);
  });

  test('an edge has no layout section, because its geometry is derived', () => {
    expect(inspectorModel(refs('edge', 'e1'))?.sections).toEqual(['line', 'typography']);
  });

  test('an empty selection has no model', () => {
    expect(inspectorModel([])).toBeUndefined();
  });

  test('a mixed-kind selection has no model rather than an intersected one', () => {
    const mixed: Array<ElementRef> = [{ id: 'n1', kind: 'node' }, { id: 'e1', kind: 'edge' }];
    expect(inspectorModel(mixed)).toBeUndefined();
  });

  test('a group gets its container section second, beside layout', () => {
    expect(inspectorModel(refs('group', 'g1'))?.sections)
      .toEqual(['layout', 'group', 'shape', 'typography']);
  });

  test('an annotation gets shape AND line -- it has both a Glyph2D and a Glyph1D', () => {
    // The callout is a Glyph1D exactly as an edge's connection is, and
    // patchAnnotationEntry already carries both fields.
    expect(inspectorModel(refs('annotation', 'a1'))?.sections)
      .toEqual(['layout', 'annotation', 'shape', 'line', 'typography']);
  });

  test('a multi-selection of one kind keeps every id', () => {
    expect(inspectorModel(refs('node', 'a', 'b', 'c'))?.ids).toEqual(['a', 'b', 'c']);
  });
});

describe('numberField folds a selection three ways', () => {
  test('agreement yields the shared value and is not mixed', () => {
    expect(numberField([10, 10], [10, 10])).toEqual({ override: 10, effective: 10, mixed: false });
  });

  test('disagreeing overrides are mixed', () => {
    expect(numberField([10, 20], [10, 20]).mixed).toBe(true);
  });

  test('some set and some unset is mixed -- they disagree about what was set', () => {
    expect(numberField([10, undefined], [10, 50]).mixed).toBe(true);
  });

  test('no overrides at all is not mixed; it is simply unset', () => {
    const field = numberField([undefined, undefined], [50, 50]);
    expect(field.mixed).toBe(false);
    expect(field.override).toBeUndefined();
    expect(field.effective).toBe(50);
  });

  test('differing effectives yield no placeholder to offer', () => {
    expect(numberField([undefined, undefined], [50, 90]).effective).toBeUndefined();
  });

  test('an empty selection is neither mixed nor valued', () => {
    expect(numberField([], [])).toEqual({ override: undefined, effective: undefined, mixed: false });
  });
});

describe('textField', () => {
  test('compares by exact value, so equivalent spellings are mixed', () => {
    expect(textField(['#FFF', '#ffffff'], ['#FFF', '#ffffff']).mixed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The headline claim, part one: an unset field reports reality, not zero.
// ---------------------------------------------------------------------------

describe('layoutModel', () => {
  test('an auto-sized node reports its real width as the effective value', () => {
    // The node has no size in the stylesheet. The old inspector showed 0 here.
    const geometry = geometryFrom({ nodes: [node('n1', vec(10, 20), vec(180, 60))] });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = layoutModel(inspectorModel(refs('node', 'n1'))!, geometry, sheet);

    expect(model.width.override).toBeUndefined();
    expect(model.width.effective).toBe(180);
  });

  test('a written size shows as the override', () => {
    const geometry = geometryFrom({ nodes: [node('n1', vec(10, 20), vec(180, 60))] });
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: create(NodeStyleEntrySchema, { layout: create(NodeLayoutSchema, { size: v(180, 60) }) }) },
    });
    const model = layoutModel(inspectorModel(refs('node', 'n1'))!, geometry, sheet);

    expect(model.width.override).toBe(180);
  });

  test('a child of a group reports a PARENT-RELATIVE effective position', () => {
    // Scene bounds are canvas-absolute; the field shows the style value, which
    // is relative to the parent. An absolute placeholder over a relative value
    // would make the two numbers incomparable.
    const geometry = geometryFrom({
      groups: [group('g1', vec(100, 100), vec(400, 400))],
      nodes: [node('n1', vec(140, 160), vec(80, 40), 'g1')],
    });
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = layoutModel(inspectorModel(refs('node', 'n1'))!, geometry, sheet);

    expect(model.x.effective).toBe(40);
    expect(model.y.effective).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// The headline claim, part two: one commit is one edit.
// ---------------------------------------------------------------------------

describe('commitLayout', () => {
  const threeNodes = (): SceneGeometry => geometryFrom({
    nodes: [
      node('a', vec(0, 0), vec(100, 50)),
      node('b', vec(200, 0), vec(120, 50)),
      node('c', vec(400, 0), vec(140, 50)),
    ],
  });

  function sheetOf(...ids: string[]): Stylesheet {
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    for (const id of ids) {
      sheet.nodes[id] = create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, { position: v(0, 0) }),
      });
    }
    return sheet;
  }

  test('three selected nodes given a width is ONE edit covering all three', () => {
    const model = inspectorModel(refs('node', 'a', 'b', 'c'))!;
    const edit = commitLayout(model, threeNodes(), sheetOf('a', 'b', 'c'), 'width', 200);

    expect(edit).toBeDefined();
    expect(edit!.nodeChanges).toHaveLength(3);
    expect(edit!.nodeChanges.map((change) => change.nodeId).sort()).toEqual(['a', 'b', 'c']);
  });

  test('committing the value a field already holds writes nothing', () => {
    // Blur fires whether or not anything was typed.
    const geometry = geometryFrom({ nodes: [node('n1', vec(10, 20), vec(100, 50))] });
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: create(NodeStyleEntrySchema, { layout: create(NodeLayoutSchema, { position: v(10, 20) }) }) },
    });
    const model = inspectorModel(refs('node', 'n1'))!;

    expect(commitLayout(model, geometry, sheet, 'x', 10)).toBeUndefined();
  });

  test('clearing x on an ANNOTATION returns undefined rather than an empty edit', () => {
    // unpinElementsEdit filters annotations out on purpose -- they have no
    // auto-layout position to fall back to -- and would hand back a StyleEdit
    // with no changes in it, which still reaches the undo log.
    const geometry = geometryFrom({});
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const model = inspectorModel(refs('annotation', 'a1'))!;

    expect(commitLayout(model, geometry, sheet, 'x', undefined)).toBeUndefined();
  });
});

describe('commitTypography', () => {
  test('setting a colour on three nodes is one edit', () => {
    const model = inspectorModel(refs('node', 'a', 'b', 'c'))!;
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const edit = commitTypography(model, sheet, 'color', '#ff0000');

    expect(edit!.nodeChanges).toHaveLength(3);
  });

  test('changing one typography field preserves the others', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {
        n1: create(NodeStyleEntrySchema, {
          typography: create(TypographySchema, {
            size: 14,
            font: '$fonts.heading',
            color: create(ColorSchema, { value: '#abcdef' }),
          }),
        }),
      },
    });
    const model = inspectorModel(refs('node', 'n1'))!;
    const edit = commitTypography(model, sheet, 'color', '#ff0000');

    const after = applyStyleEditToStylesheet(sheet, edit!).nodes['n1']!;
    expect(after.typography?.color?.value).toBe('#ff0000');
    expect(after.typography?.font).toBe('$fonts.heading');
    expect(after.typography?.size).toBe(14);
  });
});

describe('typographyModel', () => {
  test('a token reference shows as written while the placeholder shows resolved', () => {
    const laidOut = node('n1', vec(0, 0), vec(100, 50));
    laidOut.typography = create(TypographySchema, { color: create(ColorSchema, { value: '#7ab8ff' }) });
    const geometry = geometryFrom({ nodes: [laidOut] });
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {
        n1: create(NodeStyleEntrySchema, {
          typography: create(TypographySchema, { color: create(ColorSchema, { value: '$colors.accent' }) }),
        }),
      },
    });
    const model = typographyModel(inspectorModel(refs('node', 'n1'))!, geometry, sheet);

    expect(model.color.override).toBe('$colors.accent');
    expect(model.color.effective).toBe('#7ab8ff');
  });
});
