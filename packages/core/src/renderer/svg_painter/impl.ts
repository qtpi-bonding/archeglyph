// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArrowheadVariant, Glyph2D, Typography, Vec2 } from '@archeglyph/proto/gen/style_pb';
import { Localization } from '@archeglyph/proto/gen/content_pb';
import { LaidOutDiagram } from '../../layout/laid_out_diagram';
import { EdgeSection } from '../../layout/edge_section';

export function viewBox(diagram: LaidOutDiagram): string {
  throw new Error('not implemented');
}

export function arrowMarkers(variants: ArrowheadVariant[]): string {
  const renderable = [...new Set(variants)].filter(v => v !== ArrowheadVariant.ARROWHEAD_NONE);
  if (renderable.length === 0) return '';
  return `<defs>\n  ${renderable.map(variantMarker).join('\n  ')}\n</defs>`;
}

export function edgePath(sections: EdgeSection[]): string {
  throw new Error('not implemented');
}

export function textElement(label: Localization[], typography: Typography, anchor: Vec2): string {
  throw new Error('not implemented');
}

export function shapePath(shape: Glyph2D, position: Vec2, size: Vec2): string {
  throw new Error('not implemented');
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
