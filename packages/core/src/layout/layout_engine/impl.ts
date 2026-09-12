// SPDX-License-Identifier: AGPL-3.0-or-later

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
import { measureLabel } from '../../text/font_metrics';
import { boundsFromRect, type Bounds } from '../../geometry/bounds';
import { Ok, Result } from '@archeglyph/proto/util/result';

export interface LayoutEngine {
  layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>>;
}

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 40;

/** Coordinates layout adapters and applies resolved geometry overrides. */

/** Every element that already carries an explicit position, by id. */
function pinnedPositions(diagram: ResolvedDiagram): Map<string, Vec2> {
  const pinned = new Map<string, Vec2>();
  for (const node of diagram.nodes) {
    if (node.layout?.position !== undefined) {
      pinned.set(node.id, node.layout.position);
    }
  }
  for (const group of diagram.groups) {
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
    nodes: diagram.nodes.map(apply),
    groups: diagram.groups.map(apply),
  }) as ResolvedDiagram;
}

export class LayoutEngineImpl implements LayoutEngine {
  constructor(private readonly adapter: LayoutAdapter) {}

  private isFullyPinned(diagram: ResolvedDiagram): boolean {
    return diagram.nodes.every(node => node.layout?.position !== undefined)
      && diagram.groups.every(group => group.layout?.position !== undefined);
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
    const resolvedNodeById = new Map(request.diagram.nodes.map(node => [node.id, node]));
    const resolvedGroupById = new Map(request.diagram.groups.map(group => [group.id, group]));
    const resolvedEdgeById = new Map(request.diagram.edges.map(edge => [edge.id, edge]));
    const groupById = new Map(laid.groups.map(group => [group.id, group]));
    for (const node of laid.nodes) {
      const position = resolvedNodeById.get(node.id)?.layout?.position;
      if (position !== undefined) {
        const parent = node.parentGroup === undefined ? undefined : groupById.get(node.parentGroup);
        node.position = parent === undefined
          ? position
          : create(Vec2Schema, { x: parent.position.x + position.x, y: parent.position.y + position.y });
      }
    }
    for (const group of laid.groups) {
      const position = resolvedGroupById.get(group.id)?.layout?.position;
      if (position !== undefined) {
        const parent = group.parentGroup === undefined ? undefined : groupById.get(group.parentGroup);
        group.position = parent === undefined
          ? position
          : create(Vec2Schema, { x: parent.position.x + position.x, y: parent.position.y + position.y });
      }
    }
    for (const edge of laid.edges) {
      const waypoints = resolvedEdgeById.get(edge.id)?.layout?.waypoints;
      if (waypoints !== undefined && waypoints.length > 0) {
        edge.sections = [Object.assign(new EdgeSection(), {
          startPoint: waypoints[0],
          endPoint: waypoints[waypoints.length - 1],
          bendPoints: waypoints.slice(1, -1),
        })];
      }
    }
    return Ok(laid);
  }

  private layoutFromPins(diagram: ResolvedDiagram): LaidOutDiagram {
    const groupById = new Map(diagram.groups.map(group => [group.id, group]));
    const absoluteGroupPosition = (id: string): { x: number; y: number } => {
      const group = groupById.get(id);
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
    const nodeSize = (node: typeof diagram.nodes[number]): { x: number; y: number } =>
      node.layout?.size ?? sizeForLabel(node.label, node.typography);

    const nodes = diagram.nodes.map(node => {
      const local = node.layout?.position!;
      const parent = node.parentGroup === undefined ? { x: 0, y: 0 } : absoluteGroupPosition(node.parentGroup);
      return Object.assign(new LaidOutNode(), {
        id: node.id, parentGroup: node.parentGroup,
        position: create(Vec2Schema, { x: local.x + parent.x, y: local.y + parent.y }),
        size: create(Vec2Schema, nodeSize(node)), shape: node.shape,
        typography: node.typography, label: node.label, layout: node.layout,
      });
    });

    const laidNodeById = new Map(nodes.map(node => [node.id, node]));
    const computedGroupSize = new Map<string, { x: number; y: number }>();
    const groupSize = (group: typeof diagram.groups[number]): { x: number; y: number } => {
      const existing = computedGroupSize.get(group.id);
      if (existing !== undefined) return existing;
      const origin = absoluteGroupPosition(group.id);
      let width = 0;
      let height = 0;
      for (const child of nodes.filter(node => node.parentGroup === group.id)) {
        width = Math.max(width, child.position.x - origin.x + child.size.x);
        height = Math.max(height, child.position.y - origin.y + child.size.y);
      }
      for (const child of diagram.groups.filter(candidate => candidate.parentGroup === group.id)) {
        const childOrigin = absoluteGroupPosition(child.id);
        const childExtent = groupSize(child);
        width = Math.max(width, childOrigin.x - origin.x + childExtent.x);
        height = Math.max(height, childOrigin.y - origin.y + childExtent.y);
      }
      const size = { x: width, y: height };
      computedGroupSize.set(group.id, size);
      return size;
    };
    const groups = diagram.groups.map(group => {
      const position = absoluteGroupPosition(group.id);
      const size = groupSize(group);
      return Object.assign(new LaidOutGroup(), {
        id: group.id, parentGroup: group.parentGroup,
        position: create(Vec2Schema, position), size: create(Vec2Schema, size),
        shape: group.shape, typography: group.typography, label: group.label,
        isSuperNode: group.isSuperNode, hiddenDescendantCount: group.hiddenDescendantCount,
        layout: group.layout,
      });
    });
    const laidGroupById = new Map(groups.map(group => [group.id, group]));
    const endpointBounds = (id: string): Bounds => {
      const node = laidNodeById.get(id);
      if (node !== undefined) return boundsFromRect(node.position, node.size);
      const group = laidGroupById.get(id);
      return group === undefined ? boundsFromRect(create(Vec2Schema, { x: 0, y: 0 }), create(Vec2Schema, { x: 0, y: 0 })) : boundsFromRect(group.position, group.size);
    };
    const edges = diagram.edges.map(edge => {
      const layout = edge.layout;
      const waypoints = layout?.routing === EdgeRouting.ROUTING_MANUAL && layout.waypoints.length > 0
        ? layout.waypoints
        : layout?.routing === EdgeRouting.ROUTING_ORTHOGONAL
          ? routeOrthogonal(endpointBounds(edge.source), endpointBounds(edge.target), layout?.sourceAttach, layout?.targetAttach)
          : routeStraight(endpointBounds(edge.source), endpointBounds(edge.target), layout?.sourceAttach, layout?.targetAttach);
      return Object.assign(new LaidOutEdge(), {
        id: edge.id, source: edge.source, target: edge.target,
        sections: [Object.assign(new EdgeSection(), {
          startPoint: waypoints[0], endPoint: waypoints[waypoints.length - 1], bendPoints: waypoints.slice(1, -1),
        })], connection: edge.connection, typography: edge.typography, label: edge.label, layout: edge.layout,
      });
    });
    const annotations = diagram.annotations.map(annotation => {
      const measured = sizeForLabel(annotation.content, annotation.typography);
      const position = annotation.layout?.position ?? create(Vec2Schema, { x: 0, y: 0 });
      const size = annotation.layout?.size ?? create(Vec2Schema, measured);
      return Object.assign(new LaidOutAnnotation(), {
        id: annotation.id,
        anchor: annotation.anchor,
        position,
        size,
        shape: annotation.shape,
        typography: annotation.typography,
        callout: annotation.callout,
        layout: annotation.layout,
        content: annotation.content,
      });
    });
    return Object.assign(new LaidOutDiagram(), {
      id: diagram.id, canvas: diagram.canvas, nodes, groups, edges, annotations,
    });
  }

  /** Converts ELK's parent-relative positions to diagram coordinates. */
  private absolutizePositions(laid: LaidOutDiagram): void {
    const groupById = new Map(laid.groups.map(group => [group.id, group]));
    function depthOf(group: LaidOutGroup): number {
      let depth = 0;
      let current: LaidOutGroup | undefined = group;
      while (current?.parentGroup !== undefined) {
        current = groupById.get(current.parentGroup);
        depth += 1;
      }
      return depth;
    }
    const orderedGroups = laid.groups.slice().sort((a, b) => depthOf(a) - depthOf(b));
    for (const group of orderedGroups) {
      if (group.parentGroup !== undefined) {
        const parent = groupById.get(group.parentGroup);
        if (parent !== undefined) group.position = create(Vec2Schema, { x: group.position.x + parent.position.x, y: group.position.y + parent.position.y });
      }
    }
    for (const node of laid.nodes) {
      const parent = node.parentGroup === undefined ? undefined : groupById.get(node.parentGroup);
      if (parent !== undefined) node.position = create(Vec2Schema, { x: node.position.x + parent.position.x, y: node.position.y + parent.position.y });
    }
  }
}
