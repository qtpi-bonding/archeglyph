// SPDX-License-Identifier: MPL-2.0
//
// The editor rebuilds a Stylesheet field by field in several places. A field it
// forgets to copy vanishes on the next undo, accept or comment merge, so the
// view fields -- how deep to open and which edge kinds to draw -- are pinned
// through every one of those places.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  StyleEditSchema,
  StylesheetSchema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { mergeThreads } from '../pending/merge_threads';
import { applyStyleEditToStylesheet } from './apply_style_edit';
import { proposePendingEdit, removePendingEdit } from './edits/pending';
import { captureSnapshot, restoreFromSnapshot } from './undo_log';

const stylesheet = (): Stylesheet => create(StylesheetSchema, {
  schemaVersion: 2,
  openDepth: 2,
  shownEdgeKinds: ['invocation', 'dependency'],
});

const edit = () => create(StyleEditSchema, { schemaVersion: 2, id: 'edit-1' });

const view = (s: Stylesheet) => ({ openDepth: s.openDepth, shownEdgeKinds: [...s.shownEdgeKinds] });
const kept = { openDepth: 2, shownEdgeKinds: ['invocation', 'dependency'] };

describe('the view fields survive every rebuild of a stylesheet', () => {
  test('applying a style edit', () => {
    expect(view(applyStyleEditToStylesheet(stylesheet(), edit()))).toEqual(kept);
  });

  test('undoing one', () => {
    const before = stylesheet();
    const snapshot = captureSnapshot(before, edit());
    expect(view(restoreFromSnapshot(before, snapshot))).toEqual(kept);
  });

  test('proposing a pending edit', () => {
    expect(view(proposePendingEdit(stylesheet(), edit(), 'ai:test'))).toEqual(kept);
  });

  test('removing a pending edit', () => {
    const proposed = proposePendingEdit(stylesheet(), edit(), 'ai:test');
    expect(view(removePendingEdit(proposed, 'edit-1'))).toEqual(kept);
  });

  test('merging review comments', () => {
    expect(view(mergeThreads(stylesheet(), []))).toEqual(kept);
  });
});
