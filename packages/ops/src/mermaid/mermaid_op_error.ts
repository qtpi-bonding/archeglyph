// SPDX-License-Identifier: MPL-2.0

import type { OpErrorCause } from '../op';

export class MermaidOpError extends Error {
  stage!: string;
  cause!: OpErrorCause;
}
