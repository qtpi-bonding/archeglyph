// SPDX-License-Identifier: AGPL-3.0-or-later

import { Vec2 } from '@archeglyph/core/geometry/vec2';
import type { CommandId } from '../ui_state/keymap';
import { ContainerRect } from '../ui_state/viewport_math';
import { EditorState } from '../state/editor_state';
import { SceneGeometry } from '../scene/scene';
import { UiState, ElementRef } from '../ui_state/ui_state';
import { clearSelection } from '../ui_state/selection_ops';
import { nextInDocumentOrder, prevInDocumentOrder } from '../ui_state/navigation';
import { deleteAnnotationEdit } from '../state/edits/annotation';
import { ElementMove, moveElementsEdit } from '../state/edits/move';
import { setNodesHiddenEdit } from '../state/edits/visibility';

export interface Command {
  id: CommandId;
  label: string;
  run: (context: CommandContext) => void;
}

export interface CommandContext {
  state: EditorState;
  ui: UiState;
  geometry?: SceneGeometry;
  rect: ContainerRect;
  save: () => void;
}

function selectedElements(context: CommandContext): ElementRef[] {
  return context.ui.selection();
}

function runDelete(context: CommandContext): void {
  const selection = selectedElements(context);
  const nodeIds = selection.filter((ref) => ref.kind === 'node').map((ref) => ref.id);
  if (nodeIds.length > 0) {
    context.state.applyStyleEdit(setNodesHiddenEdit(context.state.stylesheet(), nodeIds, true));
  }
  for (const ref of selection) {
    if (ref.kind === 'annotation') {
      context.state.applyStyleEdit(deleteAnnotationEdit(context.state.stylesheet(), ref.id));
    }
  }
  context.ui.setSelection(clearSelection());
}

function runNudge(context: CommandContext, dx: number, dy: number): void {
  const moves: ElementMove[] = [];
  for (const ref of selectedElements(context)) {
    if (ref.kind === 'edge') {
      continue;
    }
    const stylesheet = context.state.stylesheet();
    const entry = ref.kind === 'node'
      ? stylesheet.nodes[ref.id]
      : ref.kind === 'group'
        ? stylesheet.groups[ref.id]
        : stylesheet.annotations[ref.id];
    if (entry?.position !== undefined) {
      const position: Vec2 = { x: entry.position.x + dx, y: entry.position.y + dy };
      moves.push({ kind: ref.kind, id: ref.id, position });
    }
  }
  if (moves.length > 0) {
    context.state.applyStyleEdit(moveElementsEdit(context.state.stylesheet(), moves), 'nudge');
  }
}

function runRing(context: CommandContext, direction: 'next' | 'prev'): void {
  if (context.geometry === undefined) {
    return;
  }
  const current = context.ui.selection()[0];
  const elements = context.geometry.index.map((entry) => ({
    ref: entry.ref,
    centre: {
      x: (entry.bounds.minX + entry.bounds.maxX) / 2,
      y: (entry.bounds.minY + entry.bounds.maxY) / 2,
    },
  }));
  const next = direction === 'next'
    ? nextInDocumentOrder(elements, current)
    : prevInDocumentOrder(elements, current);
  if (next !== undefined) {
    context.ui.setSelection([next]);
  }
}

export const COMMANDS: Array<Command> = [
  { id: 'undo', label: 'Undo', run: ({ state }: CommandContext): void => state.undo() },
  { id: 'redo', label: 'Redo', run: ({ state }: CommandContext): void => state.redo() },
  { id: 'delete', label: 'Delete', run: runDelete },
  { id: 'escape', label: 'Escape', run: (context: CommandContext): void => context.ui.setSelection(clearSelection()) },
  {
    id: 'select-all',
    label: 'Select all',
    run: (context: CommandContext): void => {
      context.ui.setSelection(context.geometry?.index.map((entry) => entry.ref) ?? []);
    },
  },
  { id: 'nudge-up', label: 'Nudge up', run: (context: CommandContext): void => runNudge(context, 0, -1) },
  { id: 'nudge-down', label: 'Nudge down', run: (context: CommandContext): void => runNudge(context, 0, 1) },
  { id: 'nudge-left', label: 'Nudge left', run: (context: CommandContext): void => runNudge(context, -1, 0) },
  { id: 'nudge-right', label: 'Nudge right', run: (context: CommandContext): void => runNudge(context, 1, 0) },
  { id: 'ring-next', label: 'Next element', run: (context: CommandContext): void => runRing(context, 'next') },
  { id: 'ring-prev', label: 'Previous element', run: (context: CommandContext): void => runRing(context, 'prev') },
  { id: 'save', label: 'Save', run: ({ save }: CommandContext): void => save() },
];

export function runCommand(id: CommandId, context: CommandContext): void {
  const command = COMMANDS.find((candidate) => candidate.id === id);
  command?.run(context);
}
