// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ChangeType,
  DiagramSchema,
  EdgeSchema,
  GraphSchema,
  LocalizationSchema,
  NodeSchema,
  type Diagram,
} from '@archeglyph/proto/gen/content_pb';
import { diff } from '../diff/diff';
import { mergeDelta } from './merge_delta';

const label = (text: string) => [create(LocalizationSchema, { locale: 'en', source: text })];

function graph(nodes: Record<string, string>, edges: Record<string, [string, string]> = {}): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 1,
    id: 'd',
    graph: create(GraphSchema, {
      nodes: Object.fromEntries(
        Object.entries(nodes).map(([id, text]) => [id, create(NodeSchema, { label: label(text) })]),
      ),
      edges: Object.fromEntries(
        Object.entries(edges).map(([id, [source, target]]) => [id, create(EdgeSchema, { source, target })]),
      ),
    }),
  });
}

const ids = (d: Diagram): string[] => Object.keys(d.graph?.nodes ?? {}).sort();

describe('a node added between base and target', () => {
  const base = graph({ a: 'A' });
  const target = graph({ a: 'A', b: 'B' });
  const delta = diff(base, target);

  test('the delta calls it ADDED', () => {
    expect(delta.nodeDeltas.map((d) => [d.nodeId, d.changeType])).toEqual([['b', ChangeType.ADDED]]);
  });

  test('the union holds it, merged onto the target', () => {
    const overlay = mergeDelta(target, delta);
    expect(ids(overlay.diagram)).toEqual(['a', 'b']);
    expect(overlay.nodes.b).toBe(ChangeType.ADDED);
  });

  test('the union holds it, merged onto the base', () => {
    const overlay = mergeDelta(base, delta);
    expect(ids(overlay.diagram)).toEqual(['a', 'b']);
    expect(overlay.nodes.b).toBe(ChangeType.ADDED);
  });
});

describe('a node removed between base and target', () => {
  const base = graph({ a: 'A', b: 'B' });
  const target = graph({ a: 'A' });
  const delta = diff(base, target);

  test('the delta calls it DELETED', () => {
    expect(delta.nodeDeltas.map((d) => [d.nodeId, d.changeType])).toEqual([['b', ChangeType.DELETED]]);
  });

  test('the union holds it, merged onto the target', () => {
    const overlay = mergeDelta(target, delta);
    expect(ids(overlay.diagram)).toEqual(['a', 'b']);
    expect(overlay.nodes.b).toBe(ChangeType.DELETED);
  });

  test('the union holds it, merged onto the base', () => {
    const overlay = mergeDelta(base, delta);
    expect(ids(overlay.diagram)).toEqual(['a', 'b']);
    expect(overlay.nodes.b).toBe(ChangeType.DELETED);
  });
});

describe('a node modified between base and target', () => {
  const base = graph({ a: 'before' });
  const target = graph({ a: 'after' });
  const delta = diff(base, target);

  test('the delta calls it MODIFIED', () => {
    expect(delta.nodeDeltas.map((d) => [d.nodeId, d.changeType])).toEqual([['a', ChangeType.MODIFIED]]);
  });

  test('it is marked MODIFIED from either side', () => {
    expect(mergeDelta(target, delta).nodes.a).toBe(ChangeType.MODIFIED);
    expect(mergeDelta(base, delta).nodes.a).toBe(ChangeType.MODIFIED);
  });
});

describe('an edge added with the node it points at', () => {
  const base = graph({ a: 'A' });
  const target = graph({ a: 'A', b: 'B' }, { a__b: ['a', 'b'] });
  const delta = diff(base, target);

  test('the union holds both, merged onto the base', () => {
    const overlay = mergeDelta(base, delta);
    expect(ids(overlay.diagram)).toEqual(['a', 'b']);
    expect(Object.keys(overlay.diagram.graph?.edges ?? {})).toEqual(['a__b']);
    expect(overlay.edges.a__b).toBe(ChangeType.ADDED);
  });
});
