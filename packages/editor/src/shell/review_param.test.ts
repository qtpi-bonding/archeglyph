// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { readUrlParams, reviewOpen } from './url_params';

const params = (search: string, hash = '') => readUrlParams({ search, hash });

describe('the review panel can be opened by link', () => {
  test('review=open opens it', () => {
    expect(reviewOpen(params('?review=open'))).toBe(true);
  });

  test('it stays shut by default, and for any other value', () => {
    expect(reviewOpen(params(''))).toBe(false);
    expect(reviewOpen(params('?review=1'))).toBe(false);
    expect(reviewOpen(params('?review=closed'))).toBe(false);
  });

  test('the fragment wins, like every other parameter', () => {
    expect(reviewOpen(params('?review=closed', '#review=open'))).toBe(true);
  });
});
