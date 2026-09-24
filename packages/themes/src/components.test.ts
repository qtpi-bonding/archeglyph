// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import type { Glyph2D } from '@archeglyph/proto/gen/style_pb';

import { BUNDLED_THEME_NAMES, getBundledTheme } from './index';

const colorOf = (glyph: Glyph2D | undefined, part: 'fill' | 'stroke'): string | undefined => {
  const paint = part === 'fill' ? glyph?.fill?.paint : glyph?.stroke?.paint;
  return paint?.case === 'color' ? paint.value.value : undefined;
};

describe.each(BUNDLED_THEME_NAMES)('%s', (name: string) => {
  const theme = getBundledTheme(name);

  // A default the theme has no component for fails the cascade for the whole
  // diagram, not just for the element that names it.
  test.each([
    ['node', 'defaultNodeComponent', 'nodeComponents'],
    ['edge', 'defaultEdgeComponent', 'edgeComponents'],
    ['group', 'defaultGroupComponent', 'groupComponents'],
    ['annotation', 'defaultAnnotationComponent', 'annotationComponents'],
  ] as const)('its default %s component exists', (_kind, defaultKey, listKey) => {
    const wanted = theme[defaultKey] ?? '';
    const names = theme[listKey].map((component: { name: string }): string => component.name);
    expect({ wanted, names, found: wanted !== '' && names.includes(wanted) })
      .toEqual({ wanted, names, found: true });
  });

  test('an annotation does not look like a node', () => {
    // A note is editorial; a node is the subject. One shared fill and the
    // reader cannot tell which they are looking at.
    const node = theme.nodeComponents[0]?.shape;
    const annotation = theme.annotationComponents[0]?.shape;

    expect(colorOf(node, 'fill')).toBeDefined();
    expect(colorOf(annotation, 'fill')).toBeUndefined();
    expect(colorOf(annotation, 'stroke')).not.toBe(colorOf(node, 'stroke')!);
  });

  test('an annotation states its own text colour', () => {
    // An absent Typography leaves <text> with no fill, which SVG paints black.
    // These sit on a pale card, so the theme foreground is not a safe default.
    const color = theme.annotationComponents[0]?.typography?.color?.value;
    expect(color).toBeTruthy();
  });
});
