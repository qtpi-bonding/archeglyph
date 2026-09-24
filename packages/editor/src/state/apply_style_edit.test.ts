// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { PATCHABLE_TYPES } from './apply_style_edit';

// The split is derived, so a field added to style.proto without `optional`
// moves its message to the replace-whole side silently. These lists are what
// names the field that moved.
describe('what a patch can describe one field of', () => {
  const name = (short: string) => `archeglyph.style.v1.${short}`;

  test.each([
    'NodeStyleEntry', 'EdgeStyleEntry', 'GroupStyleEntry', 'AnnotationEntry',
    'NodeLayout', 'EdgeLayout', 'GroupLayout', 'AnnotationLayout',
    'Glyph2D', 'Glyph1D', 'Typography', 'Stroke', 'Fill', 'Glow', 'CanvasStyle',
  ])('%s is patchable field by field', (short) => {
    expect(PATCHABLE_TYPES.has(name(short))).toBe(true);
  });

  test.each([
    'Vec2', 'Color', 'Arrowheads', 'AnnotationAnchor',
    'Gradient', 'GradientStop', 'Decoration',
  ])('%s is a value, and replaces whole', (short) => {
    expect(PATCHABLE_TYPES.has(name(short))).toBe(false);
  });

  test('nothing else has quietly joined the patchable side', () => {
    expect(PATCHABLE_TYPES.size).toBe(15);
  });
});
