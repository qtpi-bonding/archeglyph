// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Glyph2D, type Fill, type Stroke, type Typography, ArrowheadVariant, ShapeType, FontWeight, TextAlign, StrokePattern } from '@archeglyph/proto/gen/style_pb';
import type { Vec2 } from '../../geometry/vec2';
import { type Localization } from '@archeglyph/proto/gen/content_pb';
import { type LaidOutDiagram } from '../../layout/laid_out_diagram';
import { type EdgeSection } from '../../layout/edge_section';

function r(n: number): string {
  return n.toFixed(2);
}

// Pattern values are fixed rather than scaled to stroke width: the width is
// not known here, and these match what the bundled themes write by hand.
function dashAttr(stroke: Stroke): string {
  if (stroke.dashing.case === 'customDasharray') {
    return ` stroke-dasharray="${stroke.dashing.value}"`;
  }
  if (stroke.dashing.case === 'pattern') {
    if (stroke.dashing.value === StrokePattern.DASHED) {
      return ' stroke-dasharray="5,4"';
    }
    if (stroke.dashing.value === StrokePattern.DOTTED) {
      return ' stroke-dasharray="1,3"';
    }
  }
  return '';
}

function strokeAttrs(stroke: Stroke | undefined): string {
  if (stroke === undefined) {
    return '';
  } else {
    const colorStr: string = stroke.paint.case === 'color' ? ` stroke="${stroke.paint.value.value}"` : '';
    const widthStr: string = stroke.width !== undefined ? ` stroke-width="${r(stroke.width)}"` : '';
    return colorStr + widthStr + dashAttr(stroke);
  }
}

function fillAttrs(fill: Fill | undefined): string {
  if (fill === undefined) {
    // style.proto: "Unset = no fill". With no attribute SVG fills it black.
    return ' fill="none"';
  } else {
    const colorStr: string = fill.paint.case === 'color' ? ` fill="${fill.paint.value.value}"` : '';
    const opacStr: string = fill.opacity !== undefined ? ` fill-opacity="${r(fill.opacity)}"` : '';
    return colorStr + opacStr;
  }
}

function polygonPoints(n: number, cx: number, cy: number, rx: number, ry: number): string {
  let pts: string = '';
  for (let k: number = 0; k < n; k++) {
    const angle: number = 2 * Math.PI * k / n - Math.PI / 2;
    const px: number = cx + rx * Math.cos(angle);
    const py: number = cy + ry * Math.sin(angle);
    const sep: string = k > 0 ? ' ' : '';
    pts = pts + sep + r(px) + ',' + r(py);
  }
  return pts;
}

function escapeXml(text: string): string {
  const chars: string[] = text.split('');
  const escaped: string[] = chars.map((ch: string): string => {
    if (ch === '&') { return '&amp;'; }
    else if (ch === '<') { return '&lt;'; }
    else if (ch === '>') { return '&gt;'; }
    else if (ch === '"') { return '&quot;'; }
    else { return ch; }
  });
  return escaped.join('');
}

function fontWeightValue(weight: FontWeight): string {
  if (weight === FontWeight.WEIGHT_LIGHT) { return '300'; }
  else if (weight === FontWeight.WEIGHT_NORMAL) { return '400'; }
  else if (weight === FontWeight.WEIGHT_MEDIUM) { return '500'; }
  else if (weight === FontWeight.WEIGHT_SEMIBOLD) { return '600'; }
  else if (weight === FontWeight.WEIGHT_BOLD) { return '700'; }
  else { return ''; }
}

function textAnchorValue(align: TextAlign): string {
  if (align === TextAlign.ALIGN_CENTER) { return 'middle'; }
  else if (align === TextAlign.ALIGN_LEFT) { return 'start'; }
  else if (align === TextAlign.ALIGN_RIGHT) { return 'end'; }
  else { return ''; }
}

type ViewBoxExtents = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function viewBoxExtents(diagram: LaidOutDiagram): ViewBoxExtents {
  let minX: number = Infinity;
  let minY: number = Infinity;
  let maxX: number = -Infinity;
  let maxY: number = -Infinity;

  for (const node of Object.values(diagram.nodes)) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.size.x);
    maxY = Math.max(maxY, node.position.y + node.size.y);
  }
  for (const group of Object.values(diagram.groups)) {
    minX = Math.min(minX, group.position.x);
    minY = Math.min(minY, group.position.y);
    maxX = Math.max(maxX, group.position.x + group.size.x);
    maxY = Math.max(maxY, group.position.y + group.size.y);
  }
  for (const ann of Object.values(diagram.annotations)) {
    minX = Math.min(minX, ann.position.x);
    minY = Math.min(minY, ann.position.y);
    maxX = Math.max(maxX, ann.position.x + ann.size.x);
    maxY = Math.max(maxY, ann.position.y + ann.size.y);
  }
  for (const edge of Object.values(diagram.edges)) {
    for (const section of edge.sections) {
      minX = Math.min(minX, section.startPoint.x, section.endPoint.x);
      minY = Math.min(minY, section.startPoint.y, section.endPoint.y);
      maxX = Math.max(maxX, section.startPoint.x, section.endPoint.x);
      maxY = Math.max(maxY, section.startPoint.y, section.endPoint.y);
      for (const bp of section.bendPoints) {
        minX = Math.min(minX, bp.x);
        minY = Math.min(minY, bp.y);
        maxX = Math.max(maxX, bp.x);
        maxY = Math.max(maxY, bp.y);
      }
    }
  }

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  const pad: number = 16;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + 2 * pad,
    height: maxY - minY + 2 * pad,
  };
}

export function viewBox(diagram: LaidOutDiagram): string {
  const extents: ViewBoxExtents = viewBoxExtents(diagram);
  return `${r(extents.x)} ${r(extents.y)} ${r(extents.width)} ${r(extents.height)}`;
}

export function backgroundRect(diagram: LaidOutDiagram): string {
  const background = diagram.canvas?.background;
  // No '$' guard needed: the cascade resolves the background role directly.
  if (background === undefined || background.value === '') {
    return '';
  }
  const extents: ViewBoxExtents = viewBoxExtents(diagram);
  return `<rect x="${r(extents.x)}" y="${r(extents.y)}" width="${r(extents.width)}" height="${r(extents.height)}" fill="${escapeXml(background.value)}"/>`;
}

export function arrowMarkers(variants: ArrowheadVariant[]): string {
  const renderable: ArrowheadVariant[] = [...new Set(variants)].filter((v: ArrowheadVariant): boolean => v !== ArrowheadVariant.ARROWHEAD_NONE);
  if (renderable.length === 0) { return ''; }
  return `<defs>${renderable.map(variantMarker).join('')}</defs>`;
}

export function edgePath(sections: EdgeSection[]): string {
  if (sections.length === 0) {
    return '';
  }

  const parts: string[] = [`M ${r(sections[0].startPoint.x)},${r(sections[0].startPoint.y)}`];
  for (const sec of sections) {
    for (const bp of sec.bendPoints) {
      parts.push(`L ${r(bp.x)},${r(bp.y)}`);
    }
    parts.push(`L ${r(sec.endPoint.x)},${r(sec.endPoint.y)}`);
  }
  return parts.join(' ');
}

// `centred`: the anchor is a box's middle, not a corner. SVG's defaults would
// otherwise start the text at it and put the baseline on it.
export function textElement(label: Localization[], typography: Typography, anchor: Vec2, centred: boolean = false): string {
  if (label.length === 0) {
    return '';
  }
  if (typography.visible === false) {
    return '';
  }

  const entry: Localization = label[0];
  const weightStr: string = typography.weight !== undefined ? fontWeightValue(typography.weight) : '';
  const anchorStr: string = typography.align !== undefined
    ? textAnchorValue(typography.align)
    : (centred ? 'middle' : '');
  const fillStr: string = typography.color !== undefined ? typography.color.value : '';

  const attrParts: string[] = [
    `x="${r(anchor.x)}"`,
    `y="${r(anchor.y)}"`,
    typography.font !== undefined ? `font-family="${typography.font}"` : '',
    typography.size !== undefined ? `font-size="${typography.size}"` : '',
    weightStr !== '' ? `font-weight="${weightStr}"` : '',
    anchorStr !== '' ? `text-anchor="${anchorStr}"` : '',
    centred ? 'dominant-baseline="central"' : '',
    fillStr !== '' ? `fill="${fillStr}"` : '',
  ].filter((s: string): boolean => s !== '');
  const attrs: string = attrParts.join(' ');

  const lines: string[] = entry.source.split('\n');
  const lineHeight: number = typography.size !== undefined ? typography.size * 1.2 : 16;
  const tspans: string[] = lines.map((line: string, i: number): string => {
    const dy: string = i === 0 ? '0' : `${lineHeight}`;
    return `<tspan x="${r(anchor.x)}" dy="${dy}">${escapeXml(line)}</tspan>`;
  });
  return `<text ${attrs}>${tspans.join('')}</text>`;
}

export function shapePath(shape: Glyph2D, position: Vec2, size: Vec2): string {
  const x: number = position.x;
  const y: number = position.y;
  const w: number = size.x;
  const h: number = size.y;
  const cx: number = x + w / 2;
  const cy: number = y + h / 2;
  const rx: number = w / 2;
  const ry: number = h / 2;
  const sa: string = strokeAttrs(shape.stroke);
  const fa: string = fillAttrs(shape.fill);

  if (shape.shapeKind.case === 'customPathRef') {
    return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="0" data-shape-ref="${shape.shapeKind.value}"${fa}${sa}/>`;
  } else {
    const shapeType: ShapeType = shape.shapeKind.case === 'standard' ? shape.shapeKind.value : ShapeType.SHAPE_UNSPECIFIED;
    switch (shapeType) {
      case ShapeType.SHAPE_ELLIPSE: {
        return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_CYLINDER: {
        const capH: number = h / 5;
        const bodyY: number = y + capH / 2;
        const bodyH: number = h - capH / 2;
        return `<rect x="${r(x)}" y="${r(bodyY)}" width="${r(w)}" height="${r(bodyH)}"${fa}${sa}/><ellipse cx="${r(cx)}" cy="${r(bodyY)}" rx="${r(rx)}" ry="${r(capH / 2)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_TRIANGLE: {
        return `<polygon points="${polygonPoints(3, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_PENTAGON: {
        return `<polygon points="${polygonPoints(5, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_HEXAGON: {
        return `<polygon points="${polygonPoints(6, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_HEPTAGON: {
        return `<polygon points="${polygonPoints(7, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_OCTAGON: {
        return `<polygon points="${polygonPoints(8, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_NONAGON: {
        return `<polygon points="${polygonPoints(9, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_DECAGON: {
        return `<polygon points="${polygonPoints(10, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_UNSPECIFIED: {
        const cornerR: string = shape.cornerRadius !== undefined ? r(shape.cornerRadius) : '0';
        return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${cornerR}"${fa}${sa}/>`;
      }
      case ShapeType.SHAPE_RECT: {
        const cornerR: string = shape.cornerRadius !== undefined ? r(shape.cornerRadius) : '0';
        return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${cornerR}"${fa}${sa}/>`;
      }
      default: {
        const cornerR: string = shape.cornerRadius !== undefined ? r(shape.cornerRadius) : '0';
        return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${cornerR}"${fa}${sa}/>`;
      }
    }
  }
}

function variantMarker(v: ArrowheadVariant): string {
  switch (v) {
    case ArrowheadVariant.ARROWHEAD_OPEN:
      return buildMarker('ah-open', '10', '10', '10', '5',
        '<path d="M0,0 L10,5 L0,10" fill="none" stroke="context-stroke" stroke-width="1.50"/>');
    case ArrowheadVariant.ARROWHEAD_UNSPECIFIED:
      return buildMarker('ah-unspecified', '10', '10', '10', '5',
        '<path d="M0,0 L10,5 L0,10 Z" fill="context-stroke" stroke="none"/>');
    case ArrowheadVariant.ARROWHEAD_FILLED:
      return buildMarker('ah-filled', '10', '10', '10', '5',
        '<path d="M0,0 L10,5 L0,10 Z" fill="context-stroke" stroke="none"/>');
    case ArrowheadVariant.ARROWHEAD_DIAMOND:
      return buildMarker('ah-diamond', '10', '10', '10', '5',
        '<path d="M0,5 L5,0 L10,5 L5,10 Z" fill="context-stroke" stroke="none"/>');
    case ArrowheadVariant.ARROWHEAD_CIRCLE:
      return buildMarker('ah-circle', '10', '10', '10', '5',
        '<circle cx="5" cy="5" r="5" fill="context-stroke" stroke="none"/>');
    case ArrowheadVariant.ARROWHEAD_TEE:
      return buildMarker('ah-tee', '2', '10', '0', '5',
        '<line x1="0" y1="0" x2="0" y2="10" stroke="context-stroke" stroke-width="1.50"/>');
    default:
      return '';
  }
}

function buildMarker(id: string, w: string, h: string, refX: string, refY: string, body: string): string {
  return `<marker id="${id}" markerWidth="${w}" markerHeight="${h}" refX="${refX}" refY="${refY}" orient="auto">${body}</marker>`;
}
