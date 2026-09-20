// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';

export class StateIslandProps {
  mode?: string;
  error?: string;
  onDismiss?: () => void;
}

/** The transient island for the active mode or the current render error. */
export const StateIsland: Component<StateIslandProps> = (
  props: StateIslandProps,
): JSX.Element => {
  const hasError: boolean = props.error !== undefined;
  const hasState: boolean = hasError || props.mode !== undefined;

  return (
    <Show when={hasState}>
      <div
        class="ag-island"
        style={{
          display: 'flex',
          'align-items': 'flex-start',
          gap: '8px',
          padding: '8px 12px',
          background: hasError ? 'var(--ag-error)' : 'var(--ag-panel)',
          color: hasError ? 'var(--ag-error-text)' : 'var(--ag-fg-2)',
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
          {hasError ? props.error : props.mode}
        </span>
        <Show when={hasError && props.onDismiss !== undefined}>
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
};
