// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationAnchorSchema, AnnotationEntrySchema, ArrowheadsSchema, ArrowheadVariant,
  ColorSchema, EdgeStyleEntrySchema, FillSchema, Glyph1DSchema, Glyph2DSchema,
  GroupLayoutSchema, GroupStyleEntrySchema, NodeLayoutSchema, NodeStyleEntrySchema,
  RefKind, ShapeType, StrokeSchema, StyleChangeType, StyleEditSchema, StylesheetSchema,
  TypographySchema, Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { fromBinary, toBinary } from '@bufbuild/protobuf';
import { DiagramSchema, GraphSchema, NodeSchema } from '@archeglyph/proto/gen/content_pb';
import { applyStyleEditToStylesheet } from './apply_style_edit';
import { createEditorState } from './create_editor_state';

const vec = (x: number, y: number) => create(Vec2Schema, { x, y });
const colour = (value: string) => ({ case: 'color' as const, value: create(ColorSchema, { value }) });
const stroked = (value: string) => create(Glyph2DSchema, { stroke: create(StrokeSchema, { paint: colour(value) }) });
const filled = (value: string) => create(Glyph2DSchema, { fill: create(FillSchema, { paint: colour(value) }) });

type Sheet = ReturnType<typeof create<typeof StylesheetSchema>>;

const nodeEdit = (after: unknown, unsetPaths: string[] = []) => create(StyleEditSchema, {
  id: 'e',
  nodeChanges: [{ nodeId: 'n', changeType: StyleChangeType.MODIFIED, after, unsetPaths } as never],
});

const pinned: Sheet = create(StylesheetSchema, {
  nodes: {
    n: create(NodeStyleEntrySchema, {
      layout: create(NodeLayoutSchema, { position: vec(190, 130), size: vec(120, 40) }),
      shape: filled('#111111'),
    }),
  },
});

const strokeOf = (sheet: Sheet): string | undefined => {
  const paint = sheet.nodes['n']?.shape?.stroke?.paint;
  return paint?.case === 'color' ? paint.value.value : undefined;
};
const fillOf = (sheet: Sheet): string | undefined => {
  const paint = sheet.nodes['n']?.shape?.fill?.paint;
  return paint?.case === 'color' ? paint.value.value : undefined;
};

describe('a proposal changes what it names and nothing else', () => {
  test('a shape-only proposal leaves the layout alone', () => {
    const applied = applyStyleEditToStylesheet(pinned, nodeEdit(create(NodeStyleEntrySchema, { shape: stroked('#F59E0B') })));

    expect(applied.nodes['n']?.layout?.position).toEqual(vec(190, 130));
    expect(applied.nodes['n']?.layout?.size).toEqual(vec(120, 40));
    expect(strokeOf(applied)).toBe('#F59E0B');
  });

  test('a proposal naming one field of a nested message keeps the rest of it', () => {
    const applied = applyStyleEditToStylesheet(pinned, nodeEdit(create(NodeStyleEntrySchema, { shape: stroked('#F59E0B') })));
    expect(fillOf(applied)).toBe('#111111');

    const moved = applyStyleEditToStylesheet(
      pinned,
      nodeEdit(create(NodeStyleEntrySchema, { layout: create(NodeLayoutSchema, { position: vec(190, 300) }) })),
    );
    expect(moved.nodes['n']?.layout?.size).toEqual(vec(120, 40));
  });

  // An unset oneof is `{ case: undefined }`: one key, printing as `{}`.
  test('a shape patch that names no shape kind keeps the one already there', () => {
    const sheet = create(StylesheetSchema, {
      nodes: {
        n: create(NodeStyleEntrySchema, {
          shape: create(Glyph2DSchema, {
            shapeKind: { case: 'standard', value: ShapeType.SHAPE_HEXAGON },
            fill: create(FillSchema, { paint: colour('#111111') }),
          }),
        }),
      },
    });

    const applied = applyStyleEditToStylesheet(
      sheet,
      nodeEdit(create(NodeStyleEntrySchema, { shape: stroked('#F59E0B') })),
    );

    expect(applied.nodes['n']?.shape?.shapeKind).toEqual({ case: 'standard', value: ShapeType.SHAPE_HEXAGON });
    expect(strokeOf(applied)).toBe('#F59E0B');
  });

  test('two proposals on one element both survive, in either order', () => {
    const tint = nodeEdit(create(NodeStyleEntrySchema, { shape: stroked('#F59E0B') }));
    const move = nodeEdit(create(NodeStyleEntrySchema, { layout: create(NodeLayoutSchema, { position: vec(190, 300) }) }));

    for (const applied of [
      applyStyleEditToStylesheet(applyStyleEditToStylesheet(pinned, tint), move),
      applyStyleEditToStylesheet(applyStyleEditToStylesheet(pinned, move), tint),
    ]) {
      expect(strokeOf(applied)).toBe('#F59E0B');
      expect(fillOf(applied)).toBe('#111111');
      expect(applied.nodes['n']?.layout?.position).toEqual(vec(190, 300));
    }
  });

  test('applying a proposal does not mutate the sheet it came from', () => {
    applyStyleEditToStylesheet(pinned, nodeEdit(create(NodeStyleEntrySchema, { shape: stroked('#F59E0B') })));
    expect(strokeOf(pinned)).toBeUndefined();
    expect(pinned.nodes['n']?.layout?.position).toEqual(vec(190, 130));
  });

  // `create(AnnotationEntrySchema, {})` materialises `tags: {}`.
  test('a partial annotation patch keeps its tags and content', () => {
    const sheet = create(StylesheetSchema, {
      annotations: { a: create(AnnotationEntrySchema, { tags: { kind: 'note' }, component: 'old' }) },
    });
    const edit = create(StyleEditSchema, {
      id: 'e',
      annotationChanges: [{
        annotationId: 'a', changeType: StyleChangeType.MODIFIED, unsetPaths: [],
        after: create(AnnotationEntrySchema, { component: 'new' }),
      } as never],
    });

    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a']?.tags).toEqual({ kind: 'note' });
    expect(applied.annotations['a']?.component).toBe('new');
  });

  test('groups and edges merge the same way nodes do', () => {
    const sheet = create(StylesheetSchema, {
      groups: { g: create(GroupStyleEntrySchema, { layout: create(GroupLayoutSchema, { position: vec(1, 2), padding: 8 }) }) },
      edges: { e: create(EdgeStyleEntrySchema, { component: 'keep' }) },
    });
    const edit = create(StyleEditSchema, {
      id: 'e',
      groupChanges: [{
        groupId: 'g', changeType: StyleChangeType.MODIFIED, unsetPaths: [],
        after: create(GroupStyleEntrySchema, { layout: create(GroupLayoutSchema, { position: vec(9, 9) }) }),
      } as never],
      edgeChanges: [{
        edgeId: 'e', changeType: StyleChangeType.MODIFIED, unsetPaths: [],
        after: create(EdgeStyleEntrySchema, {}),
      } as never],
    });

    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.groups['g']?.layout?.padding).toBe(8);
    expect(applied.groups['g']?.layout?.position).toEqual(vec(9, 9));
    expect(applied.edges['e']?.component).toBe('keep');
  });
});

describe('a proposal clears a field by naming its path', () => {
  test('a nested field goes, and its siblings stay', () => {
    const applied = applyStyleEditToStylesheet(pinned, nodeEdit(create(NodeStyleEntrySchema, {}), ['layout.position']));

    expect(applied.nodes['n']?.layout?.position).toBeUndefined();
    expect(applied.nodes['n']?.layout?.size).toEqual(vec(120, 40));
  });

  test('a top-level field goes, and the rest of the entry stays', () => {
    const applied = applyStyleEditToStylesheet(pinned, nodeEdit(create(NodeStyleEntrySchema, {}), ['shape']));

    expect(applied.nodes['n']?.shape).toBeUndefined();
    expect(applied.nodes['n']?.layout?.position).toEqual(vec(190, 130));
  });

  // `content: undefined` is not a valid message.
  test('a repeated field empties rather than vanishing', () => {
    const sheet = create(StylesheetSchema, {
      annotations: { a: create(AnnotationEntrySchema, { content: [{ locale: 'en', source: 'hi' } as never] }) },
    });
    const edit = create(StyleEditSchema, {
      id: 'e',
      annotationChanges: [{
        annotationId: 'a', changeType: StyleChangeType.MODIFIED, unsetPaths: ['content'],
        after: create(AnnotationEntrySchema, {}),
      } as never],
    });

    expect(applyStyleEditToStylesheet(sheet, edit).annotations['a']?.content).toEqual([]);
  });

  // A cleared oneof keeps an empty wrapper, or the message no longer serialises.
  test('clearing a oneof leaf keeps its siblings and still round-trips', () => {
    const sheet = create(StylesheetSchema, {
      nodes: {
        n: create(NodeStyleEntrySchema, {
          shape: create(Glyph2DSchema, {
            stroke: create(StrokeSchema, { paint: colour('#F59E0B'), width: 2 }),
          }),
        }),
      },
    });

    const applied = applyStyleEditToStylesheet(
      sheet,
      nodeEdit(create(NodeStyleEntrySchema, {}), ['shape.stroke.paint']),
    );

    expect(applied.nodes['n']?.shape?.stroke?.paint?.case).toBeUndefined();
    expect(applied.nodes['n']?.shape?.stroke?.width).toBe(2);

    const round = fromBinary(StylesheetSchema, toBinary(StylesheetSchema, applied));
    expect(round.nodes['n']?.shape?.stroke?.width).toBe(2);
    expect(round.nodes['n']?.shape?.stroke?.paint?.case).toBeUndefined();
  });

  test('a cleared typography field goes, and the rest of the typography stays', () => {
    const sheet = create(StylesheetSchema, {
      nodes: {
        n: create(NodeStyleEntrySchema, {
          typography: create(TypographySchema, { size: 18, font: 'Inter', color: create(ColorSchema, { value: '#fff' }) }),
        }),
      },
    });

    const applied = applyStyleEditToStylesheet(
      sheet,
      nodeEdit(
        create(NodeStyleEntrySchema, { typography: create(TypographySchema, { font: 'Inter', color: create(ColorSchema, { value: '#fff' }) }) }),
        ['typography.size'],
      ),
    );

    expect(applied.nodes['n']?.typography?.size).toBeUndefined();
    expect(applied.nodes['n']?.typography?.font).toBe('Inter');
  });

  test('a path naming nothing is harmless, entry or field', () => {
    const applied = applyStyleEditToStylesheet(
      pinned,
      nodeEdit(create(NodeStyleEntrySchema, {}), ['typography.color', 'nope.nothing.here', '', 'layout.']),
    );

    expect(applied.nodes['n']?.layout?.position).toEqual(vec(190, 130));
  });

  test('a path against an element with no entry writes nothing', () => {
    const empty = create(StylesheetSchema, {});
    const applied = applyStyleEditToStylesheet(empty, nodeEdit(undefined, ['layout.position']));

    expect(applied.nodes['n']).toBeUndefined();
  });
});

// An undo entry snapshots the whole entry, so undo is only correct while the
// merge leaves the sheet it read unmutated.
describe('a clear can be undone', () => {
  const diagram = create(DiagramSchema, {
    schemaVersion: 1,
    graph: create(GraphSchema, { nodes: { n: create(NodeSchema, {}) } }),
  });

  test('undo brings back a field a proposal cleared, and redo takes it away again', () => {
    const state = createEditorState(diagram, pinned);

    state.applyStyleEdit(nodeEdit(create(NodeStyleEntrySchema, {}), ['layout.position']));
    expect(state.stylesheet().nodes['n']?.layout?.position).toBeUndefined();

    state.undo();
    expect(state.stylesheet().nodes['n']?.layout?.position).toEqual(vec(190, 130));
    expect(state.stylesheet().nodes['n']?.layout?.size).toEqual(vec(120, 40));

    state.redo();
    expect(state.stylesheet().nodes['n']?.layout?.position).toBeUndefined();
    expect(state.stylesheet().nodes['n']?.layout?.size).toEqual(vec(120, 40));
  });
});

describe('value objects replace whole', () => {
  // A message with a field declared without `optional` cannot express
  // "unchanged" for it, so naming the message replaces all of it.
  const annotationEdit = (after: unknown) => create(StyleEditSchema, {
    id: 'e',
    annotationChanges: [{
      annotationId: 'a', changeType: StyleChangeType.MODIFIED, after, unsetPaths: [],
    } as never],
  });

  test('a new anchor does not inherit the old target\'s attachment hint', () => {
    const sheet = create(StylesheetSchema, {
      annotations: {
        a: create(AnnotationEntrySchema, {
          anchor: create(AnnotationAnchorSchema, {
            refId: 'n1', refKind: RefKind.NODE, anchorPosition: vec(0, -1),
          }),
          typography: create(TypographySchema, { size: 14 }),
        }),
      },
    });

    const applied = applyStyleEditToStylesheet(sheet, annotationEdit(create(AnnotationEntrySchema, {
      anchor: create(AnnotationAnchorSchema, { refId: 'n2', refKind: RefKind.NODE }),
    })));

    expect(applied.annotations['a']?.anchor?.refId).toBe('n2');
    expect(applied.annotations['a']?.anchor?.anchorPosition).toBeUndefined();
    expect(applied.annotations['a']?.typography?.size).toBe(14);
  });

  test('naming arrowheads replaces the pair and its size', () => {
    const sheet = create(StylesheetSchema, {
      edges: {
        e1: create(EdgeStyleEntrySchema, {
          connection: create(Glyph1DSchema, {
            arrowheads: create(ArrowheadsSchema, {
              start: ArrowheadVariant.ARROWHEAD_CIRCLE, end: ArrowheadVariant.ARROWHEAD_OPEN, size: 12,
            }),
            stroke: create(StrokeSchema, { paint: colour('#abcdef') }),
          }),
        }),
      },
    });

    const applied = applyStyleEditToStylesheet(sheet, create(StyleEditSchema, {
      id: 'e',
      edgeChanges: [{
        edgeId: 'e1',
        changeType: StyleChangeType.MODIFIED,
        after: create(EdgeStyleEntrySchema, {
          connection: create(Glyph1DSchema, {
            arrowheads: create(ArrowheadsSchema, { end: ArrowheadVariant.ARROWHEAD_FILLED }),
          }),
        }),
        unsetPaths: [],
      } as never],
    }));

    const arrowheads = applied.edges['e1']?.connection?.arrowheads;
    expect(arrowheads?.end).toBe(ArrowheadVariant.ARROWHEAD_FILLED);
    expect(arrowheads?.start).toBe(ArrowheadVariant.ARROWHEAD_UNSPECIFIED);
    expect(arrowheads?.size).toBeUndefined();
    const paint = applied.edges['e1']?.connection?.stroke?.paint;
    expect(paint?.case === 'color' ? paint.value.value : undefined).toBe('#abcdef');
  });
});
