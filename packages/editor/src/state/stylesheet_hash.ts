// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { toJson } from '@archeglyph/proto/util/json';

export async function hashStylesheet(stylesheet: Stylesheet): Promise<string> {
  const json: Record<string, unknown> = JSON.parse(toJson(StylesheetSchema, stylesheet)) as Record<string, unknown>;
  delete json.pendingEdits;
  delete json.pending_edits;
  const canonical: string = canonicalJson(json);
  const bytes: Uint8Array = new TextEncoder().encode(canonical);
  const digest: ArrayBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte: number): string => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const record: Record<string, unknown> = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key: string): string => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
