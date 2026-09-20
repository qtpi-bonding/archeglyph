// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';

export class StateIslandProps {
  mode?: string;
  error?: string;
  onDismiss?: () => void;
}

/**
 * The single transient-status island. An error takes precedence over the
 * active mode so that changing state never creates two rows or moves the
 * island's surrounding layout.
 */
export const StateIsland: Component<StateIslandProps> = (
  props: StateIslandProps,
): JSX.Element => {
  if (props.error !== undefined) {
    return (
      <div
        class="ag-island"
        style={{
          display: 'flex',
          'align-items': 'flex-start',
          gap: '8px',
          padding: '8px 10px',
          background: 'var(--ag-error)',
          color: 'var(--ag-error-text)',
          'border-radius': 'var(--ag-radius)',
          'box-shadow': 'var(--ag-shadow)',
          'max-width': 'min(560px, calc(100vw - 32px))',
          'white-space': 'normal',
          'overflow-wrap': 'anywhere',
        }}
      >
        <span style={{ flex: '1', 'min-width': '0' }}>{props.error}</span>
        <Show when={props.onDismiss !== undefined}>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={(): void => { props.onDismiss?.(); }}
          >
            Dismiss
          </button>
        </Show>
      </div>
    );
  }

  if (props.mode !== undefined) {
    return (
      <div
        class="ag-island"
        style={{
          display: 'flex',
          'align-items': 'center',
          padding: '8px 10px',
          background: 'var(--ag-panel)',
          color: 'var(--ag-fg-2)',
          'border-radius': 'var(--ag-radius)',
          'box-shadow': 'var(--ag-shadow)',
        }}
      >
        <span>{props.mode}</span>
      </div>
    );
  }

  return null;
};
