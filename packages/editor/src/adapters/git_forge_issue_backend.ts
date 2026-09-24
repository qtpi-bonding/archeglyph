// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import { Comment, CommentSchema, CommentThread, CommentThreadSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson, toJson } from '@archeglyph/proto/util/json';
import { CommentBackend, ThreadFetch } from './comment_backend';
import { envelopeFor, threadsFrom } from './comment_envelope';
import { AdapterError } from './host_adapter';
import { Ok, Result } from '@archeglyph/proto/util/result';
import { GitForge, RawComment } from './git_forge';
import { init } from '@archeglyph/proto/util/init';

export class GitForgeIssueBackend implements CommentBackend {
  forge: GitForge;
  issue: string;

  constructor(forge: GitForge, issue: string) {
    this.forge = forge;
    this.issue = issue;
  }

  async fetchThreads(): Promise<Result<ThreadFetch, AdapterError>> {
    return Ok(threadsFrom(await this.forge.fetchIssueComments(this.issue)));
  }

  async postComment(editRef: string, comment: Comment): Promise<Result<void, AdapterError>> {
    const commentJsonStr: string = toJson(CommentSchema, comment);
    const commentJsonObj: unknown = JSON.parse(commentJsonStr);
    const envelope = envelopeFor(editRef, commentJsonObj);
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
    return Ok(undefined);
  }
}
