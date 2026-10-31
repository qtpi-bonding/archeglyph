// SPDX-License-Identifier: MPL-2.0

import type { Localization } from '@archeglyph/proto/gen/content_pb';

// Mermaid's documented default for the `maxEdges` config setting.
export const MERMAID_WARN_EDGES = 500;
// Mermaid's documented default for the `maxTextSize` config setting.
export const MERMAID_WARN_CHARS = 50000;

// `#` must be replaced first: every later entity code contains a `#`, and
// escaping it afterwards would turn `#quot;` into `#35;quot;`.
export function escapeLabel(text: string): string {
  return text
    .replaceAll('#', '#35;')
    .replaceAll('"', '#quot;')
    .replaceAll('<', '#lt;')
    .replaceAll('>', '#gt;')
    .replaceAll('&', '#amp;')
    .replaceAll('`', '#96;')
    .replace(/\r?\n/g, ' ');
}

export function labelOf(label: Localization[], fallback: string): string {
  const first = label[0];
  return first === undefined ? fallback : first.source;
}
