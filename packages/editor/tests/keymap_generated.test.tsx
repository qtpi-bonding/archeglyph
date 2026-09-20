// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Tests for keymap.ts generated from archegraph testgen for editor-shell-islands spec.
// These tests are hand-maintained; the CommandId type-only block was dropped
// as it asserts no runtime behavior. KEYMAP data table tests remain.

import { describe, expect, test } from 'bun:test';
import * as fc from 'fast-check';

import { KEYMAP, type CommandId } from '../src/ui_state/keymap';

describe('keymap: KEYMAP table — specific key mappings', () => {
  const findKeymapCommand = (chord: { key: string; meta?: boolean; shift?: boolean }) =>
    KEYMAP.find(
      (entry) =>
        entry.chord.key === chord.key &&
        Boolean(entry.chord.meta) === Boolean(chord.meta) &&
        Boolean(entry.chord.shift) === Boolean(chord.shift),
    )?.command;

  // WHEN: The keyboard chord has key 'z' with meta pressed and shift not pressed; it maps to undo.
  // THEN: It maps the chord to undo.
  test('cmd_z_undo', () => {
    expect(findKeymapCommand({ key: 'z', meta: true })).toBe('undo');
  });

  // WHEN: The keyboard chord has key 'z' with both meta and shift pressed; it maps to redo.
  // THEN: It maps the chord to redo.
  test('cmd_shift_z_redo', () => {
    expect(findKeymapCommand({ key: 'z', meta: true, shift: true })).toBe('redo');
  });

  // WHEN: The keyboard chord has key 'Backspace' with no meta or shift modifier; it maps to delete.
  // THEN: It maps the chord to delete.
  test('backspace_delete', () => {
    expect(findKeymapCommand({ key: 'Backspace' })).toBe('delete');
  });

  // WHEN: The keyboard chord has key 'Delete' with no meta or shift modifier; it maps to delete.
  // THEN: It maps the chord to delete.
  test('delete_key_delete', () => {
    expect(findKeymapCommand({ key: 'Delete' })).toBe('delete');
  });

  // WHEN: The keyboard chord has key 'Escape' with no meta or shift modifier; it maps to escape.
  // THEN: It maps the chord to escape.
  test('escape_cancels', () => {
    expect(findKeymapCommand({ key: 'Escape' })).toBe('escape');
  });

  // WHEN: The keyboard chord has key 'a' with meta pressed and shift not pressed; it maps to select-all.
  // THEN: It maps the chord to select-all.
  test('cmd_a_select_all', () => {
    expect(findKeymapCommand({ key: 'a', meta: true })).toBe('select-all');
  });

  // WHEN: The keyboard chord has key 'ArrowUp' with no meta or shift modifier; it maps to nudge-up.
  // THEN: It maps the chord to nudge-up.
  test('arrow_up_nudge', () => {
    expect(findKeymapCommand({ key: 'ArrowUp' })).toBe('nudge-up');
  });

  // WHEN: The keyboard chord has key 'ArrowDown' with no meta or shift modifier; it maps to nudge-down.
  // THEN: It maps the chord to nudge-down.
  test('arrow_down_nudge', () => {
    expect(findKeymapCommand({ key: 'ArrowDown' })).toBe('nudge-down');
  });

  // WHEN: The keyboard chord has key 'ArrowLeft' with no meta or shift modifier; it maps to nudge-left.
  // THEN: It maps the chord to nudge-left.
  test('arrow_left_nudge', () => {
    expect(findKeymapCommand({ key: 'ArrowLeft' })).toBe('nudge-left');
  });

  // WHEN: The keyboard chord has key 'ArrowRight' with no meta or shift modifier; it maps to nudge-right.
  // THEN: It maps the chord to nudge-right.
  test('arrow_right_nudge', () => {
    expect(findKeymapCommand({ key: 'ArrowRight' })).toBe('nudge-right');
  });

  // WHEN: The keyboard chord has key 's' with no meta or shift modifier; it maps to ring-next.
  // THEN: It maps the chord to ring-next.
  test('s_ring_next', () => {
    expect(findKeymapCommand({ key: 's' })).toBe('ring-next');
  });

  // WHEN: The keyboard chord has key 's' with shift pressed and meta not pressed; it maps to ring-prev.
  // THEN: It maps the chord to ring-prev.
  test('shift_s_ring_prev', () => {
    expect(findKeymapCommand({ key: 's', shift: true })).toBe('ring-prev');
  });

  // WHEN: The keyboard chord has key 's' with meta pressed and shift not pressed; it maps to save.
  // THEN: It maps the chord to save.
  test('cmd_s_save', () => {
    expect(findKeymapCommand({ key: 's', meta: true })).toBe('save');
  });

  // WHEN: The keyboard chord has key 'i' with meta pressed and shift not pressed; it maps to focus-inspector.
  // THEN: It maps the chord to focus-inspector.
  test('cmd_i_focus_inspector', () => {
    expect(findKeymapCommand({ key: 'i', meta: true })).toBe('focus-inspector');
  });

  // WHEN: The keyboard chord has key 'v' with no meta or shift modifier; it maps to tool-select.
  // THEN: It maps the chord to tool-select.
  test('v_select_tool', () => {
    expect(findKeymapCommand({ key: 'v' })).toBe('tool-select');
  });

  // WHEN: The keyboard chord has key 't' with no meta or shift modifier; it maps to tool-annotation.
  // THEN: It maps the chord to tool-annotation.
  test('t_annotation_tool', () => {
    expect(findKeymapCommand({ key: 't' })).toBe('tool-annotation');
  });

  // WHEN: The keyboard chord has key 'n' with no meta or shift modifier; it maps to add-annotation.
  // THEN: It maps the chord to add-annotation.
  test('n_add_annotation', () => {
    expect(findKeymapCommand({ key: 'n' })).toBe('add-annotation');
  });

  // WHEN: The keyboard chord has key 'Enter' with no meta or shift modifier; it maps to edit-text.
  // THEN: It maps the chord to edit-text.
  test('enter_edit_text', () => {
    expect(findKeymapCommand({ key: 'Enter' })).toBe('edit-text');
  });

  // WHEN: The keyboard chord has key 'd' with meta pressed and shift not pressed; it maps to duplicate.
  // THEN: It maps the chord to duplicate.
  test('cmd_d_duplicate', () => {
    expect(findKeymapCommand({ key: 'd', meta: true })).toBe('duplicate');
  });
});

describe('keymap: KEYMAP table — modifier exactness', () => {
  const findKeymapCommand = (chord: { key: string; meta?: boolean; shift?: boolean }) =>
    KEYMAP.find(
      (entry) =>
        entry.chord.key === chord.key &&
        Boolean(entry.chord.meta) === Boolean(chord.meta) &&
        Boolean(entry.chord.shift) === Boolean(chord.shift),
    )?.command;

  const modifierVariants = (chord: { key: string; meta?: boolean; shift?: boolean }) => {
    const variants = [];
    for (const meta of [false, true]) {
      for (const shift of [false, true]) {
        if (meta !== Boolean(chord.meta) || shift !== Boolean(chord.shift)) {
          variants.push({ key: chord.key, meta, shift });
        }
      }
    }
    return variants;
  };

  // These two are derived from KEYMAP itself rather than from a hand-listed
  // allowlist. The generated originals enumerated keys by hand, and had to drop
  // `z` and `s` because those carry several modifier variants each -- which left
  // them asserting an accident of today's table rather than the rule, and made
  // them silently stop covering any binding added later. Stated over every entry,
  // the rule holds for `z` and `s` too.
  const chordKey = (c: { key: string; meta?: boolean; shift?: boolean }) =>
    `${c.key}|${Boolean(c.meta)}|${Boolean(c.shift)}`;

  test('every mapped chord resolves to exactly its own command', () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEYMAP), (value) => {
        expect(findKeymapCommand(value.chord)).toBe(value.command);
      }),
    );
  });

  test('no unmapped modifier variant of a mapped key resolves to a command', () => {
    const mapped = new Set(KEYMAP.map((entry) => chordKey(entry.chord)));
    fc.assert(
      fc.property(fc.constantFrom(...KEYMAP), (value) => {
        for (const chord of modifierVariants(value.chord)) {
          // A sibling binding on the same key is legitimate (z / shift+z,
          // and s / shift+s / meta+s). Only variants absent from the table
          // must resolve to nothing.
          if (mapped.has(chordKey(chord))) continue;
          expect(findKeymapCommand(chord)).toBeUndefined();
        }
      }),
    );
  });
});

describe('keymap: KEYMAP table — unmapped keys', () => {
  const findKeymapCommand = (chord: { key: string; meta?: boolean; shift?: boolean }) =>
    KEYMAP.find(
      (entry) =>
        entry.chord.key === chord.key &&
        Boolean(entry.chord.meta) === Boolean(chord.meta) &&
        Boolean(entry.chord.shift) === Boolean(chord.shift),
    )?.command;

  // WHEN: A key not present in the table, including 'h', '=', '-', '0', or '1', does not map to any command.
  // THEN: It leaves unknown keys, including h, =, -, 0, and 1, unmapped.
  test('unknown_key_unmatched', () => {
    // Checked against KEYMAP, so a new binding cannot silently invalidate this.
    const mapped = new Set(KEYMAP.map((entry) => entry.chord.key));
    for (const key of ['q', 'w', 'j', 'y', ';']) {
      expect(mapped.has(key)).toBe(false);
      expect(findKeymapCommand({ key })).toBeUndefined();
    }
  });

  // WHEN: An empty key value does not map to any command.
  // THEN: It leaves an empty key value unmapped.
  test('empty_key_unmatched', () => {
    expect(findKeymapCommand({ key: '' })).toBeUndefined();
  });

  // WHEN: A case variant such as 'Z', 'S', or 'V' does not match the lowercase binding.
  // THEN: It leaves case variants such as Z, S, and V unmapped.
  test('case_sensitive_key_unmatched', () => {
    for (const key of ['Z', 'S', 'V']) {
      expect(findKeymapCommand({ key })).toBeUndefined();
    }
  });

  test('unexpected_modifier_unmatched', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { key: 'v', meta: true, shift: false },
          { key: 'v', meta: false, shift: true },
          { key: 's', meta: true, shift: true },
        ),
        (value) => {
          expect(findKeymapCommand(value)).toBeUndefined();
        },
      ),
    );
  });
});
