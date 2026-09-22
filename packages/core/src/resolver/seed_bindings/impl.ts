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
import { deriveComponent } from './derive';

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
 * Only an element whose `component` is unset gets one written, and only when
 * its `kind` tag derives something OTHER than the theme's default -- an unset
 * value already resolves to the default via the cascade, so writing it in
 * would only make a seeded value indistinguishable from a chosen one.
 *
 * Anything already in `component` is a choice, whoever made it, and is left
 * alone. Calling this twice is the same as calling it once.
 */
// An empty box is the only thing that means nobody chose. The cascade turns
// it into the theme's default at render time.
function isUnset(component: string | undefined): boolean {
  return component === undefined || component === '';
}

export function seedComponentBindings(diagram: Diagram, stylesheet: Stylesheet, theme: Theme | undefined): Stylesheet {
  if (theme === undefined) {
    return stylesheet;
  }

  const graph = diagram.graph;
  const nodes = { ...stylesheet.nodes };
  const edges = { ...stylesheet.edges };
  const groups = { ...stylesheet.groups };
  const annotations = { ...stylesheet.annotations };

  if (graph !== undefined) {
    const nodeNames = theme.nodeComponents.map((component) => component.name);
    const nodeDefault = theme.defaultNodeComponent;
    if (nodeDefault !== undefined && nodeDefault !== '') {
      for (const id of Object.keys(graph.nodes)) {
        const existing = nodes[id];
        const derived = deriveComponent(graph.nodes[id].tags['kind'], nodeNames, nodeDefault);
        if (derived !== undefined && derived !== nodeDefault && isUnset(existing?.component)) {
          nodes[id] = create(NodeStyleEntrySchema, { ...existing, component: derived });
        }
      }
    }

    const edgeNames = theme.edgeComponents.map((component) => component.name);
    const edgeDefault = theme.defaultEdgeComponent;
    if (edgeDefault !== undefined && edgeDefault !== '') {
      for (const id of Object.keys(graph.edges)) {
        const existing = edges[id];
        const derived = deriveComponent(graph.edges[id].tags['kind'], edgeNames, edgeDefault);
        if (derived !== undefined && derived !== edgeDefault && isUnset(existing?.component)) {
          edges[id] = create(EdgeStyleEntrySchema, { ...existing, component: derived });
        }
      }
    }

    const groupNames = theme.groupComponents.map((component) => component.name);
    const groupDefault = theme.defaultGroupComponent;
    if (groupDefault !== undefined && groupDefault !== '') {
      for (const id of Object.keys(graph.groups)) {
        const existing = groups[id];
        const derived = deriveComponent(graph.groups[id].tags['kind'], groupNames, groupDefault);
        if (derived !== undefined && derived !== groupDefault && isUnset(existing?.component)) {
          groups[id] = create(GroupStyleEntrySchema, { ...existing, component: derived });
        }
      }
    }
  }

  const annotationNames = theme.annotationComponents.map((component) => component.name);
  const annotationDefault = theme.defaultAnnotationComponent;
  if (annotationDefault !== undefined && annotationDefault !== '') {
    for (const id of Object.keys(annotations)) {
      const existing = annotations[id];
      const derived = deriveComponent(existing.tags['kind'], annotationNames, annotationDefault);
      if (derived !== undefined && derived !== annotationDefault && isUnset(existing.component)) {
        annotations[id] = create(AnnotationEntrySchema, { ...existing, component: derived });
      }
    }
  }

  return create(StylesheetSchema, { ...stylesheet, nodes, edges, groups, annotations });
}
