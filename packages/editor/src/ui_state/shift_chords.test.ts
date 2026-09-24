// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { resolveChord } from './keymap';

describe('shift chords, as a browser reports them', () => {
  test('Shift+S reaches ring-prev', () => {
    expect(resolveChord({ key: 'S', metaKey: false, ctrlKey: false, shiftKey: true })).toBe('ring-prev');
  });

  test('Cmd+Shift+Z reaches redo', () => {
    expect(resolveChord({ key: 'Z', metaKey: true, ctrlKey: false, shiftKey: true })).toBe('redo');
  });

  test('an unshifted letter still reaches its own command', () => {
    expect(resolveChord({ key: 's', metaKey: false, ctrlKey: false, shiftKey: false })).toBe('ring-next');
    expect(resolveChord({ key: 'v', metaKey: false, ctrlKey: false, shiftKey: false })).toBe('tool-select');
  });

  test('a named key is unaffected', () => {
    expect(resolveChord({ key: 'ArrowUp', metaKey: false, ctrlKey: false, shiftKey: false })).toBe('nudge-up');
    expect(resolveChord({ key: 'Escape', metaKey: false, ctrlKey: false, shiftKey: false })).toBe('escape');
  });

  test('shift is still exact: a shifted letter does not reach the unshifted command', () => {
    expect(resolveChord({ key: 'V', metaKey: false, ctrlKey: false, shiftKey: true })).toBeUndefined();
  });

  test('the diff keys are unshifted, and Cmd+D still duplicates', () => {
    expect(resolveChord({ key: 'd', metaKey: false, ctrlKey: false, shiftKey: false })).toBe('toggle-diff');
    expect(resolveChord({ key: 'x', metaKey: false, ctrlKey: false, shiftKey: false })).toBe('swap-diff-direction');
    expect(resolveChord({ key: 'd', metaKey: true, ctrlKey: false, shiftKey: false })).toBe('duplicate');
    expect(resolveChord({ key: 'D', metaKey: false, ctrlKey: false, shiftKey: true })).toBeUndefined();
    expect(resolveChord({ key: 'X', metaKey: false, ctrlKey: false, shiftKey: true })).toBeUndefined();
  });
});
