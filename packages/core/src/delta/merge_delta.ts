// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import {
  ChangeType,
  Delta,
  Diagram,
  DiagramSchema,
  Edge,
  GraphSchema,
  Group,
  GroupSchema,
  Node,
  NodeSchema,
} from '@archeglyph/proto/gen/content_pb';
import { init } from '@archeglyph/proto/util/init';
import { DeltaOverlay } from './delta_overlay';

export function mergeDelta(target: Diagram, delta: Delta): DeltaOverlay {
  const graph = target.graph;
  const nodes: { [key: string]: Node } = graph !== undefined ? { ...graph.nodes } : {};
  const edges: { [key: string]: Edge } = graph !== undefined ? { ...graph.edges } : {};
  const groups: { [key: string]: Group } = graph !== undefined ? { ...graph.groups } : {};
  const nodeTypes: Record<string, ChangeType> = {};
  const edgeTypes: Record<string, ChangeType> = {};
  const groupTypes: Record<string, ChangeType> = {};
  const restoredNodes = new Set<string>();
  const restoredGroups = new Set<string>();
  const restoredEdges = new Set<string>();

  for (const key of Object.keys(nodes)) nodeTypes[key] = ChangeType.UNCHANGED;
  for (const key of Object.keys(edges)) edgeTypes[key] = ChangeType.UNCHANGED;
  for (const key of Object.keys(groups)) groupTypes[key] = ChangeType.UNCHANGED;

  for (const entry of delta.nodeDeltas) {
    const absent = nodes[entry.nodeId] === undefined;
    const side = entry.changeType === ChangeType.DELETED ? entry.before : entry.after;
    if (entry.changeType === ChangeType.CHANGE_TYPE_UNSPECIFIED) {
      continue;
    }
    if (absent) {
      if (side !== undefined) {
        nodes[entry.nodeId] = side;
        nodeTypes[entry.nodeId] = entry.changeType;
        restoredNodes.add(entry.nodeId);
      }
    } else {
      nodeTypes[entry.nodeId] = entry.changeType;
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

  for (const entry of delta.groupDeltas) {
    const absent = groups[entry.groupId] === undefined;
    const side = entry.changeType === ChangeType.DELETED ? entry.before : entry.after;
    if (entry.changeType === ChangeType.CHANGE_TYPE_UNSPECIFIED) {
      continue;
    }
    if (absent) {
      if (side !== undefined) {
        groups[entry.groupId] = side;
        groupTypes[entry.groupId] = entry.changeType;
        restoredGroups.add(entry.groupId);
      }
    } else {
      groupTypes[entry.groupId] = entry.changeType;
    }
  }

  for (const key of restoredNodes) {
    const node = nodes[key];
    if (node.parentGroup !== undefined && groups[node.parentGroup] === undefined) {
      nodes[key] = create(NodeSchema, { ...node, parentGroup: undefined });
    }
  }
  for (const key of restoredGroups) {
    const group = groups[key];
    if (group.parentGroup !== undefined && groups[group.parentGroup] === undefined) {
      groups[key] = create(GroupSchema, { ...group, parentGroup: undefined });
    }
  }
  for (const key of Object.keys(edges)) {
    const edge = edges[key];
    if (restoredEdges.has(key) &&
        (nodes[edge.source] === undefined || nodes[edge.target] === undefined)) {
      delete edges[key];
      delete edgeTypes[key];
    }
  }

  const mergedGraph = create(GraphSchema, { nodes, edges, groups });
  const diagram = create(DiagramSchema, {
    schemaVersion: target.schemaVersion,
    id: target.id,
    title: target.title,
    graph: mergedGraph,
    metadata: target.metadata,
  });
  return init(new DeltaOverlay(), {
    diagram,
    nodes: nodeTypes,
    edges: edgeTypes,
    groups: groupTypes,
  });
}
