// SPDX-License-Identifier: AGPL-3.0-or-later

import { createSignal } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { StyleEdit, Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { applyStyleEditToStylesheet } from './apply_style_edit';
import { EditorState } from './editor_state';
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

  const applyStyleEdit = (edit: StyleEdit, coalesceKey?: string): void => {
    if (
      edit.nodeChanges.length === 0 &&
      edit.groupChanges.length === 0 &&
      edit.edgeChanges.length === 0 &&
      edit.annotationChanges.length === 0
    ) {
      return;
    }

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
    if (undoLog.length === 0) {
      return;
    }

    const entry: UndoEntry = undoLog[undoLog.length - 1];
    const restored: Stylesheet = restoreFromSnapshot(getStylesheet(), entry.beforeSnapshot);
    setStylesheet(restored);
    setUndoLog(undoLog.slice(0, -1));
    setRedoLog(getRedoLog().concat([entry]));
    markChanged();
  };

  const redo = (): void => {
    const redoLog: UndoEntry[] = getRedoLog();
    if (redoLog.length === 0) {
      return;
    }

    const entry: UndoEntry = redoLog[redoLog.length - 1];
    const current: Stylesheet = getStylesheet();
    const beforeSnapshot = captureSnapshot(current, entry.edit);
    const updated: Stylesheet = applyStyleEditToStylesheet(current, entry.edit);
    const newEntry: UndoEntry = {
      beforeSnapshot,
      edit: entry.edit,
      tsMs: Date.now(),
      coalesceKey: entry.coalesceKey,
    };
    setStylesheet(updated);
    setUndoLog(getUndoLog().concat([newEntry]));
    setRedoLog(redoLog.slice(0, -1));
    markChanged();
  };

  const appendPendingEdit = (edit: StyleEdit): void => {
    const current: Stylesheet = getStylesheet();
    setStylesheet(create(StylesheetSchema, {
      ...current,
      pendingEdits: [...current.pendingEdits, edit],
    }));
    setVersion(getVersion() + 1);
  };

  const adoptStylesheet = (next: Stylesheet): void => {
    setStylesheet(next);
    setVersion(getVersion() + 1);
  };

  return {
    diagram: getDiagram,
    stylesheet: getStylesheet,
    canUndo: (): boolean => getUndoLog().length > 0,
    canRedo: (): boolean => getRedoLog().length > 0,
    applyStyleEdit,
    undo,
    redo,
    appendPendingEdit,
    adoptStylesheet,
    dirty: getDirty,
    version: getVersion,
  };
}
