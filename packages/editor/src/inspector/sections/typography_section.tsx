// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createMemo, JSX } from 'solid-js';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { StyleEdit } from '@archeglyph/proto/gen/style_pb';
import { ColorFieldInput } from '../fields/color_field';
import { NumberFieldInput } from '../fields/number_field';
import { TokenFieldInput } from '../fields/token_field';
import { InspectorModel } from '../model';
import { SceneGeometry } from '../../scene/scene';
import { EditorState } from '../../state/editor_state';
import { commitTypography, typographyModel, TypographyModel } from '../sections_model';

export interface TypographySectionProps {
  state: EditorState;
  model: InspectorModel;
  geometry: SceneGeometry;
  theme: Theme;
}

/** The typography controls shared by nodes, edges, groups, and annotations. */
export const TypographySection: Component<TypographySectionProps> = (
  props: TypographySectionProps,
): JSX.Element => {
  const model = createMemo((): TypographyModel => (
    typographyModel(props.model, props.geometry, props.state.stylesheet())
  ));

  const apply = (field: 'size' | 'color' | 'font', value: string | number | undefined): void => {
    const edit: StyleEdit | undefined = commitTypography(
      props.model,
      props.state.stylesheet(),
      field,
      value,
    );
    if (edit !== undefined) {
      props.state.applyStyleEdit(edit);
    }
  };

  const fontTokens = (): string[] => Object.keys(props.theme.tokens?.fonts ?? {}).map(
    (name: string): string => `$fonts.${name}`,
  );

  return (
    <section>
      <NumberFieldInput
        label="Size"
        field={model().size}
        onCommit={(value: number | undefined): void => {
          apply('size', value);
        }}
      />
      <ColorFieldInput
        label="Color"
        field={model().color}
        onCommit={(value: string | undefined): void => {
          apply('color', value);
        }}
      />
      <TokenFieldInput
        label="Font"
        field={model().font}
        tokens={fontTokens()}
        onCommit={(value: string | undefined): void => {
          apply('font', value);
        }}
      />
    </section>
  );
};
