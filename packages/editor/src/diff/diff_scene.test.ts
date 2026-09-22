// SPDX-License-Identifier: AGPL-3.0-or-later
// With a base attached the scene lays out the union, so an element only the
// base has still reaches layout.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { createRoot } from 'solid-js';
import { DiagramSchema, GraphSchema, NodeSchema } from '@archeglyph/proto/gen/content_pb';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import type { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import type { LayoutRequest } from '@archeglyph/core/layout/layout_request';
import { Err } from '@archeglyph/proto/util/result';
import { getBundledTheme } from '@archeglyph/themes';

import { createEditorState } from '../state/create_editor_state';
import { createScene } from '../scene/scene';
import { createDiffState } from './diff_state';

const theme = getBundledTheme('blueprint');

function diagramOf(...ids: string[]) {
  return create(DiagramSchema, {
    schemaVersion: 1,
    id: 'd',
    graph: create(GraphSchema, {
      nodes: Object.fromEntries(ids.map((id) => [id, create(NodeSchema, {})])),
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
      const state = createEditorState(target, create(StylesheetSchema, { schemaVersion: 1 }));
      const diff = createDiffState(() => state.diagram(), 'HEAD');

      createScene(state, () => new Map([['default', theme]]), engine, diff.delta);
      await settle();

      // `dropped` is base-only, so the Delta records it DELETED.
      diff.setBase(diagramOf('kept', 'dropped'), 'main');
      await settle();

      const request = seen();
      expect(request).toBeDefined();
      expect(Object.keys(request!.diagram.nodes).sort()).toEqual(['dropped', 'kept']);

      dispose();
    });
  });
});
