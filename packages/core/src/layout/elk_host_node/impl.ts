// SPDX-License-Identifier: AGPL-3.0-or-later

import ELK from 'elkjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function createNodeElk(): ELK {
  return new ELK({
    workerUrl: require.resolve('elkjs/lib/elk-worker.min.js'),
  });
}
