// SPDX-License-Identifier: AGPL-3.0-or-later

import { Accessor, createEffect, createSignal } from 'solid-js';
import { EditorState } from '../state/editor_state';
import { HostAdapter } from '../adapters/host_adapter';

/**
 * Create the reactive save handle for an editor session.
 *
 * The initial effect is deliberately ignored: loading a document must not
 * immediately write it back. Subsequent version changes replace the pending
 * timer, while saveNow cancels that timer and uses the same save routine as
 * the debounced path.
 */
export function createSaveController(adapter: HostAdapter, state: EditorState, debounceMs: number): SaveController {
  const [status, setStatus] = createSignal<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let isFirstRun = true;

  const clearDebounce = (): void => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  };

  const save = async (): Promise<void> => {
    // Check again when the timer fires. The adapter can become unavailable
    // while a debounce is pending (for example, when the host changes mode).
    if (!adapter.canSave()) {
      return;
    }

    setStatus('saving');
    const result = await adapter.save(state.stylesheet());
    if (result.kind === 'err') {
      setErrorMessage(result.error.message);
      setStatus('error');
      return;
    }

    setErrorMessage(undefined);
    setStatus('saved');
  };

  createEffect((): void => {
    state.version();
    if (isFirstRun) {
      isFirstRun = false;
      return;
    }
    clearDebounce();
    if (!adapter.canSave()) {
      return;
    }
    debounceTimer = setTimeout((): void => {
      debounceTimer = undefined;
      void save();
    }, debounceMs);
  });

  return {
    status,
    errorMessage,
    async saveNow(): Promise<void> {
      clearDebounce();
      await save();
    },
    dispose(): void {
      clearDebounce();
    },
  };
}

export interface SaveController {
  status: Accessor<SaveStatus>;
  errorMessage: Accessor<string | undefined>;
  saveNow(): Promise<void>;
  dispose(): void;
}
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
