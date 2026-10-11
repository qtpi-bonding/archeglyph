// SPDX-License-Identifier: MPL-2.0
//
// A Delta written before the element model has `nodeDeltas`/`groupDeltas`; like
// a diagram or stylesheet it must be refused for its version, not for the first
// key the parser no longer knows. The version key may be spelled either way
// proto3 JSON allows.

import { describe, expect, test } from 'bun:test';
import { loadDelta, loadDiagram } from './index';

describe('old schema deltas and snake_case versions', () => {
  test('a version-1 delta reports the version, not the unknown key', async () => {
    const r = await loadDelta(JSON.stringify({ schemaVersion: 1, baseRef: 'a', nodeDeltas: [], edgeDeltas: [], groupDeltas: [] }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('content schema_version 1 is not supported; expected 2');
      expect(r.error.message).not.toContain('is unknown');
    }
  });

  test('the snake_case spelling of the version key is checked too', async () => {
    const r = await loadDiagram(JSON.stringify({ schema_version: 1, id: 'old', graph: { nodes: {}, groups: {} } }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('content schema_version 1 is not supported; expected 2');
    }
  });

  test('a current delta still loads', async () => {
    const r = await loadDelta(JSON.stringify({ schemaVersion: 2, baseRef: 'a', targetRef: 'b', edgeDeltas: [], elementDeltas: [] }));
    expect(r.kind).toBe('ok');
  });
});
