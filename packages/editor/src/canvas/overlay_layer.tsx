// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import type { Bounds } from '@archeglyph/core/geometry/bounds';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';
import { elementKey } from '../scene/element_key';
import { handlePositions } from '../scene/hit_test';
import type { ElementRef } from '../ui_state/ui_state';
import type { ElementBounds, SceneGeometry } from '../scene/scene';
import type { ScenePreview } from '../scene/preview';

type MaybeElement = JSX.Element | null;

export interface OverlayLayerProps {
  geometry: SceneGeometry;
  selection: Array<ElementRef>;
  hover?: ElementRef;
  zoom: number;
  preview?: ScenePreview;
  marquee?: Bounds;
}

function pointsAttribute(points: Array<Vec2>): string {
  return points.map((point: Vec2): string => `${point.x},${point.y}`).join(' ');
}

function boundsRect(bounds: Bounds, className: string, zoom: number): JSX.Element {
  return (
    <rect
      class={className}
      x={bounds.minX}
      y={bounds.minY}
      width={bounds.maxX - bounds.minX}
      height={bounds.maxY - bounds.minY}
      fill="none"
      stroke={className === 'hover-outline' ? 'var(--ag-teal)' : 'var(--ag-blue)'}
      stroke-width={2 / zoom}
      vector-effect="non-scaling-stroke"
    />
  );
}

function refOutline(
  ref: ElementRef,
  geometry: SceneGeometry,
  className: string,
  zoom: number,
): MaybeElement {
  if (ref.kind === 'edge') {
    const points: Array<Vec2> | undefined = geometry.edgePolylines[ref.id];
    if (points === undefined) {
      return null;
    }
    return (
      <polyline
        class={className}
        points={pointsAttribute(points)}
        fill="none"
        stroke={className === 'hover-outline' ? 'var(--ag-teal)' : 'var(--ag-blue)'}
        stroke-width={2 / zoom}
        vector-effect="non-scaling-stroke"
      />
    );
  }

  const entry: ElementBounds | undefined = geometry.byKey[elementKey(ref)];
  return entry === undefined ? null : boundsRect(entry.bounds, className, zoom);
}

function previewBounds(
  entries: Array<ElementBounds>,
  zoom: number,
): Array<JSX.Element> {
  return entries.map((entry: ElementBounds): JSX.Element => boundsRect(entry.bounds, 'preview-shape', zoom));
}

function previewEdges(preview: ScenePreview, zoom: number): Array<JSX.Element> {
  return preview.edges.map((edge): JSX.Element => (
    <polyline
      class="preview-edge"
      points={pointsAttribute(edge.points)}
      fill="none"
      stroke="var(--ag-blue)"
      stroke-width={2 / zoom}
      vector-effect="non-scaling-stroke"
    />
  ));
}

export const OverlayLayer: Component<OverlayLayerProps> = (props: OverlayLayerProps): JSX.Element => {
  const selectedEntry: ElementBounds | undefined = props.selection.length === 1
    ? props.geometry.byKey[elementKey(props.selection[0])]
    : undefined;
  const handles = selectedEntry === undefined || selectedEntry.ref.kind === 'edge'
    ? []
    : handlePositions(selectedEntry.bounds);
  const handleSide: number = 8 / props.zoom;
  const handleElements: Array<JSX.Element> = handles.map((handlePoint): JSX.Element => (
    <rect
      class="resize-handle"
      x={handlePoint.point.x - handleSide / 2}
      y={handlePoint.point.y - handleSide / 2}
      width={handleSide}
      height={handleSide}
      fill="var(--ag-blue)"
      stroke="var(--ag-blue)"
      stroke-width={1 / props.zoom}
      vector-effect="non-scaling-stroke"
    />
  ));

  return (
    <g class="overlay-layer">
      {props.hover === undefined ? null : refOutline(props.hover, props.geometry, 'hover-outline', props.zoom)}
      {props.selection.map((ref: ElementRef): MaybeElement =>
        refOutline(ref, props.geometry, 'selection-outline', props.zoom)
      )}
      {props.preview === undefined ? null : previewBounds(props.preview.bounds, props.zoom)}
      {props.preview === undefined ? null : previewEdges(props.preview, props.zoom)}
      {handleElements}
      {props.marquee === undefined ? null : boundsRect(props.marquee, 'marquee', props.zoom)}
    </g>
  );
};
