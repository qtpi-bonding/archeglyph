// SPDX-License-Identifier: MPL-2.0

import { type Element, ElementRole } from '@archeglyph/proto/gen/content_pb';

/**
 * Which elements name each element as their parent. A container is exactly an
 * element that appears here with at least one child; that is never stored.
 */
export function childrenIndex(elements: { [id: string]: Element }): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const id of Object.keys(elements).sort()) {
    const parent = elements[id].parent;
    if (parent === undefined || parent === '') {
      continue;
    }
    const list = children.get(parent);
    if (list === undefined) {
      children.set(parent, [id]);
    } else {
      list.push(id);
    }
  }
  return children;
}

/**
 * Whether an element is drawn with a group's machinery (a box when open, a
 * super-node when closed) rather than as a plain node: it has children, or it
 * is a GROUPING, which exists only to gather members and so is never a node
 * even while empty.
 */
export function isGroupLike(
  elements: { [id: string]: Element },
  children: Map<string, string[]>,
  id: string,
): boolean {
  return (children.get(id)?.length ?? 0) > 0 || elements[id].role === ElementRole.GROUPING;
}
