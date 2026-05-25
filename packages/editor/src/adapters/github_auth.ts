// SPDX-License-Identifier: AGPL-3.0-or-later

const TOKEN_KEY: string = 'archeglyph.github_token';
const CLIENT_ID: string = 'YOUR_GITHUB_OAUTH_APP_CLIENT_ID';
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

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve: (v: void) => void) => setTimeout(resolve, ms));
}

export class GitHubAuth {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
