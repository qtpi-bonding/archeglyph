// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';

import { beginModalGesture } from '../ui_state/modal_gesture';
import { echoChord, echoFor, gestureTokens } from './key_echo';

const press = (key: string, modifiers: Partial<{ metaKey: boolean; shiftKey: boolean }> = {}) => ({
  key,
  metaKey: modifiers.metaKey ?? false,
  ctrlKey: false,
  shiftKey: modifiers.shiftKey ?? false,
});

const text = (tokens: ReadonlyArray<{ text: string }> | undefined): Array<string> =>
  (tokens ?? []).map((token): string => token.text);

describe('gestureTokens', () => {
  const grab = beginModalGesture('grab', []);

  test('a gesture with nothing typed yet is just its key', () => {
    expect(text(gestureTokens(grab))).toEqual(['g']);
  });

  test('the direction and the digits appear as they are typed', () => {
    expect(text(gestureTokens({ ...grab, direction: 'up' }))).toEqual(['g', '↑']);
    expect(text(gestureTokens({ ...grab, direction: 'up', digits: '12' }))).toEqual(['g', '↑', '12']);
  });

  test('a digit removed by Backspace leaves the line', () => {
    expect(text(gestureTokens({ ...grab, direction: 'up', digits: '1' }))).toEqual(['g', '↑', '1']);
    expect(text(gestureTokens({ ...grab, direction: 'up', digits: '' }))).toEqual(['g', '↑']);
  });

  test('resize is r, and a direction can arrive before any digit', () => {
    const resize = beginModalGesture('resize', []);
    expect(text(gestureTokens({ ...resize, direction: 'right' }))).toEqual(['r', '→']);
  });
});

describe('echoFor', () => {
  test('a command shows its chord and what it did', () => {
    const tokens = echoFor({
      event: press('Backspace'),
      handled: true,
      gestureBefore: false,
      gestureAfter: false,
    });
    expect(text(tokens)).toEqual(['⌫', 'Delete']);
    expect(tokens?.[1]?.muted).toBe(true);
  });

  test('an unbound key shows nothing', () => {
    expect(echoFor({
      event: press('q'),
      handled: false,
      gestureBefore: false,
      gestureAfter: false,
    })).toBeUndefined();
  });

  test('the g that opens a gesture does not also flash', () => {
    expect(echoFor({
      event: press('g'),
      handled: true,
      gestureBefore: false,
      gestureAfter: true,
    })).toBeUndefined();
  });

  test('the Enter that commits a gesture does not echo edit-text', () => {
    // Enter is bound to `edit-text` in the keymap, but inside a gesture it
    // committed instead -- echoing the keymap's answer would name a command
    // that never ran.
    expect(echoFor({
      event: press('Enter'),
      handled: true,
      gestureBefore: true,
      gestureAfter: false,
    })).toBeUndefined();
  });

  test('keys the gesture consumed do not echo either', () => {
    for (const key of ['ArrowUp', 'Backspace', 'Escape', '2']) {
      expect(echoFor({
        event: press(key),
        handled: true,
        gestureBefore: true,
        gestureAfter: true,
      })).toBeUndefined();
    }
  });

  test('a modified chord keeps its modifier', () => {
    expect(text(echoFor({
      event: press('z', { metaKey: true }),
      handled: true,
      gestureBefore: false,
      gestureAfter: false,
    }))).toEqual([echoChord(press('z', { metaKey: true })), 'Undo']);
  });

  test('shift distinguishes two commands on the same key', () => {
    expect(text(echoFor({
      event: press('s', { shiftKey: true }),
      handled: true,
      gestureBefore: false,
      gestureAfter: false,
    }))[1]).toBe('Previous element');
  });
});
