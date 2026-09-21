// SPDX-License-Identifier: AGPL-3.0-or-later

import { BrowserFsAdapter } from '../adapters/browser_fs_adapter';
import { UrlParamAdapter, buildRemoteUrl } from '../adapters/url_param_adapter';
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
    return init(new AdapterPair(), { adapter });
  }
  const adapter: HostAdapter = new BrowserFsAdapter();
  return init(new AdapterPair(), { adapter });
}

export class AdapterPair {
  adapter!: HostAdapter;
  backend?: CommentBackend;
}
