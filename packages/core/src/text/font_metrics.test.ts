// SPDX-License-Identifier: MPL-2.0

// Tests for deterministic label measurement (packages/core/src/text/font_metrics).
// Per .archegraph/specs/font_metrics/font_metrics.spec.textproto: this is a
// SINGLE uniform monospace advance-width ratio (0.6 * size per character),
// not a per-character advance table — there is deliberately no fallback
// case for "a character absent from the table" because no such table
// exists; every character (any Unicode code unit, since `text.length` is
// used) is measured identically. That is a documented design choice, not
// a gap in this implementation, so this suite tests the uniform-ratio
// behavior instead of a table-lookup fallback.
//
// Expectations are derived from the spec's doc field, not from reading the
// implementation body.

import { describe, expect, test } from 'bun:test';
import {
  LINE_HEIGHT_RATIO,
  MONOSPACE_ADVANCE_WIDTH_RATIO,
  measureLabel,
} from './font_metrics';

const FONT = 'Noto Sans Mono';

describe('constants', () => {
  test('MONOSPACE_ADVANCE_WIDTH_RATIO is 0.6 per spec', () => {
    expect(MONOSPACE_ADVANCE_WIDTH_RATIO).toBe(0.6);
  });

  test('LINE_HEIGHT_RATIO is 1.2 per spec', () => {
    expect(LINE_HEIGHT_RATIO).toBe(1.2);
  });
});

describe('measureLabel', () => {
  test('empty string has zero width, one line of height', () => {
    const m = measureLabel('', FONT, 10);
    expect(m.x).toBe(0);
    expect(m.y).toBeCloseTo(1 * LINE_HEIGHT_RATIO * 10, 9);
  });

  test('single character matches the formula exactly', () => {
    const m = measureLabel('a', FONT, 10);
    expect(m.x).toBeCloseTo(1 * MONOSPACE_ADVANCE_WIDTH_RATIO * 10, 9);
    expect(m.y).toBeCloseTo(LINE_HEIGHT_RATIO * 10, 9);
  });

  test('worked example: "hello" at size 10', () => {
    const m = measureLabel('hello', FONT, 10);
    expect(m.x).toBeCloseTo(5 * 0.6 * 10, 9); // 30
    expect(m.y).toBeCloseTo(1.2 * 10, 9); // 12
  });

  test('longer text measures wider than shorter text at the same size', () => {
    const short = measureLabel('hi', FONT, 12);
    const long = measureLabel('hello world', FONT, 12);
    expect(long.x).toBeGreaterThan(short.x);
  });

  test('doubling font size approximately doubles both dimensions', () => {
    const base = measureLabel('label text', FONT, 10);
    const doubled = measureLabel('label text', FONT, 20);
    expect(doubled.x).toBeCloseTo(2 * base.x, 9);
    expect(doubled.y).toBeCloseTo(2 * base.y, 9);
  });

  test('width scales linearly with text length for a fixed size', () => {
    const one = measureLabel('a', FONT, 14);
    const ten = measureLabel('aaaaaaaaaa', FONT, 14);
    expect(ten.x).toBeCloseTo(10 * one.x, 9);
  });

  test('whitespace characters count toward width like any other character', () => {
    const withSpaces = measureLabel('a b', FONT, 10); // length 3
    const noSpaces = measureLabel('abc', FONT, 10); // length 3
    expect(withSpaces.x).toBeCloseTo(noSpaces.x, 9);
  });

  test('a character with no dedicated advance-width entry measures identically to any other (uniform monospace ratio, no per-char table)', () => {
    // Spec is explicit: there is no per-character table; font is accepted
    // but unused, and every char (ASCII, unicode, symbol) is one advance
    // width. Use a character well outside ASCII to probe this.
    const ascii = measureLabel('x', FONT, 10);
    const unicode = measureLabel('é', FONT, 10); // 'é'
    const emoji = measureLabel('\u{1f600}', FONT, 10); // grinning face (2 UTF-16 code units)
    expect(unicode.x).toBeCloseTo(ascii.x, 9);
    // Note: measureLabel uses `.length`, which counts UTF-16 code units, so
    // an astral character (surrogate pair) measures as width 2, not 1. This
    // documents that behavior rather than asserting it's "wrong" -- it
    // follows directly from the spec's stated formula (text.length * ratio
    // * size) with no code-point-aware handling described anywhere in the
    // spec.
    expect(emoji.x).toBeCloseTo(2 * ascii.x, 9);
  });

  test('font parameter is accepted but does not change the measurement (unused today, per spec)', () => {
    const a = measureLabel('sample', 'Noto Sans Mono', 12);
    const b = measureLabel('sample', 'Some Other Font', 12);
    expect(a).toEqual(b);
  });

  test('multi-line text: width is the longest line, height scales with line count', () => {
    const m = measureLabel('a\nbb\nccc', FONT, 10);
    // Longest line is 'ccc' (length 3).
    expect(m.x).toBeCloseTo(3 * MONOSPACE_ADVANCE_WIDTH_RATIO * 10, 9);
    // 3 lines.
    expect(m.y).toBeCloseTo(3 * LINE_HEIGHT_RATIO * 10, 9);
  });

  test('multi-line text height is proportional to line count, not text length', () => {
    const twoLines = measureLabel('a\nb', FONT, 10);
    const fiveLines = measureLabel('a\nb\nc\nd\ne', FONT, 10);
    expect(fiveLines.y).toBeCloseTo((5 / 2) * twoLines.y, 9);
  });

  test('trailing newline produces an extra (empty) line', () => {
    const withTrailing = measureLabel('a\n', FONT, 10);
    // 'a\n'.split('\n') === ['a', ''] -> 2 lines.
    expect(withTrailing.y).toBeCloseTo(2 * LINE_HEIGHT_RATIO * 10, 9);
    expect(withTrailing.x).toBeCloseTo(1 * MONOSPACE_ADVANCE_WIDTH_RATIO * 10, 9);
  });

  test('zero font size collapses both dimensions to zero', () => {
    const m = measureLabel('hello', FONT, 0);
    expect(m.x).toBe(0);
    expect(m.y).toBe(0);
  });

  test('negative font size is not clamped -- reflected straight through the formula', () => {
    // Spec gives no clamping/validation rule, so this documents the
    // unclamped linear-formula behavior rather than asserting a particular
    // "correct" defensive behavior that isn't in the spec.
    const positive = measureLabel('hi', FONT, 10);
    const negative = measureLabel('hi', FONT, -10);
    expect(negative.x).toBeCloseTo(-positive.x, 9);
    expect(negative.y).toBeCloseTo(-positive.y, 9);
  });
});
