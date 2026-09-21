// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import { COMMANDS, Command } from '../gestures/commands';
import { CommandId, KEYMAP } from '../ui_state/keymap';
import { formatChord } from './chord_label';

export class UndoIslandProps {
  canUndo!: boolean;
  canRedo!: boolean;
  onCommand!: (a0: CommandId) => void;
}

function commandLabel(commandId: CommandId): string {
  const command: Command | undefined = COMMANDS.find((entry: Command): boolean => entry.id === commandId);
  return command?.label ?? commandId;
}

function commandTooltip(commandId: CommandId): string {
  const label: string = commandLabel(commandId);
  const keymapEntry = KEYMAP.find((entry): boolean => entry.command === commandId);
  return keymapEntry === undefined ? label : `${label} (${formatChord(keymapEntry.chord)})`;
}

export const UndoIsland: Component<UndoIslandProps> = (props: UndoIslandProps): JSX.Element => {
  function preventButtonFocus(event: MouseEvent): void {
    event.preventDefault();
  }

  return (
    <div class="ag-island" style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
      <button
        type="button"
        disabled={!props.canUndo}
        title={commandTooltip('undo')}
        aria-label={commandLabel('undo')}
        onMouseDown={preventButtonFocus}
        onClick={(): void => { props.onCommand('undo'); }}
      >
        {commandLabel('undo')}
      </button>
      <button
        type="button"
        disabled={!props.canRedo}
        title={commandTooltip('redo')}
        aria-label={commandLabel('redo')}
        onMouseDown={preventButtonFocus}
        onClick={(): void => { props.onCommand('redo'); }}
      >
        {commandLabel('redo')}
      </button>
    </div>
  );
};
