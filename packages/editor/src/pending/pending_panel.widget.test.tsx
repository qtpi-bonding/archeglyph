// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, cleanup } = await import('@solidjs/testing-library');
const { createSignal } = await import('solid-js');
const { PendingPanel } = await import('./pending_panel');

const ITEMS = [
  { id: 'a', description: 'first', author: 'ai:claude', changeCount: 1, comments: [] },
  { id: 'b', description: 'second', author: 'user:sam', changeCount: 1, comments: [] },
] as never;

describe('PendingPanel marks the selected proposal', () => {
  test('only the selected row carries the selected class, and it follows the selection', () => {
    const [selected, setSelected] = createSignal<string | undefined>('a');
    const { container } = render(() => (
      <PendingPanel
        items={ITEMS}
        selectedId={selected()}
        onSelect={setSelected}
        onAccept={(): void => undefined}
        onReject={(): void => undefined}
        onReply={(): void => undefined}
      />
    ));
    const rows = (): Element[] => Array.from(container.querySelectorAll('.ag-pending-row'));
    const marked = (): boolean[] => rows().map((row: Element) => row.classList.contains('ag-pending-row-selected'));

    expect(marked()).toEqual([true, false]);
    setSelected('b');
    expect(marked()).toEqual([false, true]);
    setSelected(undefined);
    expect(marked()).toEqual([false, false]);

    cleanup();
  });
});
