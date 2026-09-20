// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Component, JSX } from 'solid-js';
import { COMMANDS } from '../gestures/commands';
import type { Command } from '../gestures/commands';
import { KEYMAP } from '../ui_state/keymap';
import type { CommandId } from '../ui_state/keymap';
import type { Tool } from '../ui_state/ui_state';

export interface ToolbarProps {
  tool: Tool;
  onCommand: (command: CommandId) => void;
}

const toolCommands: CommandId[] = ['tool-select', 'tool-hand', 'tool-annotation'];
const layoutCommands: CommandId[] = ['auto-layout', 'pin-all', 'unpin-all'];

function findCommand(commandId: CommandId): Command | undefined {
  return COMMANDS.find((command: Command): boolean => command.id === commandId);
}

function commandText(command: Command): string {
  const entry = KEYMAP.find((candidate): boolean => candidate.command === command.id);
  return entry === undefined ? command.label : `${command.label} (${entry.chord.key})`;
}

function toolFor(commandId: CommandId): Tool | undefined {
  if (commandId === 'tool-select') return 'select';
  if (commandId === 'tool-hand') return 'hand';
  if (commandId === 'tool-annotation') return 'annotation';
  return undefined;
}

function renderCommand(commandId: CommandId, tool: Tool, onCommand: (command: CommandId) => void): JSX.Element {
  const command: Command | undefined = findCommand(commandId);
  if (command === undefined) return <></>;

  const commandTool: Tool | undefined = toolFor(commandId);
  const active: boolean = commandTool !== undefined && commandTool === tool;
  const tooltip: string = commandText(command);

  return (
    <button
      type="button"
      aria-label={tooltip}
      title={tooltip}
      aria-pressed={active}
      style={active ? { color: 'var(--ag-blue)', 'background-color': 'var(--ag-blue-soft)' } : undefined}
      onClick={(): void => onCommand(command.id)}
    >
      {command.label}
    </button>
  );
}

export const Toolbar: Component<ToolbarProps> = (props: ToolbarProps): JSX.Element => (
  <div class="ag-island">
    <div>{toolCommands.map((commandId: CommandId): JSX.Element => renderCommand(commandId, props.tool, props.onCommand))}</div>
    <div role="separator" />
    <div>{layoutCommands.map((commandId: CommandId): JSX.Element => renderCommand(commandId, props.tool, props.onCommand))}</div>
  </div>
);
