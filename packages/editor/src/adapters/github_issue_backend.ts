// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { Comment, CommentSchema, CommentThread, CommentThreadSchema } from '@archeglyph/proto/gen/style_pb';
import { CommentBackend, ThreadEntry } from './comment_backend';
import { GitHubAuth } from './github_auth';

const GITHUB_API: string = 'https://api.github.com';
const FENCE_RE: RegExp = /```archeglyph\n([\s\S]*?)```/;

interface CommentPayload {
  id: string;
  author: string | null;
  timestamp_ms: number;
  body: string;
  reply_to: string | null;
}

interface CommentEnvelope {
  schema_version: number;
  kind: string;
  edit_ref: string;
  payload: CommentPayload;
}

function parseEnvelope(body: string): CommentEnvelope | null {
  const match: RegExpExecArray | null = FENCE_RE.exec(body);
  if (match === null) {
    return null;
  } else {
    try {
      const parsed: CommentEnvelope = JSON.parse(match[1]) as CommentEnvelope;
      if (parsed.schema_version !== 1 || parsed.kind !== 'comment') {
        return null;
      } else {
        return parsed;
      }
    } catch {
      return null;
    }
  }
}

function groupIntoThreads(envelopes: CommentEnvelope[]): Array<ThreadEntry> {
  const threads: Map<string, Comment[]> = new Map<string, Comment[]>();
  for (const env of envelopes) {
    const author: string | undefined = env.payload.author !== null ? env.payload.author : undefined;
    const replyTo: string | undefined = env.payload.reply_to !== null ? env.payload.reply_to : undefined;
    const comment: Comment = create(CommentSchema, {
      id: env.payload.id,
      author,
      timestampMs: BigInt(env.payload.timestamp_ms),
      body: env.payload.body,
      replyTo,
    });
    const existing: Comment[] | undefined = threads.get(env.edit_ref);
    threads.set(env.edit_ref, existing !== undefined ? existing.concat([comment]) : [comment]);
  }
  let result: Array<ThreadEntry> = [];
  for (const editRef of threads.keys()) {
    const comments: Comment[] = threads.get(editRef) ?? [];
    const thread: CommentThread = create(CommentThreadSchema, { comments });
    result = result.concat([Object.assign(new ThreadEntry(), { editRef, thread })]);
  }
  return result;
}

function buildCommentBody(editRef: string, comment: Comment): string {
  const payload: CommentPayload = {
    id: comment.id,
    author: comment.author ?? null,
    timestamp_ms: Number(comment.timestampMs),
    body: comment.body,
    reply_to: comment.replyTo ?? null,
  };
  const envelope: CommentEnvelope = {
    schema_version: 1,
    kind: 'comment',
    edit_ref: editRef,
    payload,
  };
  const json: string = JSON.stringify(envelope, null, 2);
  return `${comment.body}\n\n<details><summary>archeglyph metadata</summary>\n\n\`\`\`archeglyph\n${json}\n\`\`\`\n\n</details>`;
}

export class GitHubIssueBackend implements CommentBackend {
  private readonly auth: GitHubAuth;
  private readonly owner: string;
  private readonly repo: string;
  private readonly issueNumber: number;

  constructor(auth: GitHubAuth, issue: string) {
    const parts: string[] = issue.split('/');
    this.auth = auth;
    this.owner = parts[0];
    this.repo = parts[1];
    this.issueNumber = Number.parseInt(parts[2], 10);
  }

  async fetchThreads(): Promise<Array<ThreadEntry>> {
    const token: string | null = this.auth.getToken();
    const headers: Record<string, string> = token !== null
      ? { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}` }
      : { 'Accept': 'application/vnd.github+json' };
    const resp: Response = await fetch(
      `${GITHUB_API}/repos/${this.owner}/${this.repo}/issues/${this.issueNumber}/comments`,
      { headers },
    );
    const items: Array<{ body: string }> = await resp.json() as Array<{ body: string }>;
    const envelopes: CommentEnvelope[] = items
      .map((item: { body: string }): CommentEnvelope | null => parseEnvelope(item.body))
      .filter((env: CommentEnvelope | null): boolean => env !== null) as CommentEnvelope[];
    return groupIntoThreads(envelopes);
  }

  async postComment(editRef: string, comment: Comment): Promise<void> {
    const token: string | null = this.auth.getToken();
    const headers: Record<string, string> = token !== null
      ? { 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
    const body: string = buildCommentBody(editRef, comment);
    await fetch(
      `${GITHUB_API}/repos/${this.owner}/${this.repo}/issues/${this.issueNumber}/comments`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ body }),
      },
    );
  }
}
