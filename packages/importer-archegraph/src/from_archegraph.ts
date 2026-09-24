// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import {
  type Diagram,
  type Edge,
  type Node,
  DiagramMetadataSchema,
  DiagramSchema,
  EdgeSchema,
  GraphSchema,
  LocalizationSchema,
  NodeSchema,
} from '@archeglyph/proto/gen/content_pb';
import type { Archeview } from '@archeglyph/proto/gen/archegraph/view_pb';

export class ImportOptions {
  includeExternal?: boolean;
}

export function fromArchegraph(view: Archeview, options?: ImportOptions): Diagram {
  const includeExternal = options?.includeExternal ?? false;

  const includedNodeIds = new Set<string>();
  const nodes: { [key: string]: Node } = {};

  for (const id of Object.keys(view.nodes)) {
    const vn = view.nodes[id];
    if (!includeExternal && vn.isExternal) {
      continue;
    }
    includedNodeIds.add(id);

    const nodeTags: { [key: string]: string } = { ...vn.tags, 'archegraph.kind': vn.kindLabel };
    if (vn.scipSymbol !== '') {
      nodeTags['archegraph.symbol'] = vn.scipSymbol;
    }

    nodes[id] = create(NodeSchema, {
      label: [create(LocalizationSchema, { locale: 'en', source: vn.displayName })],
      tags: nodeTags,
    });
  }

  const edges: { [key: string]: Edge } = {};

  for (const id of Object.keys(view.edges)) {
    const ve = view.edges[id];
    if (!includedNodeIds.has(ve.source) || !includedNodeIds.has(ve.target)) {
      continue;
    }

    edges[id] = create(EdgeSchema, {
      source: ve.source,
      target: ve.target,
      label: [create(LocalizationSchema, { locale: 'en', source: ve.kindLabel })],
      tags: { ...ve.tags },
    });
  }

  const diagramId = view.metadata?.projectName || 'imported';

  return create(DiagramSchema, {
    schemaVersion: 1,
    id: diagramId,
    title: [],
    graph: create(GraphSchema, { nodes, edges, groups: {} }),
    metadata: create(DiagramMetadataSchema, { generator: 'archegraph-importer-v1' }),
  });
}
