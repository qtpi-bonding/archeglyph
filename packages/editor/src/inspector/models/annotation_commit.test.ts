// SPDX-License-Identifier: MPL-2.0

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationAnchorSchema,
  AnnotationEntrySchema,
  AnnotationLayoutSchema,
  RefKind,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import { commitAnnotationRotation, commitDetachAnchor } from './annotation_commit';
import { annotationModel } from './annotation_model';
import { applyStyleEditToStylesheet } from '../../state/apply_style_edit';
import type { InspectorModel } from '../model';
import type { SceneGeometry } from '../../scene/scene';

function sheet(annotations = {}) {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {},
    edges: {},
    groups: {},
    annotations,
    pendingEdits: [],
  });
}

function annotation(layout = {}, anchor?: { refId: string; refKind: RefKind }) {
  return create(AnnotationEntrySchema, {
    layout: create(AnnotationLayoutSchema, layout),
    ...(anchor === undefined ? {} : { anchor: create(AnnotationAnchorSchema, anchor) }),
  });
}

const model = (ids: Array<string>): InspectorModel => ({
  kind: 'annotation',
  ids,
  sections: ['layout', 'annotation', 'shape', 'line', 'typography'],
});

const geometry = (annotations = {}): SceneGeometry => (
  { diagram: { annotations }, byKey: {} } as unknown as SceneGeometry
);

describe('commitAnnotationRotation', () => {
  test('clearing removes the field rather than writing 0', () => {
    // 0 is a legitimate rotation, so an absent override must be absent.
    const before = sheet({ a1: annotation({ rotation: 45 }) });
    const edit = commitAnnotationRotation(model(['a1']), before, undefined);
    expect(edit).toBeDefined();

    const after = applyStyleEditToStylesheet(before, edit!);
    expect(after.annotations['a1']?.layout?.rotation).toBeUndefined();
  });

  test('a no-op returns undefined', () => {
    const before = sheet({ a1: annotation({ rotation: 45 }) });
    expect(commitAnnotationRotation(model(['a1']), before, 45)).toBeUndefined();
  });

  test('NaN is refused', () => {
    const before = sheet({ a1: annotation({}) });
    expect(commitAnnotationRotation(model(['a1']), before, Number.NaN)).toBeUndefined();
  });

  test('editing rotation leaves the anchor attached', () => {
    const before = sheet({
      a1: annotation({ rotation: 10 }, { refId: 'n1', refKind: RefKind.NODE }),
    });
    const after = applyStyleEditToStylesheet(
      before,
      commitAnnotationRotation(model(['a1']), before, 90)!,
    );
    expect(after.annotations['a1']?.layout?.rotation).toBe(90);
    expect(after.annotations['a1']?.anchor?.refId).toBe('n1');
  });
});

describe('commitDetachAnchor', () => {
  test('detaches every anchored annotation in the selection', () => {
    const before = sheet({
      a1: annotation({}, { refId: 'n1', refKind: RefKind.NODE }),
      a2: annotation({}, { refId: 'g1', refKind: RefKind.GROUP }),
    });
    const after = applyStyleEditToStylesheet(before, commitDetachAnchor(model(['a1', 'a2']), before)!);

    expect(after.annotations['a1']?.anchor).toBeUndefined();
    expect(after.annotations['a2']?.anchor).toBeUndefined();
  });

  test('skips annotations that were never anchored, and returns undefined when none are', () => {
    const before = sheet({ a1: annotation({}), a2: annotation({}) });
    expect(commitDetachAnchor(model(['a1', 'a2']), before)).toBeUndefined();
  });

  test('records the clear as an unset path, which is what makes detach apply', () => {
    // An absent optional proto field is not the same as an untouched one.
    // Without unsetPaths the change is a silent no-op.
    const before = sheet({ a1: annotation({}, { refId: 'n1', refKind: RefKind.NODE }) });
    const edit = commitDetachAnchor(model(['a1']), before)!;
    expect(edit.annotationChanges[0]?.unsetPaths).toContain('anchor');
  });
});

describe('annotationModel', () => {
  test('names the anchor target by kind and id', () => {
    const before = sheet({ a1: annotation({}, { refId: 'auth', refKind: RefKind.NODE }) });
    const fields = annotationModel(model(['a1']), geometry(), before);
    expect(fields.anchorLabel).toBe('node auth');
    expect(fields.anchored).toBe(true);
  });

  test('an unanchored annotation reports no label and nothing to detach', () => {
    const fields = annotationModel(model(['a1']), geometry(), sheet({ a1: annotation({}) }));
    expect(fields.anchorLabel).toBeUndefined();
    expect(fields.anchored).toBe(false);
  });

  test('two annotations pointing at different things have no single honest label', () => {
    const before = sheet({
      a1: annotation({}, { refId: 'n1', refKind: RefKind.NODE }),
      a2: annotation({}, { refId: 'n2', refKind: RefKind.NODE }),
    });
    const fields = annotationModel(model(['a1', 'a2']), geometry(), before);
    expect(fields.anchorLabel).toBeUndefined();
    // Still detachable, though — that is why `anchored` is separate.
    expect(fields.anchored).toBe(true);
  });
});
