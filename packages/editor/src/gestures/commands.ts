import { create } from '@bufbuild/protobuf';
import { Vec2Schema } from '@archeglyph/proto/gen/style_pb';
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
import { elementKey } from '../scene/element_key';
import { ElementMove, moveElementsEdit } from '../state/edits/move';
import { setNodesHiddenEdit } from '../state/edits/visibility';
import { pinAllEdit, unpinAllEdit } from '../state/edits/layout_command';
import { clearNodeSizeEdit } from '../state/edits/resize';

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
  // Read positions from the SCENE, not from the stylesheet.
  //
  // A nudge is a move, and a move pins on touch (D1/D8) -- so an element that
  // ELK is still placing must be nudgeable, and nudging it is what writes its
  // first explicit position. Reading `stylesheet.nodes[id].layout.position`
  // would mean only already-pinned elements could be nudged at all, which is
  // exactly backwards: the unpinned ones are the common case.
  //
  // Scene bounds are canvas-absolute and style positions are parent-relative
  // (design.md §5.3), so the parent group's offset comes off before the delta
  // goes on -- the same conversion moveCommit does, for the same reason.
  const geometry = context.geometry;
  if (geometry === undefined) {
    return;
  }
  const moves: ElementMove[] = [];
  for (const ref of selectedElements(context)) {
    if (ref.kind === 'edge') {
      continue;
    }
    const entry = geometry.byKey[elementKey(ref)];
    if (entry === undefined) {
      continue;
    }
    const parent = entry.parentGroup === undefined
      ? undefined
      : geometry.byKey[elementKey({ kind: 'group', id: entry.parentGroup })];
    moves.push({
      kind: ref.kind,
      id: ref.id,
      position: create(Vec2Schema, {
        x: entry.bounds.minX + dx - (parent?.bounds.minX ?? 0),
        y: entry.bounds.minY + dy - (parent?.bounds.minY ?? 0),
      }),
    });
  }
  if (moves.length > 0) {
    // Coalesced under one key so holding an arrow key is one undo entry, not
    // one per repeat.
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

function runPinAll(context: CommandContext): void {
  const geometry = context.geometry;
  if (geometry === undefined) {
    return;
  }
  context.state.applyStyleEdit(pinAllEdit(context.state.stylesheet(), geometry.diagram));
}

function runUnpinAll(context: CommandContext): void {
  context.state.applyStyleEdit(unpinAllEdit(context.state.stylesheet()));
}

function runResetSize(context: CommandContext): void {
  for (const ref of selectedElements(context)) {
    if (ref.kind !== 'node') {
      continue;
    }
    // Coalesce the per-node edits so resetting a selection is one undoable
    // action, rather than one undo entry for each selected node.
    context.state.applyStyleEdit(
      clearNodeSizeEdit(context.state.stylesheet(), ref.id),
      'reset-size',
    );
  }
}

export const COMMANDS: Array<Command> = [
  { id: 'undo', label: 'Undo', run: ({ state }: CommandContext): void => state.undo() },
  { id: 'redo', label: 'Redo', run: ({ state }: CommandContext): void => state.redo() },
  { id: 'delete', label: 'Delete', run: runDelete },
  { id: 'escape', label: 'Escape', run: (context: CommandContext): void => { context.ui.setSelection(clearSelection()); } },
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
  { id: 'pin-all', label: 'Pin all', run: runPinAll },
  { id: 'unpin-all', label: 'Unpin all', run: runUnpinAll },
  { id: 'auto-layout', label: 'Auto layout', run: runUnpinAll },
  { id: 'reset-size', label: 'Reset size', run: runResetSize },
  { id: 'save', label: 'Save', run: ({ save }: CommandContext): void => save() },
];

export function runCommand(id: CommandId, context: CommandContext): void {
  const command = COMMANDS.find((candidate) => candidate.id === id);
  if (command === undefined) {
    return;
  }
  command.run(context);
}
