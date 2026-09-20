// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';
import { EditorState } from '../state/editor_state';
import { EDITOR_THEMES } from './editor_theme';
import { HostAdapter } from '../adapters/host_adapter';
import { SaveController, SaveStatus } from './save_controller';

export interface TopBarProps {
  state: EditorState;
  adapter: HostAdapter;
  saveController: SaveController | null;
  /** Active chrome palette name, and a setter. Wave 6's toolbar takes this over. */
  editorTheme: string;
  onEditorTheme: (name: string) => void;
}

function statusLabel(status: SaveStatus | undefined): string {
  switch (status) {
    case 'unsaved': return 'Unsaved';
    case 'saving': return 'Saving…';
    case 'saved': return 'Saved';
    case 'error': return 'Save failed';
    default: return '';
  }
}
