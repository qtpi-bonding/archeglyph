// SPDX-License-Identifier: MPL-2.0

import { Component, createMemo, JSX } from 'solid-js';
import { ColorFieldInput } from '../fields/color_field';
import { EnumFieldInput } from '../fields/enum_field';
import { NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { lineModel, LineModel } from '../models/line_model';
import { commitLine } from '../models/line_commit';
import { PATTERN_TABLE, ARROWHEAD_TABLE } from '../models/line_names';
import { EditorState } from '../../state/editor_state';
import { SceneGeometry } from '../../scene/scene';

export interface LineSectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry: SceneGeometry;
}

type LineField = 'strokeColor' | 'strokeWidth' | 'pattern' | 'arrowStart' | 'arrowEnd';

export const LineSection: Component<LineSectionProps> = (
  props: LineSectionProps,
): JSX.Element => {
  const fields = createMemo<LineModel>(() => (
    lineModel(props.model, props.geometry, props.state.stylesheet())
  ));

  const commit = (field: LineField): ((value: string | number | undefined) => void) => (
    (value: string | number | undefined): void => {
      const edit = commitLine(
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

  const patternOptions = PATTERN_TABLE.map((entry) => entry.name);
  const arrowheadOptions = ARROWHEAD_TABLE.map((entry) => entry.name);

  return (
    <section>
      <ColorFieldInput
        label="Stroke"
        field={fields().strokeColor}
        onCommit={commit('strokeColor')}
      />
      <NumberFieldInput
        label="Stroke Width"
        field={fields().strokeWidth}
        onCommit={commit('strokeWidth')}
      />
      <EnumFieldInput
        label="Pattern"
        field={fields().pattern}
        options={patternOptions}
        onCommit={commit('pattern')}
      />
      <EnumFieldInput
        label="Start"
        field={fields().arrowStart}
        options={arrowheadOptions}
        onCommit={commit('arrowStart')}
      />
      <EnumFieldInput
        label="End"
        field={fields().arrowEnd}
        options={arrowheadOptions}
        onCommit={commit('arrowEnd')}
      />
    </section>
  );
};
