// SPDX-License-Identifier: MPL-2.0

import { RefKind, type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import type { SceneGeometry } from '../../scene/scene';
import type { InspectorModel } from '../model';
import { numberField, NumberField } from '../field_value';

export interface AnnotationModel {
  rotation: NumberField;
  // A plain string, not a field: the anchor is set by dragging onto an
  // element, so there is nothing here to edit and no override/effective fold
  // to carry. Undefined when selected annotations point at different targets,
  // since one label cannot describe two.
  anchorLabel: string | undefined;
  // Separate from anchorLabel because a mixed selection still detaches.
  anchored: boolean;
}

function refKindName(kind: RefKind): string {
  switch (kind) {
    case RefKind.NODE: return 'node';
    case RefKind.EDGE: return 'edge';
    case RefKind.GROUP: return 'group';
    default: return 'element';
  }
}

export function annotationModel(
  model: InspectorModel,
  geometry: SceneGeometry,
  stylesheet: Stylesheet,
): AnnotationModel {
  const ids = model.kind === 'annotation' ? model.ids : [];

  const rotation = numberField(
    ids.map((id) => stylesheet.annotations[id]?.layout?.rotation),
    ids.map((id) => geometry.diagram.annotations[id]?.layout?.rotation),
  );

  const labels = ids.map((id) => {
    const anchor = stylesheet.annotations[id]?.anchor;
    return anchor === undefined ? undefined : `${refKindName(anchor.refKind)} ${anchor.refId}`;
  });
  const first = labels[0];
  const agree = labels.every((label) => label === first);

  return {
    rotation,
    anchorLabel: agree ? first : undefined,
    anchored: labels.some((label) => label !== undefined),
  };
}
