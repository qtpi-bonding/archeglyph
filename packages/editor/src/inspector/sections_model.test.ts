// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntrySchema, ColorSchema, EdgeStyleEntrySchema, FontWeight,
  GroupStyleEntrySchema, NodeStyleEntrySchema,
  StylesheetSchema,
  TypographySchema,
} from '@archeglyph/proto/gen/style_pb';

import { commitTypography } from './sections_model';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import type { InspectorModel } from './model';

const typography = () => create(TypographySchema, {
  size: 18,
  font: 'Inter',
  color: create(ColorSchema, { value: '#ffffff' }),
  weight: FontWeight.WEIGHT_BOLD,
});

const nodeSheet = () => create(StylesheetSchema, {
  schemaVersion: 1,
  nodes: { n1: create(NodeStyleEntrySchema, { typography: typography() }) },
  edges: {},
  groups: {},
  annotations: {},
  pendingEdits: [],
});

const nodeModel: InspectorModel = { kind: 'node', ids: ['n1'], sections: ['typography'] };

// The Size / Color / Font rows commit `undefined` for "Default".
describe('commitTypography clears a field the inspector defaults', () => {
  test.each([
    ['size' as const, (entry: ReturnType<typeof typography>) => entry.size],
    ['font' as const, (entry: ReturnType<typeof typography>) => entry.font],
  ])('%s goes back to the default', (field, read) => {
    const sheet = nodeSheet();
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(nodeModel, sheet, field, undefined)!);
    const after = applied.nodes['n1']?.typography;

    expect(after).toBeDefined();
    expect(read(after!)).toBeUndefined();
    expect(after!.weight).toBe(FontWeight.WEIGHT_BOLD);
  });

  test('color goes back to the default and leaves the size alone', () => {
    const sheet = nodeSheet();
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(nodeModel, sheet, 'color', undefined)!);

    expect(applied.nodes['n1']?.typography?.color).toBeUndefined();
    expect(applied.nodes['n1']?.typography?.size).toBe(18);
  });

  test('an edge clears the same way a node does', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {},
      edges: { e1: create(EdgeStyleEntrySchema, { typography: typography() }) },
      groups: {},
      annotations: {},
      pendingEdits: [],
    });
    const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: ['typography'] };
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(model, sheet, 'size', undefined)!);

    expect(applied.edges['e1']?.typography?.size).toBeUndefined();
    expect(applied.edges['e1']?.typography?.font).toBe('Inter');
  });

  test('setting a field still leaves the others intact', () => {
    const sheet = nodeSheet();
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(nodeModel, sheet, 'size', 24)!);

    expect(applied.nodes['n1']?.typography?.size).toBe(24);
    expect(applied.nodes['n1']?.typography?.font).toBe('Inter');
  });
});

describe('commitTypography over a multi-selection', () => {
  const mixedNodes = () => create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {
      n1: create(NodeStyleEntrySchema, { typography: create(TypographySchema, { font: 'Inter', size: 12 }) }),
      n2: create(NodeStyleEntrySchema, { typography: create(TypographySchema, { font: 'Georgia', size: 12 }) }),
    },
    edges: {}, groups: {}, annotations: {}, pendingEdits: [],
  });
  const bothNodes: InspectorModel = { kind: 'node', ids: ['n1', 'n2'], sections: ['typography'] };

  test('sets the field on every selected element', () => {
    const sheet = mixedNodes();
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(bothNodes, sheet, 'size', 24)!);

    expect(applied.nodes['n1']?.typography?.size).toBe(24);
    expect(applied.nodes['n2']?.typography?.size).toBe(24);
  });

  test('leaves each element its own value for the fields it did not touch', () => {
    const sheet = mixedNodes();
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(bothNodes, sheet, 'size', 24)!);

    expect(applied.nodes['n1']?.typography?.font).toBe('Inter');
    expect(applied.nodes['n2']?.typography?.font).toBe('Georgia');
  });

  test('clears the field on every selected element', () => {
    const sheet = mixedNodes();
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(bothNodes, sheet, 'size', undefined)!);

    expect(applied.nodes['n1']?.typography?.size).toBeUndefined();
    expect(applied.nodes['n2']?.typography?.size).toBeUndefined();
    expect(applied.nodes['n2']?.typography?.font).toBe('Georgia');
  });

  test('a selection of groups is edited past the first one', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {},
      edges: {},
      groups: {
        g1: create(GroupStyleEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
        g2: create(GroupStyleEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
      },
      annotations: {}, pendingEdits: [],
    });
    const model: InspectorModel = { kind: 'group', ids: ['g1', 'g2'], sections: ['typography'] };
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(model, sheet, 'size', 20)!);

    expect(applied.groups['g1']?.typography?.size).toBe(20);
    expect(applied.groups['g2']?.typography?.size).toBe(20);
  });

  test('a selection of edges is edited past the first one', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {},
      edges: {
        e1: create(EdgeStyleEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
        e2: create(EdgeStyleEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
      },
      groups: {}, annotations: {}, pendingEdits: [],
    });
    const model: InspectorModel = { kind: 'edge', ids: ['e1', 'e2'], sections: ['typography'] };
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(model, sheet, 'size', 20)!);

    expect(applied.edges['e1']?.typography?.size).toBe(20);
    expect(applied.edges['e2']?.typography?.size).toBe(20);
  });

  test('a selection of annotations is edited past the first one', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {}, edges: {}, groups: {},
      annotations: {
        a1: create(AnnotationEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
        a2: create(AnnotationEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
      },
      pendingEdits: [],
    });
    const model: InspectorModel = { kind: 'annotation', ids: ['a1', 'a2'], sections: ['typography'] };
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(model, sheet, 'size', 20)!);

    expect(applied.annotations['a1']?.typography?.size).toBe(20);
    expect(applied.annotations['a2']?.typography?.size).toBe(20);
  });

  test('commits even when the first element already has the value', () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {
        n1: create(NodeStyleEntrySchema, { typography: create(TypographySchema, { size: 24 }) }),
        n2: create(NodeStyleEntrySchema, { typography: create(TypographySchema, { size: 12 }) }),
      },
      edges: {}, groups: {}, annotations: {}, pendingEdits: [],
    });
    const applied = applyStyleEditToStylesheet(sheet, commitTypography(bothNodes, sheet, 'size', 24)!);

    expect(applied.nodes['n2']?.typography?.size).toBe(24);
  });
});
