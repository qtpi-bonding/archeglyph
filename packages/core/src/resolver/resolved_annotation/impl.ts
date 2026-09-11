// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnnotationLayout, Glyph1D, Glyph2D, Typography } from '@archeglyph/proto/gen/style_pb';

export class ResolvedAnnotation {
  id!: string;
  shape!: Glyph2D;
  typography!: Typography;
  callout!: Glyph1D;
  layout?: AnnotationLayout;
}
