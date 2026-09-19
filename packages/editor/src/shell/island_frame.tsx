// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component } from 'solid-js';

/**
 * Gap in CSS pixels between an island and the viewport edge. 12.
 *
 * Half the drafting grid cell, so island edges land on a half-cell and read
 * as placed rather than arbitrary. The value is exposed on the frame as a
 * custom property so the layout CSS has one source of truth.
 */
export const ISLAND_INSET: number = 12;

/** The canvas and the optional islands that float above it. */
export class IslandFrameProps {
  canvas!: JSX.Element;
  toolbar?: JSX.Element;
  inspector?: JSX.Element;
  file?: JSX.Element;
  zoom?: JSX.Element;
  undo?: JSX.Element;
  state?: JSX.Element;
}

const islandStyle: string = [
  'position:absolute',
  'pointer-events:none',
  'max-height:calc(50vh - var(--ag-island-inset) - var(--ag-island-inset))',
].join(';');

const topCentreStyle: string = `${islandStyle};top:var(--ag-island-inset);left:50%;transform:translateX(-50%)`;
const topLeftStyle: string = `${islandStyle};top:var(--ag-island-inset);left:var(--ag-island-inset)`;
const topRightStyle: string = `${islandStyle};top:var(--ag-island-inset);right:var(--ag-island-inset)`;
const bottomLeftStyle: string = `${islandStyle};bottom:var(--ag-island-inset);left:var(--ag-island-inset)`;
const bottomRightStyle: string = `${islandStyle};bottom:var(--ag-island-inset);right:var(--ag-island-inset)`;
const bottomCentreStyle: string = `${islandStyle};bottom:var(--ag-island-inset);left:50%;transform:translateX(-50%)`;

/**
 * Prevent island controls from taking keyboard focus while leaving genuine
 * form controls usable. The keyboard editor is attached above this frame.
 */
function suppressIslandFocus(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const island: Element | null = event.target.closest('.ag-island');
  if (island === null) return;
  if (event.target.closest('select, input, textarea') !== null) return;
  event.preventDefault();
}

/**
 * A full-bleed canvas with the D13 islands positioned over it.
 */
export const IslandFrame: Component<IslandFrameProps> = (props: IslandFrameProps): JSX.Element => (
  <div
    class="ag-island-frame"
    style={`position:relative;height:100%;min-height:0;--ag-island-inset:${ISLAND_INSET}px`}
    onMouseDown={suppressIslandFocus}
  >
    <div style="position:absolute;inset:0">{props.canvas}</div>
    {props.toolbar !== undefined && <div style={topCentreStyle}>{props.toolbar}</div>}
    {props.inspector !== undefined && <div style={topLeftStyle}>{props.inspector}</div>}
    {props.file !== undefined && <div style={topRightStyle}>{props.file}</div>}
    {props.zoom !== undefined && <div style={bottomLeftStyle}>{props.zoom}</div>}
    {props.undo !== undefined && <div style={bottomRightStyle}>{props.undo}</div>}
    {props.state !== undefined && <div style={bottomCentreStyle}>{props.state}</div>}
  </div>
);
