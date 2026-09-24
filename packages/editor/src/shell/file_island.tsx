// SPDX-License-Identifier: MPL-2.0

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
  diffOn!: boolean;
  attachedIsTarget!: boolean;
  onCompare!: () => void;
  onToggleDiff!: () => void;
  onSwapDirection!: () => void;
}

const row: JSX.CSSProperties = {
  display: 'flex',
  'align-items': 'center',
  gap: '6px',
  'min-width': '0',
};

const dot = (color: string): JSX.CSSProperties => ({
  width: '7px',
  height: '7px',
  'border-radius': '50%',
  background: color,
  display: 'inline-block',
  'flex-shrink': '0',
});

export const FileIsland: Component<FileIslandProps> = (props: FileIslandProps): JSX.Element => {
  return (
    <div
      class="ag-island"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '6px',
        padding: '8px 10px',
        width: '100%',
        'box-sizing': 'border-box',
        background: 'var(--ag-panel)',
        border: '1px solid var(--ag-edge)',
        'border-radius': '6px',
      }}
    >
      <div style={row}>
        <span
          title={props.fileName}
          style={{
            flex: '1',
            'font-size': '13px',
            'min-width': '0',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
          }}
        >
          {props.fileName}
        </span>
        <Show when={props.dirty && props.status !== 'error'}>
          <span aria-label="Unsaved changes" title="Unsaved changes" style={dot('var(--ag-teal)')} />
        </Show>
        <Show when={props.status === 'error'}>
          <span
            aria-label={props.errorMessage ?? 'Save failed'}
            title={props.errorMessage ?? 'Save failed'}
            style={dot('var(--ag-danger)')}
          />
        </Show>
        <Show when={statusLabel(props.status) !== ''}>
          <span style={{ 'font-size': '11px', color: props.status === 'error' ? 'var(--ag-danger)' : 'var(--ag-fg-3)' }}>
            {statusLabel(props.status)}
          </span>
        </Show>
        <Show when={props.canSave}>
          <button type="button" onClick={props.onSave}>Save</button>
        </Show>
      </div>

      <Show when={props.comparedTo}>
        {(name): JSX.Element => (
          <span
            style={{
              'font-size': '11px',
              color: 'var(--ag-fg-3)',
              'line-height': '1.4',
              'overflow-wrap': 'anywhere',
            }}
          >
            {props.attachedIsTarget ? props.fileName : name()}
            {' → '}
            {props.attachedIsTarget ? name() : props.fileName}
          </span>
        )}
      </Show>

      <div style={row}>
        <Show
          when={props.comparedTo}
          fallback={<button type="button" onClick={props.onCompare}>Compare...</button>}
        >
          <button type="button" aria-label="Swap diff direction" onClick={props.onSwapDirection}>
            {'⇄'}
          </button>
          <button
            type="button"
            aria-label="Toggle diff"
            aria-pressed={props.diffOn}
            onClick={props.onToggleDiff}
            style={{ color: props.diffOn ? 'var(--ag-teal)' : 'var(--ag-fg-3)' }}
          >
            {props.diffOn ? 'Diff' : 'Off'}
          </button>
        </Show>
        <select
          aria-label="Editor theme"
          value={props.editorTheme}
          onChange={(event): void => { props.onEditorTheme(event.currentTarget.value); }}
          style={{ 'margin-left': 'auto', 'min-width': '0', 'max-width': '120px' }}
        >
          {EDITOR_THEMES.map((theme) => (
            <option value={theme.name}>{theme.label}</option>
          ))}
        </select>
      </div>
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
