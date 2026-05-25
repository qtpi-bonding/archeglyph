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

}
