// SPDX-License-Identifier: MPL-2.0

import type { GroupLayout, Stylesheet } from '@archeglyph/proto/gen/style_pb';
import type { SceneGeometry } from '../../scene/scene';
import type { InspectorModel } from '../model';
import { numberField, textField, NumberField, TextField } from '../field_value';
import { LABEL_POSITION_TABLE, RENDER_MODE_TABLE } from './group_names';

export interface GroupModel {
  padding: NumberField;
  renderMode: TextField;
  labelPosition: TextField;
}

// Both enums use 0 for UNSPECIFIED, and proto3 does not distinguish "absent"
// from "zero" on a scalar enum -- so a group that has never set a render mode
// reads back as 0. Mapping 0 to undefined is what lets the field render as
// "Default" rather than as a fourth mode the user appears to have chosen.
function enumName<T extends number>(
  table: ReadonlyArray<{ name: string; value: T }>,
  value: T | undefined,
): string | undefined {
  if (value === undefined || value === 0) {
    return undefined;
  }
  return table.find((entry) => entry.value === value)?.name;
}

export function groupModel(
  model: InspectorModel,
  geometry: SceneGeometry,
  stylesheet: Stylesheet,
): GroupModel {
  // Only groups carry these fields. Returning empty fields rather than
  // throwing keeps the section harmless if the router ever offers it for
  // another kind.
  const ids = model.kind === 'group' ? model.ids : [];

  const override = (id: string): GroupLayout | undefined => stylesheet.groups[id]?.layout;
  const effective = (id: string): GroupLayout | undefined => geometry.diagram.groups[id]?.layout;

  const overrides = ids.map(override);
  const effectives = ids.map(effective);

  return {
    padding: numberField(
      overrides.map((layout) => layout?.padding),
      effectives.map((layout) => layout?.padding),
    ),
    renderMode: textField(
      overrides.map((layout) => enumName(RENDER_MODE_TABLE, layout?.renderMode)),
      effectives.map((layout) => enumName(RENDER_MODE_TABLE, layout?.renderMode)),
    ),
    labelPosition: textField(
      overrides.map((layout) => enumName(LABEL_POSITION_TABLE, layout?.labelPosition)),
      effectives.map((layout) => enumName(LABEL_POSITION_TABLE, layout?.labelPosition)),
    ),
  };
}
