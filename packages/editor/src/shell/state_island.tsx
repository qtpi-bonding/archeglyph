// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';

export class StateIslandProps {
  error?: string;
  onDismiss?: () => void;
}

export const StateIsland: Component<StateIslandProps> = (
  props: StateIslandProps,
): JSX.Element => (
  <Show when={props.error !== undefined}>
    <div
      class="ag-island"
      style={{
        display: 'flex',
        'align-items': 'flex-start',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--ag-error)',
        color: 'var(--ag-error-text)',
        border: '1px solid var(--ag-edge)',
        'border-radius': 'var(--ag-radius)',
        'box-shadow': 'var(--ag-shadow)',
      }}
    >
      <span
        style={{
          'white-space': 'normal',
          'overflow-wrap': 'anywhere',
          'word-break': 'break-word',
        }}
      >
        {props.error}
      </span>
      <Show when={props.onDismiss !== undefined}>
        <button
          type="button"
          aria-label="Dismiss error"
          onClick={props.onDismiss}
          style={{
            'flex-shrink': '0',
            color: 'var(--ag-error-text)',
            background: 'transparent',
            border: '1px solid currentColor',
          }}
        >
          Dismiss
        </button>
      </Show>
    </div>
  </Show>
);
