// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import {
  GroupLabelPosition,
  GroupLayout,
  GroupLayoutSchema,
  GroupRenderMode,
  GroupStyleEntrySchema,
  StyleEdit,
  Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import type { InspectorModel } from '../model';
import { groupChange, styleEdit } from '../../state/edits/edit_builder';
import { initOf } from '../../state/edits/entry_patch';
import { LABEL_POSITION_TABLE, RENDER_MODE_TABLE } from './group_names';

export type GroupField = 'padding' | 'renderMode' | 'labelPosition';

export function commitGroup(
  model: InspectorModel,
  stylesheet: Stylesheet,
  field: GroupField,
  value: string | number | undefined,
): StyleEdit | undefined {
  if (model.kind !== 'group' || model.ids.length === 0) {
    return undefined;
  }

  const resolved = ((): number | undefined => {
    if (value === undefined) {
      return undefined;
    }
    if (field === 'padding') {
      return typeof value === 'number' ? value : Number(value);
    }
    const table = field === 'renderMode' ? RENDER_MODE_TABLE : LABEL_POSITION_TABLE;
    return table.find((entry) => entry.name === value)?.value;
  })();

  // An unrecognised enum name is a bug in the caller's option list, not a
  // reason to write a 0 that would read back as Default.
  if (value !== undefined && resolved === undefined) {
    return undefined;
  }
  if (field === 'padding' && resolved !== undefined && !Number.isFinite(resolved)) {
    return undefined;
  }

  const current = (id: string): number | undefined => {
    const layout = stylesheet.groups[id]?.layout;
    if (field === 'padding') return layout?.padding;
    if (field === 'renderMode') return layout?.renderMode;
    return layout?.labelPosition;
  };
  // Nothing to write if every selected group already reads this way. The
  // enum comparison treats absent and 0 alike, which is what the model does.
  const unchanged = model.ids.every((id) => {
    const existing = current(id);
    const normalised = field === 'padding' ? existing : existing === 0 ? undefined : existing;
    return normalised === resolved;
  });
  if (unchanged) {
    return undefined;
  }

  const groupChanges = model.ids.map((id) => {
    const existing = stylesheet.groups[id];
    const layoutInit = initOf(existing?.layout);
    if (resolved === undefined) {
      delete layoutInit[field];
    } else {
      layoutInit[field] = resolved;
    }
    return groupChange(id, create(GroupStyleEntrySchema, {
      ...initOf(existing),
      layout: create(GroupLayoutSchema, layoutInit as Partial<GroupLayout>),
    }), resolved === undefined ? [`layout.${field}`] : []);
  });

  return styleEdit({
    groupChanges,
    description: field === 'padding'
      ? 'Edit group padding'
      : field === 'renderMode'
        ? 'Edit group render mode'
        : 'Edit group label position',
  });
}

// Re-exported so a caller building the select's option list cannot drift from
// the table commitGroup resolves against.
export const RENDER_MODE_OPTIONS: Array<string> = RENDER_MODE_TABLE.map((entry) => entry.name);
export const LABEL_POSITION_OPTIONS: Array<string> = LABEL_POSITION_TABLE.map((entry) => entry.name);

export type { GroupRenderMode, GroupLabelPosition };
