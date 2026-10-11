// SPDX-License-Identifier: MPL-2.0
// With a base attached the scene lays out the union, so an element only the
// base has still reaches layout.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { createRoot, createSignal } from 'solid-js';
import { DiagramSchema, ElementSchema, GraphSchema } from '@archeglyph/proto/gen/content_pb';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import type { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import type { LayoutRequest } from '@archeglyph/core/layout/layout_request';
import { Err } from '@archeglyph/proto/util/result';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { getBundledTheme } from '@archeglyph/themes';

import { createEditorState } from '../state/create_editor_state';
import { createScene } from '../scene/scene';
import { createDiffState } from './diff_state';

const theme = getBundledTheme('blueprint');

function diagramOf(...ids: string[]) {
  return create(DiagramSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    id: 'd',
    graph: create(GraphSchema, {
      elements: Object.fromEntries(ids.map((id) => [id, create(ElementSchema, {})])),
    }),
  });
}

function spyEngine(): { engine: LayoutEngine; seen: () => LayoutRequest | undefined } {
  let captured: LayoutRequest | undefined;
  return {
    seen: () => captured,
    engine: {
      layout: async (request: LayoutRequest) => {
        captured = request;
        return Err({ stage: 'layout', message: 'stub' } as never);
      },
    } as LayoutEngine,
  };
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('a base attached to the editor renders as a diff', () => {
  test('a node only the base has still reaches layout', async () => {
    const { engine, seen } = spyEngine();

    await createRoot(async (dispose) => {
      const target = diagramOf('kept');
      const state = createEditorState(target, create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }));
      const diff = createDiffState(() => state.diagram(), () => 'HEAD');

      createScene(state, () => new Map([['default', theme]]), engine, diff.delta);
      await settle();

      // `dropped` is base-only, so the Delta records it DELETED.
      diff.attach(diagramOf('kept', 'dropped'), 'main', false);
      await settle();

      const request = seen();
      expect(request).toBeDefined();
      expect(Object.keys(request!.diagram.nodes).sort()).toEqual(['dropped', 'kept']);

      dispose();
    });
  });

  test('gating the delta off drops the union back to the target', async () => {
    const { engine, seen } = spyEngine();

    await createRoot(async (dispose) => {
      const target = diagramOf('kept');
      const state = createEditorState(target, create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }));
      const diff = createDiffState(() => state.diagram(), () => 'HEAD');
      const [on, setOn] = createSignal<boolean>(true);

      createScene(
        state,
        () => new Map([['default', theme]]),
        engine,
        () => (on() ? diff.delta() : undefined),
      );
      diff.attach(diagramOf('kept', 'dropped'), 'main', false);
      await settle();
      expect(Object.keys(seen()!.diagram.nodes).sort()).toEqual(['dropped', 'kept']);

      setOn(false);
      await settle();
      expect(Object.keys(seen()!.diagram.nodes)).toEqual(['kept']);

      setOn(true);
      await settle();
      expect(Object.keys(seen()!.diagram.nodes).sort()).toEqual(['dropped', 'kept']);

      dispose();
    });
  });

  test('with the diff off, the stand-in is what reaches layout', async () => {
    const { engine, seen } = spyEngine();

    await createRoot(async (dispose) => {
      const state = createEditorState(diagramOf('inSession'), create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }));
      const diff = createDiffState(() => state.diagram(), () => 'open');
      const [showOther, setShowOther] = createSignal<boolean>(false);

      diff.attach(diagramOf('inAttached'), 'attached', false);
      createScene(
        state,
        () => new Map([['default', theme]]),
        engine,
        () => undefined,
        () => (showOther() ? diff.baseStandIn() : undefined),
      );
      await settle();
      expect(Object.keys(seen()!.diagram.nodes)).toEqual(['inSession']);

      setShowOther(true);
      await settle();
      expect(Object.keys(seen()!.diagram.nodes)).toEqual(['inAttached']);

      setShowOther(false);
      await settle();
      expect(Object.keys(seen()!.diagram.nodes)).toEqual(['inSession']);

      dispose();
    });
  });
});
