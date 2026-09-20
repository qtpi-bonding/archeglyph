// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createMemo, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { getBundledTheme } from '@archeglyph/themes';
import { applyEditorTheme, DEFAULT_EDITOR_THEME, findEditorTheme, EDITOR_THEMES } from './editor_theme';
import { readUrlParams } from './url_params';
import { AdapterError, LoadResult } from '../adapters/host_adapter';
import { Result } from '@archeglyph/proto/util/result';
import { EditorState } from '../state/editor_state';
import { createEditorState } from '../state/create_editor_state';
import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';
import { Canvas } from '../canvas/canvas';
import { Inspector } from '../inspector/inspector';
import { AdapterPair, selectAdapters } from './select_adapters';
import { createUiState } from '../ui_state/ui_state';
import { Scene, SceneError, createScene } from '../scene/scene';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createBrowserElk } from '@archeglyph/core/layout/elk_host_browser';
import { createSaveController, SaveController } from './save_controller';
import { FileSync, syncToFile } from './external_change';
import { IslandFrame } from './island_frame';
import { StartScreen } from './start_screen';
import { Toolbar } from './toolbar';
import { FileIsland } from './file_island';
import { ZoomIsland } from './zoom_island';
import { UndoIsland } from './undo_island';
import { StateIsland } from './state_island';
import { CommandContext, CommandId, COMMANDS, runCommand } from '../gestures/commands';
import { Tool } from '../ui_state/ui_state';

const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createBrowserElk()));

export const App: Component<{}> = (): JSX.Element => {
  // Content params (d, s) are read from the fragment, which the browser never
  // transmits; locators stay in the query. See readUrlParams.
  const params: URLSearchParams = readUrlParams(window.location);
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
  const fileName: string = params.get('file') ?? params.get('name') ?? 'Untitled';
  const [state, setState] = createSignal<EditorState | null>(null);
  const [scene, setScene] = createSignal<Scene | null>(null);
  const [loadError, setLoadError] = createSignal<string | undefined>(undefined);
  const [loading, setLoading] = createSignal<boolean>(autoLoad);
  const [commandContext, setCommandContext] = createSignal<(() => CommandContext) | undefined>(undefined);
  const [dismissedError, setDismissedError] = createSignal<SceneError | undefined>(undefined);
  let focusInspector: (() => void) | undefined;
  const [saveController, setSaveController] = createSignal<SaveController | null>(null);
  let fileSync: FileSync | undefined;

  // This wrapper is stable, while the inspector supplies its target after
  // mounting. Resolve the target when the callback is called, not here.
  function onSave(): void {
    void saveController()?.saveNow();
  }
  function onFocusInspector(): void {
    focusInspector?.();
  }

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
      setLoadError(`archeglyph: failed to load diagram: ${result.error.message}`);
      setLoading(false);
      return;
    }
    setLoading(false);
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

  function onOpen(): void {
    setLoadError(undefined);
    setLoading(true);
    pair.adapter.load().then(loadFrom);
  }

  function onCommand(command: CommandId): void {
    const accessor: (() => CommandContext) | undefined = commandContext();
    if (accessor !== undefined) { runCommand(command, accessor()); }
  }

  const activeMode = createMemo<string | undefined>(() => {
    const tool: Tool = ui.tool();
    if (tool === 'select') { return undefined; }
    const id: CommandId = `tool-${tool}` as CommandId;
    return COMMANDS.find((command): boolean => command.id === id)?.label;
  });

  createEffect((): void => {
    const current: SceneError | undefined = scene()?.error();
    if (current !== dismissedError()) { setDismissedError(undefined); }
  });

  onMount((): void => {
    if (autoLoad) {
      setLoading(true);
      pair.adapter.load().then(loadFrom);
    }
    onCleanup((): void => {
      saveController()?.dispose();
      fileSync?.stop();
    });
  });

  return (
    <Show when={state() !== null} fallback={<StartScreen loading={loading()} error={loadError()} onOpen={onOpen} />}>
      <IslandFrame
        canvas={<Canvas diagram={state()!.diagram()} layoutEngine={layoutEngine} scene={scene()!} stylesheet={state()!.stylesheet()} theme={theme} ui={ui} state={state()!} onFocusInspector={onFocusInspector} onSave={onSave} registerCommandContext={(getContext: () => CommandContext): void => { setCommandContext(getContext); }} />}
        toolbar={<Toolbar tool={ui.tool()} onCommand={onCommand} />}
        inspector={<Show when={scene()?.geometry()}>{(geometry) => <Inspector state={state()!} ui={ui} geometry={geometry()} theme={theme} registerFocus={(focus: () => void): void => { focusInspector = focus; }} />}</Show>}
        file={<FileIsland fileName={fileName} dirty={state()!.dirty()} canSave={pair.adapter.canSave()} status={saveController()?.status()} errorMessage={saveController()?.errorMessage()} onSave={onSave} editorTheme={chrome().name} onEditorTheme={(name: string): void => { setChrome(findEditorTheme(name) ?? EDITOR_THEMES[0]); }} />}
        zoom={<ZoomIsland zoom={ui.viewport().zoom} onCommand={onCommand} />}
        undo={<UndoIsland canUndo={state()!.canUndo()} canRedo={state()!.canRedo()} onCommand={onCommand} />}
        state={<StateIsland mode={activeMode()} error={((): string | undefined => { const current = scene()?.error(); return current !== undefined && current !== dismissedError() ? current.message : undefined; })()} onDismiss={(): void => { setDismissedError(scene()?.error()); }} />}
      />
    </Show>
  );
};
