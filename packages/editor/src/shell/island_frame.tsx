// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component } from 'solid-js';
import { Option } from '@archeglyph/proto/util/result';

/**
 * Gap in CSS pixels between an island and the viewport edge. 12.
 *
 * Half the drafting grid cell, so island edges land on a half-cell and
 * read as placed rather than arbitrary.
 */
export const ISLAND_INSET: number = 12;

/** Props for the document-only canvas and its optional floating islands. */
export class IslandFrameProps {
  canvas!: JSX.Element;
  toolbar?: JSX.Element;
  inspector?: JSX.Element;
  file?: JSX.Element;
  zoom?: JSX.Element;
  undo?: JSX.Element;
  state?: JSX.Element;
}

const MAX_ISLAND_HEIGHT: string = 'calc(50vh - var(--ag-island-inset) - var(--ag-island-inset))';

type SlotName = 'toolbar' | 'inspector' | 'file' | 'zoom' | 'undo' | 'state';

interface SlotProps {
  name: SlotName;
  child: JSX.Element;
}

function isFormControl(target: Option<EventTarget>): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  const tagName: string = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'select' || tagName === 'textarea';
}

function slotStyle(slot: SlotName): string {
  const common: string = `position:absolute;pointer-events:none;max-height:${MAX_ISLAND_HEIGHT};`;
  switch (slot) {
    case 'toolbar':
      return `${common}top:var(--ag-island-inset);left:50%;transform:translateX(-50%);`;
    case 'inspector':
      return `${common}top:var(--ag-island-inset);left:var(--ag-island-inset);`;
    case 'file':
      return `${common}top:var(--ag-island-inset);right:var(--ag-island-inset);`;
    case 'zoom':
      return `${common}bottom:var(--ag-island-inset);left:var(--ag-island-inset);`;
    case 'undo':
      return `${common}bottom:var(--ag-island-inset);right:var(--ag-island-inset);`;
    case 'state':
      return `${common}bottom:var(--ag-island-inset);left:50%;transform:translateX(-50%);`;
  }
}

function Slot(props: SlotProps): JSX.Element {
  return (
    <div
      style={slotStyle(props.name)}
      onMouseDown={(event: MouseEvent): void => {
        if (!isFormControl(event.target)) {
          event.preventDefault();
        }
      }}
    >
      {props.child}
    </div>
  );
}

/** A full-bleed document canvas with the D13 islands overlaid around it. */
export const IslandFrame: Component<IslandFrameProps> = (props: IslandFrameProps): JSX.Element => (
  <div
    style={`position:relative;width:100%;height:100%;--ag-island-inset:${ISLAND_INSET}px;`}
  >
    <div style="position:absolute;inset:0;pointer-events:none;">{props.canvas}</div>
    {props.toolbar !== undefined ? <Slot name="toolbar" child={props.toolbar} /> : null}
    {props.inspector !== undefined ? <Slot name="inspector" child={props.inspector} /> : null}
    {props.file !== undefined ? <Slot name="file" child={props.file} /> : null}
    {props.zoom !== undefined ? <Slot name="zoom" child={props.zoom} /> : null}
    {props.undo !== undefined ? <Slot name="undo" child={props.undo} /> : null}
    {props.state !== undefined ? <Slot name="state" child={props.state} /> : null}
  </div>
);
