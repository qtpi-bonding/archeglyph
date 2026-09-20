// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';

/**
 * Wordmark, then 'Open file...', then the error when there is one.
 *
 * DO NOT ADD: a 'New diagram' button (D11 -- an empty diagram has no
 * content to separate from its style), a recents list, or a paste-a-URL
 * field. The absence of the last two is deliberate and is explained in
 * this module's doc; neither can be backed by anything the shell can
 * reach today, and a recents row that reopens an arbitrary file is worse
 * than no row.
 *
 * Renders on the --ag-bg ground so opening a file changes what is on the
 * table rather than replacing the room. It does NOT draw the drafting
 * grid: the grid is computed from ui.viewport() inside Canvas, and Canvas
 * is not mounted when this screen is. A static grid here would be a
 * second definition of it that could not track the viewport once a
 * document loaded.
 */
export class StartScreenProps {
  /** True while an automatic URL-param load is in flight. */
  loading!: boolean;
  /** Failure from a load that happened before a document existed. */
  error?: string;
  /** Opens a diagram through the shell's adapter. */
  onOpen!: () => void;
}

export const StartScreen: Component<StartScreenProps> = (props: StartScreenProps): JSX.Element => (
  <div
    style={{
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
      height: '100%',
      background: 'var(--ag-bg)',
      color: 'var(--ag-fg)',
      gap: '12px',
    }}
  >
    <div style={{ 'font-size': '20px', 'font-weight': '600', 'margin-bottom': '8px' }}>
      archeglyph
    </div>
    <Show when={props.loading} fallback={
      <button
        type="button"
        onClick={props.onOpen}
        style={{ padding: '8px 20px', 'font-size': '14px' }}
      >
        Open file…
      </button>
    }>
      <div aria-live="polite">Loading…</div>
    </Show>
    <Show when={props.error}>
      {(error) => (
        <div
          role="alert"
          style={{
            color: 'var(--ag-error-text)',
            'max-width': 'min(520px, 90vw)',
            'text-align': 'center',
          }}
        >
          {error()}
        </div>
      )}
    </Show>
  </div>
);
