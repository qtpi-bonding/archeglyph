// SPDX-License-Identifier: MPL-2.0

import { Component, createMemo, JSX, Show } from 'solid-js';
import { NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { annotationModel, AnnotationModel } from '../models/annotation_model';
import { commitAnnotationRotation, commitDetachAnchor } from '../models/annotation_commit';
import { EditorState } from '../../state/editor_state';
import { SceneGeometry } from '../../scene/scene';

export interface AnnotationSectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry: SceneGeometry;
}

export const AnnotationSection: Component<AnnotationSectionProps> = (
  props: AnnotationSectionProps,
): JSX.Element => {
  const fields = createMemo<AnnotationModel>(() => (
    annotationModel(props.model, props.geometry, props.state.stylesheet())
  ));

  const commitRotation = (value: string | number | undefined): void => {
    const edit = commitAnnotationRotation(
      props.model,
      props.state.stylesheet(),
      value === undefined ? undefined : Number(value),
    );
    if (edit !== undefined) {
      props.state.applyStyleEdit(edit);
    }
  };

  const detach = (): void => {
    const edit = commitDetachAnchor(props.model, props.state.stylesheet());
    if (edit !== undefined) {
      props.state.applyStyleEdit(edit);
    }
  };

  return (
    <section>
      <NumberFieldInput
        label="Rotation"
        field={fields().rotation}
        onCommit={commitRotation}
      />
      <label>
        <span>Anchor</span>
        <span>{fields().anchorLabel ?? (fields().anchored ? 'Mixed' : 'None')}</span>
      </label>
      <Show when={fields().anchored}>
        <button type="button" onClick={detach}>Detach</button>
      </Show>
    </section>
  );
};
