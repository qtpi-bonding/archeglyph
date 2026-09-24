// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { ChangeType } from '@archeglyph/proto/gen/content_pb';
import { diffColorFor } from './diff_color';
import { hueOf } from './hue';

const arc = (a: number, b: number): number => Math.abs((((a - b) % 360) + 540) % 360 - 180);

const BASES = [
  '#8ad1ff', '#73daca', '#bb9af7', '#8b98a9', '#b3c0cf', '#bfe3ff', '#122238', '#0f1a2b',
  '#c0caf5', '#9aa5ce', '#7f8694', '#a7aec0', '#1a1b26',
];

describe('rotate mode keeps its semantics across a whole palette', () => {
  test('added lands nearer green than red, for every base', () => {
    for (const base of BASES) {
      const added = hueOf(diffColorFor(base, ChangeType.ADDED));
      expect({ base, ok: added !== undefined && arc(added, 120) < arc(added, 0) })
        .toEqual({ base, ok: true });
    }
  });

  test('removed lands nearer red than green, for every base', () => {
    for (const base of BASES) {
      const removed = hueOf(diffColorFor(base, ChangeType.DELETED));
      expect({ base, ok: removed !== undefined && arc(removed, 0) < arc(removed, 120) })
        .toEqual({ base, ok: true });
    }
  });

  test('the three change types never collide on one quadrant', () => {
    for (const base of BASES) {
      const hues = [ChangeType.ADDED, ChangeType.MODIFIED, ChangeType.DELETED]
        .map((c) => hueOf(diffColorFor(base, c)));
      expect({ base, distinct: new Set(hues).size }).toEqual({ base, distinct: 3 });
    }
  });

  test('a grey base has no hue to rotate and is returned unchanged', () => {
    for (const grey of ['#000000', '#FFFFFF', '#8A8A8A', '#5a5a5a']) {
      expect(diffColorFor(grey, ChangeType.ADDED)).toBe(grey.toLowerCase());
    }
  });
});
