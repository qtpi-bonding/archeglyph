// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The editor's URL parameters, read from the fragment as well as the query.
 *
 * The split matters for privacy, and it is a property of HTTP rather than a
 * convention. A browser sends the query string in the request line but strips
 * the fragment entirely -- `#` and everything after it never goes on the wire.
 * So a query parameter is visible to whoever serves the page, to every proxy
 * in between, to their access logs, and to any third party the page contacts
 * via the Referer header. A fragment parameter is visible to none of them.
 *
 * Therefore:
 *
 *   CONTENT goes in the fragment. `d` and `s` carry a whole diagram and
 *   stylesheet base64'd into the link. Someone sharing their company's
 *   architecture should not have it land in a CDN log because of where a
 *   character sits in a URL.
 *
 *   LOCATORS stay in the query. `gh`, `path`, `ref`, `fetch`, `gist`, `pr`,
 *   `issue` name a public resource and nothing more. Keeping them in the query
 *   leaves links greppable and lets a host see which repos get viewed.
 *
 * Fragment values win over query values of the same name, so an old `?d=` link
 * keeps working while a new `#d=` link takes precedence.
 */
export function readUrlParams(location: { search: string; hash: string }): URLSearchParams {
  const merged: URLSearchParams = new URLSearchParams(location.search);
  const fragment: URLSearchParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  for (const [key, value] of fragment) {
    merged.set(key, value);
  }
  return merged;
}

/** Parameter names that carry document content and must never sit in the query. */
export const CONTENT_PARAMS: ReadonlyArray<string> = ['d', 's', 'base_d'];

/**
 * A shareable link for a diagram and stylesheet, with the content in the
 * fragment. Use this rather than assembling the URL by hand -- that is how
 * content ends up in a query string.
 */
export function buildInlineUrl(base: string, diagramB64: string, stylesheetB64?: string): string {
  const fragment: URLSearchParams = new URLSearchParams();
  fragment.set('d', diagramB64);
  if (stylesheetB64 !== undefined) {
    fragment.set('s', stylesheetB64);
  }
  return `${base}#${fragment.toString()}`;
}
