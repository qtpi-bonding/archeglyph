// SPDX-License-Identifier: MPL-2.0

export class PipelineError {
  stage!: string;
  // Every sub-error carries a message naming the element that failed. Without
  // it a caller can only say "cascade", which names the stage and nothing a
  // reader could act on.
  detail?: string;
}
