// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createSignal, JSX, Show } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntrySchema,
  AnnotationLayoutSchema,
  AnnotationStyleChangeSchema,
  StyleChangeType,
  StyleEditSchema,
  StyleEditState,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { EditorState } from '../state/editor_state';
import { HostAdapter } from '../adapters/host_adapter';

export interface TopBarProps {
  state: EditorState;
  adapter: HostAdapter;
}

type SaveStatus = 'saved' | 'saving' | 'error';

export const TopBar: Component<TopBarProps> = (props: TopBarProps): JSX.Element => {
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  const fileName: string = params.get('file') ?? params.get('name') ?? 'Untitled';

  const [saveStatus, setSaveStatus] = createSignal<SaveStatus | null>(null);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let isFirstRun: boolean = true;

  createEffect((): void => {
    const stylesheet = props.state.stylesheet();
    if (isFirstRun) { isFirstRun = false; return; }
    if (!props.adapter.canSave()) { return; }
    if (saveTimer !== null) { clearTimeout(saveTimer); }
    setSaveStatus('saving');
    saveTimer = setTimeout((): void => {
      saveTimer = null;
      props.adapter.save(stylesheet).then((result): void => {
        if (result.kind === 'err') {
          console.error(`archeglyph: failed to save: ${result.error.message}`);
          setSaveStatus('error');
        } else {
          setSaveStatus('saved');
        }
      });
    }, 800);
  });

  function onUndo(): void {
    props.state.undo();
  }

  function onRedo(): void {
    props.state.redo();
  }

  function onAddAnnotation(): void {
    const annotationId: string = crypto.randomUUID();
    const centerX: number = window.innerWidth / 2;
    const centerY: number = window.innerHeight / 2;

    const position = create(Vec2Schema, { x: centerX, y: centerY });
    const layout = create(AnnotationLayoutSchema, { position });
    const entry = create(AnnotationEntrySchema, { id: annotationId, content: [], layout });
    const change = create(AnnotationStyleChangeSchema, {
      annotationId,
      changeType: StyleChangeType.ADDED,
      after: entry,
    });
    const edit = create(StyleEditSchema, { annotationChanges: [change], state: StyleEditState.APPLIED });

    props.state.applyStyleEdit(edit);
  }

  return (
    <div style={{ display: 'flex', 'align-items': 'center', padding: '0 8px', height: '40px', background: 'var(--ag-panel)', 'border-bottom': '1px solid var(--ag-edge)' }}>
      <span style={{ flex: '1', 'font-size': '14px' }}>{fileName}</span>
      <Show when={props.adapter.canSave()}>
        <span style={{ 'margin-right': '8px', 'font-size': '12px', color: saveStatus() === 'error' ? 'var(--ag-danger)' : 'var(--ag-fg-3)' }}>
          {saveStatus() === 'saving' ? 'Saving…' : saveStatus() === 'saved' ? 'Saved' : saveStatus() === 'error' ? 'Save failed' : ''}
        </span>
      </Show>
      <button disabled={!props.state.canUndo()} onClick={onUndo}>Undo</button>
      <button disabled={!props.state.canRedo()} onClick={onRedo}>Redo</button>
      <button onClick={onAddAnnotation}>+ Annotation</button>
    </div>
  );
};
