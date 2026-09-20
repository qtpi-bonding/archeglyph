// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import { COMMANDS, Command } from '../gestures/commands';
import { Chord, CommandId, KEYMAP } from '../ui_state/keymap';
import { Tool } from '../ui_state/ui_state';

export class ToolbarProps {
  tool!: Tool;
  onCommand!: (command: CommandId) => void;
}

interface ToolCommand {
  tool: Tool;
  command: CommandId;
}

interface ToolbarButtonProps {
  command: CommandId;
  active?: boolean;
  onCommand: (command: CommandId) => void;
}

const TOOL_COMMANDS: Array<ToolCommand> = [
  { tool: 'select', command: 'tool-select' },
  { tool: 'hand', command: 'tool-hand' },
  { tool: 'annotation', command: 'tool-annotation' },
];

const LAYOUT_COMMANDS: Array<CommandId> = ['auto-layout', 'pin-all', 'unpin-all'];

function commandFor(id: CommandId): Command {
  const command: Command | undefined = COMMANDS.find((entry: Command): boolean => entry.id === id);
  if (command === undefined) {
    throw new Error(`Toolbar command is not registered: ${id}`);
  }
  return command;
}

function commandChord(id: CommandId): Chord | undefined {
  return KEYMAP.find((entry): boolean => entry.command === id)?.chord;
}

function commandText(id: CommandId): string {
  const command: Command = commandFor(id);
  const chord: Chord | undefined = commandChord(id);
  return chord === undefined ? command.label : `${command.label} (${chord.key})`;
}

function ToolbarButton(props: ToolbarButtonProps): JSX.Element {
  const text: string = commandText(props.command);
  return (
    <button
      type="button"
      aria-pressed={props.active === true}
      title={text}
      onClick={(): void => { props.onCommand(props.command); }}
      style={props.active === true ? {
        color: 'var(--ag-blue)',
        background: 'var(--ag-blue-soft)',
        'border-color': 'var(--ag-blue)',
      } : undefined}
    >
      {text}
    </button>
  );
}

export const Toolbar: Component<ToolbarProps> = (props: ToolbarProps): JSX.Element => (
  <div class="ag-island" style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
    <div style={{ display: 'flex', gap: '4px' }}>
      {TOOL_COMMANDS.map((entry: ToolCommand): JSX.Element => (
        <ToolbarButton
          command={entry.command}
          active={props.tool === entry.tool}
          onCommand={props.onCommand}
        />
      ))}
    </div>
    <div
      role="separator"
      aria-orientation="vertical"
      style={{ width: '1px', height: '20px', background: 'var(--ag-edge)', margin: '0 4px' }}
    />
    <div style={{ display: 'flex', gap: '4px' }}>
      {LAYOUT_COMMANDS.map((command: CommandId): JSX.Element => (
        <ToolbarButton command={command} onCommand={props.onCommand} />
      ))}
    </div>
  </div>
);
