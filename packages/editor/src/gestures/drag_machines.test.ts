// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The gesture machines, exercised as the canvas drives them: a press is routed
// to a decision, the decision opens a session, the session previews, and the
// session commits one StyleEdit.
//
// These tests deliberately run the WHOLE chain rather than each machine alone.
// Every resize primitive in this package already existed and passed its own
// unit tests while the feature did nothing, because no caller joined them up
// (docs/editor-ui-review.md §2.6). A per-function test cannot see that; a
// chain test can.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  NodeLayoutSchema,
  NodeStyleEntrySchema,
  Stylesheet,
  StylesheetSchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutGroup } from '@archeglyph/core/layout/laid_out_group';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';

import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { buildSceneGeometry, type SceneGeometry } from '../scene/scene';
import { handleAtPoint } from '../scene/hit_test';
import type { ElementRef } from '../ui_state/ui_state';
import { routePress, type GestureDecision } from './pointer_router';
import {
  moveCommit,
  resizeCommit,
  resizeUpdate,
  type MoveSession,
  type ResizeSession,
} from './drag_machines';
import { init } from '@archeglyph/proto/util/init';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function vec2(x: number, y: number) {
  return create(Vec2Schema, { x, y });
}

function node(id: string, position: Vec2, size: Vec2, parentGroup?: string): LaidOutNode {
  return init(new LaidOutNode(), { id, parentGroup, position, size });
}

function group(id: string, position: Vec2, size: Vec2): LaidOutGroup {
  return init(new LaidOutGroup(), {
    id,
    position,
    size,
    isSuperNode: false,
    hiddenDescendantCount: 0,
  });
}

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

interface DiagramParts {
  nodes?: LaidOutNode[];
  groups?: LaidOutGroup[];
}

function geometryFrom(parts: DiagramParts): SceneGeometry {
  return buildSceneGeometry(
    init(new LaidOutDiagram(), {
      ...(parts.nodes === undefined ? {} : { nodes: byId(parts.nodes) }),
      ...(parts.groups === undefined ? {} : { groups: byId(parts.groups) }),
    }),
    '<svg/>',
  );
}

const v = (x: number, y: number) => create(Vec2Schema, { x, y });

/** n1 carries a size and a component binding a careless builder could drop. */
function sheet(): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {
      n1: create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, { position: v(10, 20), size: v(100, 50) }),
        component: 'glyph',
      }),
      n2: create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, { position: v(300, 20), size: v(100, 50) }),
      }),
    },
  });
}

// ---------------------------------------------------------------------------
// The headline claim of the editor-resize pillar.
// ---------------------------------------------------------------------------

describe('dragging a handle resizes the element under it', () => {
  const n1 = node('n1', vec2(10, 20), vec2(100, 50));
  const n2 = node('n2', vec2(300, 20), vec2(100, 50));
  const selection: Array<ElementRef> = [{ id: 'n1', kind: 'node' }];

  test('press on the south-east handle, drag, release: n1 gains the dragged size', () => {
    const geometry = geometryFrom({ nodes: [n1, n2] });

    // The pointer lands on n1's south-east corner, which is where the overlay
    // draws the `se` handle.
    const press = vec2(110, 70);
    const handle = handleAtPoint(geometry, selection, press, 6);
    expect(handle).toBe('se');

    const decision: GestureDecision = routePress(
      { point: press, hit: { id: 'n1', kind: 'node' }, tool: 'select', button: 0, additive: false, onHandle: handle },
      selection,
    );
    expect(decision.kind).toBe('resize');

    const session: ResizeSession = { ref: selection[0], handle: decision.handle!, origin: press };
    const before = sheet();
    const edit = resizeCommit(session, geometry, before, vec2(140, 90), false);
    expect(edit).toBeDefined();

    const after = applyStyleEditToStylesheet(before, edit!);
    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 130, y: 70 });
    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 10, y: 20 });
  });

  test('nothing but the resized element is written', () => {
    const geometry = geometryFrom({ nodes: [n1, n2] });
    const session: ResizeSession = { ref: selection[0], handle: 'se', origin: vec2(110, 70) };
    const before = sheet();

    const after = applyStyleEditToStylesheet(
      before,
      resizeCommit(session, geometry, before, vec2(140, 90), false)!,
    );

    expect(after.nodes.n2.layout?.position).toMatchObject({ x: 300, y: 20 });
    expect(after.nodes.n2.layout?.size).toMatchObject({ x: 100, y: 50 });
    // A StyleChange carries a whole entry, so the binding is the thing most
    // easily lost on the way through a builder.
    expect(after.nodes.n1.component).toBe('glyph');
  });

  test('a north-west drag moves the origin and keeps the opposite corner fixed', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: ResizeSession = { ref: selection[0], handle: 'nw', origin: vec2(10, 20) };
    const before = sheet();

    const after = applyStyleEditToStylesheet(
      before,
      resizeCommit(session, geometry, before, vec2(30, 40), false)!,
    );

    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 30, y: 40 });
    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 80, y: 30 });
  });

  test('an edge handle resizes one axis only', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: ResizeSession = { ref: selection[0], handle: 'e', origin: vec2(110, 45) };
    const before = sheet();

    const after = applyStyleEditToStylesheet(
      before,
      resizeCommit(session, geometry, before, vec2(160, 999), false)!,
    );

    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 150, y: 50 });
  });

  test('shift keeps the aspect ratio', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: ResizeSession = { ref: selection[0], handle: 'se', origin: vec2(110, 70) };
    const before = sheet();

    // n1 is 100x50. A drag of (+100, +0) with aspect held must grow both axes
    // in proportion rather than only the one the pointer moved along.
    const after = applyStyleEditToStylesheet(
      before,
      resizeCommit(session, geometry, before, vec2(210, 70), true)!,
    );

    const size = after.nodes.n1.layout!.size!;
    expect(size.x / size.y).toBeCloseTo(2, 5);
  });

  test('a drag that ends where it started commits nothing', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: ResizeSession = { ref: selection[0], handle: 'se', origin: vec2(110, 70) };
    expect(resizeCommit(session, geometry, sheet(), vec2(110, 70), false)).toBeUndefined();
  });

  test('the preview shows the same bounds the commit will write', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: ResizeSession = { ref: selection[0], handle: 'se', origin: vec2(110, 70) };

    const preview = resizeUpdate(session, geometry, vec2(140, 90), false);

    expect(preview.bounds).toHaveLength(1);
    expect(preview.bounds[0].bounds).toEqual({ minX: 10, minY: 20, maxX: 140, maxY: 90 });
  });

  test('a group resizes its container without moving its members', () => {
    const g1 = group('g1', vec2(0, 0), vec2(200, 200));
    const child = node('c1', vec2(20, 20), vec2(40, 40), 'g1');
    const geometry = geometryFrom({ groups: [g1], nodes: [child] });
    const groupSelection: Array<ElementRef> = [{ id: 'g1', kind: 'group' }];
    const session: ResizeSession = { ref: groupSelection[0], handle: 'se', origin: vec2(200, 200) };

    const before = create(StylesheetSchema, { schemaVersion: 1 });
    const after = applyStyleEditToStylesheet(
      before,
      resizeCommit(session, geometry, before, vec2(250, 250), false)!,
    );

    expect(after.groups.g1.layout?.size).toMatchObject({ x: 250, y: 250 });
    // The child is pinned by the same edit (pin-on-touch materializes the
    // whole layout), but pinned exactly where it already was.
    expect(after.nodes.c1.layout?.position).toMatchObject({ x: 20, y: 20 });
  });
});

describe('pin-on-touch', () => {
  // The bug this guards: an un-pinned diagram is arranged by ELK, but the
  // moment ONE element gets a position the layout engine stops calling ELK
  // for placement and seeds the rest beside the pinned one -- so dragging a
  // single node rearranged the whole diagram under the user.
  test('the first move pins every other element where it already is', () => {
    const dragged = node('n1', vec2(10, 20), vec2(100, 50));
    const bystander = node('n2', vec2(300, 400), vec2(100, 50));
    const geometry = geometryFrom({ nodes: [dragged, bystander] });
    const session: MoveSession = { refs: [{ id: 'n1', kind: 'node' }], origin: vec2(0, 0) };

    const before = create(StylesheetSchema, { schemaVersion: 1 });
    const after = applyStyleEditToStylesheet(
      before,
      moveCommit(session, geometry, before, vec2(15, 5))!,
    );

    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 25, y: 25 });
    expect(after.nodes.n2.layout?.position).toMatchObject({ x: 300, y: 400 });
  });

  test('a later move does not re-pin what is already pinned', () => {
    const n1 = node('n1', vec2(10, 20), vec2(100, 50));
    const n2 = node('n2', vec2(300, 20), vec2(100, 50));
    const geometry = geometryFrom({ nodes: [n1, n2] });
    const session: MoveSession = { refs: [{ id: 'n1', kind: 'node' }], origin: vec2(0, 0) };

    // sheet() has explicit positions for both.
    const edit = moveCommit(session, geometry, sheet(), vec2(5, 0))!;

    expect(edit.nodeChanges.map((change) => change.nodeId)).toEqual(['n1']);
  });
});

describe('handleAtPoint', () => {
  const n1 = node('n1', vec2(10, 20), vec2(100, 50));

  test('finds a handle only when exactly one element is selected', () => {
    const geometry = geometryFrom({ nodes: [n1, node('n2', vec2(300, 20), vec2(100, 50))] });
    const both: Array<ElementRef> = [{ id: 'n1', kind: 'node' }, { id: 'n2', kind: 'node' }];
    // The overlay draws handles only on a single selection, so a hit on a
    // corner that has no drawn handle must not start a resize.
    expect(handleAtPoint(geometry, both, vec2(110, 70), 6)).toBeUndefined();
  });

  test('returns undefined for an empty selection', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    expect(handleAtPoint(geometry, [], vec2(110, 70), 6)).toBeUndefined();
  });

  test('returns undefined for a selected edge, which has no handles', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    expect(handleAtPoint(geometry, [{ id: 'e1', kind: 'edge' }], vec2(110, 70), 6)).toBeUndefined();
  });

  test('returns undefined away from every handle', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    expect(handleAtPoint(geometry, [{ id: 'n1', kind: 'node' }], vec2(60, 45), 6)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Regression: one coordinate space for every element-space machine.
// ---------------------------------------------------------------------------

describe('element-space machines take diagram coordinates', () => {
  // screenToDiagram has already divided by zoom before the canvas hands a
  // point to a session, so a machine that divides again scales the drag by
  // 1/zoom. That is invisible at zoom 1 and wrong at every other zoom --
  // which is every zoom, since the canvas fits the diagram on load. The fix
  // is that these machines have no zoom parameter to get wrong: only
  // panUpdate is screen-space, because panning is a viewport operation.
  const n1 = node('n1', vec2(10, 20), vec2(100, 50));

  test('a move commits exactly the delta it was given', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: MoveSession = { refs: [{ id: 'n1', kind: 'node' }], origin: vec2(60, 45) };

    const after = applyStyleEditToStylesheet(
      sheet(),
      moveCommit(session, geometry, sheet(), vec2(90, 65))!,
    );

    expect(after.nodes.n1.layout?.position).toMatchObject({ x: 40, y: 40 });
  });

  test('a resize commits exactly the delta it was given', () => {
    const geometry = geometryFrom({ nodes: [n1] });
    const session: ResizeSession = { ref: { id: 'n1', kind: 'node' }, handle: 'se', origin: vec2(110, 70) };

    const after = applyStyleEditToStylesheet(
      sheet(),
      resizeCommit(session, geometry, sheet(), vec2(140, 90), false)!,
    );

    expect(after.nodes.n1.layout?.size).toMatchObject({ x: 130, y: 70 });
  });
});
