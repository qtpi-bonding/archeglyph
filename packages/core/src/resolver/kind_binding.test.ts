// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationEntrySchema,
  NodeStyleEntrySchema,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import {
  Glyph2DSchema,
  ShapeType,
} from '@archeglyph/proto/gen/style_pb';
import {
  AnnotationComponentSchema,
  NodeComponentSchema,
  ThemeSchema,
} from '@archeglyph/proto/gen/theme_pb';
import { seedComponentBindings } from './seed_bindings';

// No bundled theme defines a second node component, so the fixture must.
function themeWithStore() {
  return create(ThemeSchema, {
    schemaVersion: 1,
    name: 'fixture',
    defaultNodeComponent: 'glyph',
    defaultAnnotationComponent: 'glyph',
    nodeComponents: [
      create(NodeComponentSchema, { name: 'glyph' }),
      create(NodeComponentSchema, {
        name: 'store',
        shape: create(Glyph2DSchema, { shapeKind: { case: 'standard', value: ShapeType.SHAPE_CYLINDER } }),
      }),
    ],
  });
}

const diagramWith = (tags: Record<string, string>) => create(DiagramSchema, {
  schemaVersion: 1,
  id: 'd',
  graph: { nodes: { postgres: { label: [], tags } }, edges: {}, groups: {} },
});

describe('the kind tag picks a component', () => {
  test('an unbound node tagged kind=store binds to the store component', () => {
    const seeded = seedComponentBindings(
      diagramWith({ kind: 'store' }),
      create(StylesheetSchema, { schemaVersion: 1 }),
      themeWithStore(),
    );
    expect(seeded.nodes['postgres']?.component).toBe('store');
  });

  // A present component is a choice, even when it equals the theme default.
  test('an explicit binding equal to the theme default is left alone', () => {
    const seeded = seedComponentBindings(
      diagramWith({ kind: 'store' }),
      create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: { postgres: create(NodeStyleEntrySchema, { component: 'glyph' }) },
      }),
      themeWithStore(),
    );
    expect(seeded.nodes['postgres']?.component).toBe('glyph');
  });

  test('a binding the user chose is never overwritten', () => {
    const seeded = seedComponentBindings(
      diagramWith({ kind: 'store' }),
      create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: { postgres: create(NodeStyleEntrySchema, { component: 'queue' }) },
      }),
      themeWithStore(),
    );
    expect(seeded.nodes['postgres']?.component).toBe('queue');
  });

  // Nothing is written when the derivation lands on the theme default: an
  // empty box already means that, and writing it in would make the box
  // indistinguishable from a choice.
  test('a kind the theme has no component for writes nothing', () => {
    const seeded = seedComponentBindings(
      diagramWith({ kind: 'wormhole' }),
      create(StylesheetSchema, { schemaVersion: 1 }),
      themeWithStore(),
    );
    expect(seeded.nodes['postgres']?.component ?? '').toBe('');
  });

  test('an untagged node writes nothing', () => {
    const seeded = seedComponentBindings(
      diagramWith({}),
      create(StylesheetSchema, { schemaVersion: 1 }),
      themeWithStore(),
    );
    expect(seeded.nodes['postgres']?.component ?? '').toBe('');
  });

  test('seeding twice gives the same result as seeding once', () => {
    const diagram = diagramWith({ kind: 'store' });
    const theme = themeWithStore();
    const once = seedComponentBindings(diagram, create(StylesheetSchema, { schemaVersion: 1 }), theme);
    const twice = seedComponentBindings(diagram, once, theme);
    expect(twice.nodes['postgres']?.component).toBe(once.nodes['postgres']?.component);
  });

  // scene.ts re-seeds a throwaway copy from the stored sheet every rebuild.
  test('the stylesheet argument is not mutated', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { postgres: create(NodeStyleEntrySchema, { component: 'glyph' }) },
    });
    seedComponentBindings(diagramWith({ kind: 'store' }), sheet, themeWithStore());
    expect(sheet.nodes['postgres']?.component).toBe('glyph');
  });

  // The guard precedes the kind lookup, even for a kind the theme defines.
  test('a theme declaring no default component writes nothing', () => {
    const theme = create(ThemeSchema, {
      schemaVersion: 1,
      name: 'no-default',
      nodeComponents: [create(NodeComponentSchema, { name: 'store' })],
    });
    const seeded = seedComponentBindings(
      diagramWith({ kind: 'store' }),
      create(StylesheetSchema, { schemaVersion: 1 }),
      theme,
    );
    expect(seeded.nodes['postgres']).toBeUndefined();
  });

  // Annotation tags live in the stylesheet, not the diagram.
  test('an annotation whose kind lands on the default writes nothing', () => {
    const theme = create(ThemeSchema, {
      schemaVersion: 1,
      name: 'fixture',
      defaultAnnotationComponent: 'glyph',
      annotationComponents: [
        create(AnnotationComponentSchema, { name: 'glyph' }),
      ],
    });
    const seeded = seedComponentBindings(
      create(DiagramSchema, { schemaVersion: 1, id: 'd', graph: { nodes: {}, edges: {}, groups: {} } }),
      create(StylesheetSchema, {
        schemaVersion: 1,
        annotations: { note: create(AnnotationEntrySchema, { tags: { kind: 'wormhole' } }) },
      }),
      theme,
    );
    expect(seeded.annotations['note']?.component ?? '').toBe('');
  });
});
