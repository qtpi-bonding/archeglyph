// SPDX-License-Identifier: AGPL-3.0-or-later

import { type LaidOutDiagram } from '../../layout/laid_out_diagram';
import { type LaidOutNode } from '../../layout/laid_out_node';
import { type LaidOutEdge } from '../../layout/laid_out_edge';
import { type LaidOutGroup } from '../../layout/laid_out_group';
import { type LaidOutAnnotation } from '../../layout/laid_out_annotation';
import { RenderError } from '../render_error';
import { type Result, Ok, Err } from '@archeglyph/proto/util/result';
import { ArrowheadVariant } from '@archeglyph/proto/gen/style_pb';
import { shapePath, edgePath, textElement, arrowMarkers, viewBox } from '../svg_painter';

export interface SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError>;
}

export class SvgRendererImpl implements SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError> {
    if (diagram.id === '') {
      return Err(Object.assign(new RenderError(), { message: 'diagram.id must not be empty' }));
    }

    const arrowVariants = collectArrowVariants(diagram);
    const defs = arrowMarkers(arrowVariants);

    const sortedGroups = [...diagram.groups].sort((a, b) => a.id.localeCompare(b.id));
    const sortedNodes = [...diagram.nodes].sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = [...diagram.edges].sort((a, b) => a.id.localeCompare(b.id));
    const sortedAnnotations = [...diagram.annotations].sort((a, b) => a.id.localeCompare(b.id));

    const parts: string[] = [];
    for (const group of sortedGroups) { parts.push(renderGroup(group)); }
    for (const node of sortedNodes) { parts.push(renderNode(node)); }
    for (const edge of sortedEdges) { parts.push(renderEdge(edge)); }
    for (const annotation of sortedAnnotations) { parts.push(renderAnnotation(annotation)); }

    const vb = viewBox(diagram);
    const svg = [
      '<!-- archeglyph version=1 -->',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" style="background: #ffffff">`,
      `  <defs>${defs}</defs>`,
      ...parts.map(p => `  ${p}`),
      '</svg>',
    ].join('\n');

    return Ok(svg);
  }
}

function collectArrowVariants(diagram: LaidOutDiagram): Set<ArrowheadVariant> {
  const variants = new Set<ArrowheadVariant>();
  for (const edge of diagram.edges) {
    const ah = edge.connection.arrowheads;
    if (ah !== undefined) {
      variants.add(ah.start);
      variants.add(ah.end);
    }
  }
  return variants;
}

function renderGroup(group: LaidOutGroup): string {
  const parts: string[] = [shapePath(group.shape, group.position, group.size)];
  if (group.isSuperNode) {
    const cx = group.position.x + group.size.x / 2;
    const cy = group.position.y + group.size.y / 2;
    const labelEl = textElement(group.label, group.typography, { x: cx, y: cy });
    if (labelEl !== '') parts.push(labelEl);
    const countEl = textElement(
      [{ locale: 'en', source: `+${group.hiddenDescendantCount}` }],
      group.typography,
      { x: cx, y: cy + 16 },
    );
    if (countEl !== '') parts.push(countEl);
  } else {
    const anchor = { x: group.position.x + group.size.x / 2, y: group.position.y + 12 };
    const labelEl = textElement(group.label, group.typography, anchor);
    if (labelEl !== '') parts.push(labelEl);
  }
  return parts.join('');
}

function renderNode(node: LaidOutNode): string {
  const sp = shapePath(node.shape, node.position, node.size);
  const anchor = { x: node.position.x + node.size.x / 2, y: node.position.y + node.size.y / 2 };
  const te = textElement(node.label, node.typography, anchor);
  return sp + te;
}

function renderEdge(edge: LaidOutEdge): string {
  const d = edgePath(edge.sections);
  const strokeColor = edge.connection.stroke?.paint.case === 'color'
    ? edge.connection.stroke.paint.value.value
    : '#000000';
  const sw = edge.connection.stroke?.width ?? 1;
  const ah = edge.connection.arrowheads;
  const startVariant = ah?.start ?? ArrowheadVariant.ARROWHEAD_NONE;
  const endVariant = ah?.end ?? ArrowheadVariant.ARROWHEAD_NONE;
  const isRealVariant = (v: ArrowheadVariant): boolean =>
    v !== ArrowheadVariant.ARROWHEAD_NONE && v !== ArrowheadVariant.ARROWHEAD_UNSPECIFIED;
  const markerStart = isRealVariant(startVariant) ? ` marker-start="url(#ah-${ArrowheadVariant[startVariant]})"` : '';
  const markerEnd = isRealVariant(endVariant) ? ` marker-end="url(#ah-${ArrowheadVariant[endVariant]})"` : '';
  const pathEl = `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${sw.toFixed(2)}"${markerStart}${markerEnd} />`;

  const parts: string[] = [pathEl];
  if (edge.label.length > 0 && edge.sections.length > 0) {
    const s0 = edge.sections[0];
    const midAnchor = {
      x: (s0.startPoint.x + s0.endPoint.x) / 2,
      y: (s0.startPoint.y + s0.endPoint.y) / 2,
    };
    const te = textElement(edge.label, edge.typography, midAnchor);
    if (te !== '') parts.push(te);
  }
  return parts.join('');
}

function renderAnnotation(annotation: LaidOutAnnotation): string {
  const size = annotation.layout?.size ?? { x: 120, y: 40 };
  return shapePath(annotation.shape, annotation.position, size);
}
