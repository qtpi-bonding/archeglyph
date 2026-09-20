// SPDX-License-Identifier: AGPL-3.0-or-later

import { createSignal } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { BrowserFsAdapter } from '../adapters/browser_fs_adapter';
import { UrlParamAdapter, buildRemoteUrl } from '../adapters/url_param_adapter';
import { FileBackend } from '../adapters/file_backend';
import { GitHubForge } from '../adapters/github_forge';
import { GitForgePrBackend } from '../adapters/git_forge_pr_backend';
import { GitForgeIssueBackend } from '../adapters/git_forge_issue_backend';
import type { CommentBackend } from '../adapters/comment_backend';
import type { HostAdapter } from '../adapters/host_adapter';
import { init } from '@archeglyph/proto/util/init';

export function selectAdapters(params: URLSearchParams): AdapterPair {
  const pr: string | null = params.get('pr');
  if (pr !== null) {
    const adapter: HostAdapter = new UrlParamAdapter(params.get('d'), params.get('s'), buildRemoteUrl(params));
    const backend: CommentBackend = new GitForgePrBackend(new GitHubForge(), pr);
    return init(new AdapterPair(), { adapter, backend });
  }
  const issue: string | null = params.get('issue');
  if (issue !== null) {
    const adapter: HostAdapter = new UrlParamAdapter(params.get('d'), params.get('s'), buildRemoteUrl(params));
    const backend: CommentBackend = new GitForgeIssueBackend(new GitHubForge(), issue);
    return init(new AdapterPair(), { adapter, backend });
  }
  if (params.has('fetch') || params.has('gh') || params.has('d') || params.has('s')) {
    const adapter: HostAdapter = new UrlParamAdapter(params.get('d'), params.get('s'), buildRemoteUrl(params));
    const [noopGet, noopSet] = createSignal<Stylesheet>(create(StylesheetSchema, {}));
    const backend: CommentBackend = new FileBackend(noopGet, noopSet);
    return init(new AdapterPair(), { adapter, backend });
  }
  const adapter: HostAdapter = new BrowserFsAdapter();
  const [noopGet, noopSet] = createSignal<Stylesheet>(create(StylesheetSchema, {}));
  const backend: CommentBackend = new FileBackend(noopGet, noopSet);
  return init(new AdapterPair(), { adapter, backend });
}

export class AdapterPair {
  adapter!: HostAdapter;
  backend!: CommentBackend;
}
