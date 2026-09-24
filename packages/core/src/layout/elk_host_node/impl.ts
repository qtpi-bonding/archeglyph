// SPDX-License-Identifier: MPL-2.0

import ElkConstructor, { type ELK } from 'elkjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function createNodeElk(): ELK {
  return new ElkConstructor({
    workerUrl: require.resolve('elkjs/lib/elk-worker.min.js'),
  });
}
