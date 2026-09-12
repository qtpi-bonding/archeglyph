// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createMemo, JSX } from 'solid-js';
import { ColorFieldInput } from '../fields/color_field';
import { EnumFieldInput } from '../fields/enum_field';
import { NumberFieldInput } from '../fields/number_field';
import { InspectorModel } from '../model';
import { lineModel, LineModel } from '../models/line_model';
import { commitLine } from '../models/line_commit';
import { PATTERN_TABLE, ARROWHEAD_TABLE } from '../models/line_names';
import { EditorState } from '../../state/editor_state';

export interface LineSectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry?: unknown;
  theme?: unknown;
}

type LineField = 'stroke' | 'strokeWidth' | 'pattern' | 'startArrowhead' | 'endArrowhead';

export const LineSection: Component<LineSectionProps> = (
  props: LineSectionProps,
): JSX.Element => {
  const fields = createMemo<LineModel>(() => (
    lineModel(props.model, props.state.stylesheet())
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
        field={fields().stroke}
        onCommit={commit('stroke')}
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
        field={fields().startArrowhead}
        options={arrowheadOptions}
        onCommit={commit('startArrowhead')}
      />
      <EnumFieldInput
        label="End"
        field={fields().endArrowhead}
        options={arrowheadOptions}
        onCommit={commit('endArrowhead')}
      />
    </section>
  );
};
