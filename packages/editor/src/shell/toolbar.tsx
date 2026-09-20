// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import { COMMANDS, Command } from '../gestures/commands';
import { CommandId, KEYMAP } from '../ui_state/keymap';
import { Tool } from '../ui_state/ui_state';

type MaybeCommand = Command | undefined;
type MaybeKey = string | undefined;

export interface ToolbarProps {
  tool: Tool;
  onCommand: (command: CommandId) => void;
}

const toolCommands: Array<{ id: CommandId; tool: Tool }> = [
  { id: 'tool-select', tool: 'select' },
  { id: 'tool-hand', tool: 'hand' },
  { id: 'tool-annotation', tool: 'annotation' },
];

const layoutCommands: CommandId[] = ['auto-layout', 'pin-all', 'unpin-all'];

function commandFor(id: CommandId): MaybeCommand {
  return COMMANDS.find((command: Command): boolean => command.id === id);
}

function commandLabel(id: CommandId): string {
  return commandFor(id)?.label ?? '';
}

function commandKey(id: CommandId): MaybeKey {
  return KEYMAP.find((entry): boolean => entry.command === id)?.chord.key;
}

function commandText(id: CommandId): string {
  const label: string = commandLabel(id);
  const key: MaybeKey = commandKey(id);
  return key === undefined ? label : `${label} (${key})`;
}

function commandButton(
  id: CommandId,
  onCommand: (command: CommandId) => void,
  active: boolean,
): JSX.Element {
  const text: string = commandText(id);
  return (
    <button
      type="button"
      title={text}
      aria-pressed={active}
      onClick={(): void => { onCommand(id); }}
      style={active ? {
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
  <div
    class="ag-island"
    style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}
  >
    <div style={{ display: 'flex', gap: '4px' }}>
      {toolCommands.map((entry): JSX.Element => commandButton(
        entry.id,
        props.onCommand,
        props.tool === entry.tool,
      ))}
    </div>
    <div
      role="separator"
      aria-orientation="vertical"
      style={{ height: '20px', width: '1px', background: 'var(--ag-edge)', margin: '0 4px' }}
    />
    <div style={{ display: 'flex', gap: '4px' }}>
      {layoutCommands.map((id): JSX.Element => commandButton(id, props.onCommand, false))}
    </div>
  </div>
);
