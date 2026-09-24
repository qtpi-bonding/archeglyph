// SPDX-License-Identifier: MPL-2.0

import { COMMANDS } from '../gestures/commands';
import { formatChord } from './chord_label';
import { resolveChord, type Chord, type CommandId } from '../ui_state/keymap';
import type { ModalGesture } from '../ui_state/modal_gesture';

export interface EchoToken {
  text: string;
  muted?: boolean;
}

export const ECHO_LINGER_MS: number = 1100;

export interface KeyEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

// A glyph reads faster than a word at this size, and the arrow keys have to
// match the direction the gesture is about to move things.
const GLYPHS: ReadonlyMap<string, string> = new Map([
  ['ArrowUp', '↑'],
  ['ArrowDown', '↓'],
  ['ArrowLeft', '←'],
  ['ArrowRight', '→'],
  ['Backspace', '⌫'],
  ['Delete', '⌦'],
  ['Enter', '⏎'],
]);

const DIRECTIONS: ReadonlyMap<string, string> = new Map([
  ['up', '↑'],
  ['down', '↓'],
  ['left', '←'],
  ['right', '→'],
]);

export function echoChord(event: KeyEvent): string {
  const chord: Chord = {
    key: GLYPHS.get(event.key) ?? event.key,
    meta: event.metaKey || event.ctrlKey,
    shift: event.shiftKey,
  };
  return formatChord(chord);
}

/** Omits each part until it exists, so Backspace shrinks the line again. */
export function gestureTokens(gesture: ModalGesture): Array<EchoToken> {
  const tokens: Array<EchoToken> = [{ text: gesture.kind === 'grab' ? 'g' : 'r' }];
  const direction = gesture.direction === undefined ? undefined : DIRECTIONS.get(gesture.direction);
  if (direction !== undefined) {
    tokens.push({ text: direction });
  }
  if (gesture.digits !== '') {
    tokens.push({ text: gesture.digits });
  }
  return tokens;
}

export interface EchoInput {
  event: KeyEvent;
  handled: boolean;
  gestureBefore: boolean;
  gestureAfter: boolean;
}

// Enter inside a gesture commits it, but resolves to `edit-text` in the
// keymap: without gestureBefore the echo names a command that never ran.
export function echoFor(input: EchoInput): Array<EchoToken> | undefined {
  if (!input.handled || input.gestureBefore || input.gestureAfter) {
    return undefined;
  }

  const command: CommandId | undefined = resolveChord(input.event);
  if (command === undefined) {
    return undefined;
  }

  const label: string | undefined = COMMANDS.find(
    (entry): boolean => entry.id === command,
  )?.label;

  const tokens: Array<EchoToken> = [{ text: echoChord(input.event) }];
  if (label !== undefined) {
    tokens.push({ text: label, muted: true });
  }
  return tokens;
}
