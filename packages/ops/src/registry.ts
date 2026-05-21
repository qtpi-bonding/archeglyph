// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Operation } from './op';
import { renderOp } from './render/op';
import { validateOp } from './validate/op';
import { formatOp } from './format/op';
import { initOp } from './init/op';
import { bindOp } from './bind/op';
import { watchOp } from './watch/op';

export const REGISTRY: Operation<unknown, unknown>[] = [
  renderOp as unknown as Operation<unknown, unknown>,
  validateOp as unknown as Operation<unknown, unknown>,
  formatOp as unknown as Operation<unknown, unknown>,
  initOp as unknown as Operation<unknown, unknown>,
  bindOp as unknown as Operation<unknown, unknown>,
  watchOp as unknown as Operation<unknown, unknown>,
];
