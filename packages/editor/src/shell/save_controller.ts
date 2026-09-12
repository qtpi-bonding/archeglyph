// SPDX-License-Identifier: AGPL-3.0-or-later

import { Accessor, createEffect, createSignal } from 'solid-js';
import { EditorState } from '../state/editor_state';
import { HostAdapter } from '../adapters/host_adapter';
import { hashStylesheet } from '../state/stylesheet_hash';

/**
 * Create the reactive save handle for an editor session.
 *
 * The initial effect is deliberately ignored: loading a document must not
 * immediately write it back. Subsequent version changes replace the pending
 * timer, while saveNow cancels that timer and uses the same save routine as
 * the debounced path.
 */
export function createSaveController(
  adapter: HostAdapter,
  state: EditorState,
  debounceMs: number,
  initialBaseHash?: string,
): SaveController {
  const [status, setStatus] = createSignal<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let isFirstRun = true;
  let baseHash: string | undefined = initialBaseHash;
  let staleBlocked: boolean = false;

  const clearDebounce = (): void => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  };

  const save = async (): Promise<void> => {
    // Check again when the timer fires. The adapter can become unavailable
    // while a debounce is pending (for example, when the host changes mode).
    if (!adapter.canSave() || staleBlocked) {
      return;
    }

    setStatus('saving');
    const stylesheet = state.stylesheet();
    const result = await adapter.save(stylesheet, baseHash);
    if (result.kind === 'err') {
      if (result.error.kind === 'stale') {
        staleBlocked = true;
        setErrorMessage(undefined);
        setStatus('stale');
        return;
      }
      setErrorMessage(result.error.message);
      setStatus('error');
      return;
    }

    // Only advance the optimistic-concurrency base after the adapter has
    // confirmed that the write succeeded.  In particular, do not advance it
    // for an I/O error or a stale-write rejection.
    baseHash = await hashStylesheet(stylesheet);
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
    if (staleBlocked || !adapter.canSave()) {
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
    adoptBaseHash(hash: string): void {
      baseHash = hash;
      staleBlocked = false;
      setErrorMessage(undefined);
      setStatus('idle');
    },
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
  adoptBaseHash: (hash: string) => void;
  saveNow(): Promise<void>;
  dispose(): void;
}
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'stale';
