// SPDX-License-Identifier: MPL-2.0

import type { Diagram } from '@archeglyph/proto/gen/content_pb';
import type { ElementRef } from '../ui_state/ui_state';
import { elementKey } from './element_key';
import type { SceneGeometry } from './scene';

/**
 * The outermost closed container above `id` that the scene draws, or
 * undefined when the element is simply gone and nothing absorbed it.
 */
function closedAncestor(id: string, geometry: SceneGeometry, diagram: Diagram): string | undefined {
  const visited = new Set<string>();
  let current: string | undefined = diagram.graph?.elements[id]?.parent;
  while (current !== undefined && !visited.has(current)) {
    visited.add(current);
    if (geometry.diagram.groups[current]?.isSuperNode === true) {
      return current;
    }
    current = diagram.graph?.elements[current]?.parent;
  }
  return undefined;
}

/**
 * The selection with every element that a re-layout absorbed into a closed
 * container replaced by that container, so it does not point at geometry that
 * no longer exists. Elements still in the scene, edges and annotations are
 * kept as they are; duplicates produced by the substitution are dropped.
 */
export function representativeSelection(
  selection: Array<ElementRef>,
  geometry: SceneGeometry,
  diagram: Diagram,
): Array<ElementRef> {
  const resolved: Array<ElementRef> = [];
  const seen = new Set<string>();
  for (const ref of selection) {
    const absorbed = (ref.kind === 'node' || ref.kind === 'group')
      && geometry.byKey[elementKey(ref)] === undefined;
    const representative = absorbed ? closedAncestor(ref.id, geometry, diagram) : undefined;
    const next: ElementRef = representative === undefined ? ref : { kind: 'group', id: representative };
    const key = elementKey(next);
    if (!seen.has(key)) {
      seen.add(key);
      resolved.push(next);
    }
  }
  return resolved;
}
