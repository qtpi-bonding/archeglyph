// SPDX-License-Identifier: MPL-2.0

import { Component, createMemo, JSX } from 'solid-js';
import { ColorFieldInput } from '../fields/color_field';
import { EnumFieldInput } from '../fields/enum_field';
import { NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { shapeModel, ShapeModel } from '../models/shape_model';
import { commitShape } from '../models/shape_commit';
import { SHAPE_TABLE } from '../models/shape_names';
import { SceneGeometry } from '../../scene/scene';
import { EditorState } from '../../state/editor_state';

export interface ShapeSectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry: SceneGeometry;
}

type ShapeField = 'shape' | 'cornerRadius' | 'fill' | 'strokeColor' | 'strokeWidth';

/** The shape controls shared by nodes, groups, and annotations. */
export const ShapeSection: Component<ShapeSectionProps> = (
  props: ShapeSectionProps,
): JSX.Element => {
  const fields = createMemo<ShapeModel>(() => (
    shapeModel(props.model, props.geometry, props.state.stylesheet())
  ));

  const commit = (field: ShapeField): ((value: string | number | undefined) => void) => (
    (value: string | number | undefined): void => {
      const edit = commitShape(
        props.model,
        props.state.stylesheet(),
        field,
        value,
      );
      if (edit !== undefined) {
        props.state.applyStyleEdit(edit);
      }
    }
  );

  const shapeOptions = SHAPE_TABLE.map((entry) => entry.name);

  return (
    <section>
      <EnumFieldInput
        label="Shape"
        field={fields().shape}
        options={shapeOptions}
        onCommit={commit('shape')}
      />
      <NumberFieldInput
        label="Corner Radius"
        field={fields().cornerRadius}
        onCommit={commit('cornerRadius')}
      />
      <NumberFieldInput
        label="Stroke Width"
        field={fields().strokeWidth}
        onCommit={commit('strokeWidth')}
      />
      <ColorFieldInput
        label="Fill"
        field={fields().fill}
        onCommit={commit('fill')}
      />
      <ColorFieldInput
        label="Stroke"
        field={fields().strokeColor}
        onCommit={commit('strokeColor')}
      />
    </section>
  );
};
