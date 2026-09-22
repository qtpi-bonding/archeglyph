// SPDX-License-Identifier: AGPL-3.0-or-later

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../default_size';

import type { ELK } from 'elkjs';
import { create } from '@bufbuild/protobuf';
import { type Vec2, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { EdgeSection } from '../edge_section';
import { LaidOutAnnotation } from '../laid_out_annotation';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LaidOutEdge } from '../laid_out_edge';
import { LaidOutGroup } from '../laid_out_group';
import { LaidOutNode } from '../laid_out_node';
import { LayoutError } from '../layout_error';
import { ResolvedDiagram } from '../../resolver/resolved_diagram';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';
import { measureLabel } from '../../text/font_metrics';
import { seedNewcomers } from '../seed_newcomers';
import { init } from '@archeglyph/proto/util/init';

export interface LayoutAdapter {
  /**
   * Positions for the elements that have none, given the ones that do.
   *
   * Lives on the adapter rather than the engine because seeding needs an ELK
   * instance and the adapter is where ELK ownership was deliberately put
   * (wave 1, host-injected ELK). The engine stays free of any layout-library
   * dependency, which is the point of this boundary.
   */
  seedPositions(diagram: ResolvedDiagram, pinned: Map<string, Vec2>): Promise<Map<string, Vec2>>;
  runLayout(diagram: ResolvedDiagram): Promise<Result<LaidOutDiagram, LayoutError>>;
}


interface ElkPoint {
  x: number;
  y: number;
}

interface ElkSection {
  id: string;
  startPoint: ElkPoint;
  bendPoints?: ElkPoint[];
  endPoint: ElkPoint;
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
  sections?: ElkSection[];
}

interface ElkNode {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  layoutOptions?: Record<string, string>;
  children?: ElkNode[];
  edges?: ElkEdge[];
}

interface ElkGraph extends ElkNode {
  layoutOptions: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
}

interface NodePosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

function vec2(x: number, y: number): Vec2 {
  return create(Vec2Schema, { x, y });
}

export class ElkAdapterImpl implements LayoutAdapter {
  async seedPositions(diagram: ResolvedDiagram, pinned: Map<string, Vec2>): Promise<Map<string, Vec2>> {
    return seedNewcomers(diagram, pinned, this.elk);
  }

  constructor(private readonly elk: ELK) {}

  async runLayout(diagram: ResolvedDiagram): Promise<Result<LaidOutDiagram, LayoutError>> {
    try {
      // Build ELK compound nodes for non-superNode groups; leaf nodes for superNodes
      const groupElkNodes: Record<string, ElkNode> = {};
      for (const group of Object.values(diagram.groups)) {
        const position = group.layout?.position;
        groupElkNodes[group.id] = group.isSuperNode
          ? {
              id: group.id,
              width: group.layout?.size?.x ?? DEFAULT_WIDTH,
              height: group.layout?.size?.y ?? DEFAULT_HEIGHT,
              ...(position !== undefined
                ? {
                    x: position.x,
                    y: position.y,
                    layoutOptions: { 'org.eclipse.elk.position': `(${position.x},${position.y})` },
                  }
                : {}),
            }
          : {
              id: group.id,
              width: group.layout?.size?.x ?? DEFAULT_WIDTH,
              height: group.layout?.size?.y ?? DEFAULT_HEIGHT,
              children: [],
              edges: [],
              ...(position !== undefined
                ? {
                    x: position.x,
                    y: position.y,
                    layoutOptions: { 'org.eclipse.elk.position': `(${position.x},${position.y})` },
                  }
                : {}),
            };
        if (position !== undefined) {
          groupElkNodes[group.id].x = position.x;
          groupElkNodes[group.id].y = position.y;
          groupElkNodes[group.id].layoutOptions = { 'org.eclipse.elk.position': `(${position.x},${position.y})` };
        }
      }

      const rootChildren: ElkNode[] = [];

      for (const group of Object.values(diagram.groups)) {
        const elkGroup = groupElkNodes[group.id];
        if (group.parentGroup) {
          const parent = groupElkNodes[group.parentGroup];
          if (parent?.children) {
            parent.children.push(elkGroup);
          } else {
            rootChildren.push(elkGroup);
          }
        } else {
          rootChildren.push(elkGroup);
        }
      }

      for (const node of Object.values(diagram.nodes)) {
        const position = node.layout?.position;
        const elkNode: ElkNode = {
          id: node.id,
          width: node.layout?.size?.x ?? DEFAULT_WIDTH,
          height: node.layout?.size?.y ?? DEFAULT_HEIGHT,
          ...(position !== undefined
            ? {
                x: position.x,
                y: position.y,
                layoutOptions: { 'org.eclipse.elk.position': `(${position.x},${position.y})` },
              }
            : {}),
        };
        if (position !== undefined) {
          elkNode.x = position.x;
          elkNode.y = position.y;
          elkNode.layoutOptions = { 'org.eclipse.elk.position': `(${position.x},${position.y})` };
        }
        if (node.parentGroup) {
          const parent = groupElkNodes[node.parentGroup];
          if (parent?.children) {
            parent.children.push(elkNode);
          } else {
            rootChildren.push(elkNode);
          }
        } else {
          rootChildren.push(elkNode);
        }
      }

      // A fixed option belongs to the graph that lays out the siblings, not
      // to the pinned child itself.  Only direct children matter here; a
      // nested pinned node is handled by the compound graph containing it.
      for (const group of Object.values(diagram.groups)) {
        const elkGroup = groupElkNodes[group.id];
        const hasPositionedChild = Object.values(diagram.groups).some(child =>
          child.parentGroup === group.id && child.layout?.position !== undefined,
        ) || Object.values(diagram.nodes).some(child =>
          child.parentGroup === group.id && child.layout?.position !== undefined,
        );
        if (hasPositionedChild) {
          elkGroup.layoutOptions = {
            ...(elkGroup.layoutOptions ?? {}),
            'org.eclipse.elk.fixed': 'true',
          };
        }
        const requested = group.layout?.size;
        if (requested !== undefined) {
          elkGroup.layoutOptions = {
            ...(elkGroup.layoutOptions ?? {}),
            'org.eclipse.elk.nodeSize.constraints': 'MINIMUM_SIZE',
            'org.eclipse.elk.nodeSize.minimum': `(${requested.x},${requested.y})`,
          };
        }
      }

      const layoutOptions: Record<string, string> = {
        'org.eclipse.elk.algorithm': 'org.eclipse.elk.layered',
        // elk.layered ignores org.eclipse.elk.position outright unless it is
        // running interactively. Without this the pinned coordinates are
        // accepted, silently discarded, and the layout is computed as though
        // nothing were pinned -- which is what the override loop in
        // layout_engine was then papering over, and why a newcomer could be
        // placed exactly where a pinned node was about to be restored.
        'org.eclipse.elk.interactive': 'true',
        // Without this, elk.layered lays each group out as its own problem and
        // declines to route an edge whose endpoints sit at different depths —
        // it returns with an empty sections array, which the renderer emits as
        // d="". Every edge here is declared on the root graph, so any edge into
        // or out of a group is exactly that case.
        'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      };
      // Root children are laid out by the root graph itself.  As with a
      // compound group's layoutOptions above, fixed belongs to that parent
      // graph rather than to the pinned child.
      const hasPositionedRootChild = Object.values(diagram.groups).some(group =>
        group.parentGroup === undefined && group.layout?.position !== undefined,
      ) || Object.values(diagram.nodes).some(node =>
        node.parentGroup === undefined && node.layout?.position !== undefined,
      );
      if (hasPositionedRootChild) {
        layoutOptions['org.eclipse.elk.fixed'] = 'true';
      }
      if (diagram.canvas?.nodeSpacing !== undefined) {
        layoutOptions['org.eclipse.elk.spacing.nodeNode'] = String(diagram.canvas.nodeSpacing);
      }
      if (diagram.canvas?.edgeSpacing !== undefined) {
        layoutOptions['org.eclipse.elk.spacing.edgeNode'] = String(diagram.canvas.edgeSpacing);
      }
      if (diagram.canvas?.margin !== undefined) {
        const margin: string = String(diagram.canvas.margin);
        // ELK's padding option uses its named-side string representation.
        layoutOptions['org.eclipse.elk.padding'] = `[top=${margin},left=${margin},bottom=${margin},right=${margin}]`;
      }

      const elkGraph: ElkGraph = {
        id: 'root',
        layoutOptions,
        children: rootChildren,
        edges: Object.values(diagram.edges).map(edge => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
      };

      const result = await this.elk.layout(elkGraph);

      const nodePositions: Record<string, NodePosition> = {};
      const edgeSectionsRaw: Record<string, ElkSection[]> = {};
      const containerOrigin: Record<string, Vec2> = {};

      // Node and group positions stay parent-relative here on purpose —
      // layout_engine's absolutizePositions converts those, and its
      // position-override loops depend on receiving relative input, so doing
      // it in both places would double every offset. containerOrigin is a
      // side table for edges only; nothing downstream sees it.
      function walkElkNode(elkNode: ElkNode, origin: Vec2): void {
        if (elkNode.id !== 'root') {
          nodePositions[elkNode.id] = {
            x: elkNode.x ?? 0,
            y: elkNode.y ?? 0,
            w: elkNode.width ?? DEFAULT_WIDTH,
            h: elkNode.height ?? DEFAULT_HEIGHT,
          };
        }
        const absolute: Vec2 = vec2(origin.x + (elkNode.x ?? 0), origin.y + (elkNode.y ?? 0));
        containerOrigin[elkNode.id] = absolute;
        const elkEdges: ElkEdge[] = elkNode.edges ?? [];
        for (const edge of elkEdges) {
          // Depending on the ELK configuration an edge may be exposed both
          // on the graph that owns it and on a containing graph.  Keep a
          // useful section list if one has already been collected rather
          // than allowing a later, empty representation to erase it.
          const sections: ElkSection[] = edge.sections ?? [];
          const existing: ElkSection[] | undefined = edgeSectionsRaw[edge.id];
          if (sections.length > 0 || existing === undefined) {
            edgeSectionsRaw[edge.id] = sections;
          }
        }
        const elkChildren: ElkNode[] = elkNode.children ?? [];
        for (const child of elkChildren) {
          walkElkNode(child, absolute);
        }
      }

      walkElkNode(result, vec2(0, 0));

      // ELK reports an edge's geometry in the frame of the lowest common
      // ancestor of its endpoints, but it also exposes the same edge on more
      // than one graph -- so which container we happened to read it from says
      // nothing about which frame the numbers are in. Derive the ancestor
      // from the endpoints instead, which is what actually determines it.
      const parentOf: Record<string, string | undefined> = {};
      for (const node of Object.values(diagram.nodes)) {
        parentOf[node.id] = node.parentGroup;
      }
      for (const group of Object.values(diagram.groups)) {
        parentOf[group.id] = group.parentGroup;
      }

      function ancestry(id: string): string[] {
        const chain: string[] = [];
        let current: string | undefined = parentOf[id];
        // Guard against a cycle in a malformed parentGroup chain: the
        // visibility filter validates group acyclicity, but this walk must
        // not hang if it ever sees one.
        const seen = new Set<string>();
        while (current !== undefined && !seen.has(current)) {
          seen.add(current);
          chain.unshift(current);
          current = parentOf[current];
        }
        return chain;
      }

      function edgeOrigin(source: string, target: string): Vec2 {
        const a: string[] = ancestry(source);
        const b: string[] = ancestry(target);
        let common: string | undefined;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
          if (a[i] !== b[i]) { break; }
          common = a[i];
        }
        return common === undefined ? vec2(0, 0) : containerOrigin[common] ?? vec2(0, 0);
      }

      const nodes = Object.values(diagram.nodes).map(node => {
        const pos = nodePositions[node.id] ?? { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
        return init(new LaidOutNode(), {
          id: node.id,
          parentGroup: node.parentGroup,
          position: vec2(pos.x, pos.y),
          size: vec2(pos.w, pos.h),
          shape: node.shape,
          typography: node.typography,
          label: node.label,
          layout: node.layout,
        });
      });

      const edges = Object.values(diagram.edges).map(edge => {
        const origin: Vec2 = edgeOrigin(edge.source, edge.target);
        const point = (p: ElkPoint | undefined): Vec2 =>
          vec2(origin.x + (p?.x ?? 0), origin.y + (p?.y ?? 0));
        const sections = (edgeSectionsRaw[edge.id] ?? []).map(s =>
          init(new EdgeSection(), {
            startPoint: point(s.startPoint),
            bendPoints: (s.bendPoints ?? []).map(point),
            endPoint: point(s.endPoint),
          })
        );
        return init(new LaidOutEdge(), {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sections,
          connection: edge.connection,
          typography: edge.typography,
          label: edge.label,
          layout: edge.layout,
        });
      });

      const groups = Object.values(diagram.groups).map(group => {
        const pos = nodePositions[group.id] ?? { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
        return init(new LaidOutGroup(), {
          id: group.id,
          parentGroup: group.parentGroup,
          position: vec2(pos.x, pos.y),
          size: vec2(pos.w, pos.h),
          shape: group.shape,
          typography: group.typography,
          label: group.label,
          isSuperNode: group.isSuperNode,
          hiddenDescendantCount: group.hiddenDescendantCount,
          layout: group.layout,
        });
      });

      // Annotations bypass ELK — always explicitly positioned. An anchor is
      // copied for rendering only; it must not make the referenced element a
      // layout participant or otherwise affect ELK's result.
      const annotations = Object.values(diagram.annotations).map(ann => {
        const font: string = ann.typography.font ?? '';
        const fontSize: number = ann.typography.size ?? 16;
        let measuredWidth: number = 0;
        let measuredHeight: number = 0;
        for (const localizedContent of ann.content) {
          const measured = measureLabel(localizedContent.source, font, fontSize);
          measuredWidth = Math.max(measuredWidth, measured.x);
          measuredHeight = Math.max(measuredHeight, measured.y);
        }
        const size: Vec2 = ann.layout?.size ?? vec2(measuredWidth, measuredHeight);
        return init(new LaidOutAnnotation(), {
          id: ann.id,
          anchor: ann.anchor,
          position: ann.layout?.position ?? vec2(0, 0),
          size,
          shape: ann.shape,
          typography: ann.typography,
          callout: ann.callout,
          layout: ann.layout,
          content: ann.content,
        });
      });

      const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
        Object.fromEntries(items.map((item: T): [string, T] => [item.id, item]));

      return Ok(init(new LaidOutDiagram(), {
        id: diagram.id,
        canvas: diagram.canvas,
        nodes: byId(nodes),
        edges: byId(edges),
        groups: byId(groups),
        annotations: byId(annotations),
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return Err(init(new LayoutError(), { message }));
    }
  }
}
