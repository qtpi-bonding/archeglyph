// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import { Comment, CommentSchema, CommentThreadSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { init } from '@archeglyph/proto/util/init';
import { ThreadEntry, ThreadFetch, UnreadableComment } from './comment_backend';
import { RawComment } from './git_forge';

export interface Envelope {
  schema_version: number;
  kind: string;
  edit_ref: string;
  payload: unknown;
}

const FENCE: RegExp = /```archeglyph\n([\s\S]*?)```/g;

/** The envelope the editor writes, and reads back from a forge comment. */
export function envelopeFor(editRef: string, payload: unknown): Envelope {
  return { schema_version: 1, kind: 'comment', edit_ref: editRef, payload };
}

function reasonFor(error: unknown): string {
  const message: string = error instanceof Error ? error.message : String(error);
  return message.length > 160 ? `${message.slice(0, 157)}...` : message;
}

/**
 * Every archeglyph block across a forge's comments, as threads.
 *
 * A comment that carries a block the editor did not use is reported rather
 * than dropped. These are hand-written in a pull request, so a stray line
 * break inside a JSON string is the common case, and silently showing
 * nothing gives the author no way to tell a typo from a thread that has not
 * loaded yet.
 */
export function threadsFrom(rawComments: ReadonlyArray<RawComment>): ThreadFetch {
  const byRef: Map<string, Array<Comment>> = new Map<string, Array<Comment>>();
  const unreadable: Array<UnreadableComment> = [];

  const reject = (author: string | undefined, reason: string): void => {
    unreadable.push(init(new UnreadableComment(), { author, reason }));
  };

  for (const rawComment of rawComments) {
    FENCE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FENCE.exec(rawComment.body)) !== null) {
      let envelope: Envelope;
      try {
        envelope = JSON.parse(match[1]) as Envelope;
      } catch (error: unknown) {
        reject(rawComment.author, `the block is not valid JSON (${reasonFor(error)})`);
        continue;
      }
      if (envelope.schema_version !== 1) {
        reject(rawComment.author, `schema_version ${String(envelope.schema_version)} is not one this editor reads`);
        continue;
      }
      if (envelope.kind !== 'comment') {
        reject(rawComment.author, `kind "${String(envelope.kind)}" is not one this editor reads`);
        continue;
      }
      let comment: Comment;
      try {
        comment = fromJson(CommentSchema, JSON.stringify(envelope.payload));
      } catch (error: unknown) {
        reject(rawComment.author, `its payload is not a comment (${reasonFor(error)})`);
        continue;
      }
      const existing: Array<Comment> | undefined = byRef.get(envelope.edit_ref);
      if (existing !== undefined) {
        existing.push(comment);
      } else {
        byRef.set(envelope.edit_ref, [comment]);
      }
    }
  }

  const entries: Array<ThreadEntry> = [];
  for (const [editRef, comments] of byRef.entries()) {
    entries.push(init(new ThreadEntry(), {
      editRef,
      thread: create(CommentThreadSchema, { comments }),
    }));
  }
  return init(new ThreadFetch(), { entries, unreadable });
}

/** One line for the review panel, naming what to go and fix. */
export function unreadableMessage(unreadable: ReadonlyArray<UnreadableComment>): string | undefined {
  if (unreadable.length === 0) {
    return undefined;
  }
  const first: UnreadableComment = unreadable[0]!;
  const who: string = first.author === undefined || first.author === '' ? 'A comment' : `${first.author}'s comment`;
  const rest: string = unreadable.length === 1
    ? ''
    : ` (and ${String(unreadable.length - 1)} other${unreadable.length === 2 ? '' : 's'})`;
  return `${who}${rest} carries an archeglyph block the editor could not read: ${first.reason}.`;
}
