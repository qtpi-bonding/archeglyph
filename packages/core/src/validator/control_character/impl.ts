// SPDX-License-Identifier: MPL-2.0

// An id is written into SVG attributes, and XML 1.0 cannot carry a control
// character there however it is escaped (`<`, `>`, `&` and quotes can, and the
// renderer escapes them). So an id must be free of C0 controls and DEL.
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

export function hasControlCharacter(id: string): boolean {
  return CONTROL_CHARACTER.test(id);
}
