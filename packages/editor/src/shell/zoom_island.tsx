// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import type { CommandId } from '../ui_state/keymap';

/** Inputs for the zoom controls island. */
export class ZoomIslandProps {
  zoom!: number;
  onCommand!: (command: CommandId) => void;
}

/** The viewport zoom controls, with a stable-width percentage readout. */
export const ZoomIsland: Component<ZoomIslandProps> = (
  props: ZoomIslandProps,
): JSX.Element => {
  const buttonStyle: JSX.CSSProperties = {
    'min-width': '28px',
    padding: '3px 7px',
    'text-align': 'center',
  };
  const readoutStyle: JSX.CSSProperties = {
    width: '4ch',
    'min-width': '4ch',
    padding: '3px 0',
    border: 'none',
    background: 'transparent',
    'font-family': 'var(--ag-font-mono)',
    'text-align': 'center',
  };

  return (
    <div
      class="ag-island"
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '2px',
        padding: '4px',
      }}
    >
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        style={buttonStyle}
        onClick={(): void => props.onCommand('zoom-out')}
      >
        −
      </button>
      <button
        type="button"
        aria-label="Reset zoom"
        title="Reset zoom"
        style={readoutStyle}
        onClick={(): void => props.onCommand('zoom-reset')}
      >
        {Math.round(props.zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        style={buttonStyle}
        onClick={(): void => props.onCommand('zoom-in')}
      >
        +
      </button>
      <span
        aria-hidden="true"
        style={{
          width: '1px',
          height: '18px',
          margin: '0 4px',
          background: 'var(--ag-edge)',
        }}
      />
      <button
        type="button"
        aria-label="Fit diagram"
        title="Fit diagram"
        style={{ ...buttonStyle, color: 'var(--ag-purple)' }}
        onClick={(): void => props.onCommand('zoom-fit')}
      >
        Fit
      </button>
    </div>
  );
};
