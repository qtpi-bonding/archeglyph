// SPDX-License-Identifier: AGPL-3.0-or-later

// Asserts edit-for-edit equality with a pointer drag, not just the resulting
// position: a reimplementation that dropped pin-on-touch, the parent-offset
// conversion or layout materialization would still land n1 in the right place.

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
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import { init } from '@archeglyph/proto/util/init';

import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { buildSceneGeometry, type SceneGeometry } from '../scene/scene';
import type { ElementRef } from '../ui_state/ui_state';
import { moveCommit, type MoveSession } from './drag_machines';
import { beginModalGesture } from '../ui_state/modal_gesture';
import { modalKeyDown } from '../ui_state/modal_step';
import { modalDelta } from './modal_aim';

const v = (x: number, y: number) => create(Vec2Schema, { x, y });

function node(id: string, position: ReturnType<typeof v>, size: ReturnType<typeof v>): LaidOutNode {
  return init(new LaidOutNode(), { id, position, size });
}

function geometryFrom(nodes: LaidOutNode[]): SceneGeometry {
  return buildSceneGeometry(
    init(new LaidOutDiagram(), { nodes: Object.fromEntries(nodes.map((n) => [n.id, n])) }),
    '<svg/>',
  );
}

function sheet(): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {
      n1: create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, { position: v(10, 20), size: v(100, 50) }),
        component: 'glyph',
      }),
    },
  });
}

describe('a modal grab is the same gesture as a drag', () => {
  const selection: Array<ElementRef> = [{ id: 'n1', kind: 'node' }];
  const geometry = (): SceneGeometry => geometryFrom([node('n1', v(10, 20), v(100, 50))]);

  test('g, Down, 4, 0, Enter commits exactly what a 40-unit drag commits', () => {
    let gesture = beginModalGesture('grab', selection);
    for (const key of ['ArrowDown', '4', '0']) {
      const step = modalKeyDown(gesture, key);
      expect(step.outcome).toBe('continue');
      gesture = step.gesture!;
    }
    expect(modalKeyDown(gesture, 'Enter').outcome).toBe('commit');

    const scene = geometry();
    const modalSession: MoveSession = { refs: gesture.refs, origin: { x: 0, y: 0 } };
    const viaModal = moveCommit(modalSession, scene, sheet(), modalDelta(gesture));

    // Deliberately a different origin from the modal path's zero, so the test
    // pins the DELTA rather than the coordinates either path happens to use.
    const dragSession: MoveSession = { refs: selection, origin: { x: 7, y: 13 } };
    const viaDrag = moveCommit(dragSession, scene, sheet(), { x: 7, y: 53 });

    expect(viaModal).toBeDefined();
    expect(viaModal).toEqual(viaDrag!);
  });

  test('the committed edit actually moves n1 40 down, not merely equals itself', () => {
    let gesture = beginModalGesture('grab', selection);
    for (const key of ['ArrowDown', '4', '0']) {
      gesture = modalKeyDown(gesture, key).gesture!;
    }
    const edit = moveCommit(
      { refs: gesture.refs, origin: { x: 0, y: 0 } },
      geometry(),
      sheet(),
      modalDelta(gesture),
    );
    const after = applyStyleEditToStylesheet(sheet(), edit!);
    expect(after.nodes.n1?.layout?.position).toEqual(v(10, 60));
  });

  test('Enter with no digits typed commits nothing', () => {
    let gesture = beginModalGesture('grab', selection);
    gesture = modalKeyDown(gesture, 'ArrowDown').gesture!;
    expect(modalKeyDown(gesture, 'Enter').outcome).toBe('commit');
    const edit = moveCommit(
      { refs: gesture.refs, origin: { x: 0, y: 0 } },
      geometry(),
      sheet(),
      modalDelta(gesture),
    );
    expect(edit).toBeUndefined();
  });
});
