// SPDX-License-Identifier: AGPL-3.0-or-later

import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';

/**
 * Fold every pending style edit over a stylesheet in list order.
 *
 * Each application returns a new stylesheet, so the input stylesheet is never
 * mutated.
 */
export function applyAllPendingEdits(stylesheet: Stylesheet): Stylesheet {
  let result: Stylesheet = stylesheet;
  for (const edit of stylesheet.pendingEdits) {
    result = applyStyleEditToStylesheet(result, edit);
  }
  return result;
}
