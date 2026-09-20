// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import { COMMANDS } from '../gestures/commands';
import { Chord, CommandId, KEYMAP } from '../ui_state/keymap';

export class UndoIslandProps {
  canUndo!: boolean;
  canRedo!: boolean;
  onCommand!: (a0: CommandId) => void;
}

function commandLabel(commandId: CommandId): string {
  return COMMANDS.find((command): boolean => command.id === commandId)?.label ?? commandId;
}

function commandChord(commandId: CommandId): Chord | undefined {
  return KEYMAP.find((entry): boolean => entry.command === commandId)?.chord;
}

function commandTitle(commandId: CommandId): string {
  const label: string = commandLabel(commandId);
  const chord: Chord | undefined = commandChord(commandId);
  return chord === undefined ? label : `${label} (${chord.key})`;
}

function stopButtonFocus(event: MouseEvent): void {
  event.preventDefault();
}

export const UndoIsland: Component<UndoIslandProps> = (props: UndoIslandProps): JSX.Element => {
  const undoLabel: string = commandLabel('undo');
  const redoLabel: string = commandLabel('redo');
  const undoTitle: string = commandTitle('undo');
  const redoTitle: string = commandTitle('redo');

  return (
    <div class="ag-island" style={{ display: 'flex', gap: '4px' }}>
      <button
        type="button"
        disabled={!props.canUndo}
        aria-label={undoLabel}
        title={undoTitle}
        onMouseDown={stopButtonFocus}
        onClick={(): void => { props.onCommand('undo'); }}
      >
        <span aria-hidden="true">↶</span> {undoLabel}
      </button>
      <button
        type="button"
        disabled={!props.canRedo}
        aria-label={redoLabel}
        title={redoTitle}
        onMouseDown={stopButtonFocus}
        onClick={(): void => { props.onCommand('redo'); }}
      >
        <span aria-hidden="true">↷</span> {redoLabel}
      </button>
    </div>
  );
};
