// SPDX-License-Identifier: MPL-2.0

import type { ElementRef } from '../ui_state/ui_state';
import type { SceneGeometry } from './scene';

/**
 * Whether the element is drawn as a block (a leaf or a closed container)
 * rather than as a box (an open container).
 *
 * A closed container is listed among the scene's groups, so its ref kind is
 * 'group', but the renderer styles it from the entry's block fields. Anything
 * that decides which fields to read or write for an element asks this, not
 * the ref kind.
 */
export function drawnAsBlock(geometry: SceneGeometry, ref: ElementRef): boolean {
  if (ref.kind === 'node') {
    return true;
  }
  return ref.kind === 'group' && geometry.diagram.groups[ref.id]?.isSuperNode === true;
}

/**
 * The kind whose edit builders write the fields this element is drawn from:
 * 'node' for a block, 'group' for a box, the given kind otherwise.
 */
export function editKindOf(
  geometry: SceneGeometry,
  kind: 'node' | 'group' | 'annotation',
  id: string,
): 'node' | 'group' | 'annotation' {
  return kind === 'group' && drawnAsBlock(geometry, { kind, id }) ? 'node' : kind;
}
