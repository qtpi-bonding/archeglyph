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

export class GitForgePrBackend implements CommentBackend {
  forge: GitForge;
  pr: string;

  constructor(forge: GitForge, pr: string) {
    this.forge = forge;
    this.pr = pr;
  }

  async fetchThreads(): Promise<Result<ThreadFetch, AdapterError>> {
    return Ok(threadsFrom(await this.forge.fetchPrComments(this.pr)));
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
    ].join('\n');
    await this.forge.postPrComment(this.pr, mdBody);
    return Ok(undefined);
  }
}
