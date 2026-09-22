// SPDX-License-Identifier: AGPL-3.0-or-later

import { Diagram } from '../../../proto/src/gen/content_pb';
import { StyleEdit } from '../../../proto/src/gen/style_pb';

export function editableChanges(edit: StyleEdit, diagram: Diagram): StyleEdit {
  const nodes = diagram.graph?.nodes ?? {};
  const edges = diagram.graph?.edges ?? {};
  const groups = diagram.graph?.groups ?? {};

  return {
    ...edit,
    // hasOwn, not `in`: `in` walks the prototype chain.
    nodeChanges: edit.nodeChanges.filter((change) => Object.hasOwn(nodes, change.nodeId)),
    edgeChanges: edit.edgeChanges.filter((change) => Object.hasOwn(edges, change.edgeId)),
    groupChanges: edit.groupChanges.filter((change) => Object.hasOwn(groups, change.groupId)),
    annotationChanges: edit.annotationChanges,
  };
}
