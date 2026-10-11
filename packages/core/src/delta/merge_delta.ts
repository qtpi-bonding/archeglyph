// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import {
  ChangeType,
  Delta,
  Diagram,
  DiagramSchema,
  Edge,
  Element,
  ElementRole,
  ElementSchema,
  GraphSchema,
} from '@archeglyph/proto/gen/content_pb';
import { init } from '@archeglyph/proto/util/init';
import { childrenIndex, isGroupLike } from '../resolver/element_form';
import { DeltaOverlay } from './delta_overlay';

export function mergeDelta(target: Diagram, delta: Delta): DeltaOverlay {
  const graph = target.graph;
  const elements: { [key: string]: Element } = graph !== undefined ? { ...graph.elements } : {};
  const edges: { [key: string]: Edge } = graph !== undefined ? { ...graph.edges } : {};
  const elementTypes: Record<string, ChangeType> = {};
  const edgeTypes: Record<string, ChangeType> = {};
  const restoredElements = new Set<string>();
  const restoredEdges = new Set<string>();

  for (const key of Object.keys(elements)) elementTypes[key] = ChangeType.UNCHANGED;
  for (const key of Object.keys(edges)) edgeTypes[key] = ChangeType.UNCHANGED;

  for (const entry of delta.elementDeltas) {
    const absent = elements[entry.elementId] === undefined;
    const side = entry.changeType === ChangeType.DELETED ? entry.before : entry.after;
    if (entry.changeType === ChangeType.CHANGE_TYPE_UNSPECIFIED) {
      continue;
    }
    if (absent) {
      if (side !== undefined) {
        elements[entry.elementId] = side;
        elementTypes[entry.elementId] = entry.changeType;
        restoredElements.add(entry.elementId);
      }
    } else {
      elementTypes[entry.elementId] = entry.changeType;
    }
  }

  for (const entry of delta.edgeDeltas) {
    const absent = edges[entry.edgeId] === undefined;
    const side = entry.changeType === ChangeType.DELETED ? entry.before : entry.after;
    if (entry.changeType === ChangeType.CHANGE_TYPE_UNSPECIFIED) {
      continue;
    }
    if (absent) {
      if (side !== undefined) {
        edges[entry.edgeId] = side;
        edgeTypes[entry.edgeId] = entry.changeType;
        restoredEdges.add(entry.edgeId);
      }
    } else {
      edgeTypes[entry.edgeId] = entry.changeType;
    }
  }

  for (const key of restoredElements) {
    const element = elements[key];
    if (element.parent !== undefined && elements[element.parent] === undefined) {
      elements[key] = create(ElementSchema, { ...element, parent: undefined });
    }
  }
  // A restored edge is only drawn if both endpoints still exist as ENTITY
  // elements; one that now points at a grouping would break the endpoint rule.
  const isEntity = (id: string): boolean =>
    elements[id] !== undefined && elements[id].role !== ElementRole.GROUPING;
  for (const key of Object.keys(edges)) {
    const edge = edges[key];
    if (restoredEdges.has(key) && (!isEntity(edge.source) || !isEntity(edge.target))) {
      delete edges[key];
      delete edgeTypes[key];
    }
  }

  const mergedGraph = create(GraphSchema, { elements, edges });
  const diagram = create(DiagramSchema, {
    schemaVersion: target.schemaVersion,
    id: target.id,
    title: target.title,
    graph: mergedGraph,
    metadata: target.metadata,
  });

  // The overlay keys change types by how an element is drawn: groups for
  // anything with children (or a grouping), nodes for the rest.
  const children = childrenIndex(elements);
  const nodeTypes: Record<string, ChangeType> = {};
  const groupTypes: Record<string, ChangeType> = {};
  for (const key of Object.keys(elementTypes)) {
    if (isGroupLike(elements, children, key)) {
      groupTypes[key] = elementTypes[key];
    } else {
      nodeTypes[key] = elementTypes[key];
    }
  }
  return init(new DeltaOverlay(), {
    diagram,
    nodes: nodeTypes,
    edges: edgeTypes,
    groups: groupTypes,
  });
}
