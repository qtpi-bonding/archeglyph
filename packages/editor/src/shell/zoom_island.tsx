// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';
import type { CommandId } from '../ui_state/keymap';

export interface ZoomIslandProps {
  zoom: number;
  onCommand: (command: CommandId) => void;
}

export const ZoomIsland: Component<ZoomIslandProps> = (props: ZoomIslandProps): JSX.Element => {
  const percentage: number = Math.round(props.zoom * 100);

  function onZoomOut(): void { props.onCommand('zoom-out'); }
  function onZoomReset(): void { props.onCommand('zoom-reset'); }
  function onZoomIn(): void { props.onCommand('zoom-in'); }
  function onZoomFit(): void { props.onCommand('zoom-fit'); }

  return (
    <div class="ag-island" style={{ display: 'flex', 'align-items': 'center', gap: '2px' }}>
      <button aria-label="Zoom out" onClick={onZoomOut}>−</button>
      <button
        aria-label="Reset zoom"
        onClick={onZoomReset}
        style={{ width: '4ch', padding: '3px 0', border: 'none', background: 'transparent', 'font-family': 'var(--ag-font-mono)', 'text-align': 'center' }}
      >
        {percentage}%
      </button>
      <button aria-label="Zoom in" onClick={onZoomIn}>+</button>
      <button
        aria-label="Fit diagram"
        onClick={onZoomFit}
        style={{ 'margin-left': '6px', 'border-left': '1px solid var(--ag-edge)', color: 'var(--ag-purple)' }}
      >
        Fit
      </button>
    </div>
  );
};
