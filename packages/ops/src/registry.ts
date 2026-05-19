// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Operation } from './op';
import { renderOp } from './render/op';

export const REGISTRY: Operation<unknown, unknown>[] = [
  renderOp as unknown as Operation<unknown, unknown>,
];
