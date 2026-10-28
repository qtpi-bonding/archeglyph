// SPDX-License-Identifier: MPL-2.0

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  BoxLayoutSchema,
  ElementStyleEntrySchema,
  GroupLabelPosition,
  GroupRenderMode,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import { commitGroup, renderModeOptions } from './group_commit';
import { groupModel } from './group_model';
import { applyStyleEditToStylesheet } from '../../state/apply_style_edit';
import type { InspectorModel } from '../model';
import type { SceneGeometry } from '../../scene/scene';
import { STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

function sheet(elements = {}) {
  return create(StylesheetSchema, {
    schemaVersion: STYLE_SCHEMA_VERSION,
    edges: {},
    elements,
    annotations: {},
    pendingEdits: [],
  });
}

// renderMode lives on the entry itself, so it is split off the box layout.
function group(layout: { padding?: number; labelPosition?: GroupLabelPosition; renderMode?: GroupRenderMode } = {}) {
  const { renderMode, ...boxLayout } = layout;
  return create(ElementStyleEntrySchema, {
    boxLayout: create(BoxLayoutSchema, boxLayout),
    ...(renderMode === undefined ? {} : { renderMode }),
  });
}

const model = (ids: Array<string>): InspectorModel => ({
  kind: 'group',
  ids,
  sections: ['layout', 'group', 'shape', 'typography'],
});

// groupModel only reads `diagram.groups` for effective values; the rest of
// SceneGeometry is irrelevant to these assertions.
const geometry = (groups = {}): SceneGeometry => (
  { diagram: { groups }, byKey: {} } as unknown as SceneGeometry
);

describe('commitGroup', () => {
  test('writes padding, and clearing it removes the field rather than writing 0', () => {
    const before = sheet({ g1: group({ padding: 12 }) });

    const cleared = commitGroup(model(['g1']), before, 'padding', undefined);
    expect(cleared).toBeDefined();
    const after = applyStyleEditToStylesheet(before, cleared!);

    // 0 would be a legitimate padding a user could have chosen, so an absent
    // override has to actually be absent.
    expect(after.elements['g1']?.boxLayout?.padding).toBeUndefined();
  });

  test('a no-op edit returns undefined rather than an empty edit', () => {
    const before = sheet({ g1: group({ padding: 12 }) });
    expect(commitGroup(model(['g1']), before, 'padding', 12)).toBeUndefined();
  });

  test('clearing an enum is a no-op when it was never set', () => {
    // UNSPECIFIED reads back as 0, and the model shows that as Default. So
    // "set it to Default" when it is already Default must not produce an edit.
    const before = sheet({ g1: group({}) });
    expect(commitGroup(model(['g1']), before, 'renderMode', undefined)).toBeUndefined();
  });

  test('an enum name outside the table is refused, not written as 0', () => {
    const before = sheet({ g1: group({ renderMode: GroupRenderMode.OPEN }) });
    // Writing 0 here would read back as Default and look like a successful
    // clear, which is the wrong answer to a bad option list.
    expect(commitGroup(model(['g1']), before, 'renderMode', 'nonsense')).toBeUndefined();
  });

  test('applies to every selected group, not just the first', () => {
    const before = sheet({ g1: group({}), g2: group({}) });
    const edit = commitGroup(model(['g1', 'g2']), before, 'labelPosition', 'bottom right');
    expect(edit).toBeDefined();

    const after = applyStyleEditToStylesheet(before, edit!);
    expect(after.elements['g1']?.boxLayout?.labelPosition)
      .toBe(GroupLabelPosition.GROUP_LABEL_BOTTOM_RIGHT);
    expect(after.elements['g2']?.boxLayout?.labelPosition)
      .toBe(GroupLabelPosition.GROUP_LABEL_BOTTOM_RIGHT);
  });

  test('editing one field leaves the others on the same group alone', () => {
    const before = sheet({
      g1: group({ padding: 8, renderMode: GroupRenderMode.CLOSED }),
    });
    const edit = commitGroup(model(['g1']), before, 'padding', 20);
    const after = applyStyleEditToStylesheet(before, edit!);

    expect(after.elements['g1']?.boxLayout?.padding).toBe(20);
    expect(after.elements['g1']?.renderMode).toBe(GroupRenderMode.CLOSED);
  });

  test('refuses a non-group selection', () => {
    const before = sheet({ g1: group({}) });
    const asNode: InspectorModel = { kind: 'node', ids: ['g1'], sections: ['layout'] };
    expect(commitGroup(asNode, before, 'padding', 4)).toBeUndefined();
  });
});

describe('groupModel', () => {
  test('an unset enum reads as Default, not as the zeroth mode', () => {
    const fields = groupModel(model(['g1']), geometry({ g1: { layout: {} } }), sheet({ g1: group({}) }));
    expect(fields.renderMode.override).toBeUndefined();
    expect(fields.renderMode.effective).toBeUndefined();
  });

  test('a set enum reads back by name', () => {
    const sheetWith = sheet({ g1: group({ renderMode: GroupRenderMode.DISSOLVED }) });
    const fields = groupModel(
      model(['g1']),
      geometry({ g1: { layout: {} } }),
      sheetWith,
    );
    expect(fields.renderMode.override).toBe('dissolved');
  });

  test('two groups disagreeing on a field fold to mixed', () => {
    const sheetWith = sheet({
      g1: group({ padding: 4 }),
      g2: group({ padding: 9 }),
    });
    const fields = groupModel(model(['g1', 'g2']), geometry({}), sheetWith);
    expect(fields.padding.mixed).toBe(true);
  });
});

describe('render mode choices', () => {
  const grouping: InspectorModel = { ...model(['g1']), groupingsOnly: true };
  const entity: InspectorModel = { ...model(['g1']), groupingsOnly: false };

  test('DISSOLVED is offered for a grouping', () => {
    expect(renderModeOptions(grouping)).toEqual(['open', 'dissolved', 'closed']);
  });

  test('DISSOLVED is not offered for an entity, but OPEN and CLOSED are', () => {
    expect(renderModeOptions(entity)).toEqual(['open', 'closed']);
  });

  test('one entity in the selection withdraws DISSOLVED for all of it', () => {
    expect(renderModeOptions({ ...model(['g1', 'g2']), groupingsOnly: false })).not.toContain('dissolved');
  });

  test('dissolving an entity is refused rather than written', () => {
    expect(commitGroup(entity, sheet({ g1: group({}) }), 'renderMode', 'dissolved')).toBeUndefined();
  });

  test('closing and opening an entity write renderMode on the entry', () => {
    const before = sheet({ g1: group({}) });

    const closed = applyStyleEditToStylesheet(before, commitGroup(entity, before, 'renderMode', 'closed')!);
    expect(closed.elements['g1']?.renderMode).toBe(GroupRenderMode.CLOSED);

    const reopened = applyStyleEditToStylesheet(closed, commitGroup(entity, closed, 'renderMode', 'open')!);
    expect(reopened.elements['g1']?.renderMode).toBe(GroupRenderMode.OPEN);
  });
});

describe('which look the group section is editing', () => {
  test('a closed container reads as the block look, an open one as the box look', () => {
    const closed: InspectorModel = { ...model(['g1']), block: true };
    const open: InspectorModel = { ...model(['g1']), block: false };

    expect(groupModel(closed, geometry(), sheet()).look).toBe('Block look');
    expect(groupModel(open, geometry(), sheet()).look).toBe('Box look');
  });
});
