// SPDX-License-Identifier: AGPL-3.0-or-later

import ElkConstructor, { type ELK } from 'elkjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function createNodeElk(): ELK {
  return new ElkConstructor({
    workerUrl: require.resolve('elkjs/lib/elk-worker.min.js'),
  });
}
