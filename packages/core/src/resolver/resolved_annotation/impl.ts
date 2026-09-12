// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnnotationAnchor, AnnotationLayout, Glyph1D, Glyph2D, Typography } from '@archeglyph/proto/gen/style_pb';
import { Localization } from '@archeglyph/proto/gen/content_pb';

export class ResolvedAnnotation {
  id!: string;
  anchor?: AnnotationAnchor;
  shape!: Glyph2D;
  typography!: Typography;
  callout!: Glyph1D;
  layout?: AnnotationLayout;
  content: Localization[] = [];
}
