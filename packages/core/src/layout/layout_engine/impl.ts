// SPDX-License-Identifier: AGPL-3.0-or-later

import { EdgeSection } from '../edge_section';
import { LayoutAdapter } from '../layout_adapter';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LayoutError } from '../layout_error';
import { LayoutRequest } from '../layout_request';
import { Ok, Result } from '@archeglyph/proto/util/result';

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
}
