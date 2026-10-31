// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { escapeLabel, labelOf } from './mermaid_text';

describe('escapeLabel', () => {
  test('escapes # to its entity code', () => {
    expect(escapeLabel('a#b')).toBe('a#35;b');
  });

  test('escapes double quotes', () => {
    expect(escapeLabel('say "hi"')).toBe('say #quot;hi#quot;');
  });

  test('escapes angle brackets', () => {
    expect(escapeLabel('<b>')).toBe('#lt;b#gt;');
  });

  test('escapes ampersand', () => {
    expect(escapeLabel('a & b')).toBe('a #amp; b');
  });

  test('escapes backtick', () => {
    expect(escapeLabel('`x`')).toBe('#96;x#96;');
  });

  test('turns a newline into one space', () => {
    expect(escapeLabel('a\nb')).toBe('a b');
  });

  test('turns a CRLF into one space', () => {
    expect(escapeLabel('a\r\nb')).toBe('a b');
  });

  test('turns a lone carriage return into one space', () => {
    expect(escapeLabel('a\rb')).toBe('a b');
  });

  test('turns U+2028 and U+2029 into one space each', () => {
    expect(escapeLabel('a\u2028b')).toBe('a b');
    expect(escapeLabel('a\u2029b')).toBe('a b');
  });

  test('passes semicolons through unchanged', () => {
    expect(escapeLabel('a;b')).toBe('a;b');
  });

  test('escapes # first so entity codes are not re-escaped', () => {
    expect(escapeLabel('"')).toBe('#quot;');
    expect(escapeLabel('"')).not.toContain('#35;');
  });
});

describe('labelOf', () => {
  test('returns the fallback when there are no localizations', () => {
    expect(labelOf([], 'x:y')).toBe('x:y');
  });

  test('returns the source of a one-entry list', () => {
    const label = [create(LocalizationSchema, { locale: 'en', source: 'A' })];
    expect(labelOf(label, 'x:y')).toBe('A');
  });

  test('returns an empty source as empty, not the fallback', () => {
    const label = [create(LocalizationSchema, { locale: 'en', source: '' })];
    expect(labelOf(label, 'x:y')).toBe('');
  });
});
