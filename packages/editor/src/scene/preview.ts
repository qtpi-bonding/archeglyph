// SPDX-License-Identifier: AGPL-3.0-or-later

import { EdgeRouting } from '@archeglyph/proto/gen/style_pb';
import { routeOrthogonal, routeStraight } from '@archeglyph/core/layout/edge_router';
import type { Bounds } from '@archeglyph/core/geometry/bounds';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';
import type { LaidOutEdge } from '@archeglyph/core/layout/laid_out_edge';
import type { ElementRef } from '../ui_state/ui_state';
import type { SceneGeometry, ElementBounds } from './scene';
import type { Handle } from './hit_test';
import { elementKey } from './element_key';

export interface PreviewEdge {
  id: string;
  points: Array<Vec2>;
}

export interface MoveIntent {
  refs: Array<ElementRef>;
  delta: Vec2;
}

export interface ResizeIntent {
  ref: ElementRef;
  handle: Handle;
  delta: Vec2;
  keepAspect?: boolean;
}

export interface ScenePreview {
  bounds: Array<ElementBounds>;
  edges: Array<PreviewEdge>;
}

export function routeEdgeBetween(
  edge: LaidOutEdge,
  sourceBounds: Bounds,
  targetBounds: Bounds,
): Array<Vec2> {
  const layout = edge.layout;
  if (layout?.routing === EdgeRouting.ROUTING_MANUAL) {
    return layout.waypoints;
  }

  const sourceAttach = layout?.sourceAttach;
  const targetAttach = layout?.targetAttach;
  if (layout?.routing === EdgeRouting.ROUTING_ORTHOGONAL) {
    return routeOrthogonal(sourceBounds, targetBounds, sourceAttach, targetAttach);
  }
  return routeStraight(sourceBounds, targetBounds, sourceAttach, targetAttach);
}

export function resizeBounds(
  bounds: Bounds,
  handle: Handle,
  delta: Vec2,
  keepAspect: boolean = false,
): Bounds {
  const minimumSize = 1;
  const movesMinX = handle === 'nw' || handle === 'w' || handle === 'sw';
  const movesMaxX = handle === 'ne' || handle === 'e' || handle === 'se';
  const movesMinY = handle === 'nw' || handle === 'n' || handle === 'ne';
  const movesMaxY = handle === 'sw' || handle === 's' || handle === 'se';

  const resized: Bounds = {
    minX: movesMinX ? Math.min(bounds.maxX - minimumSize, bounds.minX + delta.x) : bounds.minX,
    minY: movesMinY ? Math.min(bounds.maxY - minimumSize, bounds.minY + delta.y) : bounds.minY,
    maxX: movesMaxX ? Math.max(bounds.minX + minimumSize, bounds.maxX + delta.x) : bounds.maxX,
    maxY: movesMaxY ? Math.max(bounds.minY + minimumSize, bounds.maxY + delta.y) : bounds.maxY,
  };

  if (!keepAspect) {
    return resized;
  }

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width <= 0 || height <= 0) {
    return resized;
  }
  const aspect = width / height;
  const changesWidth = movesMinX || movesMaxX;
  const changesHeight = movesMinY || movesMaxY;
  const requestedWidth = resized.maxX - resized.minX;
  const requestedHeight = resized.maxY - resized.minY;

  let nextWidth = requestedWidth;
  let nextHeight = requestedHeight;
  if (changesWidth && changesHeight) {
    if (Math.abs(delta.x) / width >= Math.abs(delta.y) / height) {
      nextHeight = nextWidth / aspect;
    } else {
      nextWidth = nextHeight * aspect;
    }
  } else if (changesWidth) {
    nextHeight = nextWidth / aspect;
  } else if (changesHeight) {
    nextWidth = nextHeight * aspect;
  }

  const scale = Math.max(
    nextWidth / width,
    nextHeight / height,
    minimumSize / width,
    minimumSize / height,
  );
  nextWidth = width * scale;
  nextHeight = height * scale;

  if (movesMinX && movesMaxY) {
    return {
      minX: bounds.maxX - nextWidth,
      minY: bounds.minY,
      maxX: bounds.maxX,
      maxY: bounds.minY + nextHeight,
    };
  }
  if (movesMinX && movesMinY) {
    return {
      minX: bounds.maxX - nextWidth,
      minY: bounds.maxY - nextHeight,
      maxX: bounds.maxX,
      maxY: bounds.maxY,
    };
  }
  if (movesMaxX && movesMaxY) {
    return {
      minX: bounds.minX,
      minY: bounds.minY,
      maxX: bounds.minX + nextWidth,
      maxY: bounds.minY + nextHeight,
    };
  }
  if (movesMaxX && movesMinY) {
    return {
      minX: bounds.minX,
      minY: bounds.maxY - nextHeight,
      maxX: bounds.minX + nextWidth,
      maxY: bounds.maxY,
    };
  }

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    minX: movesMinX ? bounds.maxX - nextWidth : changesWidth ? bounds.minX : centerX - nextWidth / 2,
    minY: movesMinY ? bounds.maxY - nextHeight : changesHeight ? bounds.minY : centerY - nextHeight / 2,
    maxX: movesMaxX ? bounds.minX + nextWidth : changesWidth ? bounds.maxX : centerX + nextWidth / 2,
    maxY: movesMaxY ? bounds.minY + nextHeight : changesHeight ? bounds.maxY : centerY + nextHeight / 2,
  };
}

function shifted(bounds: Bounds, delta: Vec2): Bounds {
  return {
    minX: bounds.minX + delta.x,
    minY: bounds.minY + delta.y,
    maxX: bounds.maxX + delta.x,
    maxY: bounds.maxY + delta.y,
  };
}

function endpointBounds(
  geometry: SceneGeometry,
  id: string,
  moved: Map<string, Bounds>,
): Bounds | undefined {
  const candidates = [`node:${id}`, `group:${id}`];
  for (const candidate of candidates) {
    const element = geometry.byKey[candidate];
    if (element !== undefined) {
      return moved.get(candidate) ?? element.bounds;
    }
  }
  return undefined;
}

function previewEdges(
  geometry: SceneGeometry,
  moved: Map<string, Bounds>,
): Array<PreviewEdge> {
  const result: Array<PreviewEdge> = [];
  for (const edge of Object.values(geometry.diagram.edges)) {
    const source = endpointBounds(geometry, edge.source, moved);
    const target = endpointBounds(geometry, edge.target, moved);
    if (source === undefined || target === undefined) {
      continue;
    }
    const sourceMoved = moved.has(`node:${edge.source}`) || moved.has(`group:${edge.source}`);
    const targetMoved = moved.has(`node:${edge.target}`) || moved.has(`group:${edge.target}`);
    if (sourceMoved || targetMoved) {
      result.push({ id: edge.id, points: routeEdgeBetween(edge, source, target) });
    }
  }
  return result;
}

export function previewMove(geometry: SceneGeometry, intent: MoveIntent): ScenePreview {
  const requested = new Set(intent.refs.map(elementKey));
  const moved = new Map<string, Bounds>();
  const bounds: Array<ElementBounds> = [];

  for (const element of geometry.index) {
    let parent = element.parentGroup;
    let isMoved = requested.has(elementKey(element.ref));
    const visited = new Set<string>();
    while (!isMoved && parent !== undefined && !visited.has(parent)) {
      visited.add(parent);
      const parentKey = elementKey({ kind: 'group', id: parent });
      isMoved = requested.has(parentKey);
      parent = geometry.byKey[parentKey]?.parentGroup;
    }
    if (isMoved) {
      const next = shifted(element.bounds, intent.delta);
      moved.set(elementKey(element.ref), next);
      bounds.push({ ...element, bounds: next });
    }
  }

  return { bounds, edges: previewEdges(geometry, moved) };
}

export function previewResize(geometry: SceneGeometry, intent: ResizeIntent): ScenePreview {
  const targetKey = elementKey(intent.ref);
  const target = geometry.byKey[targetKey];
  if (target === undefined) {
    return { bounds: [], edges: [] };
  }

  const next = resizeBounds(target.bounds, intent.handle, intent.delta, intent.keepAspect);
  // Resizing is deliberately single-element: unlike previewMove, a group
  // resize changes only the group's container and leaves its members where
  // they are.
  const moved = new Map<string, Bounds>();
  moved.set(targetKey, next);
  return {
    bounds: [{ ...target, bounds: next }],
    edges: previewEdges(geometry, moved),
  };
}
