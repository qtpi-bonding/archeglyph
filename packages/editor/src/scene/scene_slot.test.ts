// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { createRoot } from 'solid-js';
import { DiagramSchema, ElementSchema, GraphSchema } from '@archeglyph/proto/gen/content_pb';
import { StyleEditSchema, StylesheetSchema, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import type { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import type { LayoutRequest } from '@archeglyph/core/layout/layout_request';
import { Err } from '@archeglyph/proto/util/result';
import { getBundledTheme } from '@archeglyph/themes';
import { createEditorState } from '../state/create_editor_state';
import type { EditorState } from '../state/editor_state';
import { createScene } from './scene';
import { createSceneSlot } from './scene_slot';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

const theme = getBundledTheme('blueprint');

function stateOf(nodeId: string): EditorState {
  return createEditorState(
    create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: nodeId,
      graph: create(GraphSchema, { elements: { [nodeId]: create(ElementSchema, {}) } }),
    }),
    create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }),
  );
}

function engineSpy(): { engine: LayoutEngine; seen: () => string[] } {
  const ids: string[] = [];
  return {
    seen: (): string[] => ids,
    engine: {
      layout: async (request: LayoutRequest) => {
        ids.push(Object.keys(request.diagram.nodes).join(','));
        return Err({ stage: 'layout', message: 'stub' } as never);
      },
    } as LayoutEngine,
  };
}

function nudge(state: EditorState, nodeId: string): void {
  state.applyStyleEdit(create(StyleEditSchema, {
    schemaVersion: STYLE_SCHEMA_VERSION,
    id: `move-${nodeId}`,
    elementChanges: [{
      elementId: nodeId,
      changeType: 1,
      after: { layout: { position: create(Vec2Schema, { x: 1, y: 1 }) } },
    }],
    timestampMs: 0n,
    state: 0,
  }));
}

const settle = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

describe('a replaced scene stops recomputing', () => {
  test('editing the old document does not reach the layout engine', async () => {
    const { engine, seen } = engineSpy();

    await createRoot(async (disposeRoot) => {
      const slot = createSceneSlot();
      const first = stateOf('first');
      const second = stateOf('second');
      const themes = (): ReadonlyMap<string, () => void> => new Map([['default', theme]]) as never;

      slot.install(() => createScene(first, themes as never, engine, () => undefined));
      await settle();
      expect(seen()).toEqual(['first']);

      slot.install(() => createScene(second, themes as never, engine, () => undefined));
      await settle();
      expect(seen()).toEqual(['first', 'second']);

      nudge(first, 'first');
      await settle();

      expect(seen()).toEqual(['first', 'second']);

      slot.dispose();
      nudge(second, 'second');
      await settle();
      expect(seen()).toEqual(['first', 'second']);
      expect(slot.scene()).toBeNull();

      disposeRoot();
    });
  });
});
