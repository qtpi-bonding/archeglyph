// SPDX-License-Identifier: AGPL-3.0-or-later

export interface GitForge {
  isAuthenticated(): boolean;
  getToken(): string | null;
  authenticate(): Promise<void>;
  fetchPrComments(pr: string): Promise<Array<RawComment>>;
  postPrComment(pr: string, body: string): Promise<void>;
  fetchIssueComments(issue: string): Promise<Array<RawComment>>;
  postIssueComment(issue: string, body: string): Promise<void>;
}
export class RawComment {
  id!: string;
  body!: string;
  author?: string;
}
