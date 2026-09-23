// SPDX-License-Identifier: AGPL-3.0-or-later

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

function changeOf(delta: { nodeDeltas: Array<{ nodeId: string; changeType: ChangeType }> }, id: string): ChangeType | undefined {
  return delta.nodeDeltas.find((d) => d.nodeId === id)?.changeType;
}

describe('diff direction', () => {
  test('reversing swaps which file is the before', () => {
    createRoot((dispose) => {
      const open = diagramOf('shared', 'onlyOpen');
      const state = createDiffState(() => open, 'open.diag.json');
      state.setBase(diagramOf('shared', 'onlyAttached'), 'attached.diag.json');

      const forward = state.delta()!;
      expect(forward.baseRef).toBe('attached.diag.json');
      expect(forward.targetRef).toBe('open.diag.json');
      expect(changeOf(forward, 'onlyOpen')).toBe(ChangeType.ADDED);
      expect(changeOf(forward, 'onlyAttached')).toBe(ChangeType.DELETED);

      state.setReversed((was: boolean): boolean => !was);

      const back = state.delta()!;
      expect(back.baseRef).toBe('open.diag.json');
      expect(back.targetRef).toBe('attached.diag.json');
      expect(changeOf(back, 'onlyOpen')).toBe(ChangeType.DELETED);
      expect(changeOf(back, 'onlyAttached')).toBe(ChangeType.ADDED);

      dispose();
    });
  });
});
