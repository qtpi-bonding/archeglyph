// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';

import { COMMANDS } from '../gestures/commands';
import { KEYMAP } from '../ui_state/keymap';
import type { ElementRef } from '../ui_state/ui_state';
import { contextMenuItems } from './menu_items';
import { commandPaletteItems } from './palette_items';

const node: ElementRef = { id: 'n1', kind: 'node' };
const annotation: ElementRef = { id: 'a1', kind: 'annotation' };

const ids = (items: ReadonlyArray<{ id?: string; key?: string }>): Array<string> =>
  items.map((item) => item.id ?? item.key!.replace(/^command:/, ''));

describe('contextMenuItems vs commandPaletteItems', () => {
  // Both surfaces read appliesTo; only the menu filters by selection. An
  // implementation sharing one filter passes every other test here.
  test('the menu filters by selected kind; the palette does not', () => {
    const menu = ids(contextMenuItems([node], COMMANDS, KEYMAP));
    const palette = ids(commandPaletteItems(COMMANDS, KEYMAP));

    expect(menu).toContain('hide');
    expect(palette).toContain('hide');

    expect(menu).not.toContain('edit-text');
    expect(palette).toContain('edit-text');

    // One matching kind suffices; a command need not cover every selected kind.
    expect(ids(contextMenuItems([node, annotation], COMMANDS, KEYMAP))).toContain('edit-text');
  });

  test('a command with no appliesTo reaches neither surface', () => {
    const menu = ids(contextMenuItems([node], COMMANDS, KEYMAP));
    const palette = ids(commandPaletteItems(COMMANDS, KEYMAP));

    for (const id of ['nudge-up', 'nudge-down', 'nudge-left', 'nudge-right', 'ring-next', 'ring-prev', 'escape', 'enter-grab', 'enter-resize']) {
      expect(menu).not.toContain(id);
      expect(palette).not.toContain(id);
    }
  });

  // 'global', so the split below does not fall out of the appliesTo rule and
  // has to be decided explicitly in commandPaletteItems.
  test('open-palette stays out of the palette but is offered by the menu', () => {
    expect(ids(commandPaletteItems(COMMANDS, KEYMAP))).not.toContain('open-palette');
    expect(ids(contextMenuItems([], COMMANDS, KEYMAP))).toContain('open-palette');
  });

  test('open-help is now listed in the palette', () => {
    expect(ids(commandPaletteItems(COMMANDS, KEYMAP))).toContain('open-help');
  });

  test('an empty selection yields exactly the global commands', () => {
    const menu = contextMenuItems([], COMMANDS, KEYMAP);
    const globals = COMMANDS.filter((command) => command.appliesTo === 'global');

    expect(menu.length).toBe(globals.length);
    expect(ids(menu)).toEqual(globals.map((command) => command.id));
  });
});
