// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import { CommandId } from '../ui_state/keymap';

/** The controls for changing and fitting the canvas viewport scale. */
export class ZoomIslandProps {
  onCommand!: (command: CommandId) => void;
}

export const ZoomIsland: Component<ZoomIslandProps> = (
  props: ZoomIslandProps,
): JSX.Element => {
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
      <button type="button" aria-label="Zoom in" onClick={command('zoom-in')}>
        +
      </button>
      <button
        type="button"
        aria-label="Fit to content"
        onClick={command('zoom-fit')}
        style={{
          'margin-left': '6px',
          color: 'var(--ag-purple)',
        }}
      >
        Fit
      </button>
    </div>
  );
};
