// SPDX-License-Identifier: MPL-2.0

// Hand-maintained since the element-model port.

import { clone, create } from '@bufbuild/protobuf';
import { Edge, Element, ElementRole, Localization, LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { AnnotationEntrySchema, GroupRenderMode, NodeVisibility, RefKind } from '@archeglyph/proto/gen/style_pb';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';
import { FilterRequest } from '../filter_request';
import { FilteredAnnotation } from '../filtered_annotation';
import { FilteredDiagram } from '../filtered_diagram';
import { FilteredEdge } from '../filtered_edge';
import { childrenIndex, isGroupLike } from '../element_form';
import { FilteredGroup } from '../filtered_group';
import { FilteredNode } from '../filtered_node';
import { ResolveError } from '../resolve_error';
import { VisibilityFilter } from './schema_gen';
import { effectiveMode } from '../effective_mode';
import { representative } from '../representative';


// The id must distinguish everything bundleKey does, or two bundles on the same
// pair collide and the later one silently replaces the earlier in byId.
function bundleHash(edge: FilteredEdge): string {
  const label = edge.label.map((l: Localization): [string, string] => [l.locale, l.source]);
  const text = JSON.stringify([edge.tags.get('kind') ?? null, label]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function bundleKey(edge: FilteredEdge): string {
  const label = edge.label.map((l: Localization): [string, string] => [l.locale, l.source]);
  return JSON.stringify([edge.source, edge.target, edge.tags.get('kind') ?? null, label]);
}

export class VisibilityFilterImpl implements VisibilityFilter {
  filter(request: FilterRequest): Result<FilteredDiagram, ResolveError> {
    const diagram = request.diagram;
    const stylesheet = request.stylesheet;

    const elementsMap: { [k: string]: Element } = diagram.graph !== undefined ? diagram.graph.elements : {};
    const edgesMap: { [k: string]: Edge } = diagram.graph !== undefined ? diagram.graph.edges : {};

    // Elements are drawn as a plain node or with a group's machinery (a box
    // when open, a super-node when closed); see isGroupLike.
    const children = childrenIndex(elementsMap);
    const nodesMap: { [k: string]: Element } = {};
    const groupsMap: { [k: string]: Element } = {};
    for (const id of Object.keys(elementsMap).sort()) {
      if (isGroupLike(elementsMap, children, id)) {
        groupsMap[id] = elementsMap[id];
      } else {
        nodesMap[id] = elementsMap[id];
      }
    }

    const sortedKeys = (obj: { [k: string]: unknown }): string[] => Object.keys(obj).sort();

    const parentOf = new Map<string, string>();
    for (const id of sortedKeys(elementsMap)) {
      const parent = elementsMap[id].parent;
      if (parent !== undefined && parent !== '') {
        if (elementsMap[parent] === undefined) {
          const err = new ResolveError();
          err.message = `visibility_filter: element '${id}' references unknown parent '${parent}'`;
          return Err(err);
        }
        parentOf.set(id, parent);
      }
    }

    // The render path never runs the validator, and every walk up a parent
    // chain below would spin forever on a loop, so refuse one here.
    for (const id of sortedKeys(elementsMap)) {
      const seen = new Set<string>([id]);
      let ancestor = parentOf.get(id);
      while (ancestor !== undefined) {
        if (seen.has(ancestor)) {
          const err = new ResolveError();
          err.message = `visibility_filter: element '${id}' is in a parent cycle through '${ancestor}'`;
          return Err(err);
        }
        seen.add(ancestor);
        ancestor = parentOf.get(ancestor);
      }
    }

    // 1. Hidden node ids.
    const hiddenNodeIds = new Set<string>();
    if (stylesheet !== undefined) {
      const styleElementIds = sortedKeys(stylesheet.elements);
      for (const id of styleElementIds) {
        const entry = stylesheet.elements[id];
        if (entry.visibility === NodeVisibility.HIDDEN) {
          hiddenNodeIds.add(id);
        } else {
          // no-op
        }
      }
    } else {
      // no-op
    }

    // Visibility applies to an element's complete descendant subtree.
    for (const id of sortedKeys(elementsMap)) {
      let current: string | undefined = id;
      while (current !== undefined) {
        if (hiddenNodeIds.has(current)) {
          hiddenNodeIds.add(id);
          break;
        }
        current = parentOf.get(current);
      }
    }

    // 2. Group render-mode partitioning.

    // Dissolving removes the box an edge would attach to, so only a grouping,
    // which never takes edges, may be dissolved. This holds for any element,
    // not just the ones drawn as groups.
    if (stylesheet !== undefined) {
      for (const id of sortedKeys(stylesheet.elements)) {
        const element = elementsMap[id];
        if (element !== undefined &&
            stylesheet.elements[id].renderMode === GroupRenderMode.DISSOLVED &&
            element.role !== ElementRole.GROUPING) {
          const err = new ResolveError();
          err.message = `visibility_filter: element '${id}' is dissolved but is not grouping`;
          return Err(err);
        }
      }
    }

    const dissolvedGroupIds = new Set<string>();
    const closedGroupIds = new Set<string>();
    const sortedGroupIds = sortedKeys(groupsMap);
    for (const id of sortedGroupIds) {
      const mode = effectiveMode(id, elementsMap, parentOf, stylesheet);
      if (mode === GroupRenderMode.DISSOLVED) {
        dissolvedGroupIds.add(id);
      } else if (mode === GroupRenderMode.CLOSED) {
        closedGroupIds.add(id);
      } else {
        // OPEN — no-op.
      }
    }

    for (const id of sortedKeys(edgesMap)) {
      const edge = edgesMap[id];
      for (const endpoint of [edge.source, edge.target]) {
        if (elementsMap[endpoint] === undefined) {
          const err = new ResolveError();
          err.message = `visibility_filter: edge '${id}' references unknown element '${endpoint}'`;
          return Err(err);
        }
      }
      if (elementsMap[edge.source]?.role === ElementRole.GROUPING ||
          elementsMap[edge.target]?.role === ElementRole.GROUPING) {
        const err = new ResolveError();
        const endpoint = elementsMap[edge.source]?.role === ElementRole.GROUPING
          ? edge.source
          : edge.target;
        err.message = `visibility_filter: edge '${id}' endpoint '${endpoint}' is grouping`;
        return Err(err);
      }
    }

    const normParent = (raw: string | undefined): string | undefined => {
      if (raw === undefined || raw === '') {
        return undefined;
      } else {
        return raw;
      }
    };

    const sortedNodeIds = sortedKeys(nodesMap);

    // 3. DISSOLVED collapse: lift through any chain of DISSOLVED parents.
    const liftThroughExpanded = (rawParent: string | undefined): string | undefined => {
      let p: string | undefined = rawParent;
      while (p !== undefined && dissolvedGroupIds.has(p)) {
        p = parentOf.get(p);
      }
      return p;
    };

    // 4. CLOSED collapse: map each descendant to its OUTERMOST closed ancestor.
    const closedRoot = new Map<string, string>();
    for (const id of sortedKeys(elementsMap)) {
      const root = representative(id, closedGroupIds, parentOf);
      if (root !== id) {
        closedRoot.set(id, root);
      }
    }

    // hidden_descendant_count per contracted group.
    const hiddenDescendantCount = new Map<string, number>();
    for (const cid of sortedGroupIds) {
      if (closedGroupIds.has(cid)) {
        hiddenDescendantCount.set(cid, 0);
      } else {
        // no-op.
      }
    }
    for (const root of closedRoot.values()) {
      const prev = hiddenDescendantCount.get(root);
      const next: number = prev !== undefined ? prev + 1 : 1;
      hiddenDescendantCount.set(root, next);
    }

    // Tag conversion: plain proto map → Map<string, string> with sorted insertion.
    const toTagMap = (tags: { [k: string]: string }): Map<string, string> => {
      const m = new Map<string, string>();
      const keys = Object.keys(tags).sort();
      for (const k of keys) {
        m.set(k, tags[k]);
      }
      return m;
    };

    // Emit FilteredNodes.
    const filteredNodes: FilteredNode[] = [];
    for (const id of sortedNodeIds) {
      if (hiddenNodeIds.has(id)) {
        // dropped.
      } else if (closedRoot.has(id)) {
        // absorbed into the closed container.
      } else {
        const node = nodesMap[id];
        const fn = new FilteredNode();
        fn.id = id;
        fn.parentGroup = liftThroughExpanded(normParent(node.parent));
        fn.tags = toTagMap(node.tags);
        fn.label = node.label;
        filteredNodes.push(fn);
      }
    }

    // Emit FilteredGroups.
    const filteredGroups: FilteredGroup[] = [];
    for (const id of sortedGroupIds) {
      if (hiddenNodeIds.has(id)) {
        // hidden subtree
      } else if (dissolvedGroupIds.has(id)) {
        // DISSOLVED groupings are omitted from output.
      } else if (closedRoot.has(id)) {
        // descendant of an outer CLOSED container — absorbed.
      } else {
        const group = groupsMap[id];
        const fg = new FilteredGroup();
        fg.id = id;
        fg.parentGroup = liftThroughExpanded(normParent(group.parent));
        fg.viewRole = closedGroupIds.has(id) ? 'block' : 'box';
        fg.tags = toTagMap(group.tags);
        fg.label = group.label;
        fg.isSuperNode = closedGroupIds.has(id);
        const count = hiddenDescendantCount.get(id);
        fg.hiddenDescendantCount = count !== undefined ? count : 0;
        filteredGroups.push(fg);
      }
    }

    // Emit FilteredEdges.
    const filteredEdges: FilteredEdge[] = [];
    const remappedEdgeIds = new Set<string>();
    const sortedEdgeIds = sortedKeys(edgesMap);
    for (const id of sortedEdgeIds) {
      const edge = edgesMap[id];
      const srcHidden = hiddenNodeIds.has(edge.source);
      const tgtHidden = hiddenNodeIds.has(edge.target);
      if (srcHidden || tgtHidden) {
        // drop — incident on a hidden endpoint.
      } else {
        const sRoot = closedRoot.get(edge.source);
        const tRoot = closedRoot.get(edge.target);
        const source: string = sRoot !== undefined ? sRoot : edge.source;
        const target: string = tRoot !== undefined ? tRoot : edge.target;
        if (source === target && (source !== edge.source || target !== edge.target)) {
          const group = filteredGroups.find((candidate) => candidate.id === source);
          if (group !== undefined) {
            group.internalEdgeCount += 1;
          }
          // Both endpoints collapsed into the SAME closed container, so this edge was
          // internal to the closed container. design.md §5.1 promises that
          // CLOSED hides the children and that CROSS-BOUNDARY edges
          // terminate at the super-node; an edge between two hidden children is
          // neither, and re-pointing it produces a self-loop on the super-node
          // that was never in the diagram. Drop it. An author's genuine
          // self-loop on a single node is untouched: its endpoints are the same
          // node, not two different ones sharing a root.
          continue;
        }
        const fe = new FilteredEdge();
        fe.id = id;
        fe.source = source;
        fe.target = target;
        fe.ordinal = edge.ordinal;
        fe.tags = toTagMap(edge.tags);
        fe.label = edge.label;
        if (sRoot !== undefined || tRoot !== undefined) {
          remappedEdgeIds.add(id);
        }
        filteredEdges.push(fe);
      }
    }

    // Only edges a contraction remapped may merge; parallels an author wrote
    // keep their own identity.
    const bundledEdges: FilteredEdge[] = [];
    const pairIndex = new Map<string, FilteredEdge[]>();
    const pairOrder: string[] = [];
    for (const fe of filteredEdges) {
      if (!remappedEdgeIds.has(fe.id)) {
        bundledEdges.push(fe);
        continue;
      }
      const pairKey = bundleKey(fe);
      const existing = pairIndex.get(pairKey);
      if (existing === undefined) {
        pairIndex.set(pairKey, [fe]);
        pairOrder.push(pairKey);
      } else {
        existing.push(fe);
      }
    }
    for (const pairKey of pairOrder) {
      const group = pairIndex.get(pairKey)!;
      if (group.length === 1) {
        bundledEdges.push(group[0]);
        continue;
      }
      const first = group[0];
      const kind = first.tags.get('kind');
      const merged = new FilteredEdge();
      merged.id = `bundle:${first.source}__${first.target}__${bundleHash(first)}`;
      merged.source = first.source;
      merged.target = first.target;
      merged.ordinal = Math.min(...group.map((e: FilteredEdge): number => e.ordinal));
      merged.tags = new Map<string, string>([['archeglyph.bundled', String(group.length)]]);
      if (kind !== undefined) {
        merged.tags.set('kind', kind);
      }
      merged.label = first.label.length > 0
        ? first.label.map((l: Localization): Localization =>
            create(LocalizationSchema, { locale: l.locale, source: `${l.source} \u00d7${group.length}` }))
        : [create(LocalizationSchema, { locale: 'en', source: `\u00d7${group.length}` })];
      bundledEdges.push(merged);
    }
    filteredEdges.length = 0;
    filteredEdges.push(...bundledEdges);

    // Annotations carry no visibility of their own; only their anchor can move.
    const filteredAnnotations: FilteredAnnotation[] = [];
    if (stylesheet !== undefined) {
      const sortedAnnIds = sortedKeys(stylesheet.annotations);
      for (const id of sortedAnnIds) {
        const entry = stylesheet.annotations[id];
        const fa = new FilteredAnnotation();
        fa.id = id;
        // An annotation anchored to something absorbed into a closed block
        // follows the block, as the edges do; the stylesheet's own copy is
        // never touched.
        fa.entry = clone(AnnotationEntrySchema, entry);
        const anchored = fa.entry.anchor?.refId;
        if (fa.entry.anchor !== undefined && fa.entry.anchor.refKind === RefKind.ELEMENT &&
            anchored !== undefined && closedRoot.has(anchored)) {
          fa.entry.anchor.refId = closedRoot.get(anchored)!;
        }
        filteredAnnotations.push(fa);
      }
    } else {
      // no-op.
    }

    const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
      Object.fromEntries(items.map((item: T): [string, T] => [item.id, item]));

    const out = new FilteredDiagram();
    out.id = diagram.id;
    out.nodes = byId(filteredNodes);
    out.edges = byId(filteredEdges);
    out.groups = byId(filteredGroups);
    out.annotations = byId(filteredAnnotations);
    return Ok(out);
  }
}
