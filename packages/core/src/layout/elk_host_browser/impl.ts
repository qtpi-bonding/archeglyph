// SPDX-License-Identifier: AGPL-3.0-or-later

import ElkConstructor, { type ELK } from 'elkjs/lib/elk.bundled.js';

export function createBrowserElk(): ELK {
  return new ElkConstructor();
}
