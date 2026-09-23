// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, fireEvent, cleanup } = await import('@solidjs/testing-library');
const { createSignal } = await import('solid-js');
const { FileIsland } = await import('./file_island');

const base = {
  fileName: 'checkout.diag.json',
  dirty: false,
  canSave: false,
  status: undefined,
  errorMessage: undefined,
  onSave: (): void => undefined,
  editorTheme: 'blueprint',
  onEditorTheme: (): void => undefined,
  comparedTo: undefined,
  diffOn: true,
  attachedIsTarget: true,
  onCompare: (): void => undefined,
  onToggleDiff: (): void => undefined,
  onSwapDirection: (): void => undefined,
};

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
      <FileIsland {...base} onCompare={(): void => { calls.push('compare'); }} />
    ));

    fireEvent.click(button(container, 'Compare...'));

    expect(calls).toEqual(['compare']);
    cleanup();
  });

  test('an attached base is named, and the toggle is offered', () => {
    const calls: string[] = [];
    const [attached, setAttached] = createSignal<string | undefined>(undefined);
    const { container } = render(() => (
      <FileIsland
        {...base}
        comparedTo={attached()}
        onToggleDiff={(): void => { calls.push('toggle'); }}
      />
    ));

    expect(container.textContent).not.toContain('checkout-v2.diag.json');

    setAttached('checkout-v2.diag.json');

    expect(container.textContent).toContain('checkout-v2.diag.json');
    fireEvent.click(button(container, 'Toggle diff'));
    expect(calls).toEqual(['toggle']);
    cleanup();
  });

  test('the direction is stated base-first, and swapping reverses it', () => {
    const calls: string[] = [];
    const [attachedIsTarget, setAttachedIsTarget] = createSignal<boolean>(true);
    const { container } = render(() => (
      <FileIsland
        {...base}
        comparedTo="checkout-v2.diag.json"
        attachedIsTarget={attachedIsTarget()}
        onSwapDirection={(): void => { calls.push('swap'); }}
      />
    ));
    const text = (): string => container.textContent ?? '';

    expect(text()).toContain('checkout.diag.json → checkout-v2.diag.json');

    fireEvent.click(button(container, 'Swap diff direction'));
    expect(calls).toEqual(['swap']);

    setAttachedIsTarget(false);
    expect(text()).toContain('checkout-v2.diag.json → checkout.diag.json');
    cleanup();
  });

  test('the toggle reads as the state it is in, and is the same button', () => {
    const [on, setOn] = createSignal<boolean>(true);
    const { container } = render(() => (
      <FileIsland {...base} comparedTo="checkout-v2.diag.json" diffOn={on()} />
    ));

    const toggle = button(container, 'Toggle diff');
    expect(toggle.textContent).toBe('Diff');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    setOn(false);

    expect(toggle.textContent).toBe('Off');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(button(container, 'Toggle diff')).toBe(toggle);
    cleanup();
  });
});
