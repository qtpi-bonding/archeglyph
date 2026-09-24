// SPDX-License-Identifier: MPL-2.0

import { Component, For, JSX, Show } from 'solid-js';
import type { EchoToken } from './key_echo';

export interface EchoIslandProps {
  tokens: ReadonlyArray<EchoToken>;
}

export const EchoIsland: Component<EchoIslandProps> = (
  props: EchoIslandProps,
): JSX.Element => (
  <Show when={props.tokens.length > 0}>
    <div class="ag-island ag-echo" aria-live="polite">
      <For each={props.tokens}>
        {(token: EchoToken): JSX.Element => (
          <span classList={{ 'ag-echo-muted': token.muted === true }}>{token.text}</span>
        )}
      </For>
    </div>
  </Show>
);
