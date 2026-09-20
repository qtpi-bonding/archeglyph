// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import { CommandId } from '../ui_state/keymap';

/** The controls for changing and fitting the canvas viewport scale. */
export class ZoomIslandProps {
  zoom!: number;
  onCommand!: (command: CommandId) => void;
}

/** Minus, readout, plus, then a separated Fit control. */
export const ZoomIsland: Component<ZoomIslandProps> = (
  props: ZoomIslandProps,
): JSX.Element => {
  const percentage: number = Math.round(props.zoom * 100);

  const command = (id: CommandId): (() => void) => (): void => {
    props.onCommand(id);
  };

  return (
    <div
      class="ag-island"
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '2px',
      }}
    >
      <button type="button" aria-label="Zoom out" onClick={command('zoom-out')}>
        −
      </button>
      <button
        type="button"
        aria-label="Reset zoom"
        onClick={command('zoom-reset')}
        style={{
          width: '4ch',
          padding: '3px 0',
          background: 'transparent',
          border: '0',
          'font-family': 'var(--ag-font-mono)',
          'text-align': 'center',
        }}
      >
        {percentage}%
      </button>
      <button type="button" aria-label="Zoom in" onClick={command('zoom-in')}>
        +
      </button>
      <button
        type="button"
        aria-label="Fit to content"
        onClick={command('zoom-fit')}
        style={{
          'margin-left': '6px',
          'border-left': '1px solid var(--ag-edge)',
          color: 'var(--ag-purple)',
        }}
      >
        Fit
      </button>
    </div>
  );
};
