// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntry,
  CanvasStyle,
  EdgeStyleEntry,
  ElementStyleEntry,
  StyleEdit,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { Option } from '@archeglyph/proto/util/result';

export function restoreFromSnapshot(current: Stylesheet, snapshot: BeforeSnapshot): Stylesheet {
  const restoredElements: { [key: string]: ElementStyleEntry } = {};
  for (const id of Object.keys(current.elements)) {
    if (snapshot.elements.has(id)) {
      const val: Option<ElementStyleEntry> = snapshot.elements.get(id) ?? null;
      if (val !== null) {
        restoredElements[id] = val;
      }
    } else {
      restoredElements[id] = current.elements[id];
    }
  }
  for (const id of snapshot.elements.keys()) {
    const val: Option<ElementStyleEntry> = snapshot.elements.get(id) ?? null;
    const inCurrent: boolean = Object.hasOwn(current.elements, id);
    if (val !== null && !inCurrent) {
      restoredElements[id] = val;
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
    const inCurrent: boolean = Object.hasOwn(current.edges, id);
    if (val !== null && !inCurrent) {
      restoredEdges[id] = val;
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
    const inCurrent: boolean = Object.hasOwn(current.annotations, id);
    if (val !== null && !inCurrent) {
      restoredAnnotations[id] = val;
    }
  }

  const restoredCanvas: CanvasStyle | undefined = snapshot.canvasTouched
    ? (snapshot.canvasBefore !== null ? snapshot.canvasBefore : undefined)
    : current.canvas;
  const restoredThemes: Record<string, string> = snapshot.themesTouched
    ? (snapshot.themesBefore !== null ? snapshot.themesBefore : {})
    : current.themes;

  return create(StylesheetSchema, {
    schemaVersion: current.schemaVersion,
    themes: restoredThemes,
    canvas: restoredCanvas,
    elements: restoredElements,
    edges: restoredEdges,
    annotations: restoredAnnotations,
    pendingEdits: snapshot.pendingEditsBefore,
    openDepth: current.openDepth,
    shownEdgeKinds: current.shownEdgeKinds,
  });
}
export interface UndoEntry {
  beforeSnapshot: BeforeSnapshot;
  edit: StyleEdit;
  tsMs: number;
  coalesceKey?: string;
  pendingEditsAfter?: StyleEdit[];
}
export function captureSnapshot(current: Stylesheet, edit: StyleEdit): BeforeSnapshot {
  const elements: Map<string, Option<ElementStyleEntry>> = new Map();
  for (const change of edit.elementChanges) {
    const value: ElementStyleEntry | undefined = Object.hasOwn(current.elements, change.elementId)
      ? current.elements[change.elementId]
      : undefined;
    elements.set(change.elementId, value !== undefined ? value : null);
  }

  const edges: Map<string, Option<EdgeStyleEntry>> = new Map();
  for (const change of edit.edgeChanges) {
    const value: EdgeStyleEntry | undefined = Object.hasOwn(current.edges, change.edgeId)
      ? current.edges[change.edgeId]
      : undefined;
    edges.set(change.edgeId, value !== undefined ? value : null);
  }

  const annotations: Map<string, Option<AnnotationEntry>> = new Map();
  for (const change of edit.annotationChanges) {
    const value: AnnotationEntry | undefined = Object.hasOwn(current.annotations, change.annotationId)
      ? current.annotations[change.annotationId]
      : undefined;
    annotations.set(change.annotationId, value !== undefined ? value : null);
  }

  const canvasTouched: boolean = edit.canvasAfter !== undefined;
  const canvasBefore: Option<CanvasStyle> = canvasTouched
    ? (current.canvas !== undefined ? current.canvas : null)
    : null;
  const themesTouched: boolean = Object.keys(edit.themesAfter ?? {}).length > 0;
  const themesBefore: Option<Record<string, string>> = themesTouched ? current.themes : null;

  return {
    elements,
    edges,
    annotations,
    canvasTouched,
    canvasBefore,
    themesTouched,
    themesBefore,
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
  elements: Map<string, Option<ElementStyleEntry>>;
  edges: Map<string, Option<EdgeStyleEntry>>;
  annotations: Map<string, Option<AnnotationEntry>>;
  canvasTouched: boolean;
  canvasBefore: Option<CanvasStyle>;
  themesTouched: boolean;
  themesBefore: Option<Record<string, string>>;
  pendingEditsBefore: StyleEdit[];
}
