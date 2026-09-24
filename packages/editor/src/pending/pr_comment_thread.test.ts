// SPDX-License-Identifier: MPL-2.0

import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fromJson } from '@archeglyph/proto/util/json';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { GitForgePrBackend } from '../adapters/git_forge_pr_backend';
import { mergeThreads } from './merge_threads';
import { pendingItems } from './pending_model';

const body = (text: string, editRef: string, id: string, author: string): string => {
  const envelope = {
    schema_version: 1, kind: 'comment', edit_ref: editRef,
    payload: { id, author, timestampMs: String(Date.now()), body: text },
  };
  return [text, '', '<details><summary>archeglyph metadata</summary>', '',
    '```archeglyph', JSON.stringify(envelope, null, 2), '```', '', '</details>'].join('\n');
};

const forge = {
  isAuthenticated: (): boolean => false,
  getToken: (): string | null => null,
  authenticate: async (): Promise<void> => {},
  fetchPrComments: async () => [
    { id: '1', body: body('Amber reads as outside the trust boundary.', 'a1b2c3d4e5f60001', 'c00000000000ff01', 'user:reviewer'), author: 'reviewer' },
    { id: '2', body: body('Swapping these shortens the egress hop.', 'a1b2c3d4e5f60002', 'c00000000000ff02', 'user:reviewer'), author: 'reviewer' },
    { id: '3', body: body('Anchor it to the group instead.', 'a1b2c3d4e5f60003', 'c00000000000ff03', 'ai:claude'), author: 'claude' },
  ],
  postPrComment: async (): Promise<void> => {},
  fetchIssueComments: async () => [],
  postIssueComment: async (): Promise<void> => {},
};

// The seam between a forge comment and a pending edit: the editor finds its
// own envelope inside a human-written markdown body and threads it by edit_ref.
test('a review comment threads onto the pending edit its envelope names', async () => {
  const sheet = fromJson(StylesheetSchema, readFileSync('examples/stack-managed.style.json', 'utf8'));
  expect(pendingItems(sheet).map((i) => i.comments.length)).toEqual([2, 1, 1]);

  const threads = await new GitForgePrBackend(forge, 'qtpi-bonding/archeglyph/1').fetchThreads();
  expect(threads.kind).toBe('ok');

  const after = pendingItems(mergeThreads(sheet, threads.kind === 'ok' ? threads.value.entries : []));
  expect(after.map((i) => i.comments.length)).toEqual([3, 2, 2]);
  expect(after[0]!.comments.at(-1)!.body).toContain('trust boundary');
});
