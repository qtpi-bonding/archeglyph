// SPDX-License-Identifier: AGPL-3.0-or-later

import { StrokePattern } from '@archeglyph/proto/gen/style_pb';

export const PATTERN_TABLE: ReadonlyArray<{ name: string; value: StrokePattern }> = [
  { name: 'SOLID', value: StrokePattern.SOLID },
  { name: 'DASHED', value: StrokePattern.DASHED },
  { name: 'DOTTED', value: StrokePattern.DOTTED },
];
