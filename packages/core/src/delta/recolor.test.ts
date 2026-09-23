// SPDX-License-Identifier: AGPL-3.0-or-later

// Color is a message, not a string: assert on `.value`.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { ChangeType } from '@archeglyph/proto/gen/content_pb';
import {
  ColorSchema,
  DecorationSchema,
  FillSchema,
  GlowSchema,
  GradientSchema,
  Glyph1DSchema,
  Glyph2DSchema,
  StrokePattern,
  StrokeSchema,
} from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { DiffRoles } from './diff_roles';
import { recolorLine, recolorShape } from './recolor_shape';

const TABLE: DiffRoles = init(new DiffRoles(), {
  added: '#00ff00',
  modified: '#0000ff',
  deleted: '#ff0000',
});

const color = (v: string) => create(ColorSchema, { value: v });

describe('recolorShape', () => {
  test('the fill takes the diff colour; stroke, glow and decorations keep theirs', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { paint: { case: 'color', value: color('#112233') } }),
      fill: create(FillSchema, { paint: { case: 'color', value: color('#445566') } }),
      glow: create(GlowSchema, { color: color('#778899') }),
      decorations: [create(DecorationSchema, { id: 'd', color: color('#aabbcc') })],
    });

    const out = recolorShape(glyph, ChangeType.ADDED, TABLE);

    expect(out.fill?.paint.case === 'color' && out.fill.paint.value.value).toBe('#00ff00');
    expect(out.stroke?.paint.case === 'color' && out.stroke.paint.value.value).toBe('#112233');
    expect(out.glow?.color?.value).toBe('#778899');
    expect(out.decorations[0]?.color?.value).toBe('#aabbcc');
  });

  test('a washed fill is opaque enough to read, whatever the theme authored', () => {
    const faint = create(Glyph2DSchema, {
      fill: create(FillSchema, { paint: { case: 'color', value: color('#445566') }, opacity: 0.02 }),
    });
    const solid = create(Glyph2DSchema, {
      fill: create(FillSchema, { paint: { case: 'color', value: color('#ffffff') }, opacity: 1 }),
    });

    expect(recolorShape(faint, ChangeType.ADDED, TABLE).fill?.opacity).toBeCloseTo(0.18, 6);
    expect(recolorShape(solid, ChangeType.ADDED, TABLE).fill?.opacity).toBeCloseTo(0.18, 6);
  });

  test('leaves a gradient paint alone', () => {
    const gradient = create(GradientSchema, {});
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { paint: { case: 'gradient', value: gradient } }),
      fill: create(FillSchema, { paint: { case: 'gradient', value: gradient } }),
    });

    const out = recolorShape(glyph, ChangeType.ADDED, TABLE);

    expect(out.stroke?.paint.case).toBe('gradient');
    expect(out.fill?.paint.case).toBe('gradient');
  });

  test('an unset colour stays unset', () => {
    const out = recolorShape(create(Glyph2DSchema, {}), ChangeType.ADDED, TABLE);

    expect(out.stroke).toBeUndefined();
    expect(out.fill).toBeUndefined();
    expect(out.glow).toBeUndefined();
  });

  test('DELETED marks the stroke with minuses and washes the fill red', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { dashing: { case: 'customDasharray', value: '5,4' } }),
      fill: create(FillSchema, { paint: { case: 'color', value: color('#445566') }, opacity: 0.06 }),
    });

    const out = recolorShape(glyph, ChangeType.DELETED, TABLE);

    expect(out.stroke?.dashing.case).toBe('pattern');
    expect(out.stroke?.dashing.value).toBe(StrokePattern.MINUS);
    expect(out.fill?.paint.case === 'color' && out.fill.paint.value.value).toBe('#ff0000');
    expect(out.fill?.opacity).toBeCloseTo(0.18, 6);
  });

  test('DELETED leaves an unpainted fill alone', () => {
    const glyph = create(Glyph2DSchema, { fill: create(FillSchema, {}) });

    expect(recolorShape(glyph, ChangeType.DELETED, TABLE).fill?.opacity).toBeUndefined();
  });

  test('DELETED creates neither a stroke nor a fill that was absent', () => {
    const out = recolorShape(create(Glyph2DSchema, {}), ChangeType.DELETED, TABLE);

    expect(out.stroke).toBeUndefined();
    expect(out.fill).toBeUndefined();
  });

  test('MODIFIED marks the stroke with deltas and washes the fill', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { dashing: { case: 'customDasharray', value: '2,3' } }),
      fill: create(FillSchema, { paint: { case: 'color', value: color('#445566') }, opacity: 0.06 }),
    });

    const out = recolorShape(glyph, ChangeType.MODIFIED, TABLE);

    expect(out.stroke?.dashing.case).toBe('pattern');
    expect(out.stroke?.dashing.value).toBe(StrokePattern.DELTA);
    expect(out.fill?.paint.case === 'color' && out.fill.paint.value.value).toBe('#0000ff');
    expect(out.fill?.opacity).toBeCloseTo(0.18, 6);
  });

  test('ADDED marks the stroke with pluses', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { dashing: { case: 'customDasharray', value: '2,3' } }),
    });

    const out = recolorShape(glyph, ChangeType.ADDED, TABLE);

    expect(out.stroke?.dashing.value).toBe(StrokePattern.PLUS);
  });

  test('UNCHANGED keeps the author\'s own dashing', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { dashing: { case: 'customDasharray', value: '2,3' } }),
    });

    const out = recolorShape(glyph, ChangeType.UNCHANGED, TABLE);

    expect(out.stroke?.dashing.case).toBe('customDasharray');
    expect(out.stroke?.dashing.value).toBe('2,3');
  });

  test('geometry and stroke metrics are carried through', () => {
    const glyph = create(Glyph2DSchema, {
      cornerRadius: 7,
      stroke: create(StrokeSchema, { width: 3, paint: { case: 'color', value: color('#112233') } }),
      glow: create(GlowSchema, { color: color('#112233'), radius: 9, intensity: 0.5 }),
    });

    const out = recolorShape(glyph, ChangeType.ADDED, TABLE);

    expect(out.cornerRadius).toBe(7);
    expect(out.stroke?.width).toBe(3);
    expect(out.glow?.radius).toBe(9);
    expect(out.glow?.intensity).toBe(0.5);
  });

  // A saturated base colour, so a transform that muted it would be visible.
  test('UNCHANGED keeps its own colour rather than reading the table', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { paint: { case: 'color', value: color('#8ad1ff') } }),
    });

    const out = recolorShape(glyph, ChangeType.UNCHANGED, TABLE);

    expect(out.stroke?.paint.case === 'color' && out.stroke.paint.value.value).toBe('#8ad1ff');
  });

  test('the input is not mutated', () => {
    const glyph = create(Glyph2DSchema, {
      stroke: create(StrokeSchema, { paint: { case: 'color', value: color('#112233') } }),
    });

    recolorShape(glyph, ChangeType.ADDED, TABLE);

    expect(glyph.stroke?.paint.case === 'color' && glyph.stroke.paint.value.value).toBe('#112233');
  });
});

describe('recolorLine', () => {
  test('replaces stroke and glow colours', () => {
    const glyph = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, { paint: { case: 'color', value: color('#112233') } }),
      glow: create(GlowSchema, { color: color('#445566') }),
    });

    const out = recolorLine(glyph, ChangeType.MODIFIED, TABLE);

    expect(out.stroke?.paint.case === 'color' && out.stroke.paint.value.value).toBe('#0000ff');
    expect(out.glow?.color?.value).toBe('#0000ff');
  });

  // A Glyph1D has no fill, so ghosting is one edit here rather than two.
  test('DELETED marks the stroke with minuses and invents no fill', () => {
    const glyph = create(Glyph1DSchema, { stroke: create(StrokeSchema, {}) });

    const out = recolorLine(glyph, ChangeType.DELETED, TABLE);

    expect(out.stroke?.dashing.case).toBe('pattern');
    expect(out.stroke?.dashing.value).toBe(StrokePattern.MINUS);
    expect('fill' in out).toBe(false);
  });

  test('DELETED creates no stroke when there was none', () => {
    expect(recolorLine(create(Glyph1DSchema, {}), ChangeType.DELETED, TABLE).stroke).toBeUndefined();
  });

  // MODIFIED takes whichever quadrant added and removed do not claim; from an
  // azure base that is magenta.
  test('rotate mode is used when no table is supplied', () => {
    const glyph = create(Glyph1DSchema, {
      stroke: create(StrokeSchema, { paint: { case: 'color', value: color('#8ad1ff') } }),
    });

    const out = recolorLine(glyph, ChangeType.MODIFIED, undefined);

    expect(out.stroke?.paint.case === 'color' && out.stroke.paint.value.value).toBe('#f38aff');
  });
});
