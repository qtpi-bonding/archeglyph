// SPDX-License-Identifier: AGPL-3.0-or-later

import type { JSX } from 'solid-js';
import type { ViewportInsets } from '../ui_state/viewport_math';

/**
 * Gap in CSS pixels between an island and the viewport edge. 12.
 *
 * Half the drafting grid cell, so island edges land on a half-cell and
 * read as placed rather than arbitrary.
 *
 * IslandFrame sets `--ag-island-inset` from this constant on its root
 * element, and styles.css references only that custom property, never a
 * literal 12px. Otherwise the TypeScript constant is dead -- a value with
 * no observable effect that the hand-maintained CSS silently shadows,
 * which is the failure the next person greps for and misreads.
 */
export const ISLAND_INSET: number = 12;

/** The canvas and the optional islands arranged around it. */
export class IslandFrameProps {
  canvas!: JSX.Element;
  toolbar?: JSX.Element;
  inspector?: JSX.Element;
  file?: JSX.Element;
  zoom?: JSX.Element;
  undo?: JSX.Element;
  state?: JSX.Element;
  echo?: JSX.Element;
  pending?: JSX.Element;
}

/** Matches the inspector, so the two columns frame the canvas evenly. */
export const SIDE_COLUMN_WIDTH: number = 268;

/**
 * Canvas edges a viewport fit must leave clear.
 *
 * Only the side columns count. They are full-height and always rendered;
 * the toolbar and corner islands are short and sit over margin the fit
 * padding already leaves.
 */
export const CANVAS_INSETS: ViewportInsets = {
  left: ISLAND_INSET + SIDE_COLUMN_WIDTH,
  right: ISLAND_INSET + SIDE_COLUMN_WIDTH,
  top: 0,
  bottom: 0,
};

/** Render one positioning-only island slot. */
function IslandSlot(props: {
  content?: JSX.Element;
  style: JSX.CSSProperties;
  maxHeight?: string;
}): JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        ...props.style,
        'pointer-events': 'none',
        'max-height': props.maxHeight ?? 'calc(50vh - (2 * var(--ag-island-inset)))',
      }}
    >
      {props.content}
    </div>
  );
}

/**
 * The document editor's full-bleed canvas with its floating islands.
 *
 * The slot divs are intentionally inert overlay geometry. Interaction,
 * surfaces, and scrolling belong to each island's own root element.
 */
export const IslandFrame = (props: IslandFrameProps): JSX.Element => {
  function onMouseDown(event: MouseEvent): void {
    const target: EventTarget | null = event.target;
    if (!(target instanceof Element)) return;
    const island: Element | null = target.closest('.ag-island');
    if (island === null) return;
    // Selects (and other real editable controls) need the browser's normal
    // focus behaviour. Buttons deliberately do not: keyboard commands live
    // on an ancestor of the frame.
    if (target.closest('input, select, textarea, [contenteditable="true"]') !== null) return;
    event.preventDefault();
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        '--ag-island-inset': `${ISLAND_INSET}px`,
      }}
    >
      <div style={{ position: 'absolute', inset: '0' }}>
        {props.canvas}
      </div>
      <IslandSlot
        content={props.toolbar}
        style={{ top: 'var(--ag-island-inset)', left: '50%', transform: 'translateX(-50%)' }}
      />
      <IslandSlot
        content={props.inspector}
        style={{ top: 'var(--ag-island-inset)', left: 'var(--ag-island-inset)' }}
      />
      <IslandSlot
        content={
          // Proposals belong on the opposite side from the inspector: both are
          // tall, and side by side one of them has to be hidden to show the
          // other. Right-aligned so the file island keeps its own width.
          <div style={{
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'flex-end',
            gap: '8px',
            width: `${SIDE_COLUMN_WIDTH}px`,
            'max-height': '100%',
          }}>
            {props.file}
            {props.pending}
          </div>
        }
        maxHeight="calc(100vh - (2 * var(--ag-island-inset)) - 56px)"
        style={{ top: 'var(--ag-island-inset)', right: 'var(--ag-island-inset)' }}
      />
      <IslandSlot
        content={props.zoom}
        style={{ bottom: 'var(--ag-island-inset)', left: 'var(--ag-island-inset)' }}
      />
      <IslandSlot
        content={props.undo}
        style={{ bottom: 'var(--ag-island-inset)', right: 'var(--ag-island-inset)' }}
      />
      <IslandSlot
        content={
          // Bottom-anchored, so the column grows upwards and the echo keeps
          // the same spot on screen however tall the state island gets.
          <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '8px' }}>
            {props.state}
            {props.echo}
          </div>
        }
        style={{ bottom: 'var(--ag-island-inset)', left: '50%', transform: 'translateX(-50%)' }}
      />
    </div>
  );
};
