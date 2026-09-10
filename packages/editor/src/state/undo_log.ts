// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntry,
  CanvasStyle,
  EdgeStyleEntry,
  GroupStyleEntry,
  NodeStyleEntry,
  StyleEdit,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { Option } from '@archeglyph/proto/util/result';

export function restoreFromSnapshot(current: Stylesheet, snapshot: BeforeSnapshot): Stylesheet {
  const restoredNodes: { [key: string]: NodeStyleEntry } = {};
  for (const id of Object.keys(current.nodes)) {
    if (snapshot.nodes.has(id)) {
      const val: Option<NodeStyleEntry> = snapshot.nodes.get(id) ?? null;
      if (val !== null) {
        restoredNodes[id] = val;
      }
    } else {
      restoredNodes[id] = current.nodes[id];
    }
  }
  for (const id of snapshot.nodes.keys()) {
    const val: Option<NodeStyleEntry> = snapshot.nodes.get(id) ?? null;
    const inCurrent: boolean = current.nodes[id] !== undefined;
    if (val !== null && !inCurrent) {
      restoredNodes[id] = val;
    }
  }

  const restoredEdges: { [key: string]: EdgeStyleEntry } = {};
  for (const id of Object.keys(current.edges)) {
    if (snapshot.edges.has(id)) {
      const val: Option<EdgeStyleEntry> = snapshot.edges.get(id) ?? null;
      if (val !== null) {
        restoredEdges[id] = val;
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
    }
  }

  const restoredGroups: { [key: string]: GroupStyleEntry } = {};
  for (const id of Object.keys(current.groups)) {
    if (snapshot.groups.has(id)) {
      const val: Option<GroupStyleEntry> = snapshot.groups.get(id) ?? null;
      if (val !== null) {
        restoredGroups[id] = val;
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
    }
  }

  const restoredAnnotations: { [key: string]: AnnotationEntry } = {};
  for (const id of Object.keys(current.annotations)) {
    if (snapshot.annotations.has(id)) {
      const val: Option<AnnotationEntry> = snapshot.annotations.get(id) ?? null;
      if (val !== null) {
        restoredAnnotations[id] = val;
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
    pendingEdits: snapshot.pendingEditsBefore,
  });
}
export interface UndoEntry {
  beforeSnapshot: BeforeSnapshot;
  edit: StyleEdit;
  tsMs: number;
  coalesceKey?: string;
}
export function captureSnapshot(current: Stylesheet, edit: StyleEdit): BeforeSnapshot {
  const nodes: Map<string, Option<NodeStyleEntry>> = new Map();
  for (const change of edit.nodeChanges) {
    const value: NodeStyleEntry | undefined = current.nodes[change.nodeId];
    nodes.set(change.nodeId, value !== undefined ? value : null);
  }

  const edges: Map<string, Option<EdgeStyleEntry>> = new Map();
  for (const change of edit.edgeChanges) {
    const value: EdgeStyleEntry | undefined = current.edges[change.edgeId];
    edges.set(change.edgeId, value !== undefined ? value : null);
  }

  const groups: Map<string, Option<GroupStyleEntry>> = new Map();
  for (const change of edit.groupChanges) {
    const value: GroupStyleEntry | undefined = current.groups[change.groupId];
    groups.set(change.groupId, value !== undefined ? value : null);
  }

  const annotations: Map<string, Option<AnnotationEntry>> = new Map();
  for (const change of edit.annotationChanges) {
    const value: AnnotationEntry | undefined = current.annotations[change.annotationId];
    annotations.set(change.annotationId, value !== undefined ? value : null);
  }

  const canvasTouched: boolean = edit.canvasAfter !== undefined;
  const canvasBefore: Option<CanvasStyle> = canvasTouched
    ? (current.canvas !== undefined ? current.canvas : null)
    : null;
  const themeRefTouched: boolean = edit.themeRefAfter !== undefined;
  const themeRefBefore: Option<string> = themeRefTouched
    ? (current.themeRef !== undefined ? current.themeRef : null)
    : null;

  return {
    nodes,
    edges,
    groups,
    annotations,
    canvasTouched,
    canvasBefore,
    themeRefTouched,
    themeRefBefore,
    pendingEditsBefore: current.pendingEdits,
  };
}
export function pushUndoEntry(
  log: UndoEntry[],
  entry: UndoEntry,
  nowMs: number,
  coalesceWindowMs: number,
): UndoEntry[] {
  const last = log.length > 0 ? log[log.length - 1] : undefined;
  if (
    last !== undefined &&
    entry.coalesceKey !== undefined &&
    last.coalesceKey === entry.coalesceKey &&
    nowMs - last.tsMs <= coalesceWindowMs
  ) {
    const merged: UndoEntry = { ...entry, beforeSnapshot: last.beforeSnapshot };
    return [...log.slice(0, -1), merged];
  }
  return [...log, entry];
}
export interface BeforeSnapshot {
  nodes: Map<string, Option<NodeStyleEntry>>;
  edges: Map<string, Option<EdgeStyleEntry>>;
  groups: Map<string, Option<GroupStyleEntry>>;
  annotations: Map<string, Option<AnnotationEntry>>;
  canvasTouched: boolean;
  canvasBefore: Option<CanvasStyle>;
  themeRefTouched: boolean;
  themeRefBefore: Option<string>;
  pendingEditsBefore: StyleEdit[];
}
