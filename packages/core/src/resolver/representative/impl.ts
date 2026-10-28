// SPDX-License-Identifier: MPL-2.0
// Map an element to the outermost CLOSED representative used by the view.

export function representative(id: string, closed: Set<string>, parentOf: Map<string, string>): string {
  let result = id;
  let parent = parentOf.get(id);
  while (parent !== undefined) {
    if (closed.has(parent)) {
      result = parent;
    }
    parent = parentOf.get(parent);
  }
  return result;
}
