// SPDX-License-Identifier: AGPL-3.0-or-later

import ELK from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import { Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { EdgeSection } from '../edge_section';
import { LaidOutAnnotation } from '../laid_out_annotation';
import { LaidOutDiagram } from '../laid_out_diagram';
import { LaidOutEdge } from '../laid_out_edge';
import { LaidOutGroup } from '../laid_out_group';
import { LaidOutNode } from '../laid_out_node';
import { LayoutError } from '../layout_error';
import { ResolvedDiagram } from '../../resolver/resolved_diagram';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';

export interface LayoutAdapter {
  runLayout(diagram: ResolvedDiagram): Promise<Result<LaidOutDiagram, LayoutError>>;
}

// elkjs's default in-process "fake worker" fallback (elk-worker.min.js, GWT-compiled)
// does not evaluate correctly under Bun's CJS interop — it comes back with an empty
// module and never settles. Route through a real worker thread via the `web-worker`
// package instead, per elkjs's documented Node worker path.
const require = createRequire(import.meta.url);
const elk = new ELK({
  workerUrl: require.resolve('elkjs/lib/elk-worker.min.js'),
});

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 40;

function vec2(x: number, y: number) {
  return create(Vec2Schema, { x, y });
}

export class ElkAdapterImpl implements LayoutAdapter {
  async runLayout(diagram: ResolvedDiagram): Promise<Result<LaidOutDiagram, LayoutError>> {
    try {
      // Build ELK compound nodes for non-superNode groups; leaf nodes for superNodes
      const groupElkNodes: Record<string, any> = {};
      for (const group of diagram.groups) {
        groupElkNodes[group.id] = group.isSuperNode
          ? {
              id: group.id,
              width: group.layout?.size?.x ?? DEFAULT_WIDTH,
              height: group.layout?.size?.y ?? DEFAULT_HEIGHT,
            }
          : {
              id: group.id,
              width: group.layout?.size?.x ?? DEFAULT_WIDTH,
              height: group.layout?.size?.y ?? DEFAULT_HEIGHT,
              children: [],
              edges: [],
            };
      }

      const rootChildren: any[] = [];

      for (const group of diagram.groups) {
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

      for (const node of diagram.nodes) {
        const elkNode = {
          id: node.id,
          width: node.layout?.size?.x ?? DEFAULT_WIDTH,
          height: node.layout?.size?.y ?? DEFAULT_HEIGHT,
        };
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

      const elkGraph = {
        id: 'root',
        layoutOptions: { 'org.eclipse.elk.algorithm': 'org.eclipse.elk.layered' },
        children: rootChildren,
        edges: diagram.edges.map(edge => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
      };

      const result = await elk.layout(elkGraph);

      const nodePositions: Record<string, { x: number; y: number; w: number; h: number }> = {};
      const edgeSectionsRaw: Record<string, any[]> = {};

      function walkElkNode(elkNode: any): void {
        if (elkNode.id !== 'root') {
          nodePositions[elkNode.id] = {
            x: elkNode.x ?? 0,
            y: elkNode.y ?? 0,
            w: elkNode.width ?? DEFAULT_WIDTH,
            h: elkNode.height ?? DEFAULT_HEIGHT,
          };
        }
        const elkEdges: any[] = elkNode.edges ?? [];
        for (const edge of elkEdges) {
          edgeSectionsRaw[edge.id] = edge.sections ?? [];
        }
        const elkChildren: any[] = elkNode.children ?? [];
        for (const child of elkChildren) {
          walkElkNode(child);
        }
      }

      walkElkNode(result);

      const nodes = diagram.nodes.map(node => {
        const pos = nodePositions[node.id] ?? { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
        return Object.assign(new LaidOutNode(), {
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

      const edges = diagram.edges.map(edge => {
        const rawSections: any[] = edgeSectionsRaw[edge.id] ?? [];
        const sections = rawSections.map(s =>
          Object.assign(new EdgeSection(), {
            startPoint: vec2((s.startPoint as any)?.x ?? 0, (s.startPoint as any)?.y ?? 0),
            bendPoints: ((s.bendPoints as any[]) ?? []).map((bp: any) => vec2(bp.x ?? 0, bp.y ?? 0)),
            endPoint: vec2((s.endPoint as any)?.x ?? 0, (s.endPoint as any)?.y ?? 0),
          })
        );
        return Object.assign(new LaidOutEdge(), {
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

      const groups = diagram.groups.map(group => {
        const pos = nodePositions[group.id] ?? { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
        return Object.assign(new LaidOutGroup(), {
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

      // Annotations bypass ELK — always explicitly positioned
      const annotations = diagram.annotations.map(ann =>
        Object.assign(new LaidOutAnnotation(), {
          id: ann.id,
          position: ann.layout?.position ?? vec2(0, 0),
          shape: ann.shape,
          typography: ann.typography,
          callout: ann.callout,
          layout: ann.layout,
        })
      );

      return Ok(Object.assign(new LaidOutDiagram(), {
        id: diagram.id,
        nodes,
        edges,
        groups,
        annotations,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return Err(Object.assign(new LayoutError(), { message }));
    }
  }
}
