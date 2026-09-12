// SPDX-License-Identifier: AGPL-3.0-or-later

// A hosted link is only worth opening if it shows the diagram AS STYLED. The
// diagram file is regenerated from code on every commit; the stylesheet is
// hand-authored and keyed by element id, which is the whole reason styling
// survives regeneration. Fetching only the diagram would show an
// auto-generated shape with none of that work, so the sibling fetch is pinned
// here rather than left to be rediscovered.

import { describe, expect, test } from 'bun:test';
import { buildGitHubUrl, UrlParamAdapter } from './url_param_adapter';

const DIAGRAM = JSON.stringify({
  schemaVersion: 1,
  id: 'd',
  graph: { nodes: { n1: { id: 'n1' } }, edges: {}, groups: {} },
});
const STYLE = JSON.stringify({
  schemaVersion: 1,
  nodes: { n1: { component: 'glyph' } },
});

/** Stubs fetch for the duration of one call, recording what was requested. */
async function withFetch<T>(
  routes: Record<string, { status: number; body: string }>,
  run: () => Promise<T>,
): Promise<{ result: T; requested: string[] }> {
  const original = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    requested.push(url);
    const route = routes[url];
    return route === undefined
      ? new Response('not found', { status: 404 })
      : new Response(route.body, { status: route.status });
  }) as typeof fetch;
  try {
    return { result: await run(), requested };
  } finally {
    globalThis.fetch = original;
  }
}

const DIAG_URL = 'https://raw.githubusercontent.com/me/repo/abc123/docs/arch.diag.json';
const STYLE_URL = 'https://raw.githubusercontent.com/me/repo/abc123/docs/arch.style.json';

describe('remote load', () => {
  test('fetches the stylesheet sitting beside the diagram', async () => {
    const { result, requested } = await withFetch(
      { [DIAG_URL]: { status: 200, body: DIAGRAM }, [STYLE_URL]: { status: 200, body: STYLE } },
      () => new UrlParamAdapter(null, null, DIAG_URL).load(),
    );
    expect(requested).toContain(STYLE_URL);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.stylesheet?.nodes.n1?.component).toBe('glyph');
      expect(result.value.baseHash).not.toBe('');
    }
  });

  test('a missing stylesheet leaves the diagram loaded, not the load failed', async () => {
    // Plenty of diagrams have no style file. That is not an error state.
    const { result } = await withFetch(
      { [DIAG_URL]: { status: 200, body: DIAGRAM } },
      () => new UrlParamAdapter(null, null, DIAG_URL).load(),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.diagram.id).toBe('d');
      expect(result.value.stylesheet).toBeUndefined();
    }
  });

  test('a missing DIAGRAM is an error, and says which url failed', async () => {
    const { result } = await withFetch({}, () => new UrlParamAdapter(null, null, DIAG_URL).load());
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('404');
      expect(result.error.message).toContain(DIAG_URL);
    }
  });

  test('a url not following the naming convention skips the sibling fetch', async () => {
    const odd = 'https://example.com/some/export.json';
    const { requested } = await withFetch(
      { [odd]: { status: 200, body: DIAGRAM } },
      () => new UrlParamAdapter(null, null, odd).load(),
    );
    expect(requested).toEqual([odd]);
  });
});

describe('buildGitHubUrl', () => {
  test('carries the ref, so the link cannot float', () => {
    const url = buildGitHubUrl('https://archeglyph.com/', {
      repo: 'me/repo', path: 'docs/arch.diag.json', ref: 'abc123',
    });
    expect(url).toContain('ref=abc123');
    expect(url).toContain('gh=me%2Frepo');
  });

  test('carries a pr number when given one', () => {
    const url = buildGitHubUrl('https://archeglyph.com/', {
      repo: 'me/repo', path: 'docs/arch.diag.json', ref: 'abc123', pr: '42',
    });
    expect(url).toContain('pr=42');
  });

  test('puts locators in the query, where they belong', () => {
    // Locators name a public resource; only CONTENT belongs in the fragment.
    const url = buildGitHubUrl('https://archeglyph.com/', {
      repo: 'me/repo', path: 'docs/arch.diag.json', ref: 'abc123',
    });
    expect(url).not.toContain('#');
  });
});
