// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Edit -> re-layout round trips, over the real example diagram.
//
// These exist because of a bug the rest of the suite structurally could not
// see: every gesture machine, edit builder and layout function passed its own
// unit tests while moving one node rearranged the whole diagram. Nothing was
// individually wrong. What was missing was a step BETWEEN them -- pin-on-touch
// -- and only a test that runs the whole loop can miss a step.
//
// So the shape here is deliberately end to end and deliberately free of UI:
//
//   lay out -> build an edit the way a gesture does -> apply -> lay out again
//
// and then assert on coordinates. No component, no DOM, no reactivity.

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { create } from '@bufbuild/protobuf';
import { StylesheetSchema, type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';
import { layoutPipeline } from '@archeglyph/core/pipeline';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createNodeElk } from '@archeglyph/core/layout/elk_host_node';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';

import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { moveCommit, resizeCommit, type MoveSession, type ResizeSession } from '../gestures/drag_machines';
import { buildSceneGeometry, type SceneGeometry } from './scene';

const EXAMPLES = fileURLToPath(new URL('../../../../examples/', import.meta.url));
const DIAGRAM_JSON = readFileSync(`${EXAMPLES}pipeline.diag.json`, 'utf8');
const STYLE_JSON = readFileSync(`${EXAMPLES}pipeline.style.json`, 'utf8');

const emptySheet = (): Stylesheet => create(StylesheetSchema, { schemaVersion: 1 });
const shippedSheet = (): Stylesheet => fromJson(StylesheetSchema, STYLE_JSON);

/** One full load -> resolve -> layout -> render -> scene pass. */
async function sceneFor(sheet: Stylesheet): Promise<{ geometry: SceneGeometry; sheet: Stylesheet }> {
  const diagram = fromJson(DiagramSchema, DIAGRAM_JSON);
  const theme = blueprintTheme();
  // The same seeding step the CLI ops and the editor shell perform on load.
  const seeded = seedComponentBindings(diagram, sheet, theme);
  const result = await layoutPipeline(
    diagram,
    seeded,
    new Map([['default', theme]]),
    new LayoutEngineImpl(new ElkAdapterImpl(createNodeElk())),
  );
  if (result.kind === 'err') {
    throw new Error(`layout failed at stage "${result.error.stage}"`);
  }
  const rendered = new SvgRendererImpl().render(result.value);
  if (rendered.kind === 'err') {
    throw new Error(`render failed: ${rendered.error.message}`);
  }
  return { geometry: buildSceneGeometry(result.value, rendered.value), sheet: seeded };
}

/** Absolute laid-out position of every node, by id. */
function positions(geometry: SceneGeometry): Record<string, { x: number; y: number }> {
  return Object.fromEntries(
    Object.values(geometry.diagram.nodes).map((node) => [node.id, { x: node.position.x, y: node.position.y }]),
  );
}

function dragNode(id: string, by: { x: number; y: number }, geometry: SceneGeometry, sheet: Stylesheet) {
  const session: MoveSession = { refs: [{ id, kind: 'node' }], origin: { x: 0, y: 0 } };
  return moveCommit(session, geometry, sheet, by);
}

describe('a drag survives the next layout pass', () => {
  test('on a diagram ELK is still arranging, only the dragged node moves', async () => {
    // The regression: with no positions in the file the layout engine asks ELK
    // for the whole arrangement, but as soon as ONE element has a position it
    // stops asking and seeds everything else beside the pinned one. Without
    // pin-on-touch the first drag therefore rearranged the entire diagram.
    const first = await sceneFor(emptySheet());
    const before = positions(first.geometry);

    const edit = dragNode('load', { x: 200, y: 100 }, first.geometry, first.sheet);
    expect(edit).toBeDefined();

    const second = await sceneFor(applyStyleEditToStylesheet(first.sheet, edit!));
    const after = positions(second.geometry);

    expect(after['load']).toEqual({ x: before['load'].x + 200, y: before['load'].y + 100 });
    for (const id of Object.keys(before)) {
      if (id !== 'load') {
        expect(after[id]).toEqual(before[id]);
      }
    }
  });

  test('the first drag writes a position for every node, not just the dragged one', async () => {
    const first = await sceneFor(emptySheet());
    const edit = dragNode('load', { x: 10, y: 10 }, first.geometry, first.sheet)!;
    const sheet = applyStyleEditToStylesheet(first.sheet, edit);

    for (const node of Object.values(first.geometry.diagram.nodes)) {
      expect(sheet.nodes[node.id]?.layout?.position).toBeDefined();
    }
  });

  test('on an already-pinned diagram the edit touches only the dragged node', async () => {
    const first = await sceneFor(shippedSheet());
    const before = positions(first.geometry);

    const edit = dragNode('load', { x: 200, y: 100 }, first.geometry, first.sheet)!;
    // Nothing to materialize: the shipped style file already pins everything.
    expect(edit.nodeChanges.map((change) => change.nodeId)).toEqual(['load']);

    const after = positions((await sceneFor(applyStyleEditToStylesheet(first.sheet, edit))).geometry);
    expect(after['load']).toEqual({ x: before['load'].x + 200, y: before['load'].y + 100 });
  });

  test('two drags in a row accumulate instead of fighting each other', async () => {
    const first = await sceneFor(emptySheet());
    const before = positions(first.geometry);

    const once = applyStyleEditToStylesheet(
      first.sheet,
      dragNode('load', { x: 50, y: 0 }, first.geometry, first.sheet)!,
    );
    const second = await sceneFor(once);
    const twice = applyStyleEditToStylesheet(
      once,
      dragNode('load', { x: 0, y: 40 }, second.geometry, once)!,
    );

    const after = positions((await sceneFor(twice)).geometry);
    expect(after['load']).toEqual({ x: before['load'].x + 50, y: before['load'].y + 40 });
  });

  test('a resize survives the next layout pass too', async () => {
    const first = await sceneFor(emptySheet());
    const bounds = first.geometry.byKey['node:load'].bounds;
    const session: ResizeSession = {
      ref: { id: 'load', kind: 'node' },
      handle: 'se',
      origin: { x: bounds.maxX, y: bounds.maxY },
    };
    const edit = resizeCommit(
      session,
      first.geometry,
      first.sheet,
      { x: bounds.maxX + 30, y: bounds.maxY + 20 },
      false,
    )!;

    const after = await sceneFor(applyStyleEditToStylesheet(first.sheet, edit));
    const node = after.geometry.diagram.nodes['load'];
    expect(node.size.x).toBeCloseTo(bounds.maxX - bounds.minX + 30, 5);
    expect(node.size.y).toBeCloseTo(bounds.maxY - bounds.minY + 20, 5);
  });
});
