// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import {
  NodeStyleChangeSchema,
  NodeStyleEntrySchema,
  StyleChangeType,
  StyleEdit,
  StyleEditSchema,
  StyleEditState,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import { createEditorState } from './create_editor_state';

function proposal(id: string, component: string): StyleEdit {
  return create(StyleEditSchema, {
    schemaVersion: 1,
    id,
    timestampMs: 0n,
    state: StyleEditState.PENDING,
    description: `set ${component}`,
    nodeChanges: [
      create(NodeStyleChangeSchema, {
        nodeId: 'n1',
        changeType: StyleChangeType.MODIFIED,
        after: create(NodeStyleEntrySchema, { component }),
        unsetPaths: [],
      }),
    ],
  });
}

function sheet(pendingEdits: StyleEdit[]): Stylesheet {
  return create(StylesheetSchema, { schemaVersion: 1, nodes: {}, pendingEdits });
}

const diagram = create(DiagramSchema, { schemaVersion: 1 });

const pendingIds = (s: Stylesheet): Array<string> => s.pendingEdits.map((e) => e.id);

describe('accepting a proposal is one undo entry, not two', () => {
  // Apply-and-remove must be a single write: two would make undo a two-press
  // operation with the change applied and the proposal still listed between.
  test('accept applies the change and removes the entry together', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));

    state.acceptPending('p1');

    expect(state.stylesheet().nodes['n1']?.component).toBe('boxy');
    expect(pendingIds(state.stylesheet())).toEqual([]);
  });

  test('one undo restores both halves', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));
    state.acceptPending('p1');

    state.undo();

    expect(state.stylesheet().nodes['n1']?.component).toBeUndefined();
    expect(pendingIds(state.stylesheet())).toEqual(['p1']);
    // If this were two entries, one undo would leave one half applied.
    expect(state.canUndo()).toBe(false);
  });

  // A StyleEdit cannot express a change to pendingEdits, so redo has to be
  // told the list separately or it re-applies the change and leaves the
  // proposal listed.
  test('redo re-applies both halves', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));
    state.acceptPending('p1');
    state.undo();

    state.redo();

    expect(state.stylesheet().nodes['n1']?.component).toBe('boxy');
    expect(pendingIds(state.stylesheet())).toEqual([]);
  });

  // Redo builds a fresh undo entry rather than re-pushing the one it popped,
  // so the second cycle is where a dropped field shows up.
  test('a second undo/redo cycle behaves like the first', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));
    state.acceptPending('p1');
    state.undo();
    state.redo();

    state.undo();
    expect(pendingIds(state.stylesheet())).toEqual(['p1']);

    state.redo();
    expect(state.stylesheet().nodes['n1']?.component).toBe('boxy');
    expect(pendingIds(state.stylesheet())).toEqual([]);
  });
});

describe('rejecting a proposal', () => {
  test('reject removes the entry without applying it', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));

    state.rejectPending('p1');

    expect(state.stylesheet().nodes['n1']?.component).toBeUndefined();
    expect(pendingIds(state.stylesheet())).toEqual([]);
  });

  test('undo brings the rejected proposal back', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));
    state.rejectPending('p1');

    state.undo();

    expect(pendingIds(state.stylesheet())).toEqual(['p1']);
    expect(state.stylesheet().nodes['n1']?.component).toBeUndefined();
  });

  test('redo removes it again, rather than doing nothing', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));
    state.rejectPending('p1');
    state.undo();

    state.redo();

    expect(pendingIds(state.stylesheet())).toEqual([]);
  });

  test('only the named proposal is touched', () => {
    const state = createEditorState(
      diagram,
      sheet([proposal('p1', 'boxy'), proposal('p2', 'round')]),
    );

    state.rejectPending('p1');

    expect(pendingIds(state.stylesheet())).toEqual(['p2']);
  });
});

describe('an unknown id writes nothing at all', () => {
  test('accept and reject on a missing id are no-ops', () => {
    const state = createEditorState(diagram, sheet([proposal('p1', 'boxy')]));
    const before = state.stylesheet();

    state.acceptPending('nope');
    state.rejectPending('nope');

    expect(state.stylesheet()).toBe(before);
    // A no-op that still pushed an undo entry would make Cmd+Z do nothing
    // visible, which reads as a broken undo rather than as a no-op.
    expect(state.canUndo()).toBe(false);
    expect(state.dirty()).toBe(false);
  });
});
