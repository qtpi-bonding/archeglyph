// SPDX-License-Identifier: AGPL-3.0-or-later
// An element created after load has no component, so seeding only at load
// leaves it with no shape or typography.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { createRoot } from 'solid-js';
import { DiagramSchema, GraphSchema } from '@archeglyph/proto/gen/content_pb';
import { StylesheetSchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import type { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import type { LayoutRequest } from '@archeglyph/core/layout/layout_request';
import { Err } from '@archeglyph/proto/util/result';
import { getBundledTheme } from '@archeglyph/themes';

import { addAnnotationEdit } from '../state/edits/annotation';
import { createEditorState } from '../state/create_editor_state';
import { createScene } from './scene';

const theme = getBundledTheme('blueprint');
const diagram = create(DiagramSchema, { schemaVersion: 1, graph: create(GraphSchema, {}) });

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
  // One macrotask is enough for createResource's fetcher to run and resolve.
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('an annotation added mid-session reaches layout with a resolved style', () => {
  test('its fill and text colour are present in the resolved diagram', async () => {
    const { engine, seen } = spyEngine();

    await createRoot(async (dispose) => {
      const state = createEditorState(diagram, create(StylesheetSchema, { schemaVersion: 1 }));
      createScene(state, () => theme, engine);
      await settle();

      state.applyStyleEdit(
        addAnnotationEdit(state.stylesheet(), 'note', create(Vec2Schema, { x: 0, y: 0 }), 'New annotation'),
      );
      await settle();

      const request = seen();
      expect(request).toBeDefined();

      const annotation = request!.diagram.annotations['note'];
      expect(annotation).toBeDefined();
      // Not the fill: a themed annotation is outline-only.
      expect(annotation!.shape?.stroke?.paint?.case).toBe('color');
      expect(annotation!.typography?.color?.value).toBeTruthy();

      dispose();
    });
  });
});
