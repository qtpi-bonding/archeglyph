// SPDX-License-Identifier: MPL-2.0

import type { BoxLayout, Stylesheet } from '@archeglyph/proto/gen/style_pb';
import type { SceneGeometry } from '../../scene/scene';
import type { InspectorModel } from '../model';
import { numberField, textField, NumberField, TextField } from '../field_value';
import { LABEL_POSITION_TABLE, RENDER_MODE_TABLE } from './group_names';

export interface GroupModel {
  /** Which look this section is editing: the closed block's or the open box's. */
  look: 'Block look' | 'Box look';
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

  const override = (id: string): BoxLayout | undefined => stylesheet.elements[id]?.boxLayout;
  const effective = (id: string): BoxLayout | undefined => geometry.diagram.groups[id]?.layout;

  const overrides = ids.map(override);
  const effectives = ids.map(effective);

  // The render mode sits on the entry itself, not on its box layout. The
  // laid-out group never carried a default for it, so the effective value is
  // the override, as it was when it travelled inside the layout.
  const renderModeOverrides = ids.map((id) => stylesheet.elements[id]?.renderMode);

  return {
    look: model.block === true ? 'Block look' : 'Box look',
    padding: numberField(
      overrides.map((layout) => layout?.padding),
      effectives.map((layout) => layout?.padding),
    ),
    renderMode: textField(
      renderModeOverrides.map((renderMode) => enumName(RENDER_MODE_TABLE, renderMode)),
      renderModeOverrides.map((renderMode) => enumName(RENDER_MODE_TABLE, renderMode)),
    ),
    labelPosition: textField(
      overrides.map((layout) => enumName(LABEL_POSITION_TABLE, layout?.labelPosition)),
      effectives.map((layout) => enumName(LABEL_POSITION_TABLE, layout?.labelPosition)),
    ),
  };
}
