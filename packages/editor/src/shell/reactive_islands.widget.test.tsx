// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, cleanup } = await import('@solidjs/testing-library');
const { createSignal } = await import('solid-js');
const { StateIsland } = await import('./state_island');
const { PendingBanner } = await import('../pending/pending_banner');
const { EchoIsland } = await import('./echo_island');
const { gestureTokens } = await import('./key_echo');
const { beginModalGesture } = await import('../ui_state/modal_gesture');

describe('StateIsland follows the model', () => {
  test('an error raised after mount is shown', () => {
    // Mount state: no error and no mode is exactly where a frozen read sticks.
    const [error, setError] = createSignal<string | undefined>(undefined);
    const { container } = render(() => <StateIsland error={error()} />);

    expect(container.textContent).toBe('');

    setError('layout failed: cyclic containment');
    expect(container.textContent).toContain('cyclic containment');

    cleanup();
  });

  test('a mode entered after mount is shown, and clears again', () => {
    const [mode, setMode] = createSignal<string | undefined>(undefined);
    const { container } = render(() => <StateIsland mode={mode()} />);

    setMode('g');
    expect(container.textContent).toContain('g');

    setMode(undefined);
    expect(container.textContent).toBe('');

    cleanup();
  });

  test('an error arriving over a mode takes the error styling', () => {
    // `hasError` picks the background AND which of the two strings is shown,
    // so it has to be re-read, not just `hasState`.
    const [error, setError] = createSignal<string | undefined>(undefined);
    const { container } = render(() => <StateIsland mode="r" error={error()} />);

    expect(container.textContent).toContain('r');

    setError('boom');
    expect(container.textContent).toContain('boom');
    expect(container.textContent).not.toContain('r');

    cleanup();
  });
});

describe('PendingBanner follows the model', () => {
  test('it appears when the first proposal arrives', () => {
    const [count, setCount] = createSignal<number>(0);
    const { container } = render(() => (
      <PendingBanner count={count()} expanded={false} onToggle={(): void => undefined} />
    ));

    expect(container.querySelector('button')).toBeNull();

    setCount(2);
    expect(container.querySelector('button')).not.toBeNull();
    expect(container.textContent).toContain('2 proposed changes');

    cleanup();
  });

  test('the count and its pluralisation track the model', () => {
    const [count, setCount] = createSignal<number>(3);
    const { container } = render(() => (
      <PendingBanner count={count()} expanded={false} onToggle={(): void => undefined} />
    ));

    expect(container.textContent).toContain('3 proposed changes');

    setCount(1);
    expect(container.textContent).toContain('1 proposed change');
    expect(container.textContent).not.toContain('changes');

    setCount(0);
    expect(container.querySelector('button')).toBeNull();

    cleanup();
  });
});

describe('EchoIsland follows the model', () => {
  test('a gesture built key by key appears one part at a time', () => {
    const [gesture, setGesture] = createSignal(beginModalGesture('grab', []));
    const { container } = render(() => <EchoIsland tokens={gestureTokens(gesture())} />);

    expect(container.textContent).toBe('g');

    setGesture((g) => ({ ...g, direction: 'up' }));
    expect(container.textContent).toBe('g↑');

    setGesture((g) => ({ ...g, digits: '12' }));
    expect(container.textContent).toBe('g↑12');

    cleanup();
  });

  test('it is absent with nothing to show, so it takes no space', () => {
    const [tokens, setTokens] = createSignal<Array<{ text: string }>>([]);
    const { container } = render(() => <EchoIsland tokens={tokens()} />);

    expect(container.querySelector('.ag-echo')).toBeNull();

    setTokens([{ text: '⌫' }, { text: 'Delete' }]);
    expect(container.querySelector('.ag-echo')).not.toBeNull();

    setTokens([]);
    expect(container.querySelector('.ag-echo')).toBeNull();

    cleanup();
  });
});
