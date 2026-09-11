// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { ArrowheadVariant, type Vec2, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { Ok, Err, type Result } from '@archeglyph/proto/util/result';
import { type LaidOutAnnotation } from '../../layout/laid_out_annotation';
import { type LaidOutDiagram } from '../../layout/laid_out_diagram';
import { type LaidOutEdge } from '../../layout/laid_out_edge';
import { type LaidOutGroup } from '../../layout/laid_out_group';
import { type LaidOutNode } from '../../layout/laid_out_node';
import { RenderError } from '../render_error';
import { arrowMarkers, edgePath, shapePath, textElement, viewBox } from '../svg_painter';

function markerId(variant: ArrowheadVariant): string {
  switch (variant) {
    case ArrowheadVariant.ARROWHEAD_OPEN: return 'ah-open';
    case ArrowheadVariant.ARROWHEAD_FILLED: return 'ah-filled';
    case ArrowheadVariant.ARROWHEAD_DIAMOND: return 'ah-diamond';
    case ArrowheadVariant.ARROWHEAD_CIRCLE: return 'ah-circle';
    case ArrowheadVariant.ARROWHEAD_TEE: return 'ah-tee';
    default: return 'ah-unspecified';
  }
}

export interface SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError>;
}

export class SvgRendererImpl implements SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError> {
    if (diagram.id === '') {
      return Err(Object.assign(new RenderError(), { message: 'diagram.id must not be empty' }));
    }

    const vb: string = viewBox(diagram);
    const vbParts: string[] = vb.split(' ');
    const svgWidth: string = vbParts[2];
    const svgHeight: string = vbParts[3];

    const sortedGroups: LaidOutGroup[] = diagram.groups.slice().sort(
      (a: LaidOutGroup, b: LaidOutGroup) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedNodes: LaidOutNode[] = diagram.nodes.slice().sort(
      (a: LaidOutNode, b: LaidOutNode) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedEdges: LaidOutEdge[] = diagram.edges.slice().sort(
      (a: LaidOutEdge, b: LaidOutEdge) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedAnnotations: LaidOutAnnotation[] = diagram.annotations.slice().sort(
      (a: LaidOutAnnotation, b: LaidOutAnnotation) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
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
      groupsSvg += `<g id="group-${group.id}" data-element-id="${group.id}" data-kind="group">${shape}${labelSvg}</g>`;
    }

    let nodesSvg: string = '';
    for (const node of sortedNodes) {
      const shape: string = shapePath(node.shape, node.position, node.size);
      const centerX: number = node.position.x + node.size.x / 2;
      const centerY: number = node.position.y + node.size.y / 2;
      const center: Vec2 = create(Vec2Schema, { x: centerX, y: centerY });
      const labelSvg: string = textElement(node.label, node.typography, center);
      nodesSvg += `<g id="node-${node.id}" data-element-id="${node.id}" data-kind="node">${shape}${labelSvg}</g>`;
    }

    let edgesSvg: string = '';
    for (const edge of sortedEdges) {
      const d: string = edgePath(edge.sections);
      const strokeColor: string = edge.connection.stroke?.paint.case === 'color'
        ? edge.connection.stroke.paint.value.value
        : '#000000';
      const strokeWidth: number = edge.connection.stroke?.width ?? 1;
      const startVariant: ArrowheadVariant | undefined = edge.connection.arrowheads?.start;
      const endVariant: ArrowheadVariant | undefined = edge.connection.arrowheads?.end;
      const startMarkerAttr: string = startVariant !== undefined && startVariant !== ArrowheadVariant.ARROWHEAD_NONE
        ? ` marker-start="url(#${markerId(startVariant)})"`
        : '';
      const endMarkerAttr: string = endVariant !== undefined && endVariant !== ArrowheadVariant.ARROWHEAD_NONE
        ? ` marker-end="url(#${markerId(endVariant)})"`
        : '';
      const hitStroke: string = `<path d="${d}" fill="none" stroke="transparent" stroke-width="12" style="pointer-events: stroke"/>`;
      const visiblePath: string = `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"${startMarkerAttr}${endMarkerAttr}/>`;
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
      edgesSvg += `<g id="edge-${edge.id}" data-element-id="${edge.id}" data-kind="edge">${hitStroke}${visiblePath}${labelSvg}</g>`;
    }

    // NOTE: callout-line rendering (annotation -> anchor target) is deferred.
    // AnnotationEntry.anchor never survives resolution today -- neither
    // ResolvedAnnotation nor LaidOutAnnotation carries it, only the visual
    // callout Glyph1D style does. Threading the anchor reference through
    // resolver + layout is a separate follow-up; this delta paints the
    // annotation's own shape + text, which is the blocking fix
    // (docs/editor-ui-review.md §2.11 / §5.5).
    let annotationsSvg: string = '';
    for (const ann of sortedAnnotations) {
      const annCenter: Vec2 = create(Vec2Schema, {
        x: ann.position.x + ann.size.x / 2,
        y: ann.position.y + ann.size.y / 2,
      });
      const shape: string = shapePath(ann.shape, ann.position, ann.size);
      const labelSvg: string = textElement(ann.content, ann.typography, annCenter);
      annotationsSvg += `<g id="annotation-${ann.id}" data-element-id="${ann.id}" data-kind="annotation">${shape}${labelSvg}</g>`;
    }

    const svg: string = `<!-- archeglyph version=1 --><svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${svgWidth}" height="${svgHeight}">${defs}${groupsSvg}${nodesSvg}${edgesSvg}${annotationsSvg}</svg>`;

    return Ok(svg);
  }
}
