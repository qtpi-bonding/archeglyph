// SPDX-License-Identifier: MPL-2.0
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
import { inspectorModel } from '../inspector/model';
import { commitShape } from '../inspector/models/shape_commit';
import { commitGroup } from '../inspector/models/group_commit';
import { ElementStyleEntrySchema, GroupRenderMode, type Glyph2D } from '@archeglyph/proto/gen/style_pb';
import { STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

const EXAMPLES = fileURLToPath(new URL('../../../../examples/', import.meta.url));
const DIAGRAM_JSON = readFileSync(`${EXAMPLES}pipeline.diag.json`, 'utf8');
const STYLE_JSON = readFileSync(`${EXAMPLES}pipeline.style.json`, 'utf8');

const emptySheet = (): Stylesheet => create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION });
const shippedSheet = (): Stylesheet => fromJson(StylesheetSchema, STYLE_JSON);

/** One full load -> resolve -> layout -> render -> scene pass. */
async function sceneFor(
  sheet: Stylesheet,
  diagramJson: string = DIAGRAM_JSON,
): Promise<{ geometry: SceneGeometry; sheet: Stylesheet }> {
  const diagram = fromJson(DiagramSchema, diagramJson);
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
      expect(sheet.elements[node.id]?.layout?.position).toBeDefined();
    }
  });

  test('on an already-pinned diagram the edit touches only the dragged node', async () => {
    const first = await sceneFor(shippedSheet());
    const before = positions(first.geometry);

    const edit = dragNode('load', { x: 200, y: 100 }, first.geometry, first.sheet)!;
    // Nothing to materialize: the shipped style file already pins everything.
    expect(edit.elementChanges.map((change) => change.elementId)).toEqual(['load']);

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

// ---------------------------------------------------------------------------
// A closed container is drawn as a block. These run the editor's edits through
// the real pipeline, because the defect was invisible to everything short of
// it: the edit was written to fields the renderer no longer reads.
// ---------------------------------------------------------------------------

const CONTAINER_JSON = JSON.stringify({
  schemaVersion: 2,
  id: 'closed',
  graph: {
    edges: { x__P: { source: 'x', target: 'P' } },
    elements: {
      P: { label: [{ locale: 'en', source: 'P' }] },
      c1: { label: [{ locale: 'en', source: 'c1' }], parent: 'P' },
      c2: { label: [{ locale: 'en', source: 'c2' }], parent: 'P' },
      x: { label: [{ locale: 'en', source: 'x' }] },
    },
  },
});

const closedSheet = (): Stylesheet => create(StylesheetSchema, {
  schemaVersion: STYLE_SCHEMA_VERSION,
  elements: { P: create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.CLOSED }) },
});

const fillOf = (glyph: Glyph2D): string | undefined =>
  glyph.fill?.paint.case === 'color' ? glyph.fill.paint.value.value : undefined;

describe('a closed container takes its edits through the block fields', () => {
  test('the scene lists the closed container as a group drawn as a block', async () => {
    const { geometry } = await sceneFor(closedSheet(), CONTAINER_JSON);

    expect(geometry.diagram.groups['P']?.isSuperNode).toBe(true);
    expect(geometry.diagram.nodes['c1']).toBeUndefined();
  });

  test('dragging it moves it, and writes layout rather than boxLayout', async () => {
    const first = await sceneFor(closedSheet(), CONTAINER_JSON);
    const before = first.geometry.diagram.groups['P'].position;
    const session: MoveSession = { refs: [{ id: 'P', kind: 'group' }], origin: { x: 0, y: 0 } };

    const edit = moveCommit(session, first.geometry, first.sheet, { x: 200, y: 100 })!;
    const sheet = applyStyleEditToStylesheet(first.sheet, edit);
    const second = await sceneFor(sheet, CONTAINER_JSON);

    expect(sheet.elements['P'].boxLayout).toBeUndefined();
    expect(second.geometry.diagram.groups['P'].position).toMatchObject({ x: before.x + 200, y: before.y + 100 });
  });

  test('resizing it resizes it', async () => {
    const first = await sceneFor(closedSheet(), CONTAINER_JSON);
    const size = first.geometry.diagram.groups['P'].size;
    const session: ResizeSession = { ref: { id: 'P', kind: 'group' }, handle: 'se', origin: { x: 0, y: 0 } };

    const edit = resizeCommit(session, first.geometry, first.sheet, { x: 60, y: 30 }, false)!;
    const second = await sceneFor(applyStyleEditToStylesheet(first.sheet, edit), CONTAINER_JSON);

    expect(second.geometry.diagram.groups['P'].size).toMatchObject({ x: size.x + 60, y: size.y + 30 });
  });

  test('a colour set while closed shows now, disappears when opened, and returns when closed again', async () => {
    const first = await sceneFor(closedSheet(), CONTAINER_JSON);
    const closedModel = inspectorModel([{ kind: 'group', id: 'P' }], first.geometry)!;
    const coloured = applyStyleEditToStylesheet(
      first.sheet,
      commitShape(closedModel, first.sheet, 'fill', '#ff0000')!,
    );
    expect(fillOf((await sceneFor(coloured, CONTAINER_JSON)).geometry.diagram.groups['P'].shape)).toBe('#ff0000');

    const openEdit = commitGroup(closedModel, coloured, 'renderMode', 'open')!;
    const opened = await sceneFor(applyStyleEditToStylesheet(coloured, openEdit), CONTAINER_JSON);
    expect(opened.geometry.diagram.groups['P'].isSuperNode).toBe(false);
    expect(fillOf(opened.geometry.diagram.groups['P'].shape)).not.toBe('#ff0000');

    const reclosed = applyStyleEditToStylesheet(
      applyStyleEditToStylesheet(coloured, openEdit),
      commitGroup(closedModel, applyStyleEditToStylesheet(coloured, openEdit), 'renderMode', 'closed')!,
    );
    expect(fillOf((await sceneFor(reclosed, CONTAINER_JSON)).geometry.diagram.groups['P'].shape)).toBe('#ff0000');
  });

  test('a box colour set while open does not change the closed block', async () => {
    const openSheet = create(StylesheetSchema, {
      schemaVersion: STYLE_SCHEMA_VERSION,
      elements: { P: create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.OPEN }) },
    });
    const open = await sceneFor(openSheet, CONTAINER_JSON);
    const boxModel = inspectorModel([{ kind: 'group', id: 'P' }], open.geometry)!;
    const boxed = applyStyleEditToStylesheet(open.sheet, commitShape(boxModel, open.sheet, 'fill', '#00ff00')!);
    expect(fillOf((await sceneFor(boxed, CONTAINER_JSON)).geometry.diagram.groups['P'].shape)).toBe('#00ff00');

    const closedAgain = applyStyleEditToStylesheet(boxed, commitGroup(boxModel, boxed, 'renderMode', 'closed')!);
    const closed = await sceneFor(closedAgain, CONTAINER_JSON);
    expect(closed.geometry.diagram.groups['P'].isSuperNode).toBe(true);
    expect(fillOf(closed.geometry.diagram.groups['P'].shape)).not.toBe('#00ff00');
  });
});
