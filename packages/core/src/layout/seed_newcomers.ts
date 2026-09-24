// SPDX-License-Identifier: MPL-2.0

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

// Children sit this far inside their group, matching what the bundled
// examples write by hand.
const INSET = 16;
const GROUP_LABEL_PADDING = 12;

function parentOf(diagram: ResolvedDiagram, id: string): string | undefined {
  return diagram.nodes[id]?.parentGroup ?? diagram.groups[id]?.parentGroup;
}

// ELK arranges in absolute space; `layout.position` is group-relative.
function absoluteOrigins(diagram: ResolvedDiagram, pinned: Map<string, Vec2>, seeded: Map<string, Vec2>): Map<string, Vec2> {
  const origins = new Map<string, Vec2>();
  const resolving = new Set<string>();

  const originOf = (groupId: string | undefined): Vec2 => {
    if (groupId === undefined || diagram.groups[groupId] === undefined) return vec2(0, 0);
    const done = origins.get(groupId);
    if (done !== undefined) return done;
    // Breaks a containment cycle rather than recursing forever.
    if (resolving.has(groupId)) return vec2(0, 0);
    resolving.add(groupId);

    const pin = pinned.get(groupId);
    let origin: Vec2;
    if (pin !== undefined) {
      const parent = originOf(parentOf(diagram, groupId));
      origin = vec2(parent.x + pin.x, parent.y + pin.y);
    } else {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      for (const childId of [...Object.keys(diagram.nodes), ...Object.keys(diagram.groups)].sort()) {
        if (parentOf(diagram, childId) !== groupId) continue;
        const childAt = diagram.groups[childId] !== undefined ? originOf(childId) : seeded.get(childId);
        if (childAt === undefined) continue;
        minX = Math.min(minX, childAt.x);
        minY = Math.min(minY, childAt.y);
      }
      const labelled = diagram.groups[groupId];
      const fontSize: number = labelled?.typography?.size ?? 13;
      const topInset: number = labelled !== undefined && labelled.label.length > 0
        ? Math.max(INSET, Math.round(fontSize * 1.2) + 2 * GROUP_LABEL_PADDING)
        : INSET;
      origin = minX === Number.POSITIVE_INFINITY
        ? seeded.get(groupId) ?? vec2(0, 0)
        : vec2(minX - INSET, minY - topInset);
    }
    resolving.delete(groupId);
    origins.set(groupId, origin);
    return origin;
  };

  for (const groupId of Object.keys(diagram.groups).sort()) originOf(groupId);
  return origins;
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
  const pinnedOrigins = absoluteOrigins(diagram, pinned, new Map());
  const absolutePin = (id: string): Vec2 | undefined => {
    const pin = pinned.get(id);
    if (pin === undefined) return undefined;
    const parent = pinnedOrigins.get(parentOf(diagram, id) ?? '') ?? vec2(0, 0);
    return vec2(parent.x + pin.x, parent.y + pin.y);
  };

  const elements = new Map<string, ElementInfo>();
  for (const group of Object.values(diagram.groups)) {
    const size = sizeOf(group);
    elements.set(group.id, { id: group.id, width: size.x, height: size.y, position: absolutePin(group.id) });
  }
  for (const node of Object.values(diagram.nodes)) {
    const size = sizeOf(node);
    elements.set(node.id, { id: node.id, width: size.x, height: size.y, position: absolutePin(node.id) });
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

    const occupied = pinnedRects.concat(
      [...result.entries()].map(([id, at]) => {
        const item = elements.get(id)!;
        return { id, x: at.x, y: at.y, width: item.width, height: item.height };
      }),
    );
    let shiftY = 0;
    while (true) {
      const collision = [...component].sort().some(id => {
        const item = laid.get(id)!;
        return occupied.some(taken => boundsIntersects(
          { minX: item.x + dx, minY: item.y + dy + shiftY, maxX: item.x + dx + item.width, maxY: item.y + dy + shiftY + item.height },
          rect(taken),
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
  const origins = absoluteOrigins(diagram, pinned, result);
  const relative = new Map<string, Vec2>();
  for (const id of [...result.keys()].sort()) {
    const own = diagram.groups[id] !== undefined ? origins.get(id) ?? result.get(id)! : result.get(id)!;
    const parent = origins.get(parentOf(diagram, id) ?? '') ?? vec2(0, 0);
    relative.set(id, vec2(own.x - parent.x, own.y - parent.y));
  }
  return relative;
}
