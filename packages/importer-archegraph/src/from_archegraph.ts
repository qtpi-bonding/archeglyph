// SPDX-License-Identifier: MPL-2.0

import { create } from '@bufbuild/protobuf';
import {
  type Diagram,
  type Edge,
  type Element,
  DiagramMetadataSchema,
  DiagramSchema,
  EdgeSchema,
  ElementRole,
  ElementSchema,
  GraphSchema,
  LocalizationSchema,
} from '@archeglyph/proto/gen/content_pb';
import { EdgeKind, EdgeRole, NodeKind } from '@archeglyph/proto/gen/archegraph/common_pb';
import type { Archeview } from '@archeglyph/proto/gen/archegraph/view_pb';
import { CONTENT_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

export class ImportOptions {
  includeExternal?: boolean;
}

export function fromArchegraph(view: Archeview, options?: ImportOptions): Diagram {
  const includeExternal = options?.includeExternal ?? false;

  const includedNodeIds = new Set<string>();
  const elements: { [key: string]: Element } = {};

  for (const id of Object.keys(view.nodes)) {
    const vn = view.nodes[id];
    if (!includeExternal && vn.isExternal) {
      continue;
    }
    includedNodeIds.add(id);

    // tags.kind is what seed_bindings reads to pick a theme component, so it
    // carries the language-neutral NodeKind; the language's own word for it
    // ("Trait", "Struct") rides along separately.
    const tags: { [key: string]: string } = {
      ...vn.tags,
      kind: NodeKind[vn.kind].toLowerCase(),
      'archegraph.kind_label': vn.kindLabel,
    };
    if (vn.scipSymbol !== '') {
      tags['archegraph.symbol'] = vn.scipSymbol;
    }

    // Every archegraph node is something the source asserts takes part in
    // relations, so every element is an ENTITY, including the ones that end up
    // containing others.
    elements[id] = create(ElementSchema, {
      label: [create(LocalizationSchema, { locale: 'en', source: vn.displayName })],
      tags,
      role: ElementRole.ENTITY,
    });
  }

  // Containment is structure, not a relation: it becomes the parent link and is
  // not emitted as an edge. A node with several containment parents keeps the
  // lexicographically smallest, so the choice is deterministic; the rest stay
  // as ordinary edges so nothing the source said is dropped.
  const containmentParents = new Map<string, string[]>();
  const excludedParents = new Map<string, string[]>();
  const extraContainment = new Set<string>();
  const edgeIds = Object.keys(view.edges).sort();
  for (const id of edgeIds) {
    const ve = view.edges[id];
    if (ve.kind !== EdgeKind.CONTAINMENT || !includedNodeIds.has(ve.target)) {
      continue;
    }
    const bucket = includedNodeIds.has(ve.source) ? containmentParents : excludedParents;
    const list = bucket.get(ve.target);
    if (list === undefined) {
      bucket.set(ve.target, [ve.source]);
    } else {
      list.push(ve.source);
    }
  }
  for (const [child, parents] of containmentParents) {
    const sorted = [...new Set(parents)].sort();
    elements[child].parent = sorted[0];
  }
  for (const [child, parents] of excludedParents) {
    if (containmentParents.has(child)) {
      continue;
    }
    // The parent is outside the slice, so the child is a root; say where it
    // came from rather than lose it.
    elements[child].tags['archegraph.parent'] = [...new Set(parents)].sort()[0];
  }
  for (const id of edgeIds) {
    const ve = view.edges[id];
    if (ve.kind === EdgeKind.CONTAINMENT &&
        includedNodeIds.has(ve.source) && includedNodeIds.has(ve.target) &&
        elements[ve.target].parent !== ve.source) {
      extraContainment.add(id);
    }
  }

  const edges: { [key: string]: Edge } = {};

  for (const id of edgeIds) {
    const ve = view.edges[id];
    if (!includedNodeIds.has(ve.source) || !includedNodeIds.has(ve.target)) {
      continue;
    }
    if (ve.kind === EdgeKind.CONTAINMENT && !extraContainment.has(id)) {
      continue;
    }

    // tags.kind picks the theme component and keys edge bundling, so the role
    // (EXTENDS, USES, ...) goes there when there is one: two edges between the
    // same pair that mean different things must not merge into one bundle.
    const edgeKind = EdgeKind[ve.kind].toLowerCase();
    const kind = ve.role !== EdgeRole.EDGE_ROLE_UNSPECIFIED ? EdgeRole[ve.role].toLowerCase() : edgeKind;
    edges[id] = create(EdgeSchema, {
      source: ve.source,
      target: ve.target,
      tags: { ...ve.tags, kind, 'archegraph.edge_kind': edgeKind },
    });
  }

  const diagramId = view.metadata?.projectName || 'imported';

  return create(DiagramSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    id: diagramId,
    title: [],
    graph: create(GraphSchema, { elements, edges }),
    metadata: create(DiagramMetadataSchema, { generator: 'archegraph-importer-v1' }),
  });
}
