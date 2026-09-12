// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createMemo, JSX } from 'solid-js';
import { NumberCommit, NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { commitLayout, layoutModel, LayoutModel } from '../sections_model';
import { SceneGeometry } from '../../scene/scene';
import { EditorState } from '../../state/editor_state';

export interface LayoutSectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry: SceneGeometry;
}

type LayoutField = 'x' | 'y' | 'width' | 'height';

/** The position and size controls shared by nodes, groups, and annotations. */
export const LayoutSection: Component<LayoutSectionProps> = (
  props: LayoutSectionProps,
): JSX.Element => {
  // Keep the model read reactive. In particular, stylesheet() must not be
  // evaluated while the component function is being constructed: that would
  // leave the fields showing the selection from the first render forever.
  const fields = createMemo<LayoutModel>(() => (
    layoutModel(props.model, props.geometry, props.state.stylesheet())
  ));

  const commit = (field: LayoutField): NumberCommit => (
    (value: number | undefined, coalesceKey?: string): void => {
      const edit = commitLayout(
        props.model,
        props.geometry,
        props.state.stylesheet(),
        field,
        value,
      );
      if (edit !== undefined) {
        props.state.applyStyleEdit(edit, coalesceKey);
      }
    }
  );

  return (
    <section>
      <NumberFieldInput label="x" field={fields().x} onCommit={commit('x')} />
      <NumberFieldInput label="y" field={fields().y} onCommit={commit('y')} />
      <NumberFieldInput label="width" field={fields().width} onCommit={commit('width')} />
      <NumberFieldInput label="height" field={fields().height} onCommit={commit('height')} />
    </section>
  );
};
