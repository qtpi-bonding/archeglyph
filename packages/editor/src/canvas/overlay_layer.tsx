// SPDX-License-Identifier: MPL-2.0

import { Component, JSX } from 'solid-js';
import type { Bounds } from '@archeglyph/core/geometry/bounds';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';
import { elementKey } from '../scene/element_key';
import { handlePositions } from '../scene/hit_test';
import { anchorGripPoint } from '../scene/anchor_grip';
import { calloutPreviews } from '../scene/callout_preview';
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
  anchorLine?: Array<Vec2>;
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
      stroke-width={2}
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
        stroke-width={2}
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
      stroke-width={2}
      vector-effect="non-scaling-stroke"
    />
  ));
}

function calloutPreviewEdges(
  geometry: SceneGeometry,
  moved: Array<ElementBounds>,
): Array<JSX.Element> {
  return calloutPreviews(geometry, moved).map((edge): JSX.Element => (
    <polyline
      class="preview-edge"
      points={pointsAttribute(edge.points)}
      fill="none"
      stroke="var(--ag-blue)"
      stroke-width={2}
      vector-effect="non-scaling-stroke"
    />
  ));
}

function anchorLineElement(points: Array<Vec2>): JSX.Element {
  return (
    <polyline
      class="anchor-line"
      points={pointsAttribute(points)}
      fill="none"
      stroke="var(--ag-blue)"
      stroke-width={2}
      stroke-dasharray="4 4"
      vector-effect="non-scaling-stroke"
    />
  );
}

function anchorGripElement(entry: ElementBounds, zoom: number): JSX.Element {
  const point: Vec2 = anchorGripPoint(entry.bounds);
  const radius: number = 5 / zoom;
  return (
    <circle
      class="anchor-grip"
      cx={point.x}
      cy={point.y}
      r={radius}
      fill="var(--ag-blue)"
      stroke="var(--ag-blue)"
      stroke-width={1}
      vector-effect="non-scaling-stroke"
    />
  );
}

export const OverlayLayer: Component<OverlayLayerProps> = (props: OverlayLayerProps): JSX.Element => {
  // These must be functions, not values computed in the component body: a
  // Solid component body runs once, so reading props there would freeze the
  // handles at their mount-time selection and zoom.
  const selectedEntry = (): ElementBounds | undefined => props.selection.length === 1
    ? props.geometry.byKey[elementKey(props.selection[0])]
    : undefined;

  const handleElements = (): Array<JSX.Element> => {
    const entry: ElementBounds | undefined = selectedEntry();
    if (entry === undefined || entry.ref.kind === 'edge') {
      return [];
    }
    // A handle is a SHAPE, not a stroke, so it is sized in diagram units and
    // genuinely needs dividing by zoom to hold a constant on-screen size.
    const handleSide: number = 8 / props.zoom;
    return handlePositions(entry.bounds).map((handlePoint): JSX.Element => (
      <rect
        class="resize-handle"
        x={handlePoint.point.x - handleSide / 2}
        y={handlePoint.point.y - handleSide / 2}
        width={handleSide}
        height={handleSide}
        fill="var(--ag-blue)"
        stroke="var(--ag-blue)"
        stroke-width={1}
        vector-effect="non-scaling-stroke"
      />
    ));
  };

  const gripElement = (): MaybeElement => {
    if (props.preview !== undefined || props.marquee !== undefined || props.anchorLine !== undefined) {
      return null;
    }
    const entry: ElementBounds | undefined = selectedEntry();
    return entry === undefined || entry.ref.kind !== 'annotation'
      ? null
      : anchorGripElement(entry, props.zoom);
  };

  return (
    <g class="overlay-layer">
      {props.hover === undefined ? null : refOutline(props.hover, props.geometry, 'hover-outline', props.zoom)}
      {props.selection.map((ref: ElementRef): MaybeElement =>
        refOutline(ref, props.geometry, 'selection-outline', props.zoom)
      )}
      {props.preview === undefined ? null : previewBounds(props.preview.bounds, props.zoom)}
      {props.preview === undefined ? null : previewEdges(props.preview, props.zoom)}
      {props.preview === undefined ? null : calloutPreviewEdges(props.geometry, props.preview.bounds)}
      {props.anchorLine === undefined || props.anchorLine.length < 2 ? null : anchorLineElement(props.anchorLine)}
      {handleElements()}
      {gripElement()}
      {props.marquee === undefined ? null : boundsRect(props.marquee, 'marquee', props.zoom)}
    </g>
  );
};
