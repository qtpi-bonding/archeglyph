// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import { Vec2 } from '@archeglyph/proto/gen/style_pb';
import { EdgeRouting, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { EdgeSection } from '../edge_section';
import { routeOrthogonal, routeStraight } from '../edge_router';
import { LaidOutAnnotation } from '../laid_out_annotation';
import { LaidOutGroup } from '../laid_out_group';
import { LayoutAdapter } from '../layout_adapter';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LaidOutEdge } from '../laid_out_edge';
import { LaidOutNode } from '../laid_out_node';
import { LayoutError } from '../layout_error';
import { LayoutRequest } from '../layout_request';
import { ResolvedDiagram } from '../../resolver/resolved_diagram';
import { ResolvedGroup } from '../../resolver/resolved_group';
import { ResolvedNode } from '../../resolver/resolved_node';
import { measureLabel } from '../../text/font_metrics';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../default_size';
import { boundsFromRect, type Bounds } from '../../geometry/bounds';
import { Ok, Result } from '@archeglyph/proto/util/result';
import { init } from '@archeglyph/proto/util/init';

export interface LayoutEngine {
  layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>>;
}


/** Coordinates layout adapters and applies resolved geometry overrides. */

/** Every element that already carries an explicit position, by id. */
function pinnedPositions(diagram: ResolvedDiagram): Map<string, Vec2> {
  const pinned = new Map<string, Vec2>();
  for (const node of Object.values(diagram.nodes)) {
    if (node.layout?.position !== undefined) {
      pinned.set(node.id, node.layout.position);
    }
  }
  for (const group of Object.values(diagram.groups)) {
    if (group.layout?.position !== undefined) {
      pinned.set(group.id, group.layout.position);
    }
  }
  return pinned;
}

/**
 * The diagram with seeded positions written onto the elements that had none,
 * so every element carries one and layoutFromPins can be used unchanged.
 *
 * Copies rather than mutating: the ResolvedDiagram belongs to the caller and a
 * layout pass must not leave positions behind on it, or the next pass would
 * treat a seeded element as pinned and never re-seed it.
 */
function withSeededPositions(diagram: ResolvedDiagram, seeded: Map<string, Vec2>): ResolvedDiagram {
  const apply = <T extends { id: string; layout?: { position?: Vec2 } }>(element: T): T => {
    const position = seeded.get(element.id);
    if (position === undefined || element.layout?.position !== undefined) {
      return element;
    }
    return Object.assign(Object.create(Object.getPrototypeOf(element) as object), element, {
      layout: Object.assign({}, element.layout, { position }),
    }) as T;
  };
  return Object.assign(Object.create(Object.getPrototypeOf(diagram) as object), diagram, {
    nodes: Object.fromEntries(Object.entries(diagram.nodes).map(([id, node]) => [id, apply(node)])),
    groups: Object.fromEntries(Object.entries(diagram.groups).map(([id, group]) => [id, apply(group)])),
  }) as ResolvedDiagram;
}

/** Inset on each side mirrors the renderer's, which is one font size. */
function labelRoom(
  label: ReadonlyArray<{ source: string }>,
  typography: { font?: string; size?: number } | undefined,
): { x: number; y: number } {
  const fontSize: number = typography?.size ?? 13;
  let width: number = 0;
  let height: number = 0;
  for (const content of label) {
    const measured = measureLabel(content.source, typography?.font ?? '', fontSize);
    width = Math.max(width, measured.x + 2 * 12);
    height = Math.max(height, measured.y + 2 * 12);
  }
  return { x: width, y: height };
}

export class LayoutEngineImpl implements LayoutEngine {
  constructor(private readonly adapter: LayoutAdapter) {}

  private isFullyPinned(diagram: ResolvedDiagram): boolean {
    return Object.values(diagram.nodes).every(node => node.layout?.position !== undefined)
      && Object.values(diagram.groups).every(group => group.layout?.position !== undefined);
  }

  async layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>> {
    if (this.isFullyPinned(request.diagram)) {
      return Ok(this.layoutFromPins(request.diagram));
    }

    // Some pinned, some not. ELK cannot be asked to respect the pinned ones --
    // elk.layered ignores fixed positions outright and elk.fixed places
    // nothing -- so the newcomers are seeded beside whatever they connect to
    // and the result is built from written positions, exactly as the
    // fully-pinned path does. ELK is consulted for ARRANGEMENT inside
    // seedPositions, never for where the pinned elements go.
    const pinned = pinnedPositions(request.diagram);
    if (pinned.size > 0) {
      const seeded = await this.adapter.seedPositions(request.diagram, pinned);
      return Ok(this.layoutFromPins(withSeededPositions(request.diagram, seeded)));
    }

    const result = await this.adapter.runLayout(request.diagram);
    if (result.kind === 'err') {
      return result;
    }

    this.absolutizePositions(result.value);
    const laid = result.value;
    for (const node of Object.values(laid.nodes)) {
      const position = request.diagram.nodes[node.id]?.layout?.position;
      if (position !== undefined) {
        const parent = node.parentGroup === undefined ? undefined : laid.groups[node.parentGroup];
        node.position = parent === undefined
          ? position
          : create(Vec2Schema, { x: parent.position.x + position.x, y: parent.position.y + position.y });
      }
    }
    for (const group of Object.values(laid.groups)) {
      const position = request.diagram.groups[group.id]?.layout?.position;
      if (position !== undefined) {
        const parent = group.parentGroup === undefined ? undefined : laid.groups[group.parentGroup];
        group.position = parent === undefined
          ? position
          : create(Vec2Schema, { x: parent.position.x + position.x, y: parent.position.y + position.y });
      }
    }
    for (const edge of Object.values(laid.edges)) {
      const waypoints = request.diagram.edges[edge.id]?.layout?.waypoints;
      if (waypoints !== undefined && waypoints.length > 0) {
        edge.sections = [init(new EdgeSection(), {
          startPoint: waypoints[0],
          endPoint: waypoints[waypoints.length - 1],
          bendPoints: waypoints.slice(1, -1),
        })];
      }
    }
    return Ok(laid);
  }

  private layoutFromPins(diagram: ResolvedDiagram): LaidOutDiagram {
    const absoluteGroupPosition = (id: string): { x: number; y: number } => {
      const group = diagram.groups[id];
      if (group === undefined || group.layout?.position === undefined) {
        return { x: 0, y: 0 };
      }
      const parent = group.parentGroup === undefined ? { x: 0, y: 0 } : absoluteGroupPosition(group.parentGroup);
      return { x: parent.x + group.layout.position.x, y: parent.y + group.layout.position.y };
    };
    const sizeForLabel = (label: { source: string }[], typography: { font?: string; size?: number }): { x: number; y: number } => {
      let width = 0;
      let height = 0;
      for (const content of label) {
        const size = measureLabel(content.source, typography.font ?? '', typography.size ?? 16);
        width = Math.max(width, size.x);
        height = Math.max(height, size.y);
      }
      return { x: width, y: height };
    };
    // The label only widens the default box, never shrinks it: a bare text
    // bounding box is not a node, and the ELK branch never produces one.
    const nodeSize = (node: ResolvedNode): { x: number; y: number } => {
      if (node.layout?.size !== undefined) { return node.layout.size; }
      const label = sizeForLabel(node.label, node.typography);
      return { x: Math.max(DEFAULT_WIDTH, label.x), y: Math.max(DEFAULT_HEIGHT, label.y) };
    };

    const nodes: Record<string, LaidOutNode> = Object.fromEntries(Object.values(diagram.nodes).map(node => {
      const local = node.layout?.position!;
      const parent = node.parentGroup === undefined ? { x: 0, y: 0 } : absoluteGroupPosition(node.parentGroup);
      return [node.id, init(new LaidOutNode(), {
        id: node.id, parentGroup: node.parentGroup,
        position: create(Vec2Schema, { x: local.x + parent.x, y: local.y + parent.y }),
        size: create(Vec2Schema, nodeSize(node)), shape: node.shape,
        typography: node.typography, label: node.label, layout: node.layout,
      })];
    }));

    const computedGroupSize = new Map<string, { x: number; y: number }>();
    const groupSize = (group: ResolvedGroup): { x: number; y: number } => {
      const existing = computedGroupSize.get(group.id);
      if (existing !== undefined) return existing;
      const origin = absoluteGroupPosition(group.id);
      // Measured to the far edge in both directions, so a child above or
      // left of the group's origin still counts toward its extent.
      let width = 0;
      let height = 0;
      const extend = (x: number, y: number, w: number, h: number): void => {
        width = Math.max(width, x - origin.x + w, origin.x - x + w);
        height = Math.max(height, y - origin.y + h, origin.y - y + h);
      };
      for (const child of Object.values(nodes).filter(node => node.parentGroup === group.id)) {
        extend(child.position.x, child.position.y, child.size.x, child.size.y);
      }
      for (const child of Object.values(diagram.groups).filter(candidate => candidate.parentGroup === group.id)) {
        const childOrigin = absoluteGroupPosition(child.id);
        const childExtent = groupSize(child);
        extend(childOrigin.x, childOrigin.y, childExtent.x, childExtent.y);
      }
      // Same rule the ELK path gets via nodeSize.minimum: an override is a
      // MINIMUM, so a group grows on request and still contains its children.
      const room = labelRoom(group.label, group.typography);
      width = Math.max(width, room.x);
      height = Math.max(height, room.y);
      const requested = group.layout?.size;
      const size = requested === undefined
        ? { x: width, y: height }
        : { x: Math.max(width, requested.x), y: Math.max(height, requested.y) };
      computedGroupSize.set(group.id, size);
      return size;
    };
    const groups: Record<string, LaidOutGroup> = Object.fromEntries(Object.values(diagram.groups).map(group => {
      const position = absoluteGroupPosition(group.id);
      const size = groupSize(group);
      return [group.id, init(new LaidOutGroup(), {
        id: group.id, parentGroup: group.parentGroup,
        position: create(Vec2Schema, position), size: create(Vec2Schema, size),
        shape: group.shape, typography: group.typography, label: group.label,
        isSuperNode: group.isSuperNode, hiddenDescendantCount: group.hiddenDescendantCount,
        layout: group.layout,
      })];
    }));
    const endpointBounds = (id: string): Bounds => {
      const node = nodes[id];
      if (node !== undefined) return boundsFromRect(node.position, node.size);
      const group = groups[id];
      return group === undefined ? boundsFromRect(create(Vec2Schema, { x: 0, y: 0 }), create(Vec2Schema, { x: 0, y: 0 })) : boundsFromRect(group.position, group.size);
    };
    const edges: Record<string, LaidOutEdge> = Object.fromEntries(Object.values(diagram.edges).map(edge => {
      const layout = edge.layout;
      const waypoints = layout?.routing === EdgeRouting.ROUTING_MANUAL && layout.waypoints.length > 0
        ? layout.waypoints
        : layout?.routing === EdgeRouting.ROUTING_ORTHOGONAL
          ? routeOrthogonal(endpointBounds(edge.source), endpointBounds(edge.target), layout?.sourceAttach, layout?.targetAttach)
          : routeStraight(endpointBounds(edge.source), endpointBounds(edge.target), layout?.sourceAttach, layout?.targetAttach);
      return [edge.id, init(new LaidOutEdge(), {
        id: edge.id, source: edge.source, target: edge.target,
        sections: [init(new EdgeSection(), {
          startPoint: waypoints[0], endPoint: waypoints[waypoints.length - 1], bendPoints: waypoints.slice(1, -1),
        })], connection: edge.connection, typography: edge.typography, label: edge.label, layout: edge.layout,
      })];
    }));
    const annotations: Record<string, LaidOutAnnotation> = Object.fromEntries(Object.values(diagram.annotations).map(annotation => {
      const measured = sizeForLabel(annotation.content, annotation.typography);
      const position = annotation.layout?.position ?? create(Vec2Schema, { x: 0, y: 0 });
      const size = annotation.layout?.size ?? create(Vec2Schema, measured);
      return [annotation.id, init(new LaidOutAnnotation(), {
        id: annotation.id,
        position,
        size,
        anchor: annotation.anchor,
        shape: annotation.shape,
        typography: annotation.typography,
        callout: annotation.callout,
        layout: annotation.layout,
        content: annotation.content,
      })];
    }));
    return init(new LaidOutDiagram(), {
      id: diagram.id, canvas: diagram.canvas, nodes, groups, edges, annotations,
    });
  }

  /** Converts ELK's parent-relative positions to diagram coordinates. */
  private absolutizePositions(laid: LaidOutDiagram): void {
    function depthOf(group: LaidOutGroup): number {
      let depth = 0;
      let current: LaidOutGroup | undefined = group;
      while (current?.parentGroup !== undefined) {
        current = laid.groups[current.parentGroup];
        depth += 1;
      }
      return depth;
    }
    const orderedGroups = Object.values(laid.groups).sort((a, b) => depthOf(a) - depthOf(b));
    for (const group of orderedGroups) {
      if (group.parentGroup !== undefined) {
        const parent = laid.groups[group.parentGroup];
        if (parent !== undefined) group.position = create(Vec2Schema, { x: group.position.x + parent.position.x, y: group.position.y + parent.position.y });
      }
    }
    for (const node of Object.values(laid.nodes)) {
      const parent = node.parentGroup === undefined ? undefined : laid.groups[node.parentGroup];
      if (parent !== undefined) node.position = create(Vec2Schema, { x: node.position.x + parent.position.x, y: node.position.y + parent.position.y });
    }
  }
}
