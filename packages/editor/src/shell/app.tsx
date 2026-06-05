// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import Resizable from '@corvu/resizable';
import { create } from '@bufbuild/protobuf';
import { Diagram, DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { Theme, ThemeSchema } from '@archeglyph/proto/gen/theme_pb';
import { LoadResult } from '../adapters/host_adapter';
import { EditorState } from '../state/editor_state';
import { createEditorState } from '../state/create_editor_state';
import { Canvas } from '../canvas/canvas';
import { SelectedElement, SelectionContext, SelectionState } from '../canvas/selection';
import { TopBar } from './top_bar';
import { Inspector } from './inspector';
import { AdapterPair, selectAdapters } from './select_adapters';

export const App: Component<{}> = (): JSX.Element => {
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  const pair: AdapterPair = selectAdapters(params);
  const theme: Theme = create(ThemeSchema, {});
  const autoLoad: boolean = params.has('d') || params.has('s') || params.has('fetch') || params.has('gh') || params.has('pr') || params.has('issue');

  const [state, setState] = createSignal<EditorState | null>(null);

  const [getSelected, setSelectedSignal] = createSignal<SelectedElement | null>(null);
  const selection: SelectionState = {
    selected: getSelected,
    setSelected: (el: SelectedElement | null): void => { setSelectedSignal(el); },
  };

  function loadFrom(result: LoadResult): void {
    const stylesheet: Stylesheet = result.stylesheet ?? create(StylesheetSchema, {});
    setState(createEditorState(result.diagram, stylesheet));
  }

  function onOpen(): void {
    pair.adapter.load().then(loadFrom);
  }

  function onNew(): void {
    const diagram: Diagram = create(DiagramSchema, {});
    const stylesheet: Stylesheet = create(StylesheetSchema, {});
    setState(createEditorState(diagram, stylesheet));
  }

  onMount((): void => {
    if (autoLoad) {
      pair.adapter.load().then(loadFrom);
    }

    function onKeyDown(e: KeyboardEvent): void {
      const currentState: EditorState | null = state();
      if (currentState === null) { return; }
      if (e.metaKey && e.shiftKey && e.key === 'z') {
        currentState.redo();
      } else if (e.metaKey && e.key === 'z') {
        currentState.undo();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    onCleanup((): void => {
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  return (
    <SelectionContext.Provider value={selection}>
      <div style={{ display: 'flex', 'flex-direction': 'column', height: '100%' }}>
        <Show when={state() !== null} fallback={
          <Show when={!autoLoad}>
            <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', height: '100%', gap: '12px' }}>
              <div style={{ 'font-size': '20px', 'font-weight': '600', 'margin-bottom': '8px' }}>archeglyph</div>
              <button onClick={onOpen} style={{ padding: '8px 20px', 'font-size': '14px', cursor: 'pointer' }}>Open file…</button>
              <button onClick={onNew} style={{ padding: '8px 20px', 'font-size': '14px', cursor: 'pointer' }}>New diagram</button>
            </div>
          </Show>
        }>
          <TopBar state={state()!} adapter={pair.adapter} />
          <Resizable style={{ flex: '1', overflow: 'hidden' }}>
            <Resizable.Panel initialSize={0.7} minSize={0.2} style={{ height: '100%', overflow: 'hidden' }}>
              <Canvas state={state()!} theme={theme} />
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel initialSize={'280px'} minSize={'200px'} style={{ height: '100%', overflow: 'hidden' }}>
              <Inspector state={state()!} />
            </Resizable.Panel>
          </Resizable>
        </Show>
      </div>
    </SelectionContext.Provider>
  );
};
