// SPDX-License-Identifier: AGPL-3.0-or-later

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from './default_size';

import type { ELK } from 'elkjs';
import { create } from '@bufbuild/protobuf';
import { type Vec2, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { ResolvedDiagram } from '../resolver/resolved_diagram';
import { boundsIntersects, boundsUnion, type Bounds } from '../geometry/bounds';

interface ElkNode {
  id: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  layoutOptions?: Record<string, string>;
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ElkGraph {
  id: string;
  children: ElkNode[];
  edges: ElkEdge[];
  layoutOptions: Record<string, string>;
}

interface ElementInfo {
  id: string;
  width: number;
  height: number;
  position?: Vec2;
}

interface Placed {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAP = 20;

function vec2(x: number, y: number): Vec2 {
  return create(Vec2Schema, { x, y });
}

function rect(item: Placed): Bounds {
  return {
    minX: item.x,
    minY: item.y,
    maxX: item.x + item.width,
    maxY: item.y + item.height,
  };
}

function sizeOf(item: { layout?: { size?: Vec2 } }): Vec2 {
  return item.layout?.size ?? vec2(DEFAULT_WIDTH, DEFAULT_HEIGHT);
}

/** Positions every element without a position, without changing pinned elements. */
export async function seedNewcomers(
  diagram: ResolvedDiagram,
  pinned: Map<string, Vec2>,
  elk: ELK,
): Promise<Map<string, Vec2>> {
  const elements = new Map<string, ElementInfo>();
  for (const group of Object.values(diagram.groups)) {
    const size = sizeOf(group);
    elements.set(group.id, { id: group.id, width: size.x, height: size.y, position: pinned.get(group.id) });
  }
  for (const node of Object.values(diagram.nodes)) {
    const size = sizeOf(node);
    elements.set(node.id, { id: node.id, width: size.x, height: size.y, position: pinned.get(node.id) });
  }

  const newcomerIds = [...elements.values()]
    .filter(item => item.position === undefined)
    .map(item => item.id)
    .sort();
  const result = new Map<string, Vec2>();
  if (newcomerIds.length === 0) return result;

  const adjacency = new Map<string, Set<string>>();
  for (const id of elements.keys()) adjacency.set(id, new Set<string>());
  for (const edge of Object.values(diagram.edges)) {
    if (!elements.has(edge.source) || !elements.has(edge.target)) continue;
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const pinnedIds = [...elements.values()]
    .filter(item => item.position !== undefined)
    .map(item => item.id)
    .sort();
  const pinnedRects = pinnedIds.map(id => {
    const item = elements.get(id)!;
    return { id, x: item.position!.x, y: item.position!.y, width: item.width, height: item.height };
  });

  let contentBounds: Bounds | undefined;
  for (const item of pinnedRects) contentBounds = contentBounds === undefined ? rect(item) : boundsUnion(contentBounds, rect(item));
  const fallbackY = (contentBounds?.maxY ?? 0) + GAP;
  let fallbackIndex = 0;

  // Each connected newcomer component is laid out independently. This keeps
  // unrelated newcomers from making one another's anchors influence the
  // translation, while still allowing ELK to see all edges in a component.
  const remaining = new Set(newcomerIds);
  while (remaining.size > 0) {
    const first = [...remaining].sort()[0];
    const component = new Set<string>([first]);
    const queue = [first];
    remaining.delete(first);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbour of [...(adjacency.get(current) ?? [])].sort()) {
        if (elements.get(neighbour)?.position === undefined) {
          if (!component.has(neighbour)) {
            component.add(neighbour);
            remaining.delete(neighbour);
            queue.push(neighbour);
          }
        }
      }
    }
    const anchors = new Set<string>();
    for (const id of component) {
      for (const neighbour of adjacency.get(id) ?? []) {
        if (elements.get(neighbour)?.position !== undefined) anchors.add(neighbour);
      }
    }

    if (anchors.size === 0) {
      for (const id of [...component].sort()) {
        const item = elements.get(id)!;
        result.set(id, vec2(fallbackIndex * (item.width + GAP), fallbackY));
        fallbackIndex += 1;
      }
      continue;
    }

    const included = new Set<string>([...component, ...anchors]);
    const children = [...included].sort().map(id => {
      const item = elements.get(id)!;
      const node: ElkNode = { id, width: item.width, height: item.height };
      if (item.position !== undefined) {
        node.x = item.position.x;
        node.y = item.position.y;
        node.layoutOptions = { 'org.eclipse.elk.fixed': 'true' };
      }
      return node;
    });
    const edges: ElkEdge[] = Object.values(diagram.edges)
      .filter(edge => included.has(edge.source) && included.has(edge.target))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(edge => ({ id: edge.id, sources: [edge.source], targets: [edge.target] }));
    const laidOut = await elk.layout({
      id: `seed-${[...component].sort()[0]}`,
      children,
      edges,
      layoutOptions: {
        'org.eclipse.elk.algorithm': 'org.eclipse.elk.layered',
        'org.eclipse.elk.interactive': 'true',
        'org.eclipse.elk.spacing.nodeNode': String(GAP),
      },
    } as ElkGraph);

    const laid = new Map<string, Placed>();
    for (const child of (laidOut.children ?? []) as ElkNode[]) {
      const item = elements.get(child.id)!;
      laid.set(child.id, {
        id: child.id,
        x: child.x ?? 0,
        y: child.y ?? 0,
        width: item.width,
        height: item.height,
      });
    }
    let dx = 0;
    let dy = 0;
    for (const id of [...anchors].sort()) {
      const actual = elements.get(id)!.position!;
      const generated = laid.get(id);
      if (generated !== undefined) {
        dx += actual.x - generated.x;
        dy += actual.y - generated.y;
      }
    }
    dx /= anchors.size;
    dy /= anchors.size;

    // Move the whole component, not individual newcomers, when it overlaps a
    // pinned element that was not among its anchors.
    let shiftY = 0;
    while (true) {
      const collision = [...component].sort().some(id => {
        const item = laid.get(id)!;
        return pinnedRects.some(pin => boundsIntersects(
          { minX: item.x + dx, minY: item.y + dy + shiftY, maxX: item.x + dx + item.width, maxY: item.y + dy + shiftY + item.height },
          rect(pin),
        ));
      });
      if (!collision) break;
      shiftY += GAP;
    }
    for (const id of [...component].sort()) {
      const item = laid.get(id)!;
      result.set(id, vec2(item.x + dx, item.y + dy + shiftY));
    }
  }
  return result;
}
