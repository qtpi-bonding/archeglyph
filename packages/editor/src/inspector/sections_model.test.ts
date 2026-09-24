// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ColorSchema, EdgeStyleEntrySchema, FontWeight, NodeStyleEntrySchema, StylesheetSchema,
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
