// SPDX-License-Identifier: MPL-2.0

import { type Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { toJson } from '@archeglyph/proto/util/json';

type JsonPrimitive = boolean | number | string | null;
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

/**
 * Computes a stable short hash for the committed portion of a stylesheet.
 *
 * Pending edits are excluded from the stamp. They were once transient UI
 * state; since threads are stored inside them they also carry durable user
 * data, so a reply changes the document without changing this hash. Kept
 * excluded anyway: the stamp exists to detect a concurrent write to the
 * COMMITTED stylesheet, and no adapter gates a save on it today. Object keys
 * are sorted
 * recursively so equivalent JSON with different key insertion order hashes
 * identically; array order remains significant.
 */
export async function hashStylesheet(stylesheet: Stylesheet): Promise<string> {
  const json: JsonValue = JSON.parse(toJson(StylesheetSchema, stylesheet)) as JsonValue;
  if (json === null || Array.isArray(json) || typeof json !== 'object') {
    throw new Error('Stylesheet JSON must be an object');
  }

  delete json.pendingEdits;
  delete json.pending_edits;

  const canonical: string = JSON.stringify(sortJson(json));
  const bytes: Uint8Array = new TextEncoder().encode(canonical);
  // .slice() to hand digest() an exactly-sized ArrayBuffer. TextEncoder
  // returns Uint8Array<ArrayBufferLike>, which TS will not narrow to
  // BufferSource because the backing store could in principle be a
  // SharedArrayBuffer.
  const digest: ArrayBuffer = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  const hash: Uint8Array = new Uint8Array(digest);

  let result: string = '';
  for (let index: number = 0; index < 8; index += 1) {
    result += hash[index].toString(16).padStart(2, '0');
  }
  return result;
}

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item: JsonValue): JsonValue => sortJson(item));
  }

  if (value !== null && typeof value === 'object') {
    const sorted: JsonObject = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJson(value[key]);
    }
    return sorted;
  }

  return value;
}
