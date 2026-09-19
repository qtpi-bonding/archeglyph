// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';

export class StateIslandProps {
  mode?: string;
  error?: string;
  onDismiss?: () => void;
}

/** The small, single-row status surface for the editor shell. */
export const StateIsland: Component<StateIslandProps> = (
  props: StateIslandProps,
): JSX.Element => {
  // Keep this as one branch rather than rendering two adjacent rows. Apart
  // from making errors win, that keeps the frame from moving when a failure
  // happens while a tool is active.
  if (props.error !== undefined) {
    return (
      <div
        class="ag-island"
        style={{
          display: 'flex',
          'align-items': 'flex-start',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--ag-error)',
          color: 'var(--ag-error-text)',
          'overflow-wrap': 'anywhere',
          'white-space': 'normal',
        }}
      >
        <span style={{ flex: '1', 'min-width': '0' }}>{props.error}</span>
        {props.onDismiss !== undefined && (
          <button type="button" aria-label="Dismiss error" onClick={props.onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    );
  }

  if (props.mode !== undefined) {
    return (
      <div
        class="ag-island"
        style={{
          padding: '8px 12px',
          background: 'var(--ag-panel)',
          color: 'var(--ag-fg-2)',
        }}
      >
        {props.mode}
      </div>
    );
  }

  return <></>;
};
