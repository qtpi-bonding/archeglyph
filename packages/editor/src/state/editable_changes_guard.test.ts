// SPDX-License-Identifier: MPL-2.0
// A style change against an element the diagram does not contain is dead: it
// writes a stylesheet entry nothing matches. Both write paths drop it.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, GraphSchema, ElementSchema } from '@archeglyph/proto/gen/content_pb';
import {
  ElementStyleChangeSchema, ElementStyleEntrySchema, StyleChangeType,
  StyleEditSchema, StylesheetSchema, type StyleEdit,
} from '@archeglyph/proto/gen/style_pb';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

import { createEditorState } from './create_editor_state';

const diagram = create(DiagramSchema, {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  graph: create(GraphSchema, { elements: { present: create(ElementSchema, {}) } }),
});

function editFor(nodeId: string, id: string = nodeId): StyleEdit {
  return create(StyleEditSchema, {
    schemaVersion: STYLE_SCHEMA_VERSION,
    id,
    elementChanges: [
      create(ElementStyleChangeSchema, {
        elementId: nodeId,
        changeType: StyleChangeType.MODIFIED,
        after: create(ElementStyleEntrySchema, { component: 'boxy' }),
      }),
    ],
  });
}

describe('a style edit against an element the diagram does not contain', () => {
  test('applyStyleEdit drops it entirely, as if it were empty', () => {
    const state = createEditorState(diagram, create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }));
    const before = state.stylesheet();

    state.applyStyleEdit(editFor('absent'));

    expect(state.stylesheet()).toBe(before);
    expect(state.version()).toBe(0);
    expect(state.canUndo()).toBe(false);
    expect(state.dirty()).toBe(false);
  });

  test('applyStyleEdit keeps the changes that do name a present element', () => {
    const state = createEditorState(diagram, create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }));

    state.applyStyleEdit(editFor('present'));

    expect(state.stylesheet().elements['present']?.component).toBe('boxy');
    expect(state.stylesheet().elements['absent']).toBeUndefined();
    expect(state.version()).toBe(1);
  });

  test('acceptPending writes nothing but still clears the proposal', () => {
    const proposal = editFor('absent', 'p1');
    const state = createEditorState(
      diagram,
      create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION, pendingEdits: [proposal] }),
    );

    state.acceptPending('p1');

    // A reviewed proposal leaves the queue even when every change is dropped.
    expect(state.stylesheet().pendingEdits).toHaveLength(0);
    expect(state.stylesheet().elements['absent']).toBeUndefined();
  });
});
