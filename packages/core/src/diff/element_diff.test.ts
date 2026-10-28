// SPDX-License-Identifier: MPL-2.0
//
// Spec (elements-and-containers, "Diff"): a move between parents is ONE
// MODIFIED ElementDelta carrying both parents. An element gaining children gets
// no delta of its own (children are derived from the child's `parent`). A role
// change is MODIFIED. Identical diagrams diff to nothing.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ChangeType,
  DiagramSchema,
  ElementRole,
  ElementSchema,
  GraphSchema,
  type Diagram,
} from '@archeglyph/proto/gen/content_pb';
import { CONTENT_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { diff } from './diff';

interface El { parent?: string; role?: ElementRole }

function graph(elements: Record<string, El>): Diagram {
  return create(DiagramSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    id: 'd',
    graph: create(GraphSchema, {
      elements: Object.fromEntries(
        Object.entries(elements).map(([id, e]) => [id, create(ElementSchema, {
          label: [], parent: e.parent, role: e.role ?? ElementRole.ENTITY, tags: {},
        })]),
      ),
      edges: {},
    }),
  });
}

describe('moving an element between parents', () => {
  const delta = diff(
    graph({ a: {}, b: {}, c: { parent: 'a' } }),
    graph({ a: {}, b: {}, c: { parent: 'b' } }),
  );

  test('yields exactly one ElementDelta', () => {
    expect(delta.elementDeltas.length).toBe(1);
    expect(delta.elementDeltas[0].elementId).toBe('c');
  });
  test('it is MODIFIED', () => {
    expect(delta.elementDeltas[0].changeType).toBe(ChangeType.MODIFIED);
  });
  test('before.parent and after.parent are the two parents', () => {
    expect(delta.elementDeltas[0].before?.parent).toBe('a');
    expect(delta.elementDeltas[0].after?.parent).toBe('b');
  });
  test('the old and new parents get no delta of their own', () => {
    expect(delta.elementDeltas.filter((d) => d.elementId !== 'c')).toEqual([]);
  });
});

describe('moving an element out of every parent to the root', () => {
  test('is one MODIFIED delta whose after.parent is unset', () => {
    const delta = diff(graph({ a: {}, c: { parent: 'a' } }), graph({ a: {}, c: {} }));
    expect(delta.elementDeltas.map((d) => [d.elementId, d.changeType])).toEqual([['c', ChangeType.MODIFIED]]);
    expect(delta.elementDeltas[0].before?.parent).toBe('a');
    expect(delta.elementDeltas[0].after?.parent ?? '').toBe('');
  });
});

describe('an ENTITY leaf gains its first child', () => {
  const delta = diff(graph({ a: {} }), graph({ a: {}, k: { parent: 'a' } }));

  test('the leaf itself gets no ElementDelta', () => {
    expect(delta.elementDeltas.some((d) => d.elementId === 'a')).toBe(false);
  });
  test('the child is ADDED with the leaf as after.parent', () => {
    expect(delta.elementDeltas.map((d) => [d.elementId, d.changeType])).toEqual([['k', ChangeType.ADDED]]);
    expect(delta.elementDeltas[0].after?.parent).toBe('a');
  });
});

describe('a role change', () => {
  test('ENTITY to GROUPING is MODIFIED with both roles recorded', () => {
    const delta = diff(
      graph({ a: { role: ElementRole.ENTITY } }),
      graph({ a: { role: ElementRole.GROUPING } }),
    );
    expect(delta.elementDeltas.length).toBe(1);
    expect(delta.elementDeltas[0].changeType).toBe(ChangeType.MODIFIED);
    expect(delta.elementDeltas[0].before?.role).toBe(ElementRole.ENTITY);
    expect(delta.elementDeltas[0].after?.role).toBe(ElementRole.GROUPING);
  });
});

describe('identical diagrams', () => {
  test('diff to an empty delta', () => {
    const d = graph({ a: {}, b: { parent: 'a' }, g: { role: ElementRole.GROUPING } });
    const delta = diff(d, graph({ a: {}, b: { parent: 'a' }, g: { role: ElementRole.GROUPING } }));
    expect(delta.elementDeltas).toEqual([]);
    expect(delta.edgeDeltas).toEqual([]);
  });
});
