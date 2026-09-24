// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { pendingMeta, type PendingItem } from './pending_model';

const item = (changeCount: number, comments: number): PendingItem => ({
  id: 'x', description: 'd', author: 'ai:claude', changeCount,
  comments: Array.from({ length: comments }, () => ({}) as never),
});

describe('a proposal summarises itself in one line', () => {
  test('the parts are separated, not run together', () => {
    expect(pendingMeta(item(3, 2))).toBe('ai:claude · 3 changes · 2 comments');
  });

  test('one of a thing is singular', () => {
    expect(pendingMeta(item(1, 1))).toBe('ai:claude · 1 change · 1 comment');
  });

  test('none of a thing is plural', () => {
    expect(pendingMeta(item(0, 0))).toBe('ai:claude · 0 changes · 0 comments');
  });
});
