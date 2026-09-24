// SPDX-License-Identifier: AGPL-3.0-or-later

// A StyleChange carries a WHOLE entry, not a field, so every builder here has
// to rebuild the entry around the one thing it is changing. Get that wrong and
// moving a node silently drops its component binding, or a resize clears its
// typography — all of which typechecks, and all of which archegraph verify
// reports as clean, because the wiring is right and only the behaviour is not.
//
// So these tests are almost entirely about field PRESERVATION rather than about
// the field being written. The assertion that a move sets a position is the
// cheap half; the assertion that it left the size alone is the half that has
// actually caught bugs.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ColorSchema,
  NodeLayoutSchema,
  NodeStyleEntrySchema,
  NodeVisibility,
  Stylesheet,
  StylesheetSchema,
  TypographySchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { applyStyleEditToStylesheet } from '../apply_style_edit';
import { moveElementsEdit, moveNodeEdit } from './move';
import { clearNodeSizeEdit, resizeAnnotationEdit, resizeNodeEdit } from './resize';
import { setNodeHiddenEdit, showAllEdit } from './visibility';
import { addAnnotationEdit, deleteAnnotationEdit, setAnnotationTextEdit } from './annotation';
import { unpinAllEdit, unpinElementsEdit } from './layout_command';
import { setNodesGlyphEdit } from './glyph';

const v = (x: number, y: number) => create(Vec2Schema, { x, y });

/** A node that already carries everything a careless builder could drop. */
function loadedStylesheet(): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {
      n1: create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, { position: v(1, 2), size: v(200, 80), rotation: 15 }),
        component: 'glyph',
        typography: create(TypographySchema, { color: create(ColorSchema, { value: '#abcdef' }) }),
      }),
    },
  });
}

const apply = (sheet: Stylesheet, edit: ReturnType<typeof moveNodeEdit>): Stylesheet =>
  applyStyleEditToStylesheet(sheet, edit);

describe('move', () => {
  test('writes the position', () => {
    const after = apply(loadedStylesheet(), moveNodeEdit(loadedStylesheet(), 'n1', v(10, 20)));
    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 10, y: 20 });
  });

  test('preserves size, rotation, component and typography', () => {
    const before = loadedStylesheet();
    const after = apply(before, moveNodeEdit(before, 'n1', v(10, 20)));
    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 200, y: 80 });
    expect(after.nodes.n1.layout?.rotation).toBe(15);
    expect(after.nodes.n1.component).toBe('glyph');
    expect(after.nodes.n1.typography?.color?.value).toBe('#abcdef');
  });

  test('creates an entry for a node that has none', () => {
    const empty = create(StylesheetSchema, { schemaVersion: 1 });
    const after = apply(empty, moveNodeEdit(empty, 'fresh', v(3, 4)));
    expect(after.nodes.fresh.layout?.position).toMatchObject({ x: 3, y: 4 });
  });

  test('moves a multi-selection in one edit', () => {
    const before = loadedStylesheet();
    const edit = moveElementsEdit(before, [{ kind: 'node', id: 'n1', position: v(7, 8) }]);
    expect(apply(before, edit).nodes.n1.layout?.position).toMatchObject({ x: 7, y: 8 });
  });
});

describe('resize', () => {
  test('writes position and size together', () => {
    // Seven of the eight handles move the origin as well as the extent, so a
    // resize that only wrote size would grow every box downward from a fixed
    // top-left whichever handle was dragged.
    const before = loadedStylesheet();
    const after = apply(before, resizeNodeEdit(before, 'n1', v(5, 5), v(300, 90)));
    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 5, y: 5 });
    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 300, y: 90 });
  });

  test('preserves the component binding', () => {
    const before = loadedStylesheet();
    expect(apply(before, resizeNodeEdit(before, 'n1', v(5, 5), v(300, 90))).nodes.n1.component)
      .toBe('glyph');
  });

  test('clearNodeSize hands the size back to the label measurement', () => {
    const before = loadedStylesheet();
    const after = apply(before, clearNodeSizeEdit(before, 'n1'));
    expect(after.nodes.n1.layout?.size).toBeUndefined();
    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 1, y: 2 });
  });
});

describe('glyph', () => {
  test('writes the component without disturbing layout', () => {
    const before = loadedStylesheet();
    const after = apply(before, setNodesGlyphEdit(before, ['n1'], { component: 'boxy' }));
    expect(after.nodes.n1.component).toBe('boxy');
    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 200, y: 80 });
  });
});

describe('visibility', () => {
  test('hides and shows, leaving layout alone', () => {
    const before = loadedStylesheet();
    const hidden = apply(before, setNodeHiddenEdit(before, 'n1', true));
    expect(hidden.nodes.n1.visibility).toBe(NodeVisibility.HIDDEN);
    expect(hidden.nodes.n1.layout?.size).toMatchObject({ x: 200, y: 80 });

    const shown = apply(hidden, showAllEdit(hidden));
    expect(shown.nodes.n1.visibility).not.toBe(NodeVisibility.HIDDEN);
  });
});

describe('pinning', () => {
  test('unpinAll actually removes the position', () => {
    const before = loadedStylesheet();
    expect(before.nodes.n1.layout?.position).toBeDefined();
    const after = apply(before, unpinAllEdit(before));
    expect(after.nodes.n1.layout?.position).toBeUndefined();
  });

  test('unpinAll keeps everything that is not the position', () => {
    const before = loadedStylesheet();
    const after = apply(before, unpinAllEdit(before));
    expect(after.nodes.n1.component).toBe('glyph');
    expect(after.nodes.n1.typography?.color?.value).toBe('#abcdef');
    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 200, y: 80 });
  });

  test('unpinElements removes the position for the named nodes only', () => {
    const before = loadedStylesheet();
    const after = apply(before, unpinElementsEdit(before, [{ kind: 'node', id: 'n1', position: v(0, 0) }]));
    expect(after.nodes.n1.layout?.position).toBeUndefined();
    expect(after.nodes.n1.component).toBe('glyph');
  });
});

describe('annotations', () => {
  test('add, retext, resize and delete round-trip', () => {
    let sheet = create(StylesheetSchema, { schemaVersion: 1 });

    sheet = apply(sheet, addAnnotationEdit(sheet, 'a1', v(40, 50), 'hello'));
    expect(sheet.annotations.a1?.content?.[0]?.source).toBe('hello');
    expect(sheet.annotations.a1?.layout?.position).toMatchObject({ x: 40, y: 50 });

    sheet = apply(sheet, setAnnotationTextEdit(sheet, 'a1', 'goodbye'));
    expect(sheet.annotations.a1?.content?.[0]?.source).toBe('goodbye');
    expect(sheet.annotations.a1?.layout?.position).toMatchObject({ x: 40, y: 50 });

    sheet = apply(sheet, resizeAnnotationEdit(sheet, 'a1', v(40, 50), v(120, 60)));
    expect(sheet.annotations.a1?.layout?.size).toMatchObject({ x: 120, y: 60 });
    expect(sheet.annotations.a1?.content?.[0]?.source).toBe('goodbye');

    // Annotations are the one element type the editor owns outright, so this
    // is a real removal rather than the hiding that D3 gives everything else.
    sheet = apply(sheet, deleteAnnotationEdit(sheet, 'a1'));
    expect(sheet.annotations.a1).toBeUndefined();
  });
});
