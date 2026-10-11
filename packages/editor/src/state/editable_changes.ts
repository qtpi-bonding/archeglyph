// SPDX-License-Identifier: MPL-2.0

import { Diagram } from '../../../proto/src/gen/content_pb';
import { StyleEdit } from '../../../proto/src/gen/style_pb';

export function editableChanges(edit: StyleEdit, diagram: Diagram): StyleEdit {
  const elements = diagram.graph?.elements ?? {};
  const edges = diagram.graph?.edges ?? {};

  return {
    ...edit,
    // hasOwn, not `in`: `in` walks the prototype chain.
    elementChanges: edit.elementChanges.filter((change) => Object.hasOwn(elements, change.elementId)),
    edgeChanges: edit.edgeChanges.filter((change) => Object.hasOwn(edges, change.edgeId)),
    annotationChanges: edit.annotationChanges,
  };
}
