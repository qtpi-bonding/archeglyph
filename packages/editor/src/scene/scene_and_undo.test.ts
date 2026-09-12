// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Behavioral test suite for the editor's derived-scene and undo layers,
// derived from:
//   1. .archegraph/specs/editor-scene/*.spec.textproto and
//      .archegraph/specs/editor-state/*.spec.textproto (the authority)
//   2. docs/editor-ui-review.md §10 (decisions D1-D13)
//   3. proto/style.proto field comments
//
// Expectations here come from the doc fields of the specs, NOT from reading
// the implementation bodies. Where the implementation appears to diverge,
// the test is left failing and reported rather than adjusted to match the
// code, and the implementation is never touched.

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  NodeStyleChangeSchema,
  NodeStyleEntry,
  NodeStyleEntrySchema,
  StyleChangeType,
  StyleEdit,
  StyleEditSchema,
  StyleEditState,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import {
  EdgeLayoutSchema,
  EdgeRouting,
} from '@archeglyph/proto/gen/style_pb';

import { elementKey, refsEqual } from './element_key';
import { handlePositions, hitTestHandle, hitTestPoint, type Handle } from './hit_test';
import { buildSceneGeometry, type SceneGeometry } from './scene';
import {
  previewMove,
  previewResize,
  resizeBounds,
  routeEdgeBetween,
  type MoveIntent,
  type ResizeIntent,
} from './preview';
import type { ElementRef } from '../ui_state/ui_state';

import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import { LaidOutGroup } from '@archeglyph/core/layout/laid_out_group';
import { LaidOutAnnotation } from '@archeglyph/core/layout/laid_out_annotation';
import { LaidOutEdge } from '@archeglyph/core/layout/laid_out_edge';
import { EdgeSection } from '@archeglyph/core/layout/edge_section';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';

import { captureSnapshot, pushUndoEntry, restoreFromSnapshot, type UndoEntry } from '../state/undo_log';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

function node(id: string, position: Vec2, size: Vec2, parentGroup?: string): LaidOutNode {
  return Object.assign(new LaidOutNode(), {
    id,
    parentGroup,
    position,
    size,
  });
}

function group(id: string, position: Vec2, size: Vec2, parentGroup?: string): LaidOutGroup {
  return Object.assign(new LaidOutGroup(), {
    id,
    parentGroup,
    position,
    size,
    isSuperNode: false,
    hiddenDescendantCount: 0,
  });
}

function annotation(id: string, position: Vec2, size: Vec2): LaidOutAnnotation {
  return Object.assign(new LaidOutAnnotation(), {
    id,
    position,
    size,
  });
}

function edge(id: string, source: string, target: string, points: Vec2[]): LaidOutEdge {
  const sections: EdgeSection[] = [];
  if (points.length >= 2) {
    sections.push(
      Object.assign(new EdgeSection(), {
        startPoint: points[0],
        bendPoints: points.slice(1, -1),
        endPoint: points[points.length - 1],
      }),
    );
  }
  return Object.assign(new LaidOutEdge(), {
    id,
    source,
    target,
    sections,
  });
}

function diagram(partial: Partial<LaidOutDiagram>): LaidOutDiagram {
  return Object.assign(new LaidOutDiagram(), partial);
}

// ---------------------------------------------------------------------------
// element_key.ts
// ---------------------------------------------------------------------------

describe('elementKey', () => {
  test('is unique across kinds sharing the same id', () => {
    const node1: ElementRef = { kind: 'node', id: 'x' };
    const edge1: ElementRef = { kind: 'edge', id: 'x' };
    const group1: ElementRef = { kind: 'group', id: 'x' };
    const annotation1: ElementRef = { kind: 'annotation', id: 'x' };

    const keys = [node1, edge1, group1, annotation1].map(elementKey);
    expect(new Set(keys).size).toBe(4);
  });

  test('is stable for the same ref', () => {
    const ref: ElementRef = { kind: 'node', id: 'n1' };
    expect(elementKey(ref)).toBe(elementKey({ kind: 'node', id: 'n1' }));
  });

  test('puts kind first so a colon in the id cannot collide across kinds', () => {
    // node "a:node" (kind=node, id="a:node") should not collide with the
    // node "a" split differently -- kind-first prefixing is what the spec
    // doc claims guarantees this.
    const a: ElementRef = { kind: 'node', id: 'a:node' };
    const b: ElementRef = { kind: 'node', id: 'a' };
    expect(elementKey(a)).not.toBe(elementKey(b));
  });
});

describe('refsEqual', () => {
  test('true for same id and kind, even distinct object identities', () => {
    expect(refsEqual({ kind: 'node', id: 'n1' }, { kind: 'node', id: 'n1' })).toBe(true);
  });

  test('false when kind differs but id matches', () => {
    expect(refsEqual({ kind: 'node', id: 'n1' }, { kind: 'group', id: 'n1' })).toBe(false);
  });

  test('false when id differs but kind matches', () => {
    expect(refsEqual({ kind: 'node', id: 'n1' }, { kind: 'node', id: 'n2' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// scene.ts -- buildSceneGeometry (pure export only)
// ---------------------------------------------------------------------------

describe('buildSceneGeometry', () => {
  test('empty diagram yields zero-size bounds at the origin', () => {
    const geometry = buildSceneGeometry(diagram({}), '<svg/>');
    expect(geometry.index).toEqual([]);
    expect(geometry.contentBounds).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    expect(geometry.svg).toBe('<svg/>');
  });

  test('single element: contentBounds equals its own bounds', () => {
    const n1 = node('n1', vec2(10, 20), vec2(100, 50));
    const geometry = buildSceneGeometry(diagram({ nodes: [n1] }), '<svg/>');
    expect(geometry.contentBounds).toEqual({ minX: 10, minY: 20, maxX: 110, maxY: 70 });
    expect(geometry.index).toHaveLength(1);
    expect(geometry.byKey[elementKey({ kind: 'node', id: 'n1' })]).toBeDefined();
  });

  test('negative-coordinate elements are indexed and bounded correctly', () => {
    const n1 = node('n1', vec2(-50, -30), vec2(20, 10));
    const geometry = buildSceneGeometry(diagram({ nodes: [n1] }), '<svg/>');
    expect(geometry.byKey['node:n1'].bounds).toEqual({ minX: -50, minY: -30, maxX: -30, maxY: -20 });
    expect(geometry.contentBounds).toEqual({ minX: -50, minY: -30, maxX: -30, maxY: -20 });
  });

  test('contentBounds encloses every indexed element (nodes, groups, annotations)', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const g1 = group('g1', vec2(100, 100), vec2(10, 10));
    const a1 = annotation('a1', vec2(-20, 200), vec2(5, 5));
    const geometry = buildSceneGeometry(diagram({ nodes: [n1], groups: [g1], annotations: [a1] }), '<svg/>');
    // Union must reach every element's extremes.
    expect(geometry.contentBounds.minX).toBeLessThanOrEqual(-20);
    expect(geometry.contentBounds.minY).toBeLessThanOrEqual(0);
    expect(geometry.contentBounds.maxX).toBeGreaterThanOrEqual(110);
    expect(geometry.contentBounds.maxY).toBeGreaterThanOrEqual(205);
  });

  test('edges are flattened into edgePolylines, not the index', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const n2 = node('n2', vec2(100, 0), vec2(10, 10));
    const e1 = edge('e1', 'n1', 'n2', [vec2(10, 5), vec2(50, 5), vec2(100, 5)]);
    const geometry = buildSceneGeometry(diagram({ nodes: [n1, n2], edges: [e1] }), '<svg/>');
    expect(geometry.edgePolylines['e1']).toEqual([vec2(10, 5), vec2(50, 5), vec2(100, 5)]);
    // Edges have no rect -- per hit_test.ts's own spec doc, they carry no
    // bounding box for hit-testing, so they must not appear in `index`.
    expect(geometry.index.find((entry) => entry.ref.kind === ('edge' as never))).toBeUndefined();
  });

  test('parentGroup is carried for nodes/groups but never set for annotations', () => {
    const g1 = group('g1', vec2(0, 0), vec2(200, 200));
    const n1 = node('n1', vec2(10, 10), vec2(20, 20), 'g1');
    const a1 = annotation('a1', vec2(5, 5), vec2(5, 5));
    const geometry = buildSceneGeometry(diagram({ nodes: [n1], groups: [g1], annotations: [a1] }), '<svg/>');
    expect(geometry.byKey['node:n1'].parentGroup).toBe('g1');
    expect(geometry.byKey['annotation:a1'].parentGroup).toBeUndefined();
    expect(geometry.byKey['group:g1'].parentGroup).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// hit_test.ts
// ---------------------------------------------------------------------------

function geometryFrom(d: LaidOutDiagram): SceneGeometry {
  return buildSceneGeometry(d, '<svg/>');
}

describe('hitTestPoint -- priority order', () => {
  test('a node inside a group: clicking the node hits the node, not the group', () => {
    const g1 = group('g1', vec2(0, 0), vec2(200, 200));
    const n1 = node('n1', vec2(20, 20), vec2(40, 40), 'g1');
    const geometry = geometryFrom(diagram({ nodes: [n1], groups: [g1] }));

    const hit = hitTestPoint(geometry, vec2(30, 30), 5);
    expect(hit).toEqual({ kind: 'node', id: 'n1' });
  });

  test("clicking the group's empty interior (outside the node) hits the group", () => {
    const g1 = group('g1', vec2(0, 0), vec2(200, 200));
    const n1 = node('n1', vec2(20, 20), vec2(40, 40), 'g1');
    const geometry = geometryFrom(diagram({ nodes: [n1], groups: [g1] }));

    const hit = hitTestPoint(geometry, vec2(150, 150), 5);
    expect(hit).toEqual({ kind: 'group', id: 'g1' });
  });

  test('an annotation over a node wins: annotations are tested before nodes', () => {
    const n1 = node('n1', vec2(0, 0), vec2(50, 50));
    const a1 = annotation('a1', vec2(10, 10), vec2(20, 20));
    const geometry = geometryFrom(diagram({ nodes: [n1], annotations: [a1] }));

    // Point (20,20) is inside both n1 [0,50]x[0,50] and a1 [10,30]x[10,30].
    const hit = hitTestPoint(geometry, vec2(20, 20), 5);
    expect(hit).toEqual({ kind: 'annotation', id: 'a1' });
  });

  test('nodes win over edges even when the edge is painted on top', () => {
    const n1 = node('n1', vec2(0, 0), vec2(50, 50));
    const n2 = node('n2', vec2(200, 0), vec2(50, 50));
    // Route the edge straight through the middle of n1's rect.
    const e1 = edge('e1', 'n1', 'n2', [vec2(0, 25), vec2(250, 25)]);
    const geometry = geometryFrom(diagram({ nodes: [n1, n2], edges: [e1] }));

    const hit = hitTestPoint(geometry, vec2(25, 25), 5);
    expect(hit).toEqual({ kind: 'node', id: 'n1' });
  });

  test('an edge is hit within tolerance when no rect covers the point', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const n2 = node('n2', vec2(200, 0), vec2(10, 10));
    const e1 = edge('e1', 'n1', 'n2', [vec2(10, 5), vec2(200, 5)]);
    const geometry = geometryFrom(diagram({ nodes: [n1, n2], edges: [e1] }));

    // (100, 8) is 3 units from the polyline y=5, well clear of both node rects.
    const hit = hitTestPoint(geometry, vec2(100, 8), 5);
    expect(hit).toEqual({ kind: 'edge', id: 'e1' });
  });

  test('full order: annotation > node > edge > group, all overlapping the same point', () => {
    const g1 = group('g1', vec2(0, 0), vec2(200, 200));
    const n1 = node('n1', vec2(20, 20), vec2(100, 100), 'g1');
    const a1 = annotation('a1', vec2(20, 20), vec2(100, 100));
    const e1 = edge('e1', 'other-a', 'other-b', [vec2(0, 50), vec2(200, 50)]);
    const geometry = geometryFrom(diagram({ nodes: [n1], groups: [g1], annotations: [a1], edges: [e1] }));

    // Point (50, 50) is inside g1, n1, a1, and within tolerance of e1's line.
    expect(hitTestPoint(geometry, vec2(50, 50), 5)).toEqual({ kind: 'annotation', id: 'a1' });
  });

  test('within a kind, the later-indexed element wins (matches paint order)', () => {
    // Two overlapping nodes; n2 is later in the array.
    const n1 = node('n1', vec2(0, 0), vec2(50, 50));
    const n2 = node('n2', vec2(0, 0), vec2(50, 50));
    const geometry = geometryFrom(diagram({ nodes: [n1, n2] }));
    expect(hitTestPoint(geometry, vec2(25, 25), 5)).toEqual({ kind: 'node', id: 'n2' });
  });

  test('a click in empty space hits nothing', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const geometry = geometryFrom(diagram({ nodes: [n1] }));
    expect(hitTestPoint(geometry, vec2(1000, 1000), 5)).toBeUndefined();
  });

  test('a click exactly on a rect boundary counts as a hit (boundsContains is inclusive)', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const geometry = geometryFrom(diagram({ nodes: [n1] }));
    // (10, 5) sits exactly on the right edge of the rect [0,10]x[0,10].
    expect(hitTestPoint(geometry, vec2(10, 5), 0)).toEqual({ kind: 'node', id: 'n1' });
  });
});

describe('handlePositions / hitTestHandle', () => {
  const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 50 };

  test('emits all eight handles, clockwise from nw, matching the Handle union order', () => {
    const points = handlePositions(bounds);
    const order: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    expect(points.map((p) => p.handle)).toEqual(order);
  });

  test('handle points sit exactly on the corners and edge midpoints', () => {
    const points = handlePositions(bounds);
    const byHandle = Object.fromEntries(points.map((p) => [p.handle, p.point]));
    expect(byHandle.nw).toEqual({ x: 0, y: 0 });
    expect(byHandle.ne).toEqual({ x: 100, y: 0 });
    expect(byHandle.se).toEqual({ x: 100, y: 50 });
    expect(byHandle.sw).toEqual({ x: 0, y: 50 });
    expect(byHandle.n).toEqual({ x: 50, y: 0 });
    expect(byHandle.s).toEqual({ x: 50, y: 50 });
    expect(byHandle.e).toEqual({ x: 100, y: 25 });
    expect(byHandle.w).toEqual({ x: 0, y: 25 });
  });

  test('hitTestHandle finds the handle nearest the point, agreeing with handlePositions (same source)', () => {
    // The spec requires the drawn handle (handlePositions) and the hit
    // target (hitTestHandle) to come from the same source -- verify by
    // hitting near every point handlePositions produced.
    for (const { handle, point } of handlePositions(bounds)) {
      expect(hitTestHandle(bounds, point, 1)).toBe(handle);
    }
  });

  test('hitTestHandle returns undefined outside the radius', () => {
    expect(hitTestHandle(bounds, { x: 50, y: 25 }, 1)).toBeUndefined();
  });

  test('hitTestHandle picks the nearest handle when two are in range', () => {
    // (48, 0) is 2 from 'n' (50,0) and far from 'nw' (0,0); make radius big
    // enough to catch both 'nw' and 'n' via a point between them, favouring
    // whichever is nearer.
    const point = { x: 20, y: 0 }; // 20 from nw(0,0), 30 from n(50,0)
    expect(hitTestHandle(bounds, point, 60)).toBe('nw');
  });
});

// ---------------------------------------------------------------------------
// undo_log.ts
// ---------------------------------------------------------------------------

function stylesheet(nodes: { [id: string]: NodeStyleEntry }, pendingEdits: StyleEdit[] = []): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes,
    pendingEdits,
  });
}

function nodeEntry(x: number, y: number): NodeStyleEntry {
  return create(NodeStyleEntrySchema, { component: `pos-${x},${y}` });
}

function moveEdit(id: string, nodeId: string, x: number, y: number): StyleEdit {
  return create(StyleEditSchema, {
    schemaVersion: 1,
    id,
    timestampMs: 0n,
    state: StyleEditState.APPLIED,
    nodeChanges: [
      create(NodeStyleChangeSchema, {
        nodeId,
        changeType: StyleChangeType.MODIFIED,
        after: nodeEntry(x, y),
      }),
    ],
  });
}

// Minimal harness replicating createEditorState's applyStyleEdit/undo/redo
// composition purely from the exported primitives in undo_log.ts and
// apply_style_edit.ts (create_editor_state.ts itself is Solid-reactive and
// out of scope; this only exercises the pure functions it composes).
function makeHarness(initial: Stylesheet) {
  let current = initial;
  let undoLog: UndoEntry[] = [];
  let redoLog: UndoEntry[] = [];
  let dirty = false;
  const coalesceWindowMs = 500;

  return {
    current: () => current,
    dirty: () => dirty,
    undoLog: () => undoLog,
    redoLog: () => redoLog,
    apply(edit: StyleEdit, nowMs: number, coalesceKey?: string) {
      const beforeSnapshot = captureSnapshot(current, edit);
      current = applyStyleEditToStylesheet(current, edit);
      const entry: UndoEntry = { beforeSnapshot, edit, tsMs: nowMs, coalesceKey };
      undoLog = pushUndoEntry(undoLog, entry, nowMs, coalesceWindowMs);
      redoLog = [];
      dirty = true;
    },
    undo() {
      if (undoLog.length === 0) return;
      const entry = undoLog[undoLog.length - 1];
      current = restoreFromSnapshot(current, entry.beforeSnapshot);
      undoLog = undoLog.slice(0, -1);
      redoLog = [...redoLog, entry];
      dirty = true;
    },
  };
}

describe('undo_log: captureSnapshot / restoreFromSnapshot round trip', () => {
  test('undo then redo (re-apply) returns to the original state', () => {
    const original = stylesheet({ n1: nodeEntry(1, 2) });
    const edit = moveEdit('e1', 'n1', 5, 6);

    const before = captureSnapshot(original, edit);
    const applied = applyStyleEditToStylesheet(original, edit);
    expect(applied.nodes.n1.component).toBe('pos-5,6');

    const undone = restoreFromSnapshot(applied, before);
    expect(undone.nodes.n1.component).toBe('pos-1,2');

    // "redo" = re-apply the same edit.
    const redone = applyStyleEditToStylesheet(undone, edit);
    expect(redone.nodes.n1.component).toBe(applied.nodes.n1.component);
  });

  test('undo of an ADDED entry removes it entirely (no id left over)', () => {
    const original = stylesheet({});
    const edit = moveEdit('e1', 'new-node', 1, 1);
    // changeType is MODIFIED in moveEdit helper; use ADDED explicitly here.
    const addEdit = create(StyleEditSchema, {
      schemaVersion: 1,
      id: 'e2',
      timestampMs: 0n,
      state: StyleEditState.APPLIED,
      nodeChanges: [
        create(NodeStyleChangeSchema, {
          nodeId: 'new-node',
          changeType: StyleChangeType.ADDED,
          after: nodeEntry(9, 9),
        }),
      ],
    });
    const before = captureSnapshot(original, addEdit);
    const applied = applyStyleEditToStylesheet(original, addEdit);
    expect(applied.nodes['new-node']).toBeDefined();

    const undone = restoreFromSnapshot(applied, before);
    expect(undone.nodes['new-node']).toBeUndefined();
  });
});

describe('undo_log: pushUndoEntry coalescing', () => {
  test('consecutive edits with the SAME coalesceKey, within the window, merge into one entry', () => {
    const log: UndoEntry[] = [];
    const editA = moveEdit('a', 'n1', 1, 1);
    const editB = moveEdit('b', 'n1', 2, 2);
    const snapA = { nodes: new Map(), edges: new Map(), groups: new Map(), annotations: new Map(), canvasTouched: false, canvasBefore: null, themeRefTouched: false, themeRefBefore: null, pendingEditsBefore: [] };
    const snapB = { ...snapA };

    const entryA: UndoEntry = { beforeSnapshot: snapA, edit: editA, tsMs: 1000, coalesceKey: 'inspector:n1:x' };
    const entryB: UndoEntry = { beforeSnapshot: snapB, edit: editB, tsMs: 1200, coalesceKey: 'inspector:n1:x' };

    const afterA = pushUndoEntry(log, entryA, 1000, 500);
    expect(afterA).toHaveLength(1);

    const afterB = pushUndoEntry(afterA, entryB, 1200, 500);
    expect(afterB).toHaveLength(1);
    // Merged entry keeps the ORIGINAL beforeSnapshot (the true pre-gesture
    // state) but the latest edit.
    expect(afterB[0].beforeSnapshot).toBe(snapA);
    expect(afterB[0].edit).toBe(editB);
  });

  test('edits with DIFFERENT coalesceKeys do NOT merge', () => {
    const log: UndoEntry[] = [];
    const editA = moveEdit('a', 'n1', 1, 1);
    const editB = moveEdit('b', 'n2', 2, 2);
    const snap = { nodes: new Map(), edges: new Map(), groups: new Map(), annotations: new Map(), canvasTouched: false, canvasBefore: null, themeRefTouched: false, themeRefBefore: null, pendingEditsBefore: [] };

    const entryA: UndoEntry = { beforeSnapshot: snap, edit: editA, tsMs: 1000, coalesceKey: 'inspector:n1:x' };
    const entryB: UndoEntry = { beforeSnapshot: snap, edit: editB, tsMs: 1200, coalesceKey: 'inspector:n2:y' };

    const afterA = pushUndoEntry(log, entryA, 1000, 500);
    const afterB = pushUndoEntry(afterA, entryB, 1200, 500);
    expect(afterB).toHaveLength(2);
  });

  test('edits with no coalesceKey never merge, even back-to-back', () => {
    const log: UndoEntry[] = [];
    const editA = moveEdit('a', 'n1', 1, 1);
    const editB = moveEdit('b', 'n1', 2, 2);
    const snap = { nodes: new Map(), edges: new Map(), groups: new Map(), annotations: new Map(), canvasTouched: false, canvasBefore: null, themeRefTouched: false, themeRefBefore: null, pendingEditsBefore: [] };

    const entryA: UndoEntry = { beforeSnapshot: snap, edit: editA, tsMs: 1000 };
    const entryB: UndoEntry = { beforeSnapshot: snap, edit: editB, tsMs: 1010 };

    const afterA = pushUndoEntry(log, entryA, 1000, 500);
    const afterB = pushUndoEntry(afterA, entryB, 1010, 500);
    expect(afterB).toHaveLength(2);
  });

  test('same coalesceKey but OUTSIDE the window does not merge', () => {
    const log: UndoEntry[] = [];
    const editA = moveEdit('a', 'n1', 1, 1);
    const editB = moveEdit('b', 'n1', 2, 2);
    const snap = { nodes: new Map(), edges: new Map(), groups: new Map(), annotations: new Map(), canvasTouched: false, canvasBefore: null, themeRefTouched: false, themeRefBefore: null, pendingEditsBefore: [] };

    const entryA: UndoEntry = { beforeSnapshot: snap, edit: editA, tsMs: 1000, coalesceKey: 'k' };
    const entryB: UndoEntry = { beforeSnapshot: snap, edit: editB, tsMs: 1600, coalesceKey: 'k' };

    const afterA = pushUndoEntry(log, entryA, 1000, 500);
    const afterB = pushUndoEntry(afterA, entryB, 1600, 500);
    expect(afterB).toHaveLength(2);
  });
});

describe('undo/redo harness composed from undo_log.ts + apply_style_edit.ts primitives', () => {
  test('undo then redo (re-apply of the popped entry) returns the stylesheet to its post-edit state', () => {
    const h = makeHarness(stylesheet({ n1: nodeEntry(0, 0) }));
    h.apply(moveEdit('e1', 'n1', 1, 1), 1000);
    expect(h.current().nodes.n1.component).toBe('pos-1,1');

    h.undo();
    expect(h.current().nodes.n1.component).toBe('pos-0,0'); // back to pre-edit value

    // redo = re-apply the entry popped onto the redo stack
    const redoEntry = h.redoLog()[h.redoLog().length - 1];
    const redone = applyStyleEditToStylesheet(h.current(), redoEntry.edit);
    expect(redone.nodes.n1.component).toBe('pos-1,1');
  });

  test('a new edit after an undo discards the redo stack', () => {
    const h = makeHarness(stylesheet({ n1: nodeEntry(0, 0) }));
    h.apply(moveEdit('e1', 'n1', 1, 1), 1000);
    h.undo();
    expect(h.redoLog()).toHaveLength(1);

    h.apply(moveEdit('e2', 'n1', 2, 2), 2000);
    expect(h.redoLog()).toHaveLength(0);
  });

  test('undo with an empty log is a no-op', () => {
    const h = makeHarness(stylesheet({ n1: nodeEntry(0, 0) }));
    expect(h.undoLog()).toHaveLength(0);
    h.undo();
    expect(h.undoLog()).toHaveLength(0);
    expect(h.current().nodes.n1.component).toBe('pos-0,0');
  });

  test('the dirty flag is set on apply, and per the spec (create_editor_state.ts doc: '
    + 'undo/redo "each call setVersion(v => v + 1) and setDirty(true)") stays true even '
    + 'after an undo returns the document to its saved state -- it is never reset to '
    + 'false by undo itself', () => {
    const h = makeHarness(stylesheet({ n1: nodeEntry(0, 0) }));
    expect(h.dirty()).toBe(false);
    h.apply(moveEdit('e1', 'n1', 1, 1), 1000);
    expect(h.dirty()).toBe(true);
    h.undo();
    // Content is back to the original, but dirty is still true: nothing in
    // the spec's undo path clears it. (This harness mirrors
    // create_editor_state.ts's markChanged() call in `undo`, which is
    // unconditional.)
    expect(h.current().nodes.n1.component).toBe(nodeEntry(0, 0).component);
    expect(h.dirty()).toBe(true);
  });
});

describe('undo_log: pendingEditsBefore (the §5.9 fix)', () => {
  test('restoreFromSnapshot restores pendingEdits from the snapshot, not from the current stylesheet', () => {
    const pendingBefore = [moveEdit('pending-1', 'n1', 0, 0)];
    const original = stylesheet({ n1: nodeEntry(0, 0) }, pendingBefore);
    const edit = moveEdit('e1', 'n1', 1, 1);

    const before = captureSnapshot(original, edit);
    expect(before.pendingEditsBefore).toBe(original.pendingEdits);

    // Simulate pendingEdits having changed by the time of undo (e.g. a
    // pending edit was accepted/rejected in between).
    let applied = applyStyleEditToStylesheet(original, edit);
    applied = create(StylesheetSchema, { ...applied, pendingEdits: [] });

    const restored = restoreFromSnapshot(applied, before);
    // Must come back from the snapshot (pendingBefore), NOT from applied's
    // (now-empty) current.pendingEdits.
    expect(restored.pendingEdits).toEqual(pendingBefore);
  });
});
