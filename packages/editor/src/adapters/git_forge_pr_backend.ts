// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import { Comment, CommentSchema, CommentThread, CommentThreadSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson, toJson } from '@archeglyph/proto/util/json';
import { CommentBackend, ThreadEntry } from './comment_backend';
import { AdapterError } from './host_adapter';
import { Ok, Result } from '@archeglyph/proto/util/result';
import { GitForge, RawComment } from './git_forge';
import { init } from '@archeglyph/proto/util/init';

interface Envelope {
  schema_version: number;
  kind: string;
  edit_ref: string;
  payload: unknown;
}

function extractEnvelopes(body: string): Envelope[] {
  const results: Envelope[] = [];
  const re: RegExp = /```archeglyph\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    try {
      const parsed: unknown = JSON.parse(match[1]);
      results.push(parsed as Envelope);
    } catch (_e: unknown) {
      // skip malformed JSON blocks
    }
  }
  return results;
}

export class GitForgePrBackend implements CommentBackend {
  forge: GitForge;
  pr: string;

  constructor(forge: GitForge, pr: string) {
    this.forge = forge;
    this.pr = pr;
  }

  async fetchThreads(): Promise<Result<Array<ThreadEntry>, AdapterError>> {
    const rawComments: RawComment[] = await this.forge.fetchPrComments(this.pr);
    const threadMap: Map<string, Comment[]> = new Map<string, Comment[]>();
    for (const rawComment of rawComments) {
      const envelopes: Envelope[] = extractEnvelopes(rawComment.body);
      for (const env of envelopes) {
        if (env.schema_version !== 1 || env.kind !== 'comment') {
          continue;
        }
        const comment: Comment = fromJson(CommentSchema, JSON.stringify(env.payload));
        const existing: Comment[] | undefined = threadMap.get(env.edit_ref);
        if (existing !== undefined) {
          existing.push(comment);
        } else {
          threadMap.set(env.edit_ref, [comment]);
        }
      }
    }
    const entries: ThreadEntry[] = [];
    for (const [editRef, comments] of threadMap.entries()) {
      const thread: CommentThread = create(CommentThreadSchema, { comments });
      entries.push(init(new ThreadEntry(), { editRef, thread }));
    }
    return Ok(entries);
  }

  async postComment(editRef: string, comment: Comment): Promise<Result<void, AdapterError>> {
    const commentJsonStr: string = toJson(CommentSchema, comment);
    const commentJsonObj: unknown = JSON.parse(commentJsonStr);
    const envelope: Envelope = { schema_version: 1, kind: 'comment', edit_ref: editRef, payload: commentJsonObj };
    const envelopeStr: string = JSON.stringify(envelope, null, 2);
    const mdBody: string = [
      comment.body,
      '',
      '<details><summary>archeglyph metadata</summary>',
      '',
      '```archeglyph',
      envelopeStr,
      '```',
      '',
      '</details>',
    ].join('\n');
    await this.forge.postPrComment(this.pr, mdBody);
    return Ok(undefined);
  }
}
