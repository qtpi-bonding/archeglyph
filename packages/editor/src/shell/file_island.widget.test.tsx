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
    diffOn: true,
    reversed: false,
    onCompare: (): void => undefined,
    onToggleDiff: (): void => undefined,
    onSwapDirection: (): void => undefined,
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

  test('an attached base is named, and the toggle is offered', () => {
    const calls: string[] = [];
    const [base, setBase] = createSignal<string | undefined>(undefined);
    const { container } = render(() => (
      <FileIsland
        {...props({
          comparedTo: base(),
          onToggleDiff: (): void => { calls.push('toggle'); },
        })}
      />
    ));

    expect(container.textContent).not.toContain('checkout.diag.json');

    setBase('checkout.diag.json');

    expect(container.textContent).toContain('checkout.diag.json');
    fireEvent.click(button(container, 'Toggle diff'));
    expect(calls).toEqual(['toggle']);
    cleanup();
  });

  test('the direction is stated, base first, and swapping reverses it', () => {
    const calls: string[] = [];
    const [reversed, setReversed] = createSignal<boolean>(false);
    const { container } = render(() => (
      <FileIsland
        {...props({
          fileName: 'checkout.diag.json',
          comparedTo: 'checkout-v2.diag.json',
          reversed: reversed(),
          onSwapDirection: (): void => { calls.push('swap'); },
        })}
      />
    ));
    const text = (): string => container.textContent ?? '';

    expect(text()).toContain('checkout-v2.diag.json \u2192 checkout.diag.json');

    fireEvent.click(button(container, 'Swap diff direction'));
    expect(calls).toEqual(['swap']);

    setReversed(true);
    expect(text()).toContain('checkout.diag.json \u2192 checkout-v2.diag.json');
    cleanup();
  });

  test('the toggle reads as the state it is in, not the state it would reach', () => {
    const [on, setOn] = createSignal<boolean>(true);
    const { container } = render(() => (
      <FileIsland {...props({ comparedTo: 'checkout.diag.json', diffOn: on() })} />
    ));

    const toggle = button(container, 'Toggle diff');
    expect(toggle.textContent).toBe('Diff');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    setOn(false);

    expect(toggle.textContent).toBe('Off');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    cleanup();
  });
});
