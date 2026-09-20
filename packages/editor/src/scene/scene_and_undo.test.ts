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
import { init } from '@archeglyph/proto/util/init';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function vec2(x: number, y: number) {
  return { x, y };
}

function node(id: string, position: Vec2, size: Vec2, parentGroup?: string): LaidOutNode {
  return init(new LaidOutNode(), {
    id,
    parentGroup,
    position,
    size,
  });
}

function group(id: string, position: Vec2, size: Vec2, parentGroup?: string): LaidOutGroup {
  return init(new LaidOutGroup(), {
    id,
    parentGroup,
    position,
    size,
    isSuperNode: false,
    hiddenDescendantCount: 0,
  });
}

function annotation(id: string, position: Vec2, size: Vec2): LaidOutAnnotation {
  return init(new LaidOutAnnotation(), {
    id,
    position,
    size,
  });
}

function edge(id: string, source: string, target: string, points: Vec2[]): LaidOutEdge {
  const sections: EdgeSection[] = [];
  if (points.length >= 2) {
    sections.push(
      init(new EdgeSection(), {
        startPoint: points[0],
        bendPoints: points.slice(1, -1),
        endPoint: points[points.length - 1],
      }),
    );
  }
  return init(new LaidOutEdge(), {
    id,
    source,
    target,
    sections,
  });
}

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

interface DiagramParts {
  nodes?: LaidOutNode[];
  edges?: LaidOutEdge[];
  groups?: LaidOutGroup[];
  annotations?: LaidOutAnnotation[];
}

function diagram(parts: DiagramParts): LaidOutDiagram {
  return init(new LaidOutDiagram(), {
    ...(parts.nodes === undefined ? {} : { nodes: byId(parts.nodes) }),
    ...(parts.edges === undefined ? {} : { edges: byId(parts.edges) }),
    ...(parts.groups === undefined ? {} : { groups: byId(parts.groups) }),
    ...(parts.annotations === undefined ? {} : { annotations: byId(parts.annotations) }),
  });
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

// ---------------------------------------------------------------------------
// preview.ts
// ---------------------------------------------------------------------------

describe('resizeBounds', () => {
  const base = { minX: 0, minY: 0, maxX: 100, maxY: 50 };

  test('se moves only the max corner (max only, per spec)', () => {
    expect(resizeBounds(base, 'se', vec2(10, 10))).toEqual({ minX: 0, minY: 0, maxX: 110, maxY: 60 });
  });

  test('nw moves only the min corner', () => {
    expect(resizeBounds(base, 'nw', vec2(10, 10))).toEqual({ minX: 10, minY: 10, maxX: 100, maxY: 50 });
  });

  test('ne moves maxX and minY, leaving minX and maxY put', () => {
    expect(resizeBounds(base, 'ne', vec2(10, -10))).toEqual({ minX: 0, minY: -10, maxX: 110, maxY: 50 });
  });

  test('sw moves minX and maxY, leaving minY and maxX put', () => {
    expect(resizeBounds(base, 'sw', vec2(-10, 10))).toEqual({ minX: -10, minY: 0, maxX: 100, maxY: 60 });
  });

  test('n moves min.y only (matches the spec\'s own example)', () => {
    expect(resizeBounds(base, 'n', vec2(999, 10))).toEqual({ minX: 0, minY: 10, maxX: 100, maxY: 50 });
  });

  test('s moves max.y only', () => {
    expect(resizeBounds(base, 's', vec2(999, 10))).toEqual({ minX: 0, minY: 0, maxX: 100, maxY: 60 });
  });

  test('e moves max.x only', () => {
    expect(resizeBounds(base, 'e', vec2(10, 999))).toEqual({ minX: 0, minY: 0, maxX: 110, maxY: 50 });
  });

  test('w moves min.x only', () => {
    expect(resizeBounds(base, 'w', vec2(-10, 999))).toEqual({ minX: -10, minY: 0, maxX: 100, maxY: 50 });
  });

  test('dragging a handle past its own opposite edge clamps to a small positive minimum rather than inverting', () => {
    // 'e' dragged far enough left to pass minX=0 entirely.
    const result = resizeBounds(base, 'e', vec2(-500, 0));
    expect(result.maxX).toBeGreaterThan(result.minX);
    expect(result.maxX - result.minX).toBeGreaterThan(0);
    // Spec: "Clamp to a small positive minimum in both axes" -- must not
    // go to zero or negative width.
    expect(result.maxX - result.minX).toBeCloseTo(1, 5);
  });

  test('dragging w past the opposite edge also clamps rather than inverting', () => {
    const result = resizeBounds(base, 'w', vec2(500, 0));
    expect(result.maxX - result.minX).toBeGreaterThan(0);
    expect(result.maxX - result.minX).toBeCloseTo(1, 5);
  });

  test('an extreme drag never produces a zero or negative size in either axis', () => {
    const result = resizeBounds(base, 'se', vec2(-100000, -100000));
    expect(result.maxX - result.minX).toBeGreaterThan(0);
    expect(result.maxY - result.minY).toBeGreaterThan(0);
  });

  test('does not mutate the input bounds object', () => {
    const input = { minX: 0, minY: 0, maxX: 100, maxY: 50 };
    const copy = { ...input };
    resizeBounds(input, 'se', vec2(5, 5));
    expect(input).toEqual(copy);
  });
});

describe('routeEdgeBetween', () => {
  function edgeWithLayout(routing?: EdgeRouting, waypoints: Vec2[] = []): LaidOutEdge {
    return init(new LaidOutEdge(), {
      id: 'e1',
      source: 's',
      target: 't',
      sections: [],
      layout: routing === undefined ? undefined : create(EdgeLayoutSchema, { routing, waypoints }),
    });
  }

  test('MANUAL routing returns the author-pinned waypoints unchanged, ignoring the current bounds', () => {
    const waypoints = [vec2(1, 1), vec2(2, 2), vec2(3, 3)];
    const e = edgeWithLayout(EdgeRouting.ROUTING_MANUAL, waypoints);
    const result = routeEdgeBetween(e, { minX: 0, minY: 0, maxX: 10, maxY: 10 }, { minX: 500, minY: 500, maxX: 510, maxY: 510 });
    // `create()` normalizes the input array into proto Vec2 messages, so
    // compare against the stored array (same reference, per "return them
    // unchanged" in the spec) rather than the raw literal passed in.
    expect(result).toBe(e.layout!.waypoints);
    expect(result.map((p) => ({ x: p.x, y: p.y }))).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }]);
  });

  test('ORTHOGONAL routing dispatches to routeOrthogonal (produces an axis-aligned bend for a diagonal pair)', () => {
    const e = edgeWithLayout(EdgeRouting.ROUTING_ORTHOGONAL);
    const source = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const target = { minX: 100, minY: 100, maxX: 110, maxY: 110 };
    const result = routeEdgeBetween(e, source, target);
    // A genuinely diagonal pair through routeOrthogonal bends: 3 points,
    // and the interior point shares an axis with each endpoint.
    expect(result).toHaveLength(3);
    const [start, bend, end] = result;
    expect(bend.x === start.x || bend.y === start.y).toBe(true);
    expect(bend.x === end.x || bend.y === end.y).toBe(true);
  });

  test('CURVED routing falls back to routeStraight (no curved router exists yet, per spec)', () => {
    const e = edgeWithLayout(EdgeRouting.ROUTING_CURVED);
    const source = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const target = { minX: 100, minY: 100, maxX: 110, maxY: 110 };
    const result = routeEdgeBetween(e, source, target);
    // routeStraight always returns exactly 2 points (no bend), unlike
    // routeOrthogonal's up-to-3 for a diagonal pair.
    expect(result).toHaveLength(2);
  });

  test('STRAIGHT routing and unset layout both use routeStraight', () => {
    const source = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const target = { minX: 100, minY: 0, maxX: 110, maxY: 10 };
    const withStraight = routeEdgeBetween(edgeWithLayout(EdgeRouting.ROUTING_STRAIGHT), source, target);
    const withNoLayout = routeEdgeBetween(edgeWithLayout(undefined), source, target);
    expect(withStraight).toEqual(withNoLayout);
    expect(withStraight).toHaveLength(2);
  });

  test('two boxes level with each other (shared y-centre): ORTHOGONAL needs no bend', () => {
    const e = edgeWithLayout(EdgeRouting.ROUTING_ORTHOGONAL);
    const source = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const target = { minX: 100, minY: 0, maxX: 110, maxY: 10 };
    const result = routeEdgeBetween(e, source, target);
    expect(result).toHaveLength(2);
    expect(result[0].y).toBeCloseTo(result[1].y, 5);
  });

  test('two diagonally offset boxes: STRAIGHT produces two distinct endpoints, not the same point twice', () => {
    const e = edgeWithLayout(EdgeRouting.ROUTING_STRAIGHT);
    const source = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const target = { minX: 100, minY: 100, maxX: 110, maxY: 110 };
    const [start, end] = routeEdgeBetween(e, source, target);
    expect(start).not.toEqual(end);
  });

  test('overlapping boxes: routing still returns finite, non-NaN points', () => {
    const e = edgeWithLayout(EdgeRouting.ROUTING_STRAIGHT);
    const source = { minX: 0, minY: 0, maxX: 50, maxY: 50 };
    const target = { minX: 10, minY: 10, maxX: 60, maxY: 60 };
    const [start, end] = routeEdgeBetween(e, source, target);
    for (const p of [start, end]) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  test('identical boxes (same bounds on both sides): degenerates to a single coincident point, not a crash or NaN', () => {
    const e = edgeWithLayout(EdgeRouting.ROUTING_STRAIGHT);
    const same = { minX: 0, minY: 0, maxX: 50, maxY: 50 };
    const [start, end] = routeEdgeBetween(e, same, same);
    expect(Number.isFinite(start.x)).toBe(true);
    expect(Number.isFinite(start.y)).toBe(true);
    expect(start).toEqual(end);
  });
});

describe('previewMove', () => {
  test('moves every element in a multi-element selection by the shared delta', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const n2 = node('n2', vec2(100, 100), vec2(10, 10));
    const n3 = node('n3', vec2(200, 200), vec2(10, 10)); // not selected
    const geometry = geometryFrom(diagram({ nodes: [n1, n2, n3] }));

    const intent: MoveIntent = {
      refs: [{ kind: 'node', id: 'n1' }, { kind: 'node', id: 'n2' }],
      delta: vec2(5, 5),
    };
    const preview = previewMove(geometry, intent);
    const byId = Object.fromEntries(preview.bounds.map((b) => [b.ref.id, b.bounds]));

    expect(preview.bounds).toHaveLength(2);
    expect(byId.n1).toEqual({ minX: 5, minY: 5, maxX: 15, maxY: 15 });
    expect(byId.n2).toEqual({ minX: 105, minY: 105, maxX: 115, maxY: 115 });
    expect(byId.n3).toBeUndefined();
  });

  test('an empty selection moves nothing and leaves the picture untouched (empty bounds/edges)', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const geometry = geometryFrom(diagram({ nodes: [n1] }));
    const intent: MoveIntent = { refs: [], delta: vec2(50, 50) };
    const preview = previewMove(geometry, intent);
    expect(preview.bounds).toEqual([]);
    expect(preview.edges).toEqual([]);
  });

  test('a ref naming an element absent from the geometry (stale selection) is tolerated, not thrown', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const geometry = geometryFrom(diagram({ nodes: [n1] }));
    const intent: MoveIntent = { refs: [{ kind: 'node', id: 'does-not-exist' }], delta: vec2(5, 5) };
    let preview: ReturnType<typeof previewMove> | undefined;
    expect(() => {
      preview = previewMove(geometry, intent);
    }).not.toThrow();
    expect(preview?.bounds).toEqual([]);
  });

  test('moving a group also moves its members (parentGroup chain), not just the group rect', () => {
    const g1 = group('g1', vec2(0, 0), vec2(100, 100));
    const n1 = node('n1', vec2(10, 10), vec2(20, 20), 'g1');
    const geometry = geometryFrom(diagram({ nodes: [n1], groups: [g1] }));

    const intent: MoveIntent = { refs: [{ kind: 'group', id: 'g1' }], delta: vec2(3, 4) };
    const preview = previewMove(geometry, intent);
    const byKey = Object.fromEntries(preview.bounds.map((b) => [elementKey(b.ref), b.bounds]));

    expect(byKey['group:g1']).toEqual({ minX: 3, minY: 4, maxX: 103, maxY: 104 });
    expect(byKey['node:n1']).toEqual({ minX: 13, minY: 14, maxX: 33, maxY: 34 });
  });

  test('re-routes only edges with a moved endpoint, leaving unrelated edges out of the preview entirely', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const n2 = node('n2', vec2(100, 0), vec2(10, 10));
    const n3 = node('n3', vec2(0, 100), vec2(10, 10));
    const n4 = node('n4', vec2(100, 100), vec2(10, 10));
    const moving = edge('e-moving', 'n1', 'n2', [vec2(10, 5), vec2(100, 5)]);
    const untouched = edge('e-static', 'n3', 'n4', [vec2(10, 105), vec2(100, 105)]);
    const geometry = geometryFrom(diagram({ nodes: [n1, n2, n3, n4], edges: [moving, untouched] }));

    const intent: MoveIntent = { refs: [{ kind: 'node', id: 'n1' }], delta: vec2(0, 50) };
    const preview = previewMove(geometry, intent);

    expect(preview.edges.map((e) => e.id)).toEqual(['e-moving']);
  });

  test('does not mutate the source geometry (the resting picture must stay the genuine renderer output)', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const geometry = geometryFrom(diagram({ nodes: [n1] }));
    const originalBounds = geometry.byKey['node:n1'].bounds;
    const snapshotBounds = { ...originalBounds };

    const preview = previewMove(geometry, { refs: [{ kind: 'node', id: 'n1' }], delta: vec2(999, 999) });

    expect(geometry.byKey['node:n1'].bounds).toEqual(snapshotBounds);
    // The preview's bounds entry must be an independently-allocated object,
    // not the same reference mutated in place.
    expect(preview.bounds[0].bounds).not.toBe(originalBounds);
  });
});

describe('previewResize', () => {
  test('resizes only the named element; a group resize does NOT move its members (container grows around them)', () => {
    const g1 = group('g1', vec2(0, 0), vec2(100, 100));
    const n1 = node('n1', vec2(10, 10), vec2(20, 20), 'g1');
    const geometry = geometryFrom(diagram({ nodes: [n1], groups: [g1] }));

    const intent: ResizeIntent = { ref: { kind: 'group', id: 'g1' }, handle: 'se', delta: vec2(50, 50) };
    const preview = previewResize(geometry, intent);

    expect(preview.bounds).toHaveLength(1);
    expect(preview.bounds[0].ref).toEqual({ kind: 'group', id: 'g1' });
    expect(preview.bounds[0].bounds).toEqual({ minX: 0, minY: 0, maxX: 150, maxY: 150 });
  });

  test('re-routes only edges attached to the resized element', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const n2 = node('n2', vec2(100, 0), vec2(10, 10));
    const n3 = node('n3', vec2(0, 100), vec2(10, 10));
    const n4 = node('n4', vec2(100, 100), vec2(10, 10));
    const attached = edge('e-attached', 'n1', 'n2', [vec2(10, 5), vec2(100, 5)]);
    const unrelated = edge('e-unrelated', 'n3', 'n4', [vec2(10, 105), vec2(100, 105)]);
    const geometry = geometryFrom(diagram({ nodes: [n1, n2, n3, n4], edges: [attached, unrelated] }));

    const intent: ResizeIntent = { ref: { kind: 'node', id: 'n1' }, handle: 'se', delta: vec2(5, 5) };
    const preview = previewResize(geometry, intent);

    expect(preview.edges.map((e) => e.id)).toEqual(['e-attached']);
  });

  test('a ref naming an element absent from the geometry yields an empty preview rather than throwing', () => {
    const geometry = geometryFrom(diagram({}));
    const intent: ResizeIntent = { ref: { kind: 'node', id: 'ghost' }, handle: 'se', delta: vec2(5, 5) };
    let preview: ReturnType<typeof previewResize> | undefined;
    expect(() => {
      preview = previewResize(geometry, intent);
    }).not.toThrow();
    expect(preview).toEqual({ bounds: [], edges: [] });
  });

  test('does not mutate the source geometry', () => {
    const n1 = node('n1', vec2(0, 0), vec2(10, 10));
    const geometry = geometryFrom(diagram({ nodes: [n1] }));
    const originalBounds = geometry.byKey['node:n1'].bounds;
    const snapshotBounds = { ...originalBounds };

    const preview = previewResize(geometry, { ref: { kind: 'node', id: 'n1' }, handle: 'se', delta: vec2(50, 50) });

    expect(geometry.byKey['node:n1'].bounds).toEqual(snapshotBounds);
    expect(preview.bounds[0].bounds).not.toBe(originalBounds);
  });
});
