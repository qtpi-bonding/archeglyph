// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntrySchema, ColorSchema, EdgeStyleEntrySchema, FillSchema, Glyph2DSchema,
  GroupLayoutSchema, GroupStyleEntrySchema, NodeLayoutSchema, NodeStyleEntrySchema,
  ShapeType, StrokeSchema, StyleChangeType, StyleEditSchema, StylesheetSchema,
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
