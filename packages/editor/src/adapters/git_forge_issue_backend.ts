// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { Comment, CommentSchema, CommentThread, CommentThreadSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson, toJson } from '@archeglyph/proto/util/json';
import { CommentBackend, ThreadEntry } from './comment_backend';
import { GitForge, RawComment } from './git_forge';

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

export class GitForgeIssueBackend implements CommentBackend {
  forge: GitForge;
  issue: string;

  constructor(forge: GitForge, issue: string) {
    this.forge = forge;
    this.issue = issue;
  }

  async fetchThreads(): Promise<Array<ThreadEntry>> {
    const rawComments: Array<RawComment> = await this.forge.fetchIssueComments(this.issue);
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
      entries.push(Object.assign(new ThreadEntry(), { editRef, thread }));
    }
    return entries;
  }

  async postComment(editRef: string, comment: Comment): Promise<void> {
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
      '',
      `[💬 Discuss in archeglyph](https://archeglyph.dev/edit?issue=${this.issue})`,
    ].join('\n');
    await this.forge.postIssueComment(this.issue, mdBody);
  }
}
