// SPDX-License-Identifier: MPL-2.0
//
// Spec (elements-and-containers, "Diff"): mergeDelta's endpoint check for a
// restored edge is "is an ENTITY element", not merely "is an element"; a
// restored element whose parent is absent is re-rooted; the overlay keys change
// types by drawn form (groups for group-like elements, nodes for leaves).

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ChangeType,
  DeltaSchema,
  DiagramSchema,
  EdgeDeltaSchema,
  EdgeSchema,
  ElementDeltaSchema,
  ElementRole,
  ElementSchema,
  GraphSchema,
  LocalizationSchema,
  type Diagram,
} from '@archeglyph/proto/gen/content_pb';
import { CONTENT_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { diff } from '../diff/diff';
import { mergeDelta } from './merge_delta';

interface El { parent?: string; role?: ElementRole; text?: string }

const element = (e: El) => create(ElementSchema, {
  label: [create(LocalizationSchema, { locale: 'en', source: e.text ?? 'x' })],
  parent: e.parent,
  role: e.role ?? ElementRole.ENTITY,
  tags: {},
});

function graph(elements: Record<string, El>, edges: Record<string, [string, string]> = {}): Diagram {
  return create(DiagramSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    id: 'd',
    graph: create(GraphSchema, {
      elements: Object.fromEntries(Object.entries(elements).map(([id, e]) => [id, element(e)])),
      edges: Object.fromEntries(Object.entries(edges).map(([id, [source, target]]) => [id, create(EdgeSchema, { source, target })])),
    }),
  });
}

const deletedEdge = (edgeId: string, source: string, target: string) => create(DeltaSchema, {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  edgeDeltas: [create(EdgeDeltaSchema, { edgeId, changeType: ChangeType.DELETED, before: create(EdgeSchema, { source, target }) })],
});

describe('a restored DELETED edge', () => {
  test('is dropped when an endpoint is missing from the target', () => {
    const overlay = mergeDelta(graph({ a: {} }), deletedEdge('e', 'a', 'gone'));
    expect(Object.keys(overlay.diagram.graph?.edges ?? {})).toEqual([]);
    expect(overlay.edges['e']).toBeUndefined();
  });

  test('is dropped, with its change type removed, when an endpoint is now a GROUPING', () => {
    const target = graph({ a: {}, g: { role: ElementRole.GROUPING }, m: { parent: 'g' } });
    const overlay = mergeDelta(target, deletedEdge('e', 'a', 'g'));
    expect(Object.keys(overlay.diagram.graph?.edges ?? {})).toEqual([]);
    expect('e' in overlay.edges).toBe(false);
  });

  test('is dropped when the SOURCE endpoint is now a GROUPING', () => {
    const target = graph({ a: {}, g: { role: ElementRole.GROUPING } });
    const overlay = mergeDelta(target, deletedEdge('e', 'g', 'a'));
    expect(overlay.diagram.graph?.edges['e']).toBeUndefined();
    expect('e' in overlay.edges).toBe(false);
  });

  test('is kept between two ENTITY elements, marked DELETED', () => {
    const overlay = mergeDelta(graph({ a: {}, b: {} }), deletedEdge('e', 'a', 'b'));
    expect(overlay.diagram.graph?.edges['e']?.source).toBe('a');
    expect(overlay.diagram.graph?.edges['e']?.target).toBe('b');
    expect(overlay.edges['e']).toBe(ChangeType.DELETED);
  });

  test('is kept when an endpoint is an ENTITY that has children', () => {
    const overlay = mergeDelta(graph({ a: {}, p: {}, k: { parent: 'p' } }), deletedEdge('e', 'a', 'p'));
    expect(overlay.edges['e']).toBe(ChangeType.DELETED);
  });
});

describe('a restored DELETED element', () => {
  const delta = create(DeltaSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    elementDeltas: [create(ElementDeltaSchema, {
      elementId: 'x', changeType: ChangeType.DELETED, before: element({ parent: 'vanished' }),
    })],
  });

  test('whose parent is absent is re-rooted', () => {
    const overlay = mergeDelta(graph({ a: {} }), delta);
    expect(overlay.diagram.graph?.elements['x']).toBeDefined();
    expect(overlay.diagram.graph?.elements['x']?.parent).toBeUndefined();
    expect(overlay.nodes['x']).toBe(ChangeType.DELETED);
  });

  test('whose parent is present keeps it', () => {
    const overlay = mergeDelta(graph({ vanished: {} }), delta);
    expect(overlay.diagram.graph?.elements['x']?.parent).toBe('vanished');
  });
});

describe('the overlay keys change types by drawn form', () => {
  const base = graph({ p: { text: 'old' }, leaf: {}, gr: { role: ElementRole.GROUPING } });
  const target = graph({
    p: { text: 'new' }, c: { parent: 'p' }, leaf: {}, gr: { role: ElementRole.GROUPING }, m: { parent: 'gr' },
  });
  const overlay = mergeDelta(target, diff(base, target));

  test('a container with children lands in groups', () => {
    expect(overlay.groups['p']).toBe(ChangeType.MODIFIED);
    expect(overlay.nodes['p']).toBeUndefined();
  });
  test('a leaf lands in nodes', () => {
    expect(overlay.nodes['c']).toBe(ChangeType.ADDED);
    expect(overlay.nodes['leaf']).toBe(ChangeType.UNCHANGED);
    expect(overlay.groups['c']).toBeUndefined();
    expect(overlay.groups['leaf']).toBeUndefined();
  });
  test('a GROUPING lands in groups', () => {
    expect(overlay.groups['gr']).toBe(ChangeType.UNCHANGED);
    expect(overlay.nodes['gr']).toBeUndefined();
  });
  test('an empty GROUPING is still a group', () => {
    const lone = graph({ gr: { role: ElementRole.GROUPING } });
    const o = mergeDelta(lone, diff(graph({}), lone));
    expect(o.groups['gr']).toBe(ChangeType.ADDED);
    expect(o.nodes['gr']).toBeUndefined();
  });
});
