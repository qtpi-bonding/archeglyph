// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, fireEvent, cleanup } = await import('@solidjs/testing-library');
const { createSignal } = await import('solid-js');
const { FileIsland } = await import('./file_island');
type FileIslandProps = import('./file_island').FileIslandProps;

function props(overrides: Partial<FileIslandProps> = {}): FileIslandProps {
  return {
    fileName: 'checkout-v2.diag.json',
    dirty: false,
    canSave: false,
    onSave: (): void => undefined,
    editorTheme: 'blueprint',
    onEditorTheme: (): void => undefined,
    onCompare: (): void => undefined,
    onClearComparison: (): void => undefined,
    ...overrides,
  } as FileIslandProps;
}

const button = (container: Element, label: string): HTMLButtonElement => {
  const found = Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent === label || b.getAttribute('aria-label') === label,
  );
  if (found === undefined) { throw new Error(`no button ${label}`); }
  return found as HTMLButtonElement;
};

describe('attaching a diff base from the island', () => {
  test('with no base attached, Compare invites one', () => {
    const calls: string[] = [];
    const { container } = render(() => (
      <FileIsland {...props({ onCompare: (): void => { calls.push('compare'); } })} />
    ));

    fireEvent.click(button(container, 'Compare...'));

    expect(calls).toEqual(['compare']);
    cleanup();
  });

  test('an attached base is named, and can be cleared', () => {
    const calls: string[] = [];
    const [base, setBase] = createSignal<string | undefined>(undefined);
    const { container } = render(() => (
      <FileIsland
        {...props({
          comparedTo: base(),
          onClearComparison: (): void => { calls.push('clear'); },
        })}
      />
    ));

    expect(container.textContent).not.toContain('checkout.diag.json');

    setBase('checkout.diag.json');

    expect(container.textContent).toContain('checkout.diag.json');
    fireEvent.click(button(container, 'Clear comparison'));
    expect(calls).toEqual(['clear']);
    cleanup();
  });
});
