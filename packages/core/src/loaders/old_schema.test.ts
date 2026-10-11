// SPDX-License-Identifier: MPL-2.0
//
// Phase E2: pre-element files fail with a version message, not a parse error.

import { describe, expect, test } from 'bun:test';
import { loadDiagram, loadStylesheet } from './index';

const oldContent = JSON.stringify({
  schemaVersion: 1,
  id: 'old',
  graph: { nodes: { a: { label: [], tags: {} } }, groups: {} },
});

const oldStyle = JSON.stringify({
  schemaVersion: 1,
  nodes: { a: {} },
  groups: {},
});

describe('old schema files', () => {
  test('a version-1 diagram reports the version, not the unknown key', async () => {
    const r = await loadDiagram(oldContent);
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('content schema_version 1 is not supported; expected 2');
      expect(r.error.message).not.toContain('key "nodes" is unknown');
    }
  });

  test('a version-1 stylesheet reports the version, not the unknown key', async () => {
    const r = await loadStylesheet(oldStyle);
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('style schema_version 1 is not supported; expected 2');
      expect(r.error.message).not.toContain('key "nodes" is unknown');
    }
  });

  test('a version-2 diagram with an unknown top-level key is an err, not an empty graph', async () => {
    const r = await loadDiagram(JSON.stringify({ schemaVersion: 2, id: 'x', bogus: 1, graph: { elements: {}, edges: {} } }));
    expect(r.kind).toBe('err');
  });

  test('a version-2 diagram with the old nodes map is an err, not an empty graph', async () => {
    const r = await loadDiagram(JSON.stringify({ schemaVersion: 2, id: 'x', graph: { nodes: { a: {} }, groups: {} } }));
    expect(r.kind).toBe('err');
  });

  test('a version-2 stylesheet with an unknown top-level key is an err', async () => {
    const r = await loadStylesheet(JSON.stringify({ schemaVersion: 2, nodes: { a: {} } }));
    expect(r.kind).toBe('err');
  });
});
