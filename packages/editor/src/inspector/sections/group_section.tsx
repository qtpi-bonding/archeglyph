// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createMemo, JSX } from 'solid-js';
import { EnumFieldInput } from '../fields/enum_field';
import { NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { groupModel, GroupModel } from '../models/group_model';
import {
  commitGroup, GroupField, LABEL_POSITION_OPTIONS, RENDER_MODE_OPTIONS,
} from '../models/group_commit';
import { EditorState } from '../../state/editor_state';
import { SceneGeometry } from '../../scene/scene';

export interface GroupSectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry: SceneGeometry;
}

export const GroupSection: Component<GroupSectionProps> = (
  props: GroupSectionProps,
): JSX.Element => {
  const fields = createMemo<GroupModel>(() => (
    groupModel(props.model, props.geometry, props.state.stylesheet())
  ));

  const commit = (field: GroupField): ((value: string | number | undefined) => void) => (
    (value: string | number | undefined): void => {
      const edit = commitGroup(props.model, props.state.stylesheet(), field, value);
      if (edit !== undefined) {
        props.state.applyStyleEdit(edit);
      }
    }
  );

  return (
    <section>
      <NumberFieldInput
        label="Padding"
        field={fields().padding}
        onCommit={commit('padding')}
      />
      <EnumFieldInput
        label="Render"
        field={fields().renderMode}
        options={RENDER_MODE_OPTIONS}
        onCommit={commit('renderMode')}
      />
      <EnumFieldInput
        label="Label"
        field={fields().labelPosition}
        options={LABEL_POSITION_OPTIONS}
        onCommit={commit('labelPosition')}
      />
    </section>
  );
};
