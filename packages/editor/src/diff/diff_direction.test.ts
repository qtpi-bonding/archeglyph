// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { createRoot } from 'solid-js';
import { ChangeType, DiagramSchema, GraphSchema, NodeSchema } from '@archeglyph/proto/gen/content_pb';
import { createDiffState } from './diff_state';

function diagramOf(...ids: string[]) {
  return create(DiagramSchema, {
    schemaVersion: 1,
    id: 'd',
    graph: create(GraphSchema, {
      nodes: Object.fromEntries(ids.map((id) => [id, create(NodeSchema, {})])),
    }),
  });
}

function changeOf(
  delta: { nodeDeltas: Array<{ nodeId: string; changeType: ChangeType }> },
  id: string,
): ChangeType | undefined {
  return delta.nodeDeltas.find((d) => d.nodeId === id)?.changeType;
}

describe('diff direction', () => {
  test('an attached target makes the open document the base', () => {
    createRoot((dispose) => {
      const open = diagramOf('shared', 'onlyOpen');
      const state = createDiffState(() => open, () => 'open.diag.json');
      state.attach(diagramOf('shared', 'onlyAttached'), 'attached.diag.json', true);

      const forward = state.delta()!;
      expect(forward.baseRef).toBe('open.diag.json');
      expect(forward.targetRef).toBe('attached.diag.json');
      expect(changeOf(forward, 'onlyOpen')).toBe(ChangeType.DELETED);
      expect(changeOf(forward, 'onlyAttached')).toBe(ChangeType.ADDED);
      expect(state.baseStandIn()).toBeUndefined();

      state.swap();

      const back = state.delta()!;
      expect(back.baseRef).toBe('attached.diag.json');
      expect(back.targetRef).toBe('open.diag.json');
      expect(changeOf(back, 'onlyOpen')).toBe(ChangeType.ADDED);
      expect(changeOf(back, 'onlyAttached')).toBe(ChangeType.DELETED);
      expect(state.baseStandIn()).toBeDefined();

      dispose();
    });
  });

  test('an attached base makes the open document the target', () => {
    createRoot((dispose) => {
      const state = createDiffState(() => diagramOf('onlyOpen'), () => 'open');
      state.attach(diagramOf('onlyAttached'), 'attached', false);

      const delta = state.delta()!;
      expect(delta.baseRef).toBe('attached');
      expect(changeOf(delta, 'onlyOpen')).toBe(ChangeType.ADDED);

      dispose();
    });
  });

  test('detaching returns the delta to undefined', () => {
    createRoot((dispose) => {
      const state = createDiffState(() => diagramOf('a'), () => 'open');
      state.attach(diagramOf('b'), 'attached', true);
      expect(state.delta()).toBeDefined();

      state.detach();

      expect(state.delta()).toBeUndefined();
      expect(state.baseStandIn()).toBeUndefined();
      dispose();
    });
  });
});
