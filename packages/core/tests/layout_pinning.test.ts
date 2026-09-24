// SPDX-License-Identifier: MPL-2.0
//
// HAND-MAINTAINED. These three cases began life as `archegraph testgen`
// output, were wrong, and were rewritten against the actual design. They live
// here and NOT in tests/testgen.test.ts because that filename is what the next
// `archegraph testgen` run writes to -- it overwrites without asking, and its
// own header says not to hand-edit it. A repair committed there is a repair
// waiting to be silently reverted.
//
// What they originally got wrong, and what they check now:
//
//   Two of them modelled the mixed pinned/unpinned path as "pinned positions
//   handed to ELK as fixed hints". That is the opposite of the design.
//   layout_engine.spec.textproto says "ELK is not consulted for placement in
//   this path at all", and the code agrees: three branches, and runLayout is
//   reached only when NOTHING is pinned.
//
//     fully pinned   -> layoutFromPins, no adapter call
//     some pinned    -> seedPositions, then layoutFromPins; NOT runLayout
//     none pinned    -> runLayout
//
//   The third asserted that a root-level positioned node leaves the root
//   graph's elk `fixed` option unset. layout_adapter sets it deliberately --
//   the root graph plays the parent role for root-level children, mirroring
//   the compound-group case the same suite already covers.
//
// The root cause of the first two was a cross-file ambiguity in our own spec,
// not a codegen defect: layout_adapter's doc described a fixed-position
// instruction handed to ELK (true, about seedPositions' internal call) while
// layout_engine's said ELK is not consulted (also true, about layout). Neither
// file was ambiguous alone. See the ambiguity-review brief in
// .claude/skills/archegraph-spec-workflow/SKILL.md.

import { describe, expect, spyOn, test } from 'bun:test';

import { create } from '@bufbuild/protobuf';
import {
  AnnotationLayoutSchema, CanvasStyleSchema, EdgeLayoutSchema, EdgePathPosition, EdgeRouting,
  Glyph1DSchema, Glyph2DSchema, GroupLayoutSchema, NodeLayoutSchema,
  TypographySchema, Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import * as edgeRouter from '../src/layout/edge_router';
import * as fontMetrics from '../src/text/font_metrics';
import { ResolvedAnnotation } from '../src/resolver/resolved_annotation';
import { ResolvedDiagram } from '../src/resolver/resolved_diagram';
import { ResolvedEdge } from '../src/resolver/resolved_edge';
import { ResolvedGroup } from '../src/resolver/resolved_group';
import { ResolvedNode } from '../src/resolver/resolved_node';
import { LaidOutDiagram } from '../src/layout/laid_out_diagram';
import { LaidOutNode } from '../src/layout/laid_out_node';
import { LayoutRequest } from '../src/layout/layout_request';
import { Ok } from '@archeglyph/proto/util/result';
import { ElkAdapterImpl, LayoutAdapter } from '../src/layout/layout_adapter/impl';
import { LayoutEngineImpl } from '../src/layout/layout_engine/impl';
import { init } from '@archeglyph/proto/util/init';

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item: T): [string, T] => [item.id, item]));

describe('layout pinning paths (repaired testgen cases)', () => {
    // WHEN: The root element itself (with no parent group) carries an explicit position; the root graph is the "parent" laying out that root-level sibling, so runLayout marks the root graph's own layoutOptions 'fixed' -- exactly the same propagation a compound group gets for a positioned child, just one level up
    // THEN: runLayout applies the position/option handling to the explicitly positioned root element AND marks the root graph's own layoutOptions with 'org.eclipse.elk.fixed', since the root graph plays the parent role for root-level children.
    test('root_element_with_explicit_position_marks_root_graph_fixed', async () => {
        const captured: { graph?: any } = {};
        const mockElk = { layout: async (g: any) => { captured.graph = g; return g; } } as any;
        const node = init(new ResolvedNode(), {
          id: 'root_node',
          layout: create(NodeLayoutSchema, { position: create(Vec2Schema, { x: 3, y: 4 }) }),
        });
        const diagram = init(new ResolvedDiagram(), { id: 'd', nodes: byId([node]), edges: {}, groups: {}, annotations: {} });
        const adapter = new ElkAdapterImpl(mockElk);
        const result = await adapter.runLayout(diagram);
        expect(result.kind).toBe('ok');
        const elkNode = captured.graph.children.find((c: any) => c.id === 'root_node');
        expect(elkNode.x).toBe(3);
        expect(elkNode.y).toBe(4);
        expect(elkNode.layoutOptions?.['org.eclipse.elk.position']).toBeDefined();
        expect(captured.graph.layoutOptions?.['org.eclipse.elk.fixed']).toBe('true');
    });

    // WHEN: All nodes are pinned but at least one group lacks an explicit position; because groups also count toward full-pinning, the diagram is not fully pinned, so layout seeds the unpinned group's position via the adapter and finishes through layoutFromPins -- it never calls adapter.runLayout, because ELK is not consulted for placement once anything is pinned
    // THEN: Calls adapter.seedPositions (not adapter.runLayout) because the unpinned group counts against full-pinning even though all nodes are pinned, and the not-fully-pinned path never asks ELK to place anything.
    test('unpinned_group_forces_seed_path_not_run_layout', async () => {
        const vec = (x: number, y: number) => create(Vec2Schema, { x, y });
        const nodeA = init(new ResolvedNode(), {
          id: 'a', shape: {} as any, typography: {} as any,
          layout: create(NodeLayoutSchema, { position: vec(0, 0), size: vec(100, 40) }),
        });
        const group = init(new ResolvedGroup(), {
          id: 'g', shape: {} as any, typography: {} as any, isSuperNode: false, hiddenDescendantCount: 0,
        });
        const diagram = init(new ResolvedDiagram(), {
          id: 'd', canvas: {} as any, nodes: byId([nodeA]), groups: byId([group]), edges: {}, annotations: {},
        });
        const seedCalls: ResolvedDiagram[] = [];
        const runLayoutCalls: ResolvedDiagram[] = [];
        const spyAdapter: LayoutAdapter = {
          async seedPositions(d) {
            seedCalls.push(d);
            return new Map([['g', vec(0, 0)]]);
          },
          async runLayout(d) {
            runLayoutCalls.push(d);
            return Ok(init(new LaidOutDiagram(), { id: d.id, canvas: d.canvas, nodes: {}, edges: {}, groups: {}, annotations: {} }));
          },
        };
        const engine = new LayoutEngineImpl(spyAdapter);
        const result = await engine.layout(init(new LayoutRequest(), { diagram }));

        expect(seedCalls.length).toBe(1);
        expect(runLayoutCalls.length).toBe(0);
        expect(result.kind).toBe('ok');
    });

    // WHEN: In the not-fully-pinned path, every already-pinned element (nodes and groups) is handed to layout_adapter.seedPositions as the `pinned` map, so ELK is consulted only to arrange the newcomer beside the already-placed elements, never to place the pinned elements themselves -- and adapter.runLayout is never called, since ELK does not compute final placement on this path
    // THEN: Calls adapter.seedPositions with every already-pinned node and group in the `pinned` map, never calls adapter.runLayout, and the returned diagram carries the pinned positions unchanged plus the seeded newcomer position.
    test('pinned_elements_passed_as_fixed_hints', async () => {
        const vec = (x: number, y: number) => create(Vec2Schema, { x, y });
        const pinnedNode = init(new ResolvedNode(), {
          id: 'pinned', shape: {} as any, typography: {} as any,
          layout: create(NodeLayoutSchema, { position: vec(5, 6), size: vec(80, 30) }),
        });
        const pinnedGroup = init(new ResolvedGroup(), {
          id: 'pinnedGroup', shape: {} as any, typography: {} as any, isSuperNode: false, hiddenDescendantCount: 0,
          layout: create(GroupLayoutSchema, { position: vec(200, 200), size: vec(150, 150) }),
        });
        const newcomer = init(new ResolvedNode(), { id: 'newcomer', shape: {} as any, typography: {} as any });
        const diagram = init(new ResolvedDiagram(), {
          id: 'd', canvas: {} as any, nodes: byId([pinnedNode, newcomer]), groups: byId([pinnedGroup]), edges: {}, annotations: {},
        });
        const seedCalls: { diagram: ResolvedDiagram; pinned: Map<string, any> }[] = [];
        const runLayoutCalls: ResolvedDiagram[] = [];
        const spyAdapter: LayoutAdapter = {
          async seedPositions(d, pinned) {
            seedCalls.push({ diagram: d, pinned });
            return new Map([['newcomer', vec(50, 60)]]);
          },
          async runLayout(d) {
            runLayoutCalls.push(d);
            return Ok(init(new LaidOutDiagram(), { id: d.id, canvas: d.canvas, nodes: {}, edges: {}, groups: {}, annotations: {} }));
          },
        };
        const engine = new LayoutEngineImpl(spyAdapter);
        const result = await engine.layout(init(new LayoutRequest(), { diagram }));

        expect(seedCalls.length).toBe(1);
        expect(runLayoutCalls.length).toBe(0);
        const pinnedArg = seedCalls[0].pinned;
        expect(pinnedArg.get('pinned')?.x).toBeCloseTo(5);
        expect(pinnedArg.get('pinned')?.y).toBeCloseTo(6);
        expect(pinnedArg.get('pinnedGroup')?.x).toBeCloseTo(200);
        expect(pinnedArg.get('pinnedGroup')?.y).toBeCloseTo(200);
        expect(pinnedArg.has('newcomer')).toBe(false);
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
          const laidPinned = result.value.nodes['pinned']!;
          const laidNewcomer = result.value.nodes['newcomer']!;
          expect(laidPinned.position.x).toBeCloseTo(5);
          expect(laidPinned.position.y).toBeCloseTo(6);
          expect(laidNewcomer.position.x).toBeCloseTo(50);
          expect(laidNewcomer.position.y).toBeCloseTo(60);
        }
    });
});
