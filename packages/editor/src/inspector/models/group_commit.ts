// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import {
  BoxLayout,
  BoxLayoutSchema,
  ElementStyleEntrySchema,
  GroupLabelPosition,
  GroupRenderMode,
  StyleEdit,
  Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import type { InspectorModel } from '../model';
import { elementChange, styleEdit } from '../../state/edits/edit_builder';
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
  // A known entity cannot be dissolved. The select does not offer it, and a
  // caller that bypasses the select is refused the same way.
  if (field === 'renderMode' && resolved === GroupRenderMode.DISSOLVED && model.groupingsOnly === false) {
    return undefined;
  }

  const current = (id: string): number | undefined => {
    const existing = stylesheet.elements[id];
    if (field === 'renderMode') return existing?.renderMode;
    if (field === 'padding') return existing?.boxLayout?.padding;
    return existing?.boxLayout?.labelPosition;
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

  // The render mode is a field of the entry; padding and label position live
  // in its box layout.
  const fieldPath = field === 'renderMode' ? field : `boxLayout.${field}`;

  const elementChanges = model.ids.map((id) => {
    const existing = stylesheet.elements[id];
    const entryInit = initOf(existing);
    if (field === 'renderMode') {
      if (resolved === undefined) {
        delete entryInit[field];
      } else {
        entryInit[field] = resolved;
      }
      return elementChange(
        id,
        create(ElementStyleEntrySchema, entryInit),
        resolved === undefined ? [fieldPath] : [],
      );
    }

    const layoutInit = initOf(existing?.boxLayout);
    if (resolved === undefined) {
      delete layoutInit[field];
    } else {
      layoutInit[field] = resolved;
    }
    return elementChange(id, create(ElementStyleEntrySchema, {
      ...entryInit,
      boxLayout: create(BoxLayoutSchema, layoutInit as Partial<BoxLayout>),
    }), resolved === undefined ? [fieldPath] : []);
  });

  return styleEdit({
    elementChanges,
    description: field === 'padding'
      ? 'Edit group padding'
      : field === 'renderMode'
        ? 'Edit group render mode'
        : 'Edit group label position',
  });
}

// Built from the table commitGroup resolves against, so the select's option
// list cannot drift from it. DISSOLVED is for groupings only (an entity is
// open or closed), so it is withheld from a selection known to hold an entity.
export function renderModeOptions(model: InspectorModel): Array<string> {
  return RENDER_MODE_TABLE
    .filter((entry) => entry.value !== GroupRenderMode.DISSOLVED || model.groupingsOnly !== false)
    .map((entry) => entry.name);
}
export const LABEL_POSITION_OPTIONS: Array<string> = LABEL_POSITION_TABLE.map((entry) => entry.name);

export type { GroupRenderMode, GroupLabelPosition };
