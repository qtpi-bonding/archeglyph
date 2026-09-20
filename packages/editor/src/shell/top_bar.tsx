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

export const TopBar: Component<TopBarProps> = (props: TopBarProps): JSX.Element => {
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  const fileName: string = params.get('file') ?? params.get('name') ?? 'Untitled';

  function onUndo(): void {
    props.state.undo();
  }

  function onRedo(): void {
    props.state.redo();
  }

  function onSave(): void {
    void props.saveController?.saveNow();
  }

  return (
    <div style={{ display: 'flex', 'align-items': 'center', padding: '0 8px', height: '40px', background: 'var(--ag-panel)', 'border-bottom': '1px solid var(--ag-edge)' }}>
      <span style={{ flex: '1', 'font-size': '14px' }}>{fileName}</span>
      <Show when={props.adapter.canSave()}>
        <span style={{ 'margin-right': '8px', 'font-size': '12px', color: props.saveController?.status() === 'error' ? 'var(--ag-danger)' : 'var(--ag-fg-3)' }}>
          {statusLabel(props.saveController?.status())}
        </span>
        {/* An explicit Save exists because autosave cannot start itself: the
            first write has to raise showSaveFilePicker, which needs the
            transient activation only a real click carries. After one save the
            handle is held and the debounce takes over silently. */}
        <button onClick={onSave}>Save</button>
      </Show>
      <button disabled={!props.state.canUndo()} onClick={onUndo}>Undo</button>
      <button disabled={!props.state.canRedo()} onClick={onRedo}>Redo</button>
      {/* Chrome palette. Deliberately separate from the diagram's theme —
          this styles the application, not the document, and is never written
          to the style file. A placeholder until wave 6's toolbar. */}
      <select
        aria-label="Editor theme"
        value={props.editorTheme}
        onChange={(event): void => { props.onEditorTheme(event.currentTarget.value); }}
        style={{ 'margin-left': '8px' }}
      >
        {EDITOR_THEMES.map((theme) => (
          <option value={theme.name}>{theme.label}</option>
        ))}
      </select>
    </div>
  );
};
