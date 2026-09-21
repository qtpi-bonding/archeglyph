// SPDX-License-Identifier: AGPL-3.0-or-later

import type { OpErrorCause } from '../op';

export class DiffOpError extends Error {
  stage!: string;
  cause!: OpErrorCause;
}
