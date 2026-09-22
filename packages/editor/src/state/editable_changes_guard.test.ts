// SPDX-License-Identifier: AGPL-3.0-or-later
// A style change against an element the diagram does not contain is dead: it
// writes a stylesheet entry nothing matches. Both write paths drop it.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, GraphSchema, NodeSchema } from '@archeglyph/proto/gen/content_pb';
import {
  NodeStyleChangeSchema, NodeStyleEntrySchema, StyleChangeType,
  StyleEditSchema, StylesheetSchema, type StyleEdit,
} from '@archeglyph/proto/gen/style_pb';

import { createEditorState } from './create_editor_state';

const diagram = create(DiagramSchema, {
  schemaVersion: 1,
  graph: create(GraphSchema, { nodes: { present: create(NodeSchema, {}) } }),
});

function editFor(nodeId: string, id: string = nodeId): StyleEdit {
  return create(StyleEditSchema, {
    schemaVersion: 1,
    id,
    nodeChanges: [
      create(NodeStyleChangeSchema, {
        nodeId,
        changeType: StyleChangeType.MODIFIED,
        after: create(NodeStyleEntrySchema, { component: 'boxy' }),
      }),
    ],
  });
}

describe('a style edit against an element the diagram does not contain', () => {
  test('applyStyleEdit drops it entirely, as if it were empty', () => {
    const state = createEditorState(diagram, create(StylesheetSchema, { schemaVersion: 1 }));
    const before = state.stylesheet();

    state.applyStyleEdit(editFor('absent'));

    expect(state.stylesheet()).toBe(before);
    expect(state.version()).toBe(0);
    expect(state.canUndo()).toBe(false);
    expect(state.dirty()).toBe(false);
  });

  test('applyStyleEdit keeps the changes that do name a present element', () => {
    const state = createEditorState(diagram, create(StylesheetSchema, { schemaVersion: 1 }));

    state.applyStyleEdit(editFor('present'));

    expect(state.stylesheet().nodes['present']?.component).toBe('boxy');
    expect(state.stylesheet().nodes['absent']).toBeUndefined();
    expect(state.version()).toBe(1);
  });

  test('acceptPending writes nothing but still clears the proposal', () => {
    const proposal = editFor('absent', 'p1');
    const state = createEditorState(
      diagram,
      create(StylesheetSchema, { schemaVersion: 1, pendingEdits: [proposal] }),
    );

    state.acceptPending('p1');

    // A reviewed proposal leaves the queue even when every change is dropped.
    expect(state.stylesheet().pendingEdits).toHaveLength(0);
    expect(state.stylesheet().nodes['absent']).toBeUndefined();
  });
});
