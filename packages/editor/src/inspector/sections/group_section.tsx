// SPDX-License-Identifier: MPL-2.0

import { Component, createMemo, JSX, Show } from 'solid-js';
import { EnumFieldInput } from '../fields/enum_field';
import { NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { groupModel, GroupModel } from '../models/group_model';
import {
  commitGroup, GroupField, LABEL_POSITION_OPTIONS, renderModeOptions,
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
      <div class="ag-look" style={{ color: 'var(--ag-fg-3)' }}>{fields().look}</div>
      <EnumFieldInput
        label="Render"
        field={fields().renderMode}
        options={renderModeOptions(props.model)}
        onCommit={commit('renderMode')}
      />
      {/* Padding and label position shape the open box only. */}
      <Show when={props.model.block !== true}>
        <NumberFieldInput
          label="Padding"
          field={fields().padding}
          onCommit={commit('padding')}
        />
        <EnumFieldInput
          label="Label"
          field={fields().labelPosition}
          options={LABEL_POSITION_OPTIONS}
          onCommit={commit('labelPosition')}
        />
      </Show>
    </section>
  );
};
