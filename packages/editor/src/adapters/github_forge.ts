// SPDX-License-Identifier: AGPL-3.0-or-later

import { GitForge } from './git_forge';
import { RawComment } from './git_forge';

const TOKEN_KEY: string = 'archeglyph.github_token';
const CLIENT_ID: string = 'YOUR_GITHUB_OAUTH_APP_CLIENT_ID';
const API_BASE: string = 'https://api.github.com';
const DEVICE_CODE_URL: string = 'https://github.com/login/device/code';
const TOKEN_URL: string = 'https://github.com/login/oauth/access_token';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface GithubComment {
  id: number;
  body: string;
  user: { login: string } | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve: (v: void) => void) => setTimeout(resolve, ms));
}

function buildHeaders(token: string | null): Record<string, string> {
  if (token !== null) {
    return {
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'Authorization': `token ${token}`,
    };
  }
  return {
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

function parsePath(path: string): [string, string, string] {
  const parts: string[] = path.split('/');
  return [parts[0], parts[1], parts[2]];
}

function mapComment(c: GithubComment): RawComment {
  return Object.assign(new RawComment(), {
    id: String(c.id),
    body: c.body,
    author: c.user !== null ? c.user.login : undefined,
  });
}

export class GitHubForge implements GitForge {
  isAuthenticated(): boolean {
    return localStorage.getItem(TOKEN_KEY) !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async authenticate(): Promise<void> {
    const codeResp: Response = await fetch(DEVICE_CODE_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, scope: 'repo' }),
    });
    const codeData: DeviceCodeResponse = await codeResp.json() as DeviceCodeResponse;
    window.open(codeData.verification_uri);
    alert(`Enter this code at GitHub: ${codeData.user_code}`);
    const expiresAt: number = Date.now() + codeData.expires_in * 1000;
    let pollInterval: number = codeData.interval;
    while (Date.now() < expiresAt) {
      await sleep(pollInterval * 1000);
      const tokenResp: Response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          device_code: codeData.device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });
      const tokenData: TokenResponse = await tokenResp.json() as TokenResponse;
      if (tokenData.access_token !== undefined) {
        localStorage.setItem(TOKEN_KEY, tokenData.access_token);
        return;
      } else if (tokenData.error === 'access_denied') {
        throw new Error('GitHub authorization denied');
      } else {
        pollInterval = tokenData.error === 'slow_down' ? pollInterval + 5 : pollInterval;
      }
    }
    throw new Error('GitHub Device Flow timed out');
  }

  async fetchPrComments(pr: string): Promise<Array<RawComment>> {
    const [owner, repo, n]: [string, string, string] = parsePath(pr);
    const resp: Response = await fetch(
      `${API_BASE}/repos/${owner}/${repo}/pulls/${n}/comments`,
      { headers: buildHeaders(this.getToken()) },
    );
    const data: GithubComment[] = await resp.json() as GithubComment[];
    return data.map(mapComment);
  }

  async postPrComment(pr: string, body: string): Promise<void> {
    const [owner, repo, n]: [string, string, string] = parsePath(pr);
    await fetch(
      `${API_BASE}/repos/${owner}/${repo}/pulls/${n}/comments`,
      {
        method: 'POST',
        headers: buildHeaders(this.getToken()),
        body: JSON.stringify({ body }),
      },
    );
  }

  async fetchIssueComments(issue: string): Promise<Array<RawComment>> {
    const [owner, repo, n]: [string, string, string] = parsePath(issue);
    const resp: Response = await fetch(
      `${API_BASE}/repos/${owner}/${repo}/issues/${n}/comments`,
      { headers: buildHeaders(this.getToken()) },
    );
    const data: GithubComment[] = await resp.json() as GithubComment[];
    return data.map(mapComment);
  }

  async postIssueComment(issue: string, body: string): Promise<void> {
    const [owner, repo, n]: [string, string, string] = parsePath(issue);
    await fetch(
      `${API_BASE}/repos/${owner}/${repo}/issues/${n}/comments`,
      {
        method: 'POST',
        headers: buildHeaders(this.getToken()),
        body: JSON.stringify({ body }),
      },
    );
  }
}
