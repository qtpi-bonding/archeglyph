// SPDX-License-Identifier: AGPL-3.0-or-later

import { createSignal } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationEntry,
  CanvasStyle,
  EdgeStyleEntry,
  GroupStyleEntry,
  NodeStyleEntry,
  StyleChangeType,
  StyleEdit,
  StyleEditState,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { Option } from '@archeglyph/proto/util/result';
import { EditorState } from './editor_state';

type BeforeSnapshot = {
  nodes: Map<string, Option<NodeStyleEntry>>;
  edges: Map<string, Option<EdgeStyleEntry>>;
  groups: Map<string, Option<GroupStyleEntry>>;
  annotations: Map<string, Option<AnnotationEntry>>;
  canvasTouched: boolean;
  canvasBefore: Option<CanvasStyle>;
  themeRefTouched: boolean;
  themeRefBefore: Option<string>;
};

type UndoEntry = {
  beforeSnapshot: BeforeSnapshot;
  edit: StyleEdit;
  tsMs: number;
  coalesceKey?: string;
};

function captureSnapshot(current: Stylesheet, edit: StyleEdit): BeforeSnapshot {
  const nodes: Map<string, Option<NodeStyleEntry>> = new Map();
  for (const change of edit.nodeChanges) {
    const val: NodeStyleEntry | undefined = current.nodes[change.nodeId];
    if (val !== undefined) {
      nodes.set(change.nodeId, val);
    } else {
      nodes.set(change.nodeId, null);
    }
  }

  const edges: Map<string, Option<EdgeStyleEntry>> = new Map();
  for (const change of edit.edgeChanges) {
    const val: EdgeStyleEntry | undefined = current.edges[change.edgeId];
    if (val !== undefined) {
      edges.set(change.edgeId, val);
    } else {
      edges.set(change.edgeId, null);
    }
  }

  const groups: Map<string, Option<GroupStyleEntry>> = new Map();
  for (const change of edit.groupChanges) {
    const val: GroupStyleEntry | undefined = current.groups[change.groupId];
    if (val !== undefined) {
      groups.set(change.groupId, val);
    } else {
      groups.set(change.groupId, null);
    }
  }

  const annotations: Map<string, Option<AnnotationEntry>> = new Map();
  for (const change of edit.annotationChanges) {
    const val: AnnotationEntry | undefined = current.annotations[change.annotationId];
    if (val !== undefined) {
      annotations.set(change.annotationId, val);
    } else {
      annotations.set(change.annotationId, null);
    }
  }

  const canvasTouched: boolean = edit.canvasAfter !== undefined;
  const canvasBefore: Option<CanvasStyle> = canvasTouched
    ? (current.canvas !== undefined ? current.canvas : null)
    : null;

  const themeRefTouched: boolean = edit.themeRefAfter !== undefined;
  const themeRefBefore: Option<string> = themeRefTouched
    ? (current.themeRef !== undefined ? current.themeRef : null)
    : null;

  return { nodes, edges, groups, annotations, canvasTouched, canvasBefore, themeRefTouched, themeRefBefore };
}

function applyStyleEditToStylesheet(current: Stylesheet, edit: StyleEdit): Stylesheet {
  const nodeDeleteIds: Set<string> = new Set();
  for (const change of edit.nodeChanges) {
    if (change.changeType === StyleChangeType.DELETED) {
      nodeDeleteIds.add(change.nodeId);
    } else {
      // no-op
    }
  }
  const newNodes: { [key: string]: NodeStyleEntry } = {};
  for (const id of Object.keys(current.nodes)) {
    if (nodeDeleteIds.has(id)) {
      // skip deleted entry
    } else {
      newNodes[id] = current.nodes[id];
    }
  }
  for (const change of edit.nodeChanges) {
    if (change.changeType !== StyleChangeType.DELETED) {
      if (change.after !== undefined) {
        newNodes[change.nodeId] = change.after;
      } else {
        // no-op
      }
    } else {
      // no-op
    }
  }

  const edgeDeleteIds: Set<string> = new Set();
  for (const change of edit.edgeChanges) {
    if (change.changeType === StyleChangeType.DELETED) {
      edgeDeleteIds.add(change.edgeId);
    } else {
      // no-op
    }
  }
  const newEdges: { [key: string]: EdgeStyleEntry } = {};
  for (const id of Object.keys(current.edges)) {
    if (edgeDeleteIds.has(id)) {
      // skip
    } else {
      newEdges[id] = current.edges[id];
    }
  }
  for (const change of edit.edgeChanges) {
    if (change.changeType !== StyleChangeType.DELETED) {
      if (change.after !== undefined) {
        newEdges[change.edgeId] = change.after;
      } else {
        // no-op
      }
    } else {
      // no-op
    }
  }

  const groupDeleteIds: Set<string> = new Set();
  for (const change of edit.groupChanges) {
    if (change.changeType === StyleChangeType.DELETED) {
      groupDeleteIds.add(change.groupId);
    } else {
      // no-op
    }
  }
  const newGroups: { [key: string]: GroupStyleEntry } = {};
  for (const id of Object.keys(current.groups)) {
    if (groupDeleteIds.has(id)) {
      // skip
    } else {
      newGroups[id] = current.groups[id];
    }
  }
  for (const change of edit.groupChanges) {
    if (change.changeType !== StyleChangeType.DELETED) {
      if (change.after !== undefined) {
        newGroups[change.groupId] = change.after;
      } else {
        // no-op
      }
    } else {
      // no-op
    }
  }

  const annotationDeleteIds: Set<string> = new Set();
  for (const change of edit.annotationChanges) {
    if (change.changeType === StyleChangeType.DELETED) {
      annotationDeleteIds.add(change.annotationId);
    } else {
      // no-op
    }
  }
  const newAnnotations: { [key: string]: AnnotationEntry } = {};
  for (const id of Object.keys(current.annotations)) {
    if (annotationDeleteIds.has(id)) {
      // skip
    } else {
      newAnnotations[id] = current.annotations[id];
    }
  }
  for (const change of edit.annotationChanges) {
    if (change.changeType !== StyleChangeType.DELETED) {
      if (change.after !== undefined) {
        newAnnotations[change.annotationId] = change.after;
      } else {
        // no-op
      }
    } else {
      // no-op
    }
  }

  const newCanvas: CanvasStyle | undefined = edit.canvasAfter !== undefined ? edit.canvasAfter : current.canvas;
  const newThemeRef: string | undefined = edit.themeRefAfter !== undefined ? edit.themeRefAfter : current.themeRef;

  return create(StylesheetSchema, {
    schemaVersion: current.schemaVersion,
    themeRef: newThemeRef,
    canvas: newCanvas,
    nodes: newNodes,
    edges: newEdges,
    groups: newGroups,
    annotations: newAnnotations,
    pendingEdits: current.pendingEdits,
  });
}

function restoreFromSnapshot(current: Stylesheet, snapshot: BeforeSnapshot): Stylesheet {
  const restoredNodes: { [key: string]: NodeStyleEntry } = {};
  for (const id of Object.keys(current.nodes)) {
    if (snapshot.nodes.has(id)) {
      const val: Option<NodeStyleEntry> = snapshot.nodes.get(id) ?? null;
      if (val !== null) {
        restoredNodes[id] = val;
      } else {
        // entry was absent before this edit (was ADDED) — skip to remove it
      }
    } else {
      restoredNodes[id] = current.nodes[id];
    }
  }
  for (const id of snapshot.nodes.keys()) {
    const val: Option<NodeStyleEntry> = snapshot.nodes.get(id) ?? null;
    const inCurrent: boolean = current.nodes[id] !== undefined;
    if (val !== null && !inCurrent) {
      restoredNodes[id] = val; // entry was DELETED by the edit — restore it
    } else {
      // no-op
    }
  }

  const restoredEdges: { [key: string]: EdgeStyleEntry } = {};
  for (const id of Object.keys(current.edges)) {
    if (snapshot.edges.has(id)) {
      const val: Option<EdgeStyleEntry> = snapshot.edges.get(id) ?? null;
      if (val !== null) {
        restoredEdges[id] = val;
      } else {
        // was absent before — skip
      }
    } else {
      restoredEdges[id] = current.edges[id];
    }
  }
  for (const id of snapshot.edges.keys()) {
    const val: Option<EdgeStyleEntry> = snapshot.edges.get(id) ?? null;
    const inCurrent: boolean = current.edges[id] !== undefined;
    if (val !== null && !inCurrent) {
      restoredEdges[id] = val;
    } else {
      // no-op
    }
  }

  const restoredGroups: { [key: string]: GroupStyleEntry } = {};
  for (const id of Object.keys(current.groups)) {
    if (snapshot.groups.has(id)) {
      const val: Option<GroupStyleEntry> = snapshot.groups.get(id) ?? null;
      if (val !== null) {
        restoredGroups[id] = val;
      } else {
        // was absent before — skip
      }
    } else {
      restoredGroups[id] = current.groups[id];
    }
  }
  for (const id of snapshot.groups.keys()) {
    const val: Option<GroupStyleEntry> = snapshot.groups.get(id) ?? null;
    const inCurrent: boolean = current.groups[id] !== undefined;
    if (val !== null && !inCurrent) {
      restoredGroups[id] = val;
    } else {
      // no-op
    }
  }

  const restoredAnnotations: { [key: string]: AnnotationEntry } = {};
  for (const id of Object.keys(current.annotations)) {
    if (snapshot.annotations.has(id)) {
      const val: Option<AnnotationEntry> = snapshot.annotations.get(id) ?? null;
      if (val !== null) {
        restoredAnnotations[id] = val;
      } else {
        // was absent before — skip
      }
    } else {
      restoredAnnotations[id] = current.annotations[id];
    }
  }
  for (const id of snapshot.annotations.keys()) {
    const val: Option<AnnotationEntry> = snapshot.annotations.get(id) ?? null;
    const inCurrent: boolean = current.annotations[id] !== undefined;
    if (val !== null && !inCurrent) {
      restoredAnnotations[id] = val;
    } else {
      // no-op
    }
  }

  const restoredCanvas: CanvasStyle | undefined = snapshot.canvasTouched
    ? (snapshot.canvasBefore !== null ? snapshot.canvasBefore : undefined)
    : current.canvas;
  const restoredThemeRef: string | undefined = snapshot.themeRefTouched
    ? (snapshot.themeRefBefore !== null ? snapshot.themeRefBefore : undefined)
    : current.themeRef;

  return create(StylesheetSchema, {
    schemaVersion: current.schemaVersion,
    themeRef: restoredThemeRef,
    canvas: restoredCanvas,
    nodes: restoredNodes,
    edges: restoredEdges,
    groups: restoredGroups,
    annotations: restoredAnnotations,
    pendingEdits: current.pendingEdits,
  });
}

export function createEditorState(diagram: Diagram, stylesheet: Stylesheet): EditorState {
  const [getDiagram] = createSignal<Diagram>(diagram);
  const [getStylesheet, setStylesheet] = createSignal<Stylesheet>(stylesheet);
  const [getUndoLog, setUndoLog] = createSignal<UndoEntry[]>([]);
  const [getRedoLog, setRedoLog] = createSignal<UndoEntry[]>([]);
  const [getDirty, setDirty] = createSignal<boolean>(false);
  const [getVersion, setVersion] = createSignal<number>(0);
  const coalesceWindowMs: number = 500;

  const applyStyleEdit = (edit: StyleEdit, coalesceKey?: string): void => {
    if (edit.state !== StyleEditState.APPLIED) {
      return;
    }
    const current: Stylesheet = getStylesheet();
    const beforeSnapshot: BeforeSnapshot = captureSnapshot(current, edit);
    const updated: Stylesheet = applyStyleEditToStylesheet(current, edit);
    setStylesheet(updated);
    const nowMs: number = Date.now();
    const entry: UndoEntry = { beforeSnapshot, edit, tsMs: nowMs, coalesceKey };
    const log: UndoEntry[] = getUndoLog();
    const previous: UndoEntry | undefined = log[log.length - 1];
    if (coalesceKey !== undefined && previous !== undefined &&
        previous.coalesceKey === coalesceKey && nowMs - previous.tsMs <= coalesceWindowMs) {
      const merged: UndoEntry = { beforeSnapshot: previous.beforeSnapshot, edit, tsMs: nowMs, coalesceKey };
      setUndoLog(log.slice(0, -1).concat([merged]));
    } else {
      setUndoLog(log.concat([entry]));
    }
    setRedoLog([]);
    setDirty(true);
    setVersion(getVersion() + 1);
  };

  const undo = (): void => {
    setDirty(true);
    setVersion(getVersion() + 1);
    const undoLog: UndoEntry[] = getUndoLog();
    if (undoLog.length === 0) {
      // no-op — canUndo is false
    } else {
      const entry: UndoEntry = undoLog[undoLog.length - 1];
      const current: Stylesheet = getStylesheet();
      const restored: Stylesheet = restoreFromSnapshot(current, entry.beforeSnapshot);
      setStylesheet(restored);
      const lastIdx: number = undoLog.length - 1;
      setUndoLog(undoLog.filter((e: UndoEntry, i: number): boolean => i < lastIdx));
      setRedoLog(getRedoLog().concat([entry]));
    }
  };

  const redo = (): void => {
    setDirty(true);
    setVersion(getVersion() + 1);
    const redoLog: UndoEntry[] = getRedoLog();
    if (redoLog.length === 0) {
      // no-op — canRedo is false
    } else {
      const entry: UndoEntry = redoLog[redoLog.length - 1];
      const current: Stylesheet = getStylesheet();
      const beforeSnapshot: BeforeSnapshot = captureSnapshot(current, entry.edit);
      const updated: Stylesheet = applyStyleEditToStylesheet(current, entry.edit);
      setStylesheet(updated);
      const newUndoEntry: UndoEntry = { beforeSnapshot, edit: entry.edit, tsMs: Date.now(), coalesceKey: entry.coalesceKey };
      setUndoLog(getUndoLog().concat([newUndoEntry]));
      const lastIdx: number = redoLog.length - 1;
      setRedoLog(redoLog.filter((e: UndoEntry, i: number): boolean => i < lastIdx));
    }
  };

  return {
    diagram: getDiagram,
    stylesheet: getStylesheet,
    canUndo: (): boolean => getUndoLog().length > 0,
    canRedo: (): boolean => getRedoLog().length > 0,
    applyStyleEdit,
    undo,
    redo,
    dirty: getDirty,
    version: getVersion,
  };
}
