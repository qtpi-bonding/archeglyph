// SPDX-License-Identifier: AGPL-3.0-or-later

import { EdgeSection } from '../edge_section';
import { ElkAdapterImpl, LayoutAdapter } from '../layout_adapter';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LayoutError } from '../layout_error';
import { LayoutRequest } from '../layout_request';
import { Ok, Result } from '@archeglyph/proto/util/result';

export interface LayoutEngine {
  layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>>;
}

/** Coordinates layout adapters and applies resolved geometry overrides. */
export class LayoutEngineImpl implements LayoutEngine {
  private readonly adapter: LayoutAdapter;

  constructor() {
    this.adapter = new ElkAdapterImpl();
  }

  async layout(request: LayoutRequest): Promise<Result<LaidOutDiagram, LayoutError>> {
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
      const pos = resolvedNodeById.get(node.id)?.layout?.position;
      if (pos != null) node.position = pos;
    }
    for (const group of laid.groups) {
      const pos = resolvedGroupById.get(group.id)?.layout?.position;
      if (pos != null) group.position = pos;
    }
    for (const edge of laid.edges) {
      const waypoints = resolvedEdgeById.get(edge.id)?.layout?.waypoints;
      if (waypoints != null && waypoints.length > 0) {
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
