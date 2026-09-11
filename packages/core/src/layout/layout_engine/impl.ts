// SPDX-License-Identifier: AGPL-3.0-or-later

import { EdgeSection } from '../edge_section';
import { LaidOutGroup } from '../laid_out_group';
import { LayoutAdapter } from '../layout_adapter';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LayoutError } from '../layout_error';
import { LayoutRequest } from '../layout_request';
import { Ok, Result } from '@archeglyph/proto/util/result';
import { Vec2Schema } from '@archeglyph/proto/gen/style_pb';
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
    const groupById = new Map(laid.groups.map(g => [g.id, g]));
    for (const node of laid.nodes) {
      const overridePos = resolvedNodeById.get(node.id)?.layout?.position;
      if (overridePos != null) {
        const parent = node.parentGroup !== undefined ? groupById.get(node.parentGroup) : undefined;
        node.position = parent !== undefined
          ? create(Vec2Schema, { x: parent.position.x + overridePos.x, y: parent.position.y + overridePos.y })
          : overridePos;
      }
    }
    for (const group of laid.groups) {
      const overridePos = resolvedGroupById.get(group.id)?.layout?.position;
      if (overridePos != null) {
        const parent = group.parentGroup !== undefined ? groupById.get(group.parentGroup) : undefined;
        group.position = parent !== undefined
          ? create(Vec2Schema, { x: parent.position.x + overridePos.x, y: parent.position.y + overridePos.y })
          : overridePos;
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
    const groupById = new Map(laid.groups.map(g => [g.id, g]));

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
        if (parent !== undefined) {
          group.position = create(Vec2Schema, {
            x: group.position.x + parent.position.x,
            y: group.position.y + parent.position.y,
          });
        }
      }
    }

    for (const node of laid.nodes) {
      const parent = node.parentGroup === undefined
        ? undefined
        : groupById.get(node.parentGroup);
      if (parent !== undefined) {
        node.position = create(Vec2Schema, {
          x: node.position.x + parent.position.x,
          y: node.position.y + parent.position.y,
        });
      }
    }
  }
}
