// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { ThemeSchema, type Theme } from '@archeglyph/proto/gen/theme_pb';

export function defaultTheme(): Theme {
  return create(ThemeSchema, { name: 'archeglyph-default' });
}
export function validateOp(): unknown {
  throw new Error('not implemented');
}
