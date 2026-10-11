// SPDX-License-Identifier: MPL-2.0
//
// Spec (elements-and-containers, "Style"): seeding derives `component` from the
// theme's NODE catalogue and `boxComponent` from its GROUP catalogue, both by
// tags.kind, so a closed container looks like a node of its kind. A leaf gets
// `component` only; a group-like element (children, or role GROUPING) gets both.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementRole } from '@archeglyph/proto/gen/content_pb';
import { ElementStyleEntrySchema, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { NodeComponentSchema, ThemeSchema } from '@archeglyph/proto/gen/theme_pb';
import { seedComponentBindings } from './seed_bindings';

const theme = create(ThemeSchema, {
  schemaVersion: 1,
  name: 'fixture',
  defaultNodeComponent: 'glyph',
  defaultGroupComponent: 'box',
  nodeComponents: ['glyph', 'store', 'subsystem'].map((name) => create(NodeComponentSchema, { name })),
  groupComponents: ['box', 'subsystem', 'rack'].map((name) => create(NodeComponentSchema, { name })),
});

function diagram(kinds: { leaf?: string; parent?: string; grouping?: string; emptyGrouping?: string }) {
  const tags = (kind?: string): Record<string, string> => (kind === undefined ? {} : { kind });
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'd',
    graph: {
      elements: {
        leaf: { label: [], tags: tags(kinds.leaf) },
        parent: { label: [], tags: tags(kinds.parent) },
        child: { label: [], parent: 'parent', tags: {} },
        grouping: { label: [], role: ElementRole.GROUPING, tags: tags(kinds.grouping) },
        member: { label: [], parent: 'grouping', tags: {} },
        emptyGrouping: { label: [], role: ElementRole.GROUPING, tags: tags(kinds.emptyGrouping) },
      },
      edges: {},
    },
  });
}

const empty = () => create(StylesheetSchema, { schemaVersion: 2 });

describe('seeding forms: leaf versus group-like', () => {
  test('a leaf gets component from the node catalogue and no boxComponent', () => {
    const s = seedComponentBindings(diagram({ leaf: 'subsystem' }), empty(), theme);
    expect(s.elements['leaf']?.component).toBe('subsystem');
    expect(s.elements['leaf']?.boxComponent ?? '').toBe('');
  });

  test('a container whose kind is in both catalogues gets both bindings', () => {
    const s = seedComponentBindings(diagram({ parent: 'subsystem' }), empty(), theme);
    expect(s.elements['parent']?.component).toBe('subsystem');
    expect(s.elements['parent']?.boxComponent).toBe('subsystem');
  });

  test('a GROUPING with members gets both bindings', () => {
    const s = seedComponentBindings(diagram({ grouping: 'subsystem' }), empty(), theme);
    expect(s.elements['grouping']?.component).toBe('subsystem');
    expect(s.elements['grouping']?.boxComponent).toBe('subsystem');
  });

  test('an empty GROUPING is group-like and gets both bindings', () => {
    const s = seedComponentBindings(diagram({ emptyGrouping: 'subsystem' }), empty(), theme);
    expect(s.elements['emptyGrouping']?.component).toBe('subsystem');
    expect(s.elements['emptyGrouping']?.boxComponent).toBe('subsystem');
  });

  test('a container whose kind is only in the node catalogue gets component and no boxComponent', () => {
    const s = seedComponentBindings(diagram({ parent: 'store' }), empty(), theme);
    expect(s.elements['parent']?.component).toBe('store');
    expect(s.elements['parent']?.boxComponent ?? '').toBe('');
  });

  test('a container whose kind is only in the group catalogue gets boxComponent and no component', () => {
    const s = seedComponentBindings(diagram({ parent: 'rack' }), empty(), theme);
    expect(s.elements['parent']?.boxComponent).toBe('rack');
    expect(s.elements['parent']?.component ?? '').toBe('');
  });

  test('a kind neither catalogue knows writes nothing for a container', () => {
    const s = seedComponentBindings(diagram({ parent: 'wormhole' }), empty(), theme);
    expect(s.elements['parent']?.component ?? '').toBe('');
    expect(s.elements['parent']?.boxComponent ?? '').toBe('');
  });
});

describe('seeding forms: explicit values and idempotence', () => {
  test('an explicit component is kept while the unset boxComponent is still seeded', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 2,
      elements: { parent: create(ElementStyleEntrySchema, { component: 'glyph' }) },
    });
    const s = seedComponentBindings(diagram({ parent: 'subsystem' }), sheet, theme);
    expect(s.elements['parent']?.component).toBe('glyph');
    expect(s.elements['parent']?.boxComponent).toBe('subsystem');
  });

  test('an explicit boxComponent is kept while the unset component is still seeded', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 2,
      elements: { parent: create(ElementStyleEntrySchema, { boxComponent: 'rack' }) },
    });
    const s = seedComponentBindings(diagram({ parent: 'subsystem' }), sheet, theme);
    expect(s.elements['parent']?.boxComponent).toBe('rack');
    expect(s.elements['parent']?.component).toBe('subsystem');
  });

  test('both explicit values survive untouched', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 2,
      elements: { parent: create(ElementStyleEntrySchema, { component: 'glyph', boxComponent: 'box' }) },
    });
    const s = seedComponentBindings(diagram({ parent: 'subsystem' }), sheet, theme);
    expect(s.elements['parent']?.component).toBe('glyph');
    expect(s.elements['parent']?.boxComponent).toBe('box');
  });

  test('seeding twice equals seeding once for a container', () => {
    const d = diagram({ parent: 'subsystem', leaf: 'store', grouping: 'subsystem' });
    const once = seedComponentBindings(d, empty(), theme);
    const twice = seedComponentBindings(d, once, theme);
    for (const id of ['parent', 'leaf', 'grouping']) {
      expect(twice.elements[id]?.component).toBe(once.elements[id]?.component);
      expect(twice.elements[id]?.boxComponent).toBe(once.elements[id]?.boxComponent);
    }
    expect(once.elements['parent']?.component).toBe('subsystem');
    expect(once.elements['parent']?.boxComponent).toBe('subsystem');
  });
});
