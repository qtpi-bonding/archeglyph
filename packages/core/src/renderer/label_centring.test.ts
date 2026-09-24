// SPDX-License-Identifier: MPL-2.0
// A label anchored at a box's centre needs both axes told, or SVG starts the
// text at the anchor with the baseline on it and the label leaves the shape.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { ColorSchema, Glyph2DSchema, ShapeType, StrokeSchema, TextAlign, TypographySchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';

import { shapePath, textElement } from './svg_painter';

const label = [create(LocalizationSchema, { locale: 'en', source: 'render' })];
const at = create(Vec2Schema, { x: 100, y: 50 });
const plain = create(TypographySchema, { size: 13 });

describe('centred labels', () => {
  test('a centred label anchors in the middle of its box, on both axes', () => {
    const svg = textElement(label, plain, at, true);

    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('dominant-baseline="central"');
  });

  test('an explicit align still wins, and the baseline is unaffected', () => {
    const right = create(TypographySchema, { size: 13, align: TextAlign.ALIGN_RIGHT });
    const svg = textElement(label, right, at, true);

    expect(svg).toContain('text-anchor="end"');
    expect(svg).not.toContain('text-anchor="middle"');
    expect(svg).toContain('dominant-baseline="central"');
  });

  test('a corner-anchored label is left alone', () => {
    // Group labels compute their own anchor and align as a pair; forcing a
    // centre on them would hang the label off the group's edge.
    const svg = textElement(label, plain, at);

    expect(svg).not.toContain('text-anchor');
    expect(svg).not.toContain('dominant-baseline');
  });

  test('the anchor point itself is unchanged by centring', () => {
    const svg = textElement(label, plain, at, true);
    expect(svg).toContain('x="100.00"');
    expect(svg).toContain('y="50.00"');
  });
});

describe('an unfilled shape', () => {
  test('is painted with no fill, not with SVG default black', () => {
    // style.proto: "Unset = no fill". Omitting the attribute hands SVG its own
    // default, which is black -- a solid block where a themed outline belongs.
    const bare = create(Glyph2DSchema, {
      shapeKind: { case: 'standard', value: ShapeType.SHAPE_RECT },
      stroke: create(StrokeSchema, {
        paint: { case: 'color', value: create(ColorSchema, { value: '#8b98a9' }) },
      }),
    });
    const svg = shapePath(bare, create(Vec2Schema, { x: 0, y: 0 }), create(Vec2Schema, { x: 100, y: 40 }));

    expect(svg).toContain('fill="none"');
  });
});
