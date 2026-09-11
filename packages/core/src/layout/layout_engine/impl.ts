// SPDX-License-Identifier: AGPL-3.0-or-later

import { EdgeSection } from '../edge_section';
import { LaidOutGroup } from '../laid_out_group';
import { LayoutAdapter } from '../layout_adapter';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LayoutError } from '../layout_error';
import { LayoutRequest } from '../layout_request';
import { Ok, Result } from '@archeglyph/proto/util/result';
import { Vec2, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { create } from '@bufbuild/protobuf';

export interface LayoutEngine {
  layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>>;
}

/** Coordinates layout adapters and applies resolved geometry overrides. */
export class LayoutEngineImpl implements LayoutEngine {
  constructor(private readonly adapter: LayoutAdapter) {}

  async layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>> {
    // Keep the adapter behind this boundary: it is responsible only for
    // calculating geometry, while this engine is responsible for applying
    // values that were explicitly supplied by the resolver.
    const result = await this.adapter.runLayout(request.diagram);
    if (result.kind === 'err') {
      return result;
    }

    this.absolutizePositions(result.value);

    // The adapter supplies computed geometry, while explicitly resolved layout
    // values remain authoritative when present.
    const laid = result.value;
    const resolvedNodeById = new Map(request.diagram.nodes.map(n => [n.id, n]));
    const resolvedGroupById = new Map(request.diagram.groups.map(g => [g.id, g]));
    const resolvedEdgeById = new Map(request.diagram.edges.map(e => [e.id, e]));
    for (const node of laid.nodes) {
      const resolvedNode = resolvedNodeById.get(node.id);
      if (resolvedNode?.layout?.position != null) {
        node.position = resolvedNode.layout.position;
      }
    }
    for (const group of laid.groups) {
      const resolvedGroup = resolvedGroupById.get(group.id);
      if (resolvedGroup?.layout?.position != null) {
        group.position = resolvedGroup.layout.position;
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

  /** Converts ELK's parent-relative node and group positions to diagram coordinates. */
  private absolutizePositions(laid: LaidOutDiagram): void {
    const groupsById = new Map(laid.groups.map(group => [group.id, group]));
    const absoluteGroupPositions = new Map<string, Vec2>();

    const absoluteGroupPosition = (group: LaidOutGroup): Vec2 => {
      const existing = absoluteGroupPositions.get(group.id);
      if (existing !== undefined) {
        return existing;
      }

      const parent = group.parentGroup === undefined
        ? undefined
        : groupsById.get(group.parentGroup);
      const parentPosition = parent === undefined
        ? create(Vec2Schema, { x: 0, y: 0 })
        : absoluteGroupPosition(parent);
      const position = create(Vec2Schema, {
        x: group.position.x + parentPosition.x,
        y: group.position.y + parentPosition.y,
      });
      absoluteGroupPositions.set(group.id, position);
      return position;
    };

    for (const group of laid.groups) {
      group.position = absoluteGroupPosition(group);
    }
    for (const node of laid.nodes) {
      const parent = node.parentGroup === undefined
        ? undefined
        : groupsById.get(node.parentGroup);
      if (parent !== undefined) {
        const parentPosition = absoluteGroupPosition(parent);
        node.position = create(Vec2Schema, {
          x: node.position.x + parentPosition.x,
          y: node.position.y + parentPosition.y,
        });
      }
    }
  }
}
