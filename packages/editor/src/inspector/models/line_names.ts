// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  ArrowheadVariant,
  StrokePattern,
} from '@archeglyph/proto/gen/style_pb';

export const PATTERN_TABLE: ReadonlyArray<{ name: string; value: StrokePattern }> = [
  { name: 'solid', value: StrokePattern.STROKE_PATTERN_SOLID },
  { name: 'dashed', value: StrokePattern.STROKE_PATTERN_DASHED },
  { name: 'dotted', value: StrokePattern.STROKE_PATTERN_DOTTED },
];

export const ARROWHEAD_TABLE: ReadonlyArray<{
  name: string;
  value: ArrowheadVariant;
}> = [
  { name: 'none', value: ArrowheadVariant.ARROWHEAD_NONE },
  { name: 'open', value: ArrowheadVariant.ARROWHEAD_OPEN },
  { name: 'filled', value: ArrowheadVariant.ARROWHEAD_FILLED },
  { name: 'diamond', value: ArrowheadVariant.ARROWHEAD_DIAMOND },
  { name: 'circle', value: ArrowheadVariant.ARROWHEAD_CIRCLE },
  { name: 'tee', value: ArrowheadVariant.ARROWHEAD_TEE },
];
