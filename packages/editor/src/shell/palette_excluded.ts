// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CommandId } from '../ui_state/keymap';

/**
 * Commands that are not useful as clickable rows in the command palette.
 *
 * Chord-only movement commands, Escape, and commands that open the palette or
 * help surface are intentionally excluded from the shared command registry.
 */
export const PALETTE_EXCLUDED: ReadonlySet<CommandId> = new Set<CommandId>([
  'escape',
  'nudge-up',
  'nudge-down',
  'nudge-left',
  'nudge-right',
  'ring-next',
  'ring-prev',
  'open-palette',
  'open-help',
  'enter-grab',
  'enter-resize',
]);
