// SPDX-License-Identifier: MPL-2.0

import { CommandId } from '../ui_state/keymap';

export interface MenuItem {
  id: CommandId;
  label: string;
  chord: string;
}
import { Command } from '../gestures/commands';
import { ElementRef } from '../ui_state/ui_state';
import { KeymapEntry } from '../ui_state/keymap';
import { formatChord } from './chord_label';

export function contextMenuItems(selection: ReadonlyArray<ElementRef>, commands: ReadonlyArray<Command>, keymap: ReadonlyArray<KeymapEntry>): Array<MenuItem> {
  const items: Array<MenuItem> = [];
  for (const command of commands) {
    const appliesTo = command.appliesTo;
    if (appliesTo === undefined) {
      continue;
    }

    const applies = appliesTo === 'global'
      || (selection.length > 0 && selection.some((ref) => appliesTo.includes(ref.kind)));
    if (!applies) {
      continue;
    }

    const binding = keymap.find((entry) => entry.command === command.id);
    items.push({
      id: command.id,
      label: command.label,
      chord: binding === undefined ? '' : formatChord(binding.chord),
    });
  }
  return items;
}
