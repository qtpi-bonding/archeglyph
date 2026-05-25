// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { Comment, CommentSchema, CommentThread, CommentThreadSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson, toJson } from '@archeglyph/proto/util/json';
import { CommentBackend, ThreadEntry } from './comment_backend';
import { GitHubAuth } from './github_auth';

const GITHUB_API: string = 'https://api.github.com';

interface PrParts {
  owner: string;
  repo: string;
  number: string;
}

interface GhPrComment {
  body: string;
}

interface Envelope {
  schema_version: number;
  kind: string;
  edit_ref: string;
  payload: unknown;
}

function parsePr(pr: string): PrParts {
  const parts: string[] = pr.split('/');
  return { owner: parts[0], repo: parts[1], number: parts[2] };
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

export class GitHubPrBackend implements CommentBackend {
  auth: GitHubAuth;
  pr: string;

  constructor(auth: GitHubAuth, pr: string) {
    this.auth = auth;
    this.pr = pr;
  }

  async fetchThreads(): Promise<Array<ThreadEntry>> {
    const parts: PrParts = parsePr(this.pr);
    const url: string = `${GITHUB_API}/repos/${parts.owner}/${parts.repo}/pulls/${parts.number}/comments`;
    const token: string | null = this.auth.getToken();
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' };
    if (token !== null) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const resp: Response = await fetch(url, { headers });
    const ghComments: GhPrComment[] = await resp.json() as GhPrComment[];
    const threadMap: Map<string, Comment[]> = new Map<string, Comment[]>();
    for (const ghComment of ghComments) {
      const envelopes: Envelope[] = extractEnvelopes(ghComment.body);
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
    const parts: PrParts = parsePr(this.pr);
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
      `[💬 Discuss in archeglyph](https://archeglyph.dev/edit?pr=${this.pr})`,
    ].join('\n');
    const url: string = `${GITHUB_API}/repos/${parts.owner}/${parts.repo}/issues/${parts.number}/comments`;
    const token: string | null = this.auth.getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    if (token !== null) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: mdBody }),
    });
  }
}
