// SPDX-License-Identifier: MPL-2.0

// Hand-maintained since the element-model port.

export enum ViolationKind {
  ELEMENT_CYCLE = 'ELEMENT_CYCLE',
  EDGE_SOURCE_MISSING = 'EDGE_SOURCE_MISSING',
  EDGE_TARGET_MISSING = 'EDGE_TARGET_MISSING',
  EDGE_ENDPOINT_NOT_ENTITY = 'EDGE_ENDPOINT_NOT_ENTITY',
  ELEMENT_PARENT_MISSING = 'ELEMENT_PARENT_MISSING',
  STYLE_TARGET_MISSING = 'STYLE_TARGET_MISSING',
  STYLE_TARGET_IS_BUNDLE = 'STYLE_TARGET_IS_BUNDLE',
  RENDER_MODE_DISSOLVED_ON_ENTITY = 'RENDER_MODE_DISSOLVED_ON_ENTITY',
  OPEN_DEPTH_TOO_SMALL = 'OPEN_DEPTH_TOO_SMALL',
  ANNOTATION_ANCHOR_MISSING = 'ANNOTATION_ANCHOR_MISSING',
  ID_CONTROL_CHARACTER = 'ID_CONTROL_CHARACTER',
}

// Declaration order for deterministic violation sort. Mirrors the enum above.
export const VIOLATION_KIND_ORDER: Record<ViolationKind, number> = {
  [ViolationKind.ELEMENT_CYCLE]: 0,
  [ViolationKind.EDGE_SOURCE_MISSING]: 1,
  [ViolationKind.EDGE_TARGET_MISSING]: 2,
  [ViolationKind.EDGE_ENDPOINT_NOT_ENTITY]: 3,
  [ViolationKind.ELEMENT_PARENT_MISSING]: 4,
  [ViolationKind.STYLE_TARGET_IS_BUNDLE]: 5,
  [ViolationKind.STYLE_TARGET_MISSING]: 6,
  [ViolationKind.RENDER_MODE_DISSOLVED_ON_ENTITY]: 7,
  [ViolationKind.OPEN_DEPTH_TOO_SMALL]: 8,
  [ViolationKind.ANNOTATION_ANCHOR_MISSING]: 9,
  [ViolationKind.ID_CONTROL_CHARACTER]: 10,
};

export class Violation {
  kind!: ViolationKind;
  location!: string;
  message!: string;
}
