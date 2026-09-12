// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationEntrySchema,
  EdgeStyleEntrySchema,
  GroupStyleEntrySchema,
  NodeStyleEntrySchema,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';

/**
 * Write the theme's starting components into the stylesheet as real bindings.
 *
 * A diagram is authored without a stylesheet — that is the normal starting
 * point — and it still has to render. The resolver deliberately will not
 * invent a binding for it (design.md §5: an element with no `component`
 * starts unstyled), so something has to put one there.
 *
 * This is that something, and the important part is that its output is
 * ORDINARY DATA. The entries it writes are indistinguishable from ones the
 * user typed: they appear in the inspector, they can be changed or deleted,
 * and they are saved to the style file. Nothing downstream treats them
 * specially, and no component name is privileged anywhere in the engine —
 * the theme nominates its own starting look via default_*_component, and a
 * theme that nominates none seeds nothing.
 *
 * Existing bindings are never overwritten; this only fills gaps. Calling it
 * twice is the same as calling it once.
 */
export function seedComponentBindings(diagram: Diagram, stylesheet: Stylesheet, theme: Theme): Stylesheet {
  const graph = diagram.graph;
  if (graph === undefined) {
    return stylesheet;
  }

  const nodes = { ...stylesheet.nodes };
  const edges = { ...stylesheet.edges };
  const groups = { ...stylesheet.groups };
  const annotations = { ...stylesheet.annotations };

  const nodeName = theme.defaultNodeComponent;
  if (nodeName !== undefined && nodeName !== '') {
    for (const id of Object.keys(graph.nodes)) {
      const existing = nodes[id];
      if (existing?.component === undefined || existing.component === '') {
        nodes[id] = create(NodeStyleEntrySchema, { ...existing, component: nodeName });
      }
    }
  }

  const edgeName = theme.defaultEdgeComponent;
  if (edgeName !== undefined && edgeName !== '') {
    for (const id of Object.keys(graph.edges)) {
      const existing = edges[id];
      if (existing?.component === undefined || existing.component === '') {
        edges[id] = create(EdgeStyleEntrySchema, { ...existing, component: edgeName });
      }
    }
  }

  const groupName = theme.defaultGroupComponent;
  if (groupName !== undefined && groupName !== '') {
    for (const id of Object.keys(graph.groups)) {
      const existing = groups[id];
      if (existing?.component === undefined || existing.component === '') {
        groups[id] = create(GroupStyleEntrySchema, { ...existing, component: groupName });
      }
    }
  }

  // Annotations live only in the stylesheet, so they are seeded from what is
  // already there rather than from the diagram.
  const annotationName = theme.defaultAnnotationComponent;
  if (annotationName !== undefined && annotationName !== '') {
    for (const id of Object.keys(annotations)) {
      const existing = annotations[id];
      if (existing.component === undefined || existing.component === '') {
        annotations[id] = create(AnnotationEntrySchema, { ...existing, component: annotationName });
      }
    }
  }

  return create(StylesheetSchema, { ...stylesheet, nodes, edges, groups, annotations });
}
