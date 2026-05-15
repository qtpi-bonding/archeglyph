// SPDX-License-Identifier: AGPL-3.0-or-later

import { type LaidOutDiagram } from '../../layout/laid_out_diagram';
import { type EdgeSection } from '../../layout/edge_section';
import {
  ArrowheadVariant, FontWeight, TextAlign, ShapeType,
  type Glyph2D, type Typography, type Stroke, type Fill,
} from '@archeglyph/proto/gen/style_pb';
import { type Localization } from '@archeglyph/proto/gen/content_pb';

function r(n: number): string {
  return n.toFixed(2);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveStrokeColor(stroke: Stroke | undefined): string {
  if (stroke === undefined) return '#000000';
  if (stroke.paint.case === 'color') return stroke.paint.value.value;
  return '#000000';
}

function resolveFillColor(fill: Fill | undefined): string {
  if (fill === undefined) return 'none';
  if (fill.paint.case === 'color') return fill.paint.value.value;
  return 'none';
}

function polygon(
  x: number, y: number, w: number, h: number, sides: number,
  sc: string, sw: number, fc: string,
): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const pts: string[] = [];
  for (let k = 0; k < sides; k++) {
    const angle = (2 * Math.PI * k / sides) - Math.PI / 2;
    pts.push(`${r(cx + rx * Math.cos(angle))},${r(cy + ry * Math.sin(angle))}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" />`;
}

function fontWeightNum(weight: FontWeight | undefined): number {
  switch (weight) {
    case FontWeight.WEIGHT_LIGHT: return 300;
    case FontWeight.WEIGHT_NORMAL: return 400;
    case FontWeight.WEIGHT_MEDIUM: return 500;
    case FontWeight.WEIGHT_SEMIBOLD: return 600;
    case FontWeight.WEIGHT_BOLD: return 700;
    default: return 400;
  }
}

function textAnchorStr(align: TextAlign | undefined): string {
  switch (align) {
    case TextAlign.ALIGN_LEFT: return 'start';
    case TextAlign.ALIGN_RIGHT: return 'end';
    default: return 'middle';
  }
}

export function shapePath(
  shape: Glyph2D,
  position: { x: number; y: number },
  size: { x: number; y: number },
): string {
  const x = position.x;
  const y = position.y;
  const w = size.x;
  const h = size.y;
  const sc = resolveStrokeColor(shape.stroke);
  const sw = shape.stroke?.width ?? 1;
  const fc = resolveFillColor(shape.fill);
  const rx = shape.cornerRadius ?? 0;
  const shapeKind = shape.shapeKind;

  if (shapeKind.case === 'customPathRef') {
    return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${r(rx)}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" data-shape-ref="${escapeXml(shapeKind.value)}" />`;
  }

  const standard = shapeKind.case === 'standard' ? shapeKind.value : ShapeType.SHAPE_RECT;

  switch (standard) {
    case ShapeType.SHAPE_ELLIPSE: {
      const cx = x + w / 2;
      const cy = y + h / 2;
      return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(w / 2)}" ry="${r(h / 2)}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" />`;
    }
    case ShapeType.SHAPE_CYLINDER: {
      const cx = x + w / 2;
      const capRy = h * 0.1;
      const bodyY = y + capRy;
      const bodyH = h - 2 * capRy;
      return [
        `<rect x="${r(x)}" y="${r(bodyY)}" width="${r(w)}" height="${r(bodyH)}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" />`,
        `<ellipse cx="${r(cx)}" cy="${r(bodyY)}" rx="${r(w / 2)}" ry="${r(capRy)}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" />`,
        `<ellipse cx="${r(cx)}" cy="${r(bodyY + bodyH)}" rx="${r(w / 2)}" ry="${r(capRy)}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" />`,
      ].join('');
    }
    case ShapeType.SHAPE_TRIANGLE:
      return polygon(x, y, w, h, 3, sc, sw, fc);
    case ShapeType.SHAPE_PENTAGON:
      return polygon(x, y, w, h, 5, sc, sw, fc);
    case ShapeType.SHAPE_HEXAGON:
      return polygon(x, y, w, h, 6, sc, sw, fc);
    case ShapeType.SHAPE_HEPTAGON:
      return polygon(x, y, w, h, 7, sc, sw, fc);
    case ShapeType.SHAPE_OCTAGON:
      return polygon(x, y, w, h, 8, sc, sw, fc);
    case ShapeType.SHAPE_NONAGON:
      return polygon(x, y, w, h, 9, sc, sw, fc);
    case ShapeType.SHAPE_DECAGON:
      return polygon(x, y, w, h, 10, sc, sw, fc);
    default:
      return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${r(rx)}" fill="${fc}" stroke="${sc}" stroke-width="${r(sw)}" />`;
  }
}

export function edgePath(sections: EdgeSection[]): string {
  if (sections.length === 0) return '';
  const parts: string[] = [];
  let first = true;
  for (const s of sections) {
    if (first) {
      parts.push(`M ${r(s.startPoint.x)},${r(s.startPoint.y)}`);
      first = false;
    } else {
      parts.push(`L ${r(s.startPoint.x)},${r(s.startPoint.y)}`);
    }
    for (const bp of s.bendPoints) {
      parts.push(`L ${r(bp.x)},${r(bp.y)}`);
    }
    parts.push(`L ${r(s.endPoint.x)},${r(s.endPoint.y)}`);
  }
  return parts.join(' ');
}

export function textElement(
  label: Localization[],
  typography: Typography,
  anchor: { x: number; y: number },
): string {
  if (label.length === 0) return '';
  if (typography.visible === false) return '';
  const text = label[0].source;
  if (text === '') return '';
  const fontFamily = typography.font ?? 'sans-serif';
  const fontSize = typography.size ?? 14;
  const fw = fontWeightNum(typography.weight);
  const fill = typography.color?.value ?? '#000000';
  const textAnchor = textAnchorStr(typography.align);
  return `<text x="${r(anchor.x)}" y="${r(anchor.y)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fw}" fill="${escapeXml(fill)}" text-anchor="${textAnchor}" dominant-baseline="central">${escapeXml(text)}</text>`;
}

function arrowheadId(variant: ArrowheadVariant): string {
  return `ah-${ArrowheadVariant[variant]}`;
}

export function arrowMarkers(variants: Set<ArrowheadVariant>): string {
  const markers: string[] = [];
  for (const v of variants) {
    if (v === ArrowheadVariant.ARROWHEAD_NONE || v === ArrowheadVariant.ARROWHEAD_UNSPECIFIED) continue;
    const id = arrowheadId(v);
    switch (v) {
      case ArrowheadVariant.ARROWHEAD_OPEN:
        markers.push(`<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0,0 L 10,5 L 0,10" fill="none" stroke="context-stroke" stroke-width="2"/></marker>`);
        break;
      case ArrowheadVariant.ARROWHEAD_DIAMOND:
        markers.push(`<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 5,0 L 10,5 L 5,10 L 0,5 Z" fill="context-stroke"/></marker>`);
        break;
      case ArrowheadVariant.ARROWHEAD_CIRCLE:
        markers.push(`<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><circle cx="5" cy="5" r="5" fill="context-stroke"/></marker>`);
        break;
      default:
        markers.push(`<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0,0 L 10,5 L 0,10 Z" fill="context-stroke"/></marker>`);
    }
  }
  if (markers.length === 0) return '';
  return '\n    ' + markers.join('\n    ') + '\n  ';
}

export function viewBox(diagram: LaidOutDiagram): string {
  if (diagram.nodes.length === 0 && diagram.groups.length === 0 && diagram.annotations.length === 0) {
    return '0 0 100 100';
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of diagram.nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + n.size.x);
    maxY = Math.max(maxY, n.position.y + n.size.y);
  }
  for (const g of diagram.groups) {
    minX = Math.min(minX, g.position.x);
    minY = Math.min(minY, g.position.y);
    maxX = Math.max(maxX, g.position.x + g.size.x);
    maxY = Math.max(maxY, g.position.y + g.size.y);
  }
  for (const a of diagram.annotations) {
    const sz = a.layout?.size ?? { x: 120, y: 40 };
    minX = Math.min(minX, a.position.x);
    minY = Math.min(minY, a.position.y);
    maxX = Math.max(maxX, a.position.x + sz.x);
    maxY = Math.max(maxY, a.position.y + sz.y);
  }
  const pad = 16;
  return `${r(minX - pad)} ${r(minY - pad)} ${r(maxX - minX + 2 * pad)} ${r(maxY - minY + 2 * pad)}`;
}
