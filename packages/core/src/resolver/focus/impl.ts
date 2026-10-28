// SPDX-License-Identifier: MPL-2.0

import { type Element } from '@archeglyph/proto/gen/content_pb';
import { childrenIndex } from '../element_form';
import { type FilteredDiagram } from '../filtered_diagram';

/**
 * The containers to open so that `picks` can be seen to `depth`.
 *
 * Each pick is opened, and so is every container inside it down to `depth`
 * levels, so its contents show as blocks one level further in. Every container
 * above a pick is opened too, or the pick could not be reached. Depth 0 leaves
 * a pick as a single block. Leaves are never in the set: there is nothing to
 * open. A container that has to be open for another pick stays open whatever
 * its own depth says.
 *
 * Everything else is left to the stylesheet's default, so the rest of the
 * diagram stays on the page as closed blocks and what a pick connects to is
 * still drawn.
 */
export function openSet(
  elements: { [id: string]: Element },
  picks: ReadonlyArray<string>,
  depth: number,
): Set<string> {
  const children = childrenIndex(elements);
  const open = new Set<string>();

  const openBelow = (id: string, level: number): void => {
    const inside = children.get(id);
    if (level >= depth || inside === undefined) {
      return;
    }
    open.add(id);
    for (const child of inside) {
      openBelow(child, level + 1);
    }
  };

  for (const pick of picks) {
    if (elements[pick] === undefined) {
      continue;
    }
    const seen = new Set<string>([pick]);
    let above = elements[pick].parent;
    while (above !== undefined && above !== '' && !seen.has(above)) {
      seen.add(above);
      open.add(above);
      above = elements[above]?.parent;
    }
    openBelow(pick, 0);
  }
  return open;
}

/**
 * What to hide so that only `picks` and what lies within `hops` hops of them
 * stays on the page.
 *
 * Distance is measured on the view as it is drawn (`filtered`), not on the
 * underlying graph: the picks and everything shown inside them are the centre,
 * and each hop follows an edge, in either direction, to the next visible
 * element. An edge lifted onto a closed block counts as an edge to that block,
 * so the unit of a hop is whatever the view shows at that point.
 *
 * Whatever is further out is hidden, and only the top of each hidden part is
 * returned, since hiding an element hides its contents. A container that still
 * holds something stays, and so does every container above a kept element.
 */
export function hiddenOutside(
  elements: { [id: string]: Element },
  filtered: FilteredDiagram,
  picks: ReadonlyArray<string>,
  hops: number,
): string[] {
  const visible = new Map<string, string | undefined>();
  for (const node of Object.values(filtered.nodes)) {
    visible.set(node.id, node.parentGroup);
  }
  for (const group of Object.values(filtered.groups)) {
    visible.set(group.id, group.parentGroup);
  }

  const pickSet = new Set(picks);
  const insidePick = (id: string): boolean => {
    const seen = new Set<string>();
    for (let at: string | undefined = id; at !== undefined && at !== '' && !seen.has(at); at = elements[at]?.parent) {
      if (pickSet.has(at)) {
        return true;
      }
      seen.add(at);
    }
    return false;
  };

  const touching = new Map<string, Set<string>>();
  const link = (from: string, to: string): void => {
    const set = touching.get(from);
    if (set === undefined) {
      touching.set(from, new Set([to]));
    } else {
      set.add(to);
    }
  };
  for (const edge of Object.values(filtered.edges)) {
    if (edge.source !== edge.target) {
      link(edge.source, edge.target);
      link(edge.target, edge.source);
    }
  }

  let ring = [...visible.keys()].filter(insidePick).sort();
  const reached = new Set<string>(ring);
  for (let hop = 0; hop < hops; hop++) {
    const next: string[] = [];
    for (const id of ring) {
      for (const other of [...(touching.get(id) ?? [])].sort()) {
        if (!reached.has(other)) {
          reached.add(other);
          next.push(other);
        }
      }
    }
    ring = next;
  }

  const kept = new Set<string>(reached);
  for (const id of reached) {
    for (let above = visible.get(id); above !== undefined && !kept.has(above); above = visible.get(above)) {
      kept.add(above);
    }
  }

  const topOfHidden = (id: string): boolean => {
    const above = visible.get(id);
    return !kept.has(id) && (above === undefined || kept.has(above));
  };
  return [...visible.keys()].filter(topOfHidden).sort();
}
