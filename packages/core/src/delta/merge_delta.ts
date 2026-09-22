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

  for (const key of Object.keys(nodes)) nodeTypes[key] = ChangeType.UNCHANGED;
  for (const key of Object.keys(edges)) edgeTypes[key] = ChangeType.UNCHANGED;
  for (const key of Object.keys(groups)) groupTypes[key] = ChangeType.UNCHANGED;

  for (const entry of delta.nodeDeltas) {
    if (entry.changeType === ChangeType.DELETED) {
      if (entry.before !== undefined) {
        nodes[entry.nodeId] = entry.before;
        nodeTypes[entry.nodeId] = ChangeType.DELETED;
        restoredNodes.add(entry.nodeId);
      }
    } else if (entry.changeType !== ChangeType.CHANGE_TYPE_UNSPECIFIED && nodes[entry.nodeId] !== undefined) {
      nodeTypes[entry.nodeId] = entry.changeType;
    }
  }

  for (const entry of delta.edgeDeltas) {
    if (entry.changeType === ChangeType.DELETED) {
      if (entry.before !== undefined) {
        edges[entry.edgeId] = entry.before;
        edgeTypes[entry.edgeId] = ChangeType.DELETED;
      }
    } else if (entry.changeType !== ChangeType.CHANGE_TYPE_UNSPECIFIED && edges[entry.edgeId] !== undefined) {
      edgeTypes[entry.edgeId] = entry.changeType;
    }
  }

  for (const entry of delta.groupDeltas) {
    if (entry.changeType === ChangeType.DELETED) {
      if (entry.before !== undefined) {
        groups[entry.groupId] = entry.before;
        groupTypes[entry.groupId] = ChangeType.DELETED;
        restoredGroups.add(entry.groupId);
      }
    } else if (entry.changeType !== ChangeType.CHANGE_TYPE_UNSPECIFIED && groups[entry.groupId] !== undefined) {
      groupTypes[entry.groupId] = entry.changeType;
    }
  }

  // Resolve containment only after all three maps have been assembled.  In
  // particular, a deleted node may make a deleted edge valid again.
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
    if (edgeTypes[key] === ChangeType.DELETED &&
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
