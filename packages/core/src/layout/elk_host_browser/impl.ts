// SPDX-License-Identifier: MPL-2.0

import ElkConstructor, { type ELK } from 'elkjs/lib/elk.bundled.js';

export function createBrowserElk(): ELK {
  return new ElkConstructor();
}
