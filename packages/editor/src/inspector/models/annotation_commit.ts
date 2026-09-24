// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntrySchema,
  AnnotationLayout,
  AnnotationLayoutSchema,
  StyleEdit,
  Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import type { InspectorModel } from '../model';
import { annotationChange, styleEdit } from '../../state/edits/edit_builder';
import { initOf } from '../../state/edits/entry_patch';
import { setAnnotationAnchorEdit } from '../../state/edits/annotation';

export function commitAnnotationRotation(
  model: InspectorModel,
  stylesheet: Stylesheet,
  value: number | undefined,
): StyleEdit | undefined {
  if (model.kind !== 'annotation' || model.ids.length === 0) {
    return undefined;
  }
  if (value !== undefined && !Number.isFinite(value)) {
    return undefined;
  }
  if (model.ids.every((id) => stylesheet.annotations[id]?.layout?.rotation === value)) {
    return undefined;
  }

  const annotationChanges = model.ids.map((id) => {
    const existing = stylesheet.annotations[id];
    const layoutInit = initOf(existing?.layout);
    if (value === undefined) {
      delete layoutInit['rotation'];
    } else {
      layoutInit['rotation'] = value;
    }
    return annotationChange(id, create(AnnotationEntrySchema, {
      ...initOf(existing),
      layout: create(AnnotationLayoutSchema, layoutInit as Partial<AnnotationLayout>),
    }), value === undefined ? ['layout.rotation'] : []);
  });

  return styleEdit({ annotationChanges, description: 'Edit annotation rotation' });
}

// Delegates per id rather than clearing inline: detaching needs `unsetPaths`,
// which only setAnnotationAnchorEdit records, and without it the change
// applies as a no-op.
export function commitDetachAnchor(
  model: InspectorModel,
  stylesheet: Stylesheet,
): StyleEdit | undefined {
  if (model.kind !== 'annotation') {
    return undefined;
  }
  const anchored = model.ids.filter((id) => stylesheet.annotations[id]?.anchor !== undefined);
  if (anchored.length === 0) {
    return undefined;
  }

  const edits = anchored.map((id) => setAnnotationAnchorEdit(stylesheet, id, undefined));
  return styleEdit({
    annotationChanges: edits.flatMap((edit) => edit.annotationChanges),
    description: 'Detach annotation',
  });
}
