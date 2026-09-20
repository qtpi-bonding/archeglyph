// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show } from 'solid-js';
import { EDITOR_THEMES } from './editor_theme';
import { SaveStatus } from './save_controller';

export class FileIslandProps {
  fileName!: string;
  dirty!: boolean;
  canSave!: boolean;
  status?: SaveStatus;
  errorMessage?: string;
  onSave!: () => void;
  editorTheme!: string;
  onEditorTheme!: (name: string) => void;
}

/**
 * File name, then a dirty dot, then the status text, then Save, then the
 * palette picker.
 */
export const FileIsland: Component<FileIslandProps> = (props: FileIslandProps): JSX.Element => {
  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', height: '40px' }}>
      <span style={{ 'font-size': '14px' }}>{props.fileName}</span>
      <Show when={props.status === 'error' || (props.dirty && props.status !== 'error')}>
        <span
          aria-label={props.status === 'error' ? 'Save failed' : 'Unsaved changes'}
          title={props.errorMessage}
          style={{
            width: '6px',
            height: '6px',
            'border-radius': '50%',
            'flex-shrink': '0',
            background: props.status === 'error' ? 'var(--ag-danger)' : 'var(--ag-teal)',
          }}
        />
      </Show>
      <Show when={props.status !== undefined}>
        <span
          style={{
            'font-size': '12px',
            color: props.status === 'error' ? 'var(--ag-danger)' : 'var(--ag-fg-3)',
          }}
        >
          {statusLabel(props.status)}
        </span>
      </Show>
      <Show when={props.canSave}>
        <button onClick={props.onSave}>Save</button>
      </Show>
      <select
        aria-label="Editor theme"
        value={props.editorTheme}
        onChange={(event): void => { props.onEditorTheme(event.currentTarget.value); }}
      >
        {EDITOR_THEMES.map((theme) => (
          <option value={theme.name}>{theme.label}</option>
        ))}
      </select>
    </div>
  );
};

function statusLabel(status: SaveStatus | undefined): string {
  switch (status) {
    case 'idle': return '';
    case 'saving': return 'Saving...';
    case 'saved': return 'Saved';
    case 'unsaved': return 'Unsaved';
    case 'error': return 'Save failed';
    default: return '';
  }
}
