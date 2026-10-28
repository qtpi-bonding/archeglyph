// SPDX-License-Identifier: MPL-2.0

import type { StyleEdit, Stylesheet } from '@archeglyph/proto/gen/style_pb';

// Elements, edges and annotations are separate id namespaces, so a key carries
// its namespace: `element:app`, `edge:app__cache`, `annotation:egress-budget`.
// The ghost's markup names the same three in the same way (see markupKey).
export type TargetKey = string;

export function targetKey(namespace: 'element' | 'edge' | 'annotation', id: string): TargetKey {
  return `${namespace}:${id}`;
}

/** Every element, edge and annotation a proposal changes. */
export function touchedKeys(edit: StyleEdit): Set<TargetKey> {
  const keys: Set<TargetKey> = new Set();
  for (const change of edit.elementChanges) { keys.add(targetKey('element', change.elementId)); }
  for (const change of edit.edgeChanges) { keys.add(targetKey('edge', change.edgeId)); }
  for (const change of edit.annotationChanges) { keys.add(targetKey('annotation', change.annotationId)); }
  return keys;
}

/**
 * The proposal a click on a ghost part should select. When several proposals
 * touch the same part, a second click moves to the next one, so each of them
 * can be reached; with none selected, or the selected one not among them, the
 * first wins.
 */
export function proposalForKey(
  stylesheet: Stylesheet,
  key: TargetKey,
  selectedId: string | undefined,
): string | undefined {
  const ids: string[] = stylesheet.pendingEdits
    .filter((edit: StyleEdit): boolean => touchedKeys(edit).has(key))
    .map((edit: StyleEdit): string => edit.id);
  if (ids.length === 0) { return undefined; }
  const at: number = selectedId === undefined ? -1 : ids.indexOf(selectedId);
  return ids[(at + 1) % ids.length];
}
