// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, cleanup } = await import('@solidjs/testing-library');
const { App } = await import('./app');

describe('App constructs', () => {
  test('with no URL params', () => {
    const { container } = render(() => <App />);
    expect(container.firstElementChild).not.toBeNull();
    cleanup();
  });

  test('with diff params, so createDiffState runs', () => {
    window.history.replaceState({}, '', '/?base=HEAD~1&target=HEAD');
    const { container } = render(() => <App />);
    expect(container.firstElementChild).not.toBeNull();
    cleanup();
    window.history.replaceState({}, '', '/');
  });
});
