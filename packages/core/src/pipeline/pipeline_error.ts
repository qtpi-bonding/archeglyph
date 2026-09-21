// SPDX-License-Identifier: AGPL-3.0-or-later

export class PipelineError {
  stage!: string;
  // Every sub-error carries a message naming the element that failed. Without
  // it a caller can only say "cascade", which names the stage and nothing a
  // reader could act on.
  detail?: string;
}
