// SPDX-License-Identifier: AGPL-3.0-or-later

// A hosted link is only worth opening if it shows the diagram AS STYLED. The
// diagram file is regenerated from code on every commit; the stylesheet is
// hand-authored and keyed by element id, which is the whole reason styling
// survives regeneration. Fetching only the diagram would show an
// auto-generated shape with none of that work, so the sibling fetch is pinned
// here rather than left to be rediscovered.

import { describe, expect, test } from 'bun:test';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson } from '@archeglyph/proto/util/json';
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

// Saving an inline diagram rewrites this page's address so the link carries
// the edit. It must write to the fragment for the same reason reading does:
// the browser transmits a query string and strips a fragment. The read half
// was fixed first and the write half was not, which put the content straight
// back in the query -- so both halves are pinned.
describe('inline save writes to the fragment', () => {
  const b64 = (value: string): string => btoa(value);

  /**
   * Stub the browser globals `save()` touches. It reads `window.location.href`
   * and calls `history.replaceState`, neither of which bun provides, so both
   * are installed for the duration of the call and the resulting href handed
   * back for inspection.
   */
  async function savedHref(startHref: string, run: () => Promise<unknown>): Promise<string> {
    let current: string = startHref;
    const g = globalThis as Record<string, unknown>;
    const priorWindow = g['window'];
    const priorHistory = g['history'];
    g['window'] = { location: { get href(): string { return current; } } };
    g['history'] = { replaceState: (_a: unknown, _b: unknown, next: string): void => { current = next; } };
    try {
      await run();
      return current;
    } finally {
      g['window'] = priorWindow;
      g['history'] = priorHistory;
    }
  }

  test('puts d and s after the # and leaves none in the query', async () => {
    const adapter = new UrlParamAdapter(b64(DIAGRAM), b64(STYLE), null);
    await adapter.load();
    const saved = new URL(await savedHref(
      'https://archeglyph.com/?pr=42',
      () => adapter.save(fromJson(StylesheetSchema, STYLE)),
    ));
    expect(saved.searchParams.get('d')).toBeNull();
    expect(saved.searchParams.get('s')).toBeNull();
    expect(saved.hash).toContain('d=');
    expect(saved.hash).toContain('s=');
  });

  test('keeps locators in the query', async () => {
    const adapter = new UrlParamAdapter(b64(DIAGRAM), b64(STYLE), null);
    await adapter.load();
    const saved = new URL(await savedHref(
      'https://archeglyph.com/?pr=42',
      () => adapter.save(fromJson(StylesheetSchema, STYLE)),
    ));
    expect(saved.searchParams.get('pr')).toBe('42');
  });

  test('clears a stale d from the query left by an older link', async () => {
    // An old ?d= link that gets edited must not keep the old content in the
    // query alongside the new content in the fragment.
    const adapter = new UrlParamAdapter(b64(DIAGRAM), b64(STYLE), null);
    await adapter.load();
    const saved = new URL(await savedHref(
      'https://archeglyph.com/?d=OLD&s=OLD',
      () => adapter.save(fromJson(StylesheetSchema, STYLE)),
    ));
    expect(saved.search).not.toContain('OLD');
    expect(saved.hash).toContain('d=');
  });
});
