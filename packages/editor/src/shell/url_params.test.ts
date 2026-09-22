// SPDX-License-Identifier: AGPL-3.0-or-later

// The reason these tests exist: a browser sends the query string and strips the
// fragment. Put a diagram in `?d=` and it lands in the host's access logs; put
// it in `#d=` and it never leaves the machine. That is a one-character
// difference with a real consequence, so it is pinned rather than left to
// whoever next edits the URL handling.

import { describe, expect, test } from 'bun:test';
import { buildInlineUrl, CONTENT_PARAMS, readUrlParams } from './url_params';

describe('readUrlParams', () => {
  test('reads content from the fragment', () => {
    const params = readUrlParams({ search: '', hash: '#d=ZGlhZ3JhbQ&s=c3R5bGU' });
    expect(params.get('d')).toBe('ZGlhZ3JhbQ');
    expect(params.get('s')).toBe('c3R5bGU');
  });

  test('reads locators from the query', () => {
    const params = readUrlParams({ search: '?gh=me/repo&path=a.diag.json&ref=abc123', hash: '' });
    expect(params.get('gh')).toBe('me/repo');
    expect(params.get('ref')).toBe('abc123');
  });

  test('combines both, since a real link has locators and content', () => {
    const params = readUrlParams({ search: '?pr=42', hash: '#d=ZGlhZ3JhbQ' });
    expect(params.get('pr')).toBe('42');
    expect(params.get('d')).toBe('ZGlhZ3JhbQ');
  });

  test('a fragment value wins over a query value of the same name', () => {
    // Old links put content in the query. They keep working, but a fragment
    // value takes precedence so a correct link is never shadowed by a stale one.
    const params = readUrlParams({ search: '?d=old', hash: '#d=new' });
    expect(params.get('d')).toBe('new');
  });

  test('an old query-only link still works', () => {
    expect(readUrlParams({ search: '?d=old', hash: '' }).get('d')).toBe('old');
  });

  test('tolerates a missing leading # and an empty fragment', () => {
    expect(readUrlParams({ search: '', hash: 'd=bare' }).get('d')).toBe('bare');
    expect(readUrlParams({ search: '?gh=me/repo', hash: '#' }).get('gh')).toBe('me/repo');
  });

  test('base64url padding survives the round trip', () => {
    // '=' is meaningful in a query string; URLSearchParams must not eat it.
    const payload = 'eyJhIjoxfQ==';
    expect(readUrlParams({ search: '', hash: `#d=${encodeURIComponent(payload)}` }).get('d')).toBe(payload);
  });
});

describe('buildInlineUrl', () => {
  test('puts content after the # and nothing before it', () => {
    const url = buildInlineUrl('https://archeglyph.com/', 'ZGlhZ3JhbQ', 'c3R5bGU');
    const [beforeHash, afterHash] = url.split('#');
    for (const name of CONTENT_PARAMS) {
      expect(beforeHash).not.toContain(`${name}=`);
    }
    expect(afterHash).toContain('d=');
    expect(afterHash).toContain('s=');
  });

  test('round-trips through readUrlParams', () => {
    const url = new URL(buildInlineUrl('https://archeglyph.com/', 'ZGlhZ3JhbQ', 'c3R5bGU'));
    const params = readUrlParams({ search: url.search, hash: url.hash });
    expect(params.get('d')).toBe('ZGlhZ3JhbQ');
    expect(params.get('s')).toBe('c3R5bGU');
  });

  test('omits the stylesheet when there is none', () => {
    const url = buildInlineUrl('https://archeglyph.com/', 'ZGlhZ3JhbQ');
    expect(url).not.toContain('s=');
  });
});
