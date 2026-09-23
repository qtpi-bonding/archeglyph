// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';
import { SaveStatus } from './save_controller';
import { EDITOR_THEMES } from './editor_theme';

export class FileIslandProps {
  fileName!: string;
  dirty!: boolean;
  canSave!: boolean;
  status?: SaveStatus;
  errorMessage?: string;
  onSave!: () => void;
  editorTheme!: string;
  onEditorTheme!: (a0: string) => void;
  comparedTo?: string;
  onCompare!: () => void;
  onClearComparison!: () => void;
}

/**
 * File name, then a dirty dot, then the status text, then Save, then the
 * palette picker.
 */
export const FileIsland: Component<FileIslandProps> = (props: FileIslandProps): JSX.Element => {
  return (
    <div class="ag-island" style={{ display: 'flex', 'align-items': 'center', gap: '8px', padding: '0 8px', height: '40px', background: 'var(--ag-panel)', 'border-bottom': '1px solid var(--ag-edge)' }}>
      <span style={{ flex: '1', 'font-size': '14px' }}>{props.fileName}</span>
      <Show when={props.dirty && props.status !== 'error'}>
        <span
          aria-label="Unsaved changes"
          title="Unsaved changes"
          style={{ width: '7px', height: '7px', 'border-radius': '50%', background: 'var(--ag-teal)', display: 'inline-block' }}
        />
      </Show>
      <Show when={props.status === 'error'}>
        <span
          aria-label={props.errorMessage ?? 'Save failed'}
          title={props.errorMessage ?? 'Save failed'}
          style={{ width: '7px', height: '7px', 'border-radius': '50%', background: 'var(--ag-danger)', display: 'inline-block' }}
        />
      </Show>
      <Show when={statusLabel(props.status) !== ''}>
        <span style={{ 'font-size': '12px', color: props.status === 'error' ? 'var(--ag-danger)' : 'var(--ag-fg-3)' }}>
          {statusLabel(props.status)}
        </span>
      </Show>
      <Show when={props.canSave}>
        <button onClick={props.onSave}>Save</button>
      </Show>
      <Show
        when={props.comparedTo}
        fallback={<button onClick={props.onCompare}>Compare...</button>}
      >
        {(name): JSX.Element => (
          <>
            <span style={{ 'font-size': '12px', color: 'var(--ag-fg-3)' }}>
              vs {name()}
            </span>
            <button aria-label="Clear comparison" onClick={props.onClearComparison}>x</button>
          </>
        )}
      </Show>
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

function statusLabel(status?: SaveStatus): string {
  switch (status) {
    case 'saving': return 'Saving...';
    case 'saved': return 'Saved';
    case 'unsaved': return 'Unsaved';
    case 'error': return 'Save failed';
    case 'idle':
    default: return '';
  }
}
