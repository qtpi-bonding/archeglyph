// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { type ArrowheadVariant, type Vec2, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { Ok, Err, type Result } from '@archeglyph/proto/util/result';
import { type LaidOutDiagram } from '../../layout/laid_out_diagram';
import { type LaidOutEdge } from '../../layout/laid_out_edge';
import { type LaidOutGroup } from '../../layout/laid_out_group';
import { type LaidOutNode } from '../../layout/laid_out_node';
import { RenderError } from '../render_error';
import { arrowMarkers, edgePath, shapePath, textElement, viewBox } from '../svg_painter';

export interface SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError>;
}

export class SvgRendererImpl implements SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError> {
    if (diagram.id === '') {
      return Err(Object.assign(new RenderError(), { message: 'diagram.id must not be empty' }));
    }

    const vb: string = viewBox(diagram);

    const sortedGroups: LaidOutGroup[] = diagram.groups.slice().sort(
      (a: LaidOutGroup, b: LaidOutGroup) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedNodes: LaidOutNode[] = diagram.nodes.slice().sort(
      (a: LaidOutNode, b: LaidOutNode) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedEdges: LaidOutEdge[] = diagram.edges.slice().sort(
      (a: LaidOutEdge, b: LaidOutEdge) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );

    const variantsSeen: Set<ArrowheadVariant> = new Set();
    for (const edge of sortedEdges) {
      if (edge.connection.arrowheads !== undefined) {
        variantsSeen.add(edge.connection.arrowheads.start);
        variantsSeen.add(edge.connection.arrowheads.end);
      }
    }

    const defs: string = arrowMarkers([...variantsSeen]);

    let groupsSvg: string = '';
    for (const group of sortedGroups) {
      const shape: string = shapePath(group.shape, group.position, group.size);
      const centerX: number = group.position.x + group.size.x / 2;
      const centerY: number = group.position.y + group.size.y / 2;
      const center: Vec2 = create(Vec2Schema, { x: centerX, y: centerY });
      const labelSvg: string = textElement(group.label, group.typography, center);
      groupsSvg += `<g id="group-${group.id}">${shape}${labelSvg}</g>`;
    }

    let nodesSvg: string = '';
    for (const node of sortedNodes) {
      const shape: string = shapePath(node.shape, node.position, node.size);
      const centerX: number = node.position.x + node.size.x / 2;
      const centerY: number = node.position.y + node.size.y / 2;
      const center: Vec2 = create(Vec2Schema, { x: centerX, y: centerY });
      const labelSvg: string = textElement(node.label, node.typography, center);
      nodesSvg += `<g id="node-${node.id}">${shape}${labelSvg}</g>`;
    }

    let edgesSvg: string = '';
    for (const edge of sortedEdges) {
      const pathSvg: string = edgePath(edge.sections);
      const hasLabel: boolean = edge.label.length > 0 && edge.sections.length > 0;
      const labelSvg: string = hasLabel
        ? textElement(
            edge.label,
            edge.typography,
            create(Vec2Schema, {
              x: (edge.sections[0].startPoint.x + edge.sections[0].endPoint.x) / 2,
              y: (edge.sections[0].startPoint.y + edge.sections[0].endPoint.y) / 2,
            })
          )
        : '';
      edgesSvg += `<g id="edge-${edge.id}">${pathSvg}${labelSvg}</g>`;
    }

    const svg: string = `<!-- archeglyph version=1 --><svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${defs}${groupsSvg}${nodesSvg}${edgesSvg}</svg>`;

    return Ok(svg);
  }
}
