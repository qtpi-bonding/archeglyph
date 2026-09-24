// SPDX-License-Identifier: AGPL-3.0-or-later

import { Localization, LocalizationSchema } from '@archeglyph/proto/gen/content_pb';

import { create } from '@bufbuild/protobuf';
import {
  ArrowheadVariant,
  GroupLabelPosition,
  type Stroke,
  TextAlign,
  type Typography,
  TypographySchema,
  type Vec2,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { Ok, Err, type Result } from '@archeglyph/proto/util/result';
import { type LaidOutAnnotation } from '../../layout/laid_out_annotation';
import { type EdgeSection } from '../../layout/edge_section';
// Aliased: style_pb exports a Vec2 too, and geometry's is what sections carry.
import { type Vec2 as Point } from '../../geometry/vec2';
import { type LaidOutDiagram } from '../../layout/laid_out_diagram';
import { type LaidOutEdge } from '../../layout/laid_out_edge';
import { type LaidOutGroup } from '../../layout/laid_out_group';
import { type LaidOutNode } from '../../layout/laid_out_node';
import { calloutSections } from '../../layout/callout_line/impl';
import { RenderError } from '../render_error';
import { arrowMarkers, backgroundRect, edgePath, glyphMarks, glyphPatternOf, glyphPatterns, lineStrokeAttrs, shapePath, textElement, viewBox } from '../svg_painter';
import { init } from '@archeglyph/proto/util/init';

/**
 * Where a group's label sits, and which way it reads from there.
 *
 * GroupLayout.label_position has been in the schema since the data model was
 * locked but the renderer only ever drew the centre, which puts the label
 * straight through the group's own children. UNSPECIFIED therefore means
 * TOP_LEFT — the architecture-diagram convention, and what the blueprint
 * mockup draws.
 *
 * The anchor point and the text-anchor have to agree: a label placed at the
 * left inset but centred on it hangs off the group's edge. An explicit
 * Typography.align from the stylesheet or theme still wins; this only fills
 * in the one the position implies.
 */
const GROUP_LABEL_PADDING: number = 12;

function groupLabelPlacement(group: LaidOutGroup): { anchor: Vec2; align: TextAlign } {
  const size: number = group.typography.size ?? 13;
  const ascent: number = size * 0.8;
  const descent: number = size * 0.2;
  const left: number = group.position.x + GROUP_LABEL_PADDING;
  const right: number = group.position.x + group.size.x - GROUP_LABEL_PADDING;
  const centerX: number = group.position.x + group.size.x / 2;
  const top: number = group.position.y + GROUP_LABEL_PADDING + ascent;
  const bottom: number = group.position.y + group.size.y - GROUP_LABEL_PADDING - descent;

  if (group.isSuperNode && group.layout?.labelPosition === undefined) {
    return {
      anchor: point(centerX, group.position.y + group.size.y / 2),
      align: TextAlign.ALIGN_CENTER,
    };
  }

  switch (group.layout?.labelPosition) {
    case GroupLabelPosition.GROUP_LABEL_TOP_CENTER:
      return { anchor: point(centerX, top), align: TextAlign.ALIGN_CENTER };
    case GroupLabelPosition.GROUP_LABEL_TOP_RIGHT:
      return { anchor: point(right, top), align: TextAlign.ALIGN_RIGHT };
    case GroupLabelPosition.GROUP_LABEL_BOTTOM_LEFT:
      return { anchor: point(left, bottom), align: TextAlign.ALIGN_LEFT };
    case GroupLabelPosition.GROUP_LABEL_BOTTOM_CENTER:
      return { anchor: point(centerX, bottom), align: TextAlign.ALIGN_CENTER };
    case GroupLabelPosition.GROUP_LABEL_BOTTOM_RIGHT:
      return { anchor: point(right, bottom), align: TextAlign.ALIGN_RIGHT };
    default:
      return { anchor: point(left, top), align: TextAlign.ALIGN_LEFT };
  }
}


function groupLabel(group: LaidOutGroup): Localization[] {
  if (!group.isSuperNode || group.hiddenDescendantCount <= 0) {
    return group.label;
  }
  return group.label.map((l: Localization): Localization =>
    create(LocalizationSchema, { locale: l.locale, source: `${l.source} +${group.hiddenDescendantCount}` }));
}

function point(x: number, y: number): Vec2 {
  return create(Vec2Schema, { x, y });
}

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

function sectionPoints(sections: ReadonlyArray<EdgeSection>): Point[] {
  if (sections.length === 0) { return []; }
  const pts: Point[] = [sections[0]!.startPoint];
  for (const sec of sections) {
    for (const bp of sec.bendPoints) { pts.push(bp); }
    pts.push(sec.endPoint);
  }
  return pts;
}

export class SvgRendererImpl implements SvgRenderer {
  render(diagram: LaidOutDiagram): Result<string, RenderError> {
    if (diagram.id === '') {
      return Err(init(new RenderError(), { message: 'diagram.id must not be empty' }));
    }

    const vb: string = viewBox(diagram);
    const vbParts: string[] = vb.split(' ');
    const svgWidth: string = vbParts[2];
    const svgHeight: string = vbParts[3];

    const sortedGroups: LaidOutGroup[] = Object.values(diagram.groups).sort(
      (a: LaidOutGroup, b: LaidOutGroup) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedNodes: LaidOutNode[] = Object.values(diagram.nodes).sort(
      (a: LaidOutNode, b: LaidOutNode) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedEdges: LaidOutEdge[] = Object.values(diagram.edges).sort(
      (a: LaidOutEdge, b: LaidOutEdge) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const sortedAnnotations: LaidOutAnnotation[] = Object.values(diagram.annotations).sort(
      (a: LaidOutAnnotation, b: LaidOutAnnotation) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );

    const variantsSeen: Set<ArrowheadVariant> = new Set();
    for (const edge of sortedEdges) {
      if (edge.connection.arrowheads !== undefined) {
        variantsSeen.add(edge.connection.arrowheads.start);
        variantsSeen.add(edge.connection.arrowheads.end);
      }
    }
    for (const annotation of sortedAnnotations) {
      const sections: EdgeSection[] = calloutSections(diagram, annotation);
      if (sections.length > 0 && annotation.callout?.arrowheads !== undefined) {
        variantsSeen.add(annotation.callout.arrowheads.start);
        variantsSeen.add(annotation.callout.arrowheads.end);
      }
    }

    // Sorted so the defs block is byte-stable: a Set iterates in insertion
    // order, which follows whichever element happened to be painted first.
    const glyphKeys: Set<string> = new Set();
    const noteGlyph = (stroke: Stroke | undefined): void => {
      const glyph = glyphPatternOf(stroke);
      if (glyph !== undefined && stroke?.paint.case === 'color') {
        glyphKeys.add(`${glyph}\u0000${stroke.paint.value.value}`);
      }
    };
    for (const group of sortedGroups) { noteGlyph(group.shape.stroke); }
    for (const node of sortedNodes) { noteGlyph(node.shape.stroke); }
    for (const edge of sortedEdges) { noteGlyph(edge.connection.stroke); }
    for (const annotation of sortedAnnotations) {
      noteGlyph(annotation.shape.stroke);
      noteGlyph(annotation.callout?.stroke);
    }

    const defs: string = arrowMarkers([...variantsSeen]) + glyphPatterns([...glyphKeys].sort());

    let groupsSvg: string = '';
    for (const group of sortedGroups) {
      const shape: string = shapePath(group.shape, group.position, group.size);
      const placement = groupLabelPlacement(group);
      const labelTypography: Typography = group.typography.align !== undefined
        ? group.typography
        : create(TypographySchema, { ...group.typography, align: placement.align });
      const labelSvg: string = textElement(groupLabel(group), labelTypography, placement.anchor, group.isSuperNode);
      groupsSvg += `<g id="group-${group.id}" data-element-id="${group.id}" data-kind="group">${shape}${labelSvg}</g>`;
    }

    let nodesSvg: string = '';
    for (const node of sortedNodes) {
      const shape: string = shapePath(node.shape, node.position, node.size);
      const centerX: number = node.position.x + node.size.x / 2;
      const centerY: number = node.position.y + node.size.y / 2;
      const center: Vec2 = create(Vec2Schema, { x: centerX, y: centerY });
      const labelSvg: string = textElement(node.label, node.typography, center, true);
      nodesSvg += `<g id="node-${node.id}" data-element-id="${node.id}" data-kind="node">${shape}${labelSvg}</g>`;
    }

    let edgesSvg: string = '';
    for (const edge of sortedEdges) {
      const d: string = edgePath(edge.sections);
      const startVariant: ArrowheadVariant | undefined = edge.connection.arrowheads?.start;
      const endVariant: ArrowheadVariant | undefined = edge.connection.arrowheads?.end;
      const startMarkerAttr: string = startVariant !== undefined && startVariant !== ArrowheadVariant.ARROWHEAD_NONE
        ? ` marker-start="url(#${markerId(startVariant)})"`
        : '';
      const endMarkerAttr: string = endVariant !== undefined && endVariant !== ArrowheadVariant.ARROWHEAD_NONE
        ? ` marker-end="url(#${markerId(endVariant)})"`
        : '';
      const hitStroke: string = `<path d="${d}" fill="none" stroke="transparent" stroke-width="12" style="pointer-events: stroke"/>`;
      const edgeGlyph = glyphPatternOf(edge.connection.stroke);
      const edgeMarks: string = edgeGlyph !== undefined && edge.connection.stroke?.paint.case === 'color'
        ? glyphMarks(sectionPoints(edge.sections), edgeGlyph, edge.connection.stroke.paint.value.value)
        : '';
      const visiblePath: string = `<path d="${d}" fill="none"${lineStrokeAttrs(edge.connection.stroke)}${startMarkerAttr}${endMarkerAttr}/>${edgeMarks}`;
      const hasLabel: boolean = edge.label.length > 0 && edge.sections.length > 0;
      const labelSvg: string = hasLabel
        ? textElement(
            edge.label,
            edge.typography,
            create(Vec2Schema, {
              x: (edge.sections[0].startPoint.x + edge.sections[0].endPoint.x) / 2,
              y: (edge.sections[0].startPoint.y + edge.sections[0].endPoint.y) / 2,
            }),
            true,
          )
        : '';
      edgesSvg += `<g id="edge-${edge.id}" data-element-id="${edge.id}" data-kind="edge">${hitStroke}${visiblePath}${labelSvg}</g>`;
    }

    let annotationsSvg: string = '';
    for (const ann of sortedAnnotations) {
      const annCenter: Vec2 = create(Vec2Schema, {
        x: ann.position.x + ann.size.x / 2,
        y: ann.position.y + ann.size.y / 2,
      });
      const calloutSectionsForAnnotation: EdgeSection[] = calloutSections(diagram, ann);
      const calloutPath: string = edgePath(calloutSectionsForAnnotation);
      const calloutStartVariant: ArrowheadVariant | undefined = ann.callout?.arrowheads?.start;
      const calloutEndVariant: ArrowheadVariant | undefined = ann.callout?.arrowheads?.end;
      const calloutStartMarker: string = calloutStartVariant !== undefined && calloutStartVariant !== ArrowheadVariant.ARROWHEAD_NONE
        ? ` marker-start="url(#${markerId(calloutStartVariant)})"`
        : '';
      const calloutEndMarker: string = calloutEndVariant !== undefined && calloutEndVariant !== ArrowheadVariant.ARROWHEAD_NONE
        ? ` marker-end="url(#${markerId(calloutEndVariant)})"`
        : '';
      const calloutGlyph = glyphPatternOf(ann.callout?.stroke);
      const calloutMarks: string = calloutGlyph !== undefined && ann.callout?.stroke?.paint.case === 'color'
        ? glyphMarks(sectionPoints(calloutSections(diagram, ann)), calloutGlyph, ann.callout.stroke.paint.value.value)
        : '';
      const calloutSvg: string = calloutPath !== ''
        ? `<path d="${calloutPath}" fill="none"${lineStrokeAttrs(ann.callout?.stroke)}${calloutStartMarker}${calloutEndMarker}/>${calloutMarks}`
        : '';
      const shape: string = shapePath(ann.shape, ann.position, ann.size);
      const labelSvg: string = textElement(ann.content, ann.typography, annCenter, true);
      annotationsSvg += `<g id="annotation-${ann.id}" data-element-id="${ann.id}" data-kind="annotation">${calloutSvg}${shape}${labelSvg}</g>`;
    }

    const svg: string = `<!-- archeglyph version=1 --><svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${svgWidth}" height="${svgHeight}">${defs}${backgroundRect(diagram)}${groupsSvg}${nodesSvg}${edgesSvg}${annotationsSvg}</svg>`;

    return Ok(svg);
  }
}
