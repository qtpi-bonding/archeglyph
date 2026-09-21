// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  GroupLabelPosition,
  GroupLayoutSchema,
  GroupRenderMode,
  GroupStyleEntrySchema,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import { commitGroup } from './group_commit';
import { groupModel } from './group_model';
import { applyStyleEditToStylesheet } from '../../state/apply_style_edit';
import type { InspectorModel } from '../model';
import type { SceneGeometry } from '../../scene/scene';

function sheet(groups = {}) {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {},
    edges: {},
    groups,
    annotations: {},
    pendingEdits: [],
  });
}

function group(layout = {}) {
  return create(GroupStyleEntrySchema, { layout: create(GroupLayoutSchema, layout) });
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
    expect(after.groups['g1']?.layout?.padding).toBeUndefined();
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
    const before = sheet({ g1: group({ renderMode: GroupRenderMode.BOUNDED }) });
    // Writing 0 here would read back as Default and look like a successful
    // clear, which is the wrong answer to a bad option list.
    expect(commitGroup(model(['g1']), before, 'renderMode', 'nonsense')).toBeUndefined();
  });

  test('applies to every selected group, not just the first', () => {
    const before = sheet({ g1: group({}), g2: group({}) });
    const edit = commitGroup(model(['g1', 'g2']), before, 'labelPosition', 'bottom right');
    expect(edit).toBeDefined();

    const after = applyStyleEditToStylesheet(before, edit!);
    expect(after.groups['g1']?.layout?.labelPosition)
      .toBe(GroupLabelPosition.GROUP_LABEL_BOTTOM_RIGHT);
    expect(after.groups['g2']?.layout?.labelPosition)
      .toBe(GroupLabelPosition.GROUP_LABEL_BOTTOM_RIGHT);
  });

  test('editing one field leaves the others on the same group alone', () => {
    const before = sheet({
      g1: group({ padding: 8, renderMode: GroupRenderMode.CONTRACTED }),
    });
    const edit = commitGroup(model(['g1']), before, 'padding', 20);
    const after = applyStyleEditToStylesheet(before, edit!);

    expect(after.groups['g1']?.layout?.padding).toBe(20);
    expect(after.groups['g1']?.layout?.renderMode).toBe(GroupRenderMode.CONTRACTED);
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
    const sheetWith = sheet({ g1: group({ renderMode: GroupRenderMode.EXPANDED }) });
    const fields = groupModel(
      model(['g1']),
      geometry({ g1: { layout: { renderMode: GroupRenderMode.EXPANDED } } }),
      sheetWith,
    );
    expect(fields.renderMode.override).toBe('expanded');
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
