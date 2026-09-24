// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { init } from '@archeglyph/proto/util/init';
import { RawComment } from './git_forge';
import { threadsFrom, unreadableMessage } from './comment_envelope';

const raw = (body: string, author?: string): RawComment =>
  init(new RawComment(), { id: '1', body, author });

const fenced = (json: string, prose = 'Looks right to me.'): string =>
  [prose, '', '```archeglyph', json, '```'].join('\n');

const good = JSON.stringify({
  schema_version: 1, kind: 'comment', edit_ref: 'edit-1',
  payload: { id: 'c1', author: 'user:sam', timestampMs: '1758412800000', body: 'Agreed.' },
}, null, 2);

describe('a comment whose archeglyph block reads', () => {
  test('becomes a thread on the edit it names', () => {
    const fetch = threadsFrom([raw(fenced(good))]);

    expect(fetch.unreadable).toEqual([]);
    expect(fetch.entries.length).toBe(1);
    expect(fetch.entries[0]!.editRef).toBe('edit-1');
    expect(fetch.entries[0]!.thread.comments[0]!.body).toBe('Agreed.');
  });

  test('a comment with no block at all is not reported', () => {
    const fetch = threadsFrom([raw('Just a normal review comment.')]);

    expect(fetch.entries).toEqual([]);
    expect(fetch.unreadable).toEqual([]);
  });
});

// Every one of these produced a thread that silently did not appear, which
// is indistinguishable from one that has not loaded yet.
describe('a comment whose archeglyph block does not read is reported', () => {
  test('a line break inside a JSON string -- what a paste actually does', () => {
    const wrapped = good.replace('"body": "Agreed."', '"body": "Agreed\nwith this."');
    const fetch = threadsFrom([raw(fenced(wrapped), 'sam')]);

    expect(fetch.entries).toEqual([]);
    expect(fetch.unreadable.length).toBe(1);
    expect(fetch.unreadable[0]!.author).toBe('sam');
    expect(fetch.unreadable[0]!.reason).toContain('not valid JSON');
  });

  test('a schema version this editor does not read', () => {
    const fetch = threadsFrom([raw(fenced(good.replace('"schema_version": 1', '"schema_version": 9')))]);

    expect(fetch.unreadable[0]!.reason).toContain('schema_version 9');
  });

  test('a kind this editor does not read', () => {
    const fetch = threadsFrom([raw(fenced(good.replace('"kind": "comment"', '"kind": "coment"')))]);

    expect(fetch.unreadable[0]!.reason).toContain('"coment"');
  });

  // This one threw out of fetchThreads rather than being skipped, so the
  // whole load failed, not just the comment.
  test('a payload that is valid JSON but not a comment', () => {
    const fetch = threadsFrom([raw(fenced(good.replace('"timestampMs": "1758412800000"', '"timestampMs": "not-a-number"')))]);

    expect(fetch.entries).toEqual([]);
    expect(fetch.unreadable[0]!.reason).toContain('not a comment');
  });

  test('the readable ones still come through alongside', () => {
    const fetch = threadsFrom([raw(fenced('{ not json')), raw(fenced(good))]);

    expect(fetch.entries.length).toBe(1);
    expect(fetch.unreadable.length).toBe(1);
  });
});

describe('what the panel is told', () => {
  test('nothing, when every block read', () => {
    expect(unreadableMessage([])).toBeUndefined();
  });

  test('the author and the reason, for one', () => {
    const message = unreadableMessage(threadsFrom([raw(fenced('{ not json'), 'sam')]).unreadable)!;

    expect(message).toContain("sam's comment");
    expect(message).toContain('not valid JSON');
    expect(message).not.toContain('other');
  });

  test('a count, for more than one', () => {
    const many = threadsFrom([raw(fenced('{ nope'), 'sam'), raw(fenced('{ nope')), raw(fenced('{ nope'))]);

    expect(unreadableMessage(many.unreadable)!).toContain('and 2 others');
  });
});
