// SPDX-License-Identifier: MPL-2.0
// Compute the effective render mode, including the stylesheet open-depth default.

import { Element, ElementRole } from '@archeglyph/proto/gen/content_pb';
import { GroupRenderMode, Stylesheet } from '@archeglyph/proto/gen/style_pb';

export function effectiveMode(
  id: string,
  elements: { [id: string]: Element },
  parentOf: Map<string, string>,
  stylesheet?: Stylesheet,
): GroupRenderMode {
  const entry = stylesheet?.elements[id];
  if (entry?.renderMode !== undefined && entry.renderMode !== GroupRenderMode.UNSPECIFIED) {
    return entry.renderMode;
  }
  const depth = stylesheet?.openDepth;
  if (depth === undefined) {
    return GroupRenderMode.OPEN;
  }
  let entityDepth = 0;
  let parent = parentOf.get(id);
  while (parent !== undefined) {
    const ancestor = elements[parent];
    if (ancestor !== undefined && ancestor.role !== ElementRole.GROUPING) {
      entityDepth += 1;
    }
    parent = parentOf.get(parent);
  }
  const grouping = elements[id].role === ElementRole.GROUPING;
  return (grouping ? entityDepth < depth : entityDepth + 1 < depth)
    ? GroupRenderMode.OPEN
    : GroupRenderMode.CLOSED;
}
