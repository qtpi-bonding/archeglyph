// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { readUrlParams, reviewOpen, selectedProposal } from './url_params';

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

describe('a link can open one proposal expanded', () => {
  test('proposal=<id> selects it', () => {
    expect(selectedProposal(params('?proposal=a1b2c3d4e5f60001'))).toBe('a1b2c3d4e5f60001');
  });

  test('absent or empty selects nothing', () => {
    expect(selectedProposal(params(''))).toBeUndefined();
    expect(selectedProposal(params('?proposal='))).toBeUndefined();
  });

  test('the fragment wins, like every other parameter', () => {
    expect(selectedProposal(params('?proposal=aaa', '#proposal=bbb'))).toBe('bbb');
  });
});
