// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import Resizable from '@corvu/resizable';
import { create } from '@bufbuild/protobuf';
import { Diagram, DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { getBundledTheme } from '@archeglyph/themes';
import { applyEditorTheme, DEFAULT_EDITOR_THEME, findEditorTheme, EDITOR_THEMES } from './editor_theme';
import { AdapterError, LoadResult } from '../adapters/host_adapter';
import { Result } from '@archeglyph/proto/util/result';
import { EditorState } from '../state/editor_state';
import { createEditorState } from '../state/create_editor_state';
import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';
import { Canvas } from '../canvas/canvas';
import { ElementKind, SelectedElement, SelectionContext, SelectionState } from '../canvas/selection';
import { TopBar } from './top_bar';
import { Inspector } from './inspector';
import { AdapterPair, selectAdapters } from './select_adapters';
import { createUiState } from '../ui_state/ui_state';
import { Scene, createScene } from '../scene/scene';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createBrowserElk } from '@archeglyph/core/layout/elk_host_browser';
import { createSaveController, SaveController } from './save_controller';
import { FileSync, syncToFile } from './external_change';

const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createBrowserElk()));

export const App: Component<{}> = (): JSX.Element => {
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  const pair: AdapterPair = selectAdapters(params);
  // The DOCUMENT's palette — part of the style file, and what
  // `archeglyph render` uses. Independent of the chrome below.
  const theme: Theme = getBundledTheme('blueprint');

  // The APPLICATION's palette. An editor preference, never document data:
  // it is not written to the diagram or the style file, and the two are free
  // to disagree (dark chrome around a light document is a normal thing to
  // want). Persisted per browser; a stored name that no longer exists falls
  // back rather than leaving the chrome unstyled.
  const storedChrome: string | null = (() => {
    try { return localStorage.getItem('archeglyph.editorTheme'); } catch { return null; }
  })();
  const [chrome, setChrome] = createSignal(
    findEditorTheme(storedChrome ?? DEFAULT_EDITOR_THEME) ?? EDITOR_THEMES[0],
  );
  createEffect((): void => {
    const active = chrome();
    applyEditorTheme(active, document.documentElement);
    try { localStorage.setItem('archeglyph.editorTheme', active.name); } catch { /* private window */ }
  });
  const ui = createUiState();
  const autoLoad: boolean = params.has('d') || params.has('s') || params.has('fetch') || params.has('gh') || params.has('pr') || params.has('issue');
  const [state, setState] = createSignal<EditorState | null>(null);
  const [scene, setScene] = createSignal<Scene | null>(null);
  const [saveController, setSaveController] = createSignal<SaveController | null>(null);
  let fileSync: FileSync | undefined;
  const [getSelected, setSelectedSignal] = createSignal<SelectedElement | null>(null);
  const selection: SelectionState = {
    selected: (): SelectedElement | null => {
      const selected = getSelected();
      if (selected === null) { return null; }
      return selected;
    },
    setSelected: (element: SelectedElement | null): void => {
      setSelectedSignal(element);
    },
  };
  createEffect((): void => {
    const selected = ui.selection()[0];
    if (selected === undefined) {
      selection.setSelected(null);
      return;
    }
    const kind = selected.kind === 'node' ? ElementKind.NODE
      : selected.kind === 'group' ? ElementKind.GROUP
      : selected.kind === 'edge' ? ElementKind.EDGE
      : ElementKind.ANNOTATION;
    selection.setSelected({ id: selected.id, kind });
  });

  function installState(nextState: EditorState): void {
    saveController()?.dispose();
    fileSync?.stop();
    fileSync = undefined;
    setState(nextState);
    setScene(createScene(nextState, () => theme, layoutEngine));
  }

  function startSession(nextState: EditorState, result: LoadResult): void {
    installState(nextState);
    setSaveController(createSaveController(pair.adapter, nextState, 800));
    // The file is the truth. Anything that rewrites it -- an agent, the CLI,
    // another editor -- wins, and the canvas follows. No reconciliation, no
    // prompt: a suggestion from an agent never lands here (it goes to
    // pendingEdits and touches nothing committed), so an incoming change is
    // always a decision someone made, and last write wins is the right answer
    // rather than a compromise. See D14.
    fileSync?.stop();
    fileSync = syncToFile(pair.adapter, result.stamp, (stylesheet: Stylesheet): void => {
      nextState.adoptStylesheet(stylesheet);
    });
  }

  function loadFrom(result: Result<LoadResult, AdapterError>): void {
    if (result.kind === 'err') {
      console.error(`archeglyph: failed to load diagram: ${result.error.message}`);
      return;
    }
    // A diagram authored without a style file gets the theme's starting
    // components written in as real bindings, rather than the resolver
    // assuming them. They show up in the inspector as ordinary entries the
    // user can change or remove, and they save to the style file like
    // anything else -- which is the whole point of seeding rather than
    // defaulting.
    const loaded: Stylesheet = result.value.stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 });
    const stylesheet: Stylesheet = seedComponentBindings(result.value.diagram, loaded, theme);
    startSession(createEditorState(result.value.diagram, stylesheet), result.value);
  }

  function onOpen(): void { pair.adapter.load().then(loadFrom); }

  function onNew(): void {
    installState(createEditorState(create(DiagramSchema, {}), create(StylesheetSchema, {})));
    
    const current: EditorState | null = state();
    if (current !== null) {
      setSaveController(createSaveController(pair.adapter, current, 800));
    }
  }

  onMount((): void => {
    if (autoLoad) { pair.adapter.load().then(loadFrom); }
    function onKeyDown(e: KeyboardEvent): void {
      const currentState: EditorState | null = state();
      if (currentState === null) { return; }
      if (e.metaKey && e.shiftKey && e.key === 'z') { currentState.redo(); }
      else if (e.metaKey && e.key === 'z') { currentState.undo(); }
    }
    document.addEventListener('keydown', onKeyDown);
    onCleanup((): void => document.removeEventListener('keydown', onKeyDown));
    onCleanup((): void => {
      saveController()?.dispose();
      fileSync?.stop();
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
          <TopBar
            state={state()!}
            adapter={pair.adapter}
            saveController={saveController()}
            editorTheme={chrome().name}
            onEditorTheme={(name: string): void => { setChrome(findEditorTheme(name) ?? EDITOR_THEMES[0]); }}
          />
          <Resizable style={{ flex: '1', overflow: 'hidden' }}>
            <Resizable.Panel initialSize={0.7} minSize={0.2} style={{ height: '100%', overflow: 'hidden' }}>
              <Show when={scene() !== null}>
                <Canvas diagram={state()!.diagram()} layoutEngine={layoutEngine} scene={scene()!} stylesheet={state()!.stylesheet()} theme={theme} ui={ui} state={state()!} />
              </Show>
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
