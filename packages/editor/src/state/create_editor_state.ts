// SPDX-License-Identifier: AGPL-3.0-or-later

import { createSignal } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  Comment,
  CommentThreadSchema,
  StyleEdit,
  StyleEditSchema,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { applyStyleEditToStylesheet } from './apply_style_edit';
import { editableChanges } from './editable_changes';
import { EditorState } from './editor_state';
import { findPendingEdit, removePendingEdit } from './edits/pending';
import {
  captureSnapshot,
  pushUndoEntry,
  restoreFromSnapshot,
  UndoEntry,
} from './undo_log';

/** Undo-entry coalescing window in ms, passed to undo_log.ts's pushUndoEntry. See file doc. */
const COALESCE_WINDOW_MS: number = 500;

/** Construct the reactive state for one editor session. */
export function createEditorState(diagram: Diagram, stylesheet: Stylesheet): EditorState {
  const [getDiagram] = createSignal<Diagram>(diagram);
  const [getStylesheet, setStylesheet] = createSignal<Stylesheet>(stylesheet);
  const [getUndoLog, setUndoLog] = createSignal<UndoEntry[]>([]);
  const [getRedoLog, setRedoLog] = createSignal<UndoEntry[]>([]);
  const [getDirty, setDirty] = createSignal<boolean>(false);
  const [getVersion, setVersion] = createSignal<number>(0);

  const markChanged = (): void => {
    setDirty(true);
    setVersion(getVersion() + 1);
  };

  const applyStyleEdit = (incoming: StyleEdit, coalesceKey?: string): void => {
    const edit: StyleEdit = editableChanges(incoming, getDiagram());
    if (
      edit.nodeChanges.length === 0 && edit.groupChanges.length === 0 &&
      edit.edgeChanges.length === 0 && edit.annotationChanges.length === 0
    ) return;
    const current: Stylesheet = getStylesheet();
    const beforeSnapshot = captureSnapshot(current, edit);
    const updated: Stylesheet = applyStyleEditToStylesheet(current, edit);
    const nowMs: number = Date.now();
    const entry: UndoEntry = { beforeSnapshot, edit, tsMs: nowMs, coalesceKey };
    setStylesheet(updated);
    setUndoLog(pushUndoEntry(getUndoLog(), entry, nowMs, COALESCE_WINDOW_MS));
    setRedoLog([]);
    markChanged();
  };

  const undo = (): void => {
    const undoLog: UndoEntry[] = getUndoLog();
    if (undoLog.length === 0) return;
    const entry: UndoEntry = undoLog[undoLog.length - 1];
    setStylesheet(restoreFromSnapshot(getStylesheet(), entry.beforeSnapshot));
    setUndoLog(undoLog.slice(0, -1));
    setRedoLog(getRedoLog().concat([entry]));
    markChanged();
  };

  const redo = (): void => {
    const redoLog: UndoEntry[] = getRedoLog();
    if (redoLog.length === 0) return;
    const entry: UndoEntry = redoLog[redoLog.length - 1];
    const current: Stylesheet = getStylesheet();
    const beforeSnapshot = captureSnapshot(current, entry.edit);
    let updated: Stylesheet = applyStyleEditToStylesheet(current, entry.edit);
    if (entry.pendingEditsAfter !== undefined) {
      updated = create(StylesheetSchema, { ...updated, pendingEdits: entry.pendingEditsAfter });
    }
    const newEntry: UndoEntry = {
      beforeSnapshot,
      edit: entry.edit,
      tsMs: Date.now(),
      coalesceKey: entry.coalesceKey,
      pendingEditsAfter: entry.pendingEditsAfter,
    };
    setStylesheet(updated);
    setUndoLog(getUndoLog().concat([newEntry]));
    setRedoLog(redoLog.slice(0, -1));
    markChanged();
  };

  const appendPendingEdit = (edit: StyleEdit): void => {
    const current: Stylesheet = getStylesheet();
    setStylesheet(create(StylesheetSchema, { ...current, pendingEdits: [...current.pendingEdits, edit] }));
    setVersion(getVersion() + 1);
  };

  const adoptStylesheet = (next: Stylesheet): void => {
    setStylesheet(next);
    setVersion(getVersion() + 1);
  };

  const reviewWrite = (edit: StyleEdit, updated: Stylesheet): void => {
    const current: Stylesheet = getStylesheet();
    const beforeSnapshot = captureSnapshot(current, edit);
    const nowMs: number = Date.now();
    const entry: UndoEntry = { beforeSnapshot, edit, tsMs: nowMs, pendingEditsAfter: updated.pendingEdits };
    setStylesheet(updated);
    setUndoLog(pushUndoEntry(getUndoLog(), entry, nowMs, COALESCE_WINDOW_MS));
    setRedoLog([]);
    markChanged();
  };

  const emptyEdit = (): StyleEdit => create(StyleEditSchema, {
    nodeChanges: [], edgeChanges: [], groupChanges: [], annotationChanges: [],
  });

  const acceptPending = (editId: string): void => {
    const current: Stylesheet = getStylesheet();
    const pending: StyleEdit | undefined = findPendingEdit(current, editId);
    if (pending === undefined) return;
    const applied: Stylesheet = applyStyleEditToStylesheet(current, editableChanges(pending, getDiagram()));
    const updated: Stylesheet = create(StylesheetSchema, {
      ...applied,
      pendingEdits: current.pendingEdits.filter((edit: StyleEdit) => edit.id !== editId),
    });
    reviewWrite(pending, updated);
  };

  const rejectPending = (editId: string): void => {
    const current: Stylesheet = getStylesheet();
    if (findPendingEdit(current, editId) === undefined) return;
    reviewWrite(emptyEdit(), removePendingEdit(current, editId));
  };

  const addComment = (editRef: string, comment: Comment): void => {
    const current: Stylesheet = getStylesheet();
    const pending: StyleEdit | undefined = findPendingEdit(current, editRef);
    if (pending === undefined) return;
    const thread = pending.thread === undefined
      ? create(CommentThreadSchema, { comments: [comment] })
      : create(CommentThreadSchema, { ...pending.thread, comments: [...pending.thread.comments, comment] });
    const updatedEdit: StyleEdit = create(StyleEditSchema, { ...pending, thread });
    const updated: Stylesheet = create(StylesheetSchema, {
      ...current,
      pendingEdits: current.pendingEdits.map((edit: StyleEdit) => edit.id === editRef ? updatedEdit : edit),
    });
    reviewWrite(emptyEdit(), updated);
  };

  return {
    diagram: getDiagram,
    stylesheet: getStylesheet,
    canUndo: (): boolean => getUndoLog().length > 0,
    canRedo: (): boolean => getRedoLog().length > 0,
    applyStyleEdit, undo, redo, appendPendingEdit, adoptStylesheet,
    acceptPending, rejectPending, addComment,
    dirty: getDirty,
    version: getVersion,
  };
}
