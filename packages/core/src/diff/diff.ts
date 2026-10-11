// SPDX-License-Identifier: MPL-2.0

// Hand-maintained since the element-model port.

import { create, equals } from '@bufbuild/protobuf';
import {
  ChangeType,
  Delta,
  DeltaSchema,
  Edge,
  EdgeDeltaSchema,
  EdgeSchema,
  Element,
  ElementDeltaSchema,
  ElementSchema,
  Diagram,
} from '@archeglyph/proto/gen/content_pb';
import { CONTENT_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

export function diff(base: Diagram, target: Diagram, options?: DiffOptions): Delta {
  const baseElements: { [key: string]: Element } = base.graph !== undefined ? base.graph.elements : {};
  const targetElements: { [key: string]: Element } = target.graph !== undefined ? target.graph.elements : {};
  const baseEdges: { [key: string]: Edge } = base.graph !== undefined ? base.graph.edges : {};
  const targetEdges: { [key: string]: Edge } = target.graph !== undefined ? target.graph.edges : {};
  const includeUnchanged = options !== undefined && options.includeUnchanged === true;

  const elementDeltas = [];
  const elementIds = Array.from(new Set([...Object.keys(baseElements), ...Object.keys(targetElements)])).sort();
  for (const elementId of elementIds) {
    const before = baseElements[elementId];
    const after = targetElements[elementId];
    if (before === undefined && after !== undefined) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: ChangeType.ADDED,
        after,
      }));
    } else if (before !== undefined && after === undefined) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: ChangeType.DELETED,
        before,
      }));
    } else if (before !== undefined && after !== undefined && !equals(ElementSchema, before, after)) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: ChangeType.MODIFIED,
        before,
        after,
      }));
    } else if (includeUnchanged && before !== undefined && after !== undefined) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: ChangeType.UNCHANGED,
        before,
        after,
      }));
    }
  }

  const edgeDeltas = [];
  const edgeIds = Array.from(new Set([...Object.keys(baseEdges), ...Object.keys(targetEdges)])).sort();
  for (const edgeId of edgeIds) {
    const before = baseEdges[edgeId];
    const after = targetEdges[edgeId];
    if (before === undefined && after !== undefined) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: ChangeType.ADDED,
        after,
      }));
    } else if (before !== undefined && after === undefined) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: ChangeType.DELETED,
        before,
      }));
    } else if (before !== undefined && after !== undefined && !equals(EdgeSchema, before, after)) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: ChangeType.MODIFIED,
        before,
        after,
      }));
    } else if (includeUnchanged && before !== undefined && after !== undefined) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: ChangeType.UNCHANGED,
        before,
        after,
      }));
    }
  }

  return create(DeltaSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    baseRef: base.id,
    targetRef: target.id,
    edgeDeltas,
    elementDeltas,
  });
}
export class DiffOptions {
  includeUnchanged?: boolean;
}
