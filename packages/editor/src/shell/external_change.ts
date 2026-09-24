// SPDX-License-Identifier: MPL-2.0

import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { FileStamp, HostAdapter } from '../adapters/host_adapter';

/**
 * Keep the editor in sync with the file on disk.
 *
 * The file is the truth. An agent, the CLI, or anything else may rewrite it at
 * any time, and when that happens the editor adopts what is there — last write
 * wins, no reconciliation, no prompt.
 *
 * That is a deliberate simplification rather than a shortcut. Reconciling two
 * versions is only necessary when you cannot tell whether an incoming change
 * was a suggestion or a decision. Agents say which: a suggestion is appended to
 * Stylesheet.pending_edits and never touches committed state, so it cannot
 * conflict with anything; a real edit is a real edit and wins. Neither case
 * needs a merge, so there is no merge here.
 *
 * The cost, stated plainly: an edit landing mid-drag discards that drag. The
 * window is one autosave debounce and the tradeoff is accepted (D14).
 *
 * Two ways to notice, because only one of them is portable.
 *
 * FileSystemObserver (Chrome 129+) delivers real change records for a
 * FileSystemHandle, which is what we want: no interval, no latency, no work
 * while the file sits still. It is Chrome-only, so it cannot be the only path.
 *
 * Everywhere else, poll stat(). That reads metadata rather than contents, so
 * the cost is a handle lookup rather than a parse, and 1.5s is well under the
 * threshold where a change feels like it appeared on its own.
 */
const POLL_INTERVAL_MS: number = 1500;

/** The slice of FileSystemObserver this uses, since TS does not ship types for it yet. */
interface FileSystemObserverLike {
  observe: (handle: unknown) => Promise<void>;
  disconnect: () => void;
}
type FileSystemObserverCtor = new (callback: () => void) => FileSystemObserverLike;

export interface FileSync {
  stop: () => void;
}

function sameStamp(a: FileStamp | undefined, b: FileStamp | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  return a.lastModified === b.lastModified && a.size === b.size;
}

/**
 * Poll for changes and hand each new stylesheet to `onFile`.
 *
 * Overlapping runs are suppressed: a slow read must not queue a second check
 * behind it and report the same change twice. A read that fails is ignored
 * rather than surfaced — a file being rewritten is momentarily unreadable, and
 * the next tick will catch it.
 */
export function syncToFile(
  adapter: HostAdapter,
  initialStamp: FileStamp | undefined,
  onFile: (stylesheet: Stylesheet) => void,
): FileSync {
  let lastStamp: FileStamp | undefined = initialStamp;
  let running: boolean = false;

  const tick = async (): Promise<void> => {
    if (running) {
      return;
    }
    running = true;
    try {
      const stamped = await adapter.stat();
      if (stamped.kind === 'err' || sameStamp(stamped.value, lastStamp)) {
        return;
      }
      lastStamp = stamped.value;
      const loaded = await adapter.load();
      if (loaded.kind === 'err' || loaded.value.stylesheet === undefined) {
        return;
      }
      onFile(loaded.value.stylesheet);
    } finally {
      running = false;
    }
  };

  // Prefer real notifications where they exist. The callback is not trusted to
  // describe WHAT changed -- tick() re-stats and re-reads either way, so the
  // observer and the poller drive exactly the same path and there is only one
  // code path to get right.
  const handle: unknown = adapter.watchHandle?.();
  const Observer = (globalThis as { FileSystemObserver?: FileSystemObserverCtor }).FileSystemObserver;
  if (Observer !== undefined && handle !== undefined) {
    const observer: FileSystemObserverLike = new Observer((): void => { void tick(); });
    void observer.observe(handle);
    return { stop: (): void => { observer.disconnect(); } };
  }

  // Nothing to follow when the host cannot report a stamp. A diagram loaded
  // from a URL is the clear case: a link pinned to a commit is immutable by
  // construction, so there is nothing to poll for, and a timer ticking
  // uselessly for the lifetime of the page is worse than no timer. Probe once
  // rather than trusting the adapter's type -- the answer can depend on how it
  // was constructed.
  let timer: ReturnType<typeof setInterval> | undefined;
  void adapter.stat().then((probe): void => {
    if (probe.kind === 'err') {
      return;
    }
    timer = setInterval((): void => { void tick(); }, POLL_INTERVAL_MS);
  });
  return { stop: (): void => { if (timer !== undefined) { clearInterval(timer); } } };
}
