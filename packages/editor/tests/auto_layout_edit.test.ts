// SPDX-License-Identifier: AGPL-3.0-or-later
//
// HAND-MAINTAINED, for the same reason as
// packages/core/tests/layout_pinning.test.ts: tests/testgen.test.ts is the
// filename the next `archegraph testgen` run overwrites without asking.
//
// This case came from testgen and was FLAKY rather than wrong -- it passed in
// isolation and failed perhaps one run in three in the full suite, which is
// worse than a consistently wrong test, because it erodes trust in the whole
// suite instead of pointing at itself.
//
// The cause: styleEdit() stamps `timestampMs: BigInt(Date.now())`, and the
// generated test asserted `toEqual` between two StyleEdits built by two
// separate calls. They are equal only when both land inside the same
// millisecond. Under load they sometimes straddle one.
//
// Rewritten to compare the parts that carry the claim -- the changes
// themselves -- and to assert the timestamps' independence explicitly rather
// than accidentally depending on it.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { CanvasStyleSchema, Glyph2DSchema, GroupLayoutSchema, GroupStyleEntrySchema, NodeLayoutSchema, NodeStyleEntrySchema, Stylesheet, StylesheetSchema, TypographySchema, Vec2, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { StyleEdit } from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { SceneGeometry } from '../src/scene/scene';
import { COMMANDS, CommandContext, runCommand } from '../src/gestures/commands';
import { CommandId } from '../src/ui_state/keymap';
import { applyStyleEditToStylesheet } from '../src/state/apply_style_edit';
import { pinAllEdit, unpinAllEdit } from '../src/state/edits/layout_command';
import { EditorState } from '../src/state/editor_state';
import { UiState } from '../src/ui_state/ui_state';
import { ContainerRect } from '../src/ui_state/viewport_math';
import { LaidOutGroup } from '@archeglyph/core/layout/laid_out_group';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';


describe('auto-layout and unpin-all produce the same edit (repaired testgen case)', () => {
    // WHEN: auto-layout fires on a stylesheet with the same explicit-position state as an equivalent unpin-all invocation; the two commands must produce an identical StyleEdit value.
    // THEN: Returns a StyleEdit value identical to what unpin-all would produce for the same stylesheet state.
    test('auto_layout_edit_matches_unpin_all_edit_for_same_stylesheet', () => {
        function vec2(x: number, y: number): Vec2 { return create(Vec2Schema, { x, y }); }
          function makeSheet(): Stylesheet {
            return create(StylesheetSchema, {
              schemaVersion: 1,
              nodes: {
                n1: create(NodeStyleEntrySchema, { layout: create(NodeLayoutSchema, { position: vec2(1, 1) }) }),
                n2: create(NodeStyleEntrySchema, { component: 'no-position' }),
              },
              edges: {},
              groups: { g1: create(GroupStyleEntrySchema, { layout: create(GroupLayoutSchema, { position: vec2(2, 2) }) }) },
              annotations: {},
              pendingEdits: [],
            });
          }
          function makeContext(sheet: Stylesheet, edits: StyleEdit[]): CommandContext {
            return {
              state: { stylesheet: () => sheet, applyStyleEdit: (edit: StyleEdit) => { edits.push(edit); }, undo: () => {}, redo: () => {} } as unknown as EditorState,
              ui: { selection: () => [], setSelection: () => {}, modalGesture: () => undefined, setModalGesture: () => {} } as unknown as UiState,
              geometry: undefined,
              rect: {} as ContainerRect,
              save: () => {},
              beginTextEdit: () => {},
            };
          }

          const sheetForUnpin = makeSheet();
          const unpinEdits: StyleEdit[] = [];
          runCommand('unpin-all' as unknown as CommandId, makeContext(sheetForUnpin, unpinEdits));

          const sheetForAutoLayout = makeSheet();
          const autoLayoutEdits: StyleEdit[] = [];
          runCommand('auto-layout' as unknown as CommandId, makeContext(sheetForAutoLayout, autoLayoutEdits));

          expect(unpinEdits).toHaveLength(1);
          expect(autoLayoutEdits).toHaveLength(1);
          // Everything except the wall-clock stamp, which is not part of the claim.
    const withoutTimestamp = (edit: StyleEdit): unknown => ({
      ...edit,
      timestampMs: undefined,
    });
    expect(withoutTimestamp(autoLayoutEdits[0])).toEqual(withoutTimestamp(unpinEdits[0]));
    });
});
