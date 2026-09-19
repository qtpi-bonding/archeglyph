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
  loading!: boolean;
  error?: string;
  onOpen!: () => void;
}

export const StartScreen: Component<StartScreenProps> = (props: StartScreenProps): JSX.Element => (
  <main
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
    <Show
      when={!props.loading}
      fallback={<div role="status">Opening file…</div>}
    >
      <button onClick={props.onOpen}>Open file...</button>
    </Show>
    <Show when={props.error !== undefined}>
      <div role="alert" style={{ color: 'var(--ag-error-text)', 'max-width': '32rem', 'text-align': 'center' }}>
        {props.error}
      </div>
    </Show>
  </main>
);
