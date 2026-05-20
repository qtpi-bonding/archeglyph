// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Theme } from '@archeglyph/proto/gen/theme_pb';

export function lightTheme(): Theme {
  throw new Error('not implemented');
}

export function darkTheme(): Theme {
  throw new Error('not implemented');
}

export function getBundledTheme(name: string): Theme {
  if (name === 'dark') return darkTheme();
  return lightTheme();
}
