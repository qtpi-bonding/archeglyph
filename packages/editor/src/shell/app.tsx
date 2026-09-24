// SPDX-License-Identifier: MPL-2.0

import { batch, Component, createEffect, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { Vec2 } from '@archeglyph/core/geometry/vec2';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { getBundledTheme } from '@archeglyph/themes';
import { applyEditorTheme, DEFAULT_EDITOR_THEME, findEditorTheme, EDITOR_THEMES } from './editor_theme';
import { readUrlParams, reviewOpen, selectedProposal } from './url_params';
import { selectDiagramSource } from './select_diagram_source';
import { createDiffState, type DiffState } from '../diff/diff_state';
import type { Delta, Diagram } from '@archeglyph/proto/gen/content_pb';
import { FilePickerDiagramSource } from '../diff/file_picker_diagram_source';
import type { DiagramSource } from '../diff/diagram_source';
import { diffRefsFrom, type DiffRefs } from '../diff/diff_refs';
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
import { createSceneSlot, type SceneSlot } from '../scene/scene_slot';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createBrowserElk } from '@archeglyph/core/layout/elk_host_browser';
import { createSaveController, SaveController } from './save_controller';
import { FileSync, syncToFile } from './external_change';
import { IslandFrame } from './island_frame';
import { Toolbar } from './toolbar';
import { FileIsland } from './file_island';
import { ZoomIsland } from './zoom_island';
import { UndoIsland } from './undo_island';
import { StateIsland } from './state_island';
import { EchoIsland } from './echo_island';
import { ECHO_LINGER_MS, gestureTokens, type EchoToken } from './key_echo';
import { StartScreen } from './start_screen';
import { CommandContext, COMMANDS, runCommand } from '../gestures/commands';
import { CommandId, KEYMAP } from '../ui_state/keymap';
import { CommandPalette } from './command_palette';
import { HelpSheet } from './help_sheet';
import { commandPaletteItems, elementPaletteItems } from './palette_items';
import { PaletteAction } from './palette_item';
import { centerBoundsInRect } from '../ui_state/viewport_math';
import { elementKey } from '../scene/element_key';
import { ContextMenu } from './context_menu';
import { contextMenuItems } from './menu_items';
import { PendingBanner } from '../pending/pending_banner';
import { PendingPanel } from '../pending/pending_panel';
import { pendingItems } from '../pending/pending_model';
import { mergeThreads } from '../pending/merge_threads';
import { newComment } from '../pending/comment_builder';
import { CommentBackend } from '../adapters/comment_backend';

const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createBrowserElk()));

type CommandContextAccessor = () => CommandContext;
type MaybeCommandContextAccessor = CommandContextAccessor | undefined;

export const App: Component<{}> = (): JSX.Element => {
  const params: URLSearchParams = readUrlParams(window.location);
  const pair: AdapterPair = selectAdapters(params);
  // The editor binds one theme as `default`, which is what an unqualified
  // `component` in the stylesheet resolves against.
  const themes: ReadonlyMap<string, Theme> = new Map([['default', getBundledTheme('blueprint')]]);
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
  const refs: DiffRefs = diffRefsFrom(params);
  const [sessionName, setSessionName] = createSignal<string>(
    params.get('file') ?? params.get('name') ?? 'Untitled',
  );
  const diff: DiffState = createDiffState(() => state()?.diagram(), sessionName);
  const sceneSlot: SceneSlot = createSceneSlot();
  const scene: () => Scene | null = sceneSlot.scene;
  const [loading, setLoading] = createSignal<boolean>(autoLoad);
  const [loadError, setLoadError] = createSignal<string | undefined>(undefined);
  const [commandContext, setCommandContext] = createSignal<MaybeCommandContextAccessor>(undefined);
  const [dismissedError, setDismissedError] = createSignal<SceneError | undefined>(undefined);
  const [contextMenuPoint, setContextMenuPoint] = createSignal<Vec2 | undefined>(undefined);
  const [expanded, setExpanded] = createSignal<boolean>(reviewOpen(params));
  const [selectedPendingId, setSelectedPendingId] = createSignal<string | undefined>(selectedProposal(params));
  const [syncError, setSyncError] = createSignal<string | undefined>(undefined);
  const [comparedTo, setComparedTo] = createSignal<string | undefined>(undefined);
  const [diffOn, setDiffOn] = createSignal<boolean>(true);
  const activeDelta = (): Delta | undefined => (diffOn() ? diff.delta() : undefined);
  const standIn = (): Diagram | undefined => (diffOn() ? undefined : diff.baseStandIn());
  let focusInspector: (() => void) | undefined;
  const [saveController, setSaveController] = createSignal<SaveController | null>(null);
  let fileSync: FileSync | undefined;

  function onSave(): void { void saveController()?.saveNow(); }
  function onFocusInspector(): void { focusInspector?.(); }
  function onCommand(id: CommandId): void {
    const accessor: MaybeCommandContextAccessor = commandContext();
    if (accessor !== undefined) { runCommand(id, accessor()); }
  }

  function onOverlayClose(): void {
    ui.setOverlay(undefined);
  }

  function onContextMenuClose(): void {
    setContextMenuPoint(undefined);
  }

  function onContextMenuChoose(id: CommandId): void {
    onContextMenuClose();
    onCommand(id);
  }

  function onPaletteChoose(action: PaletteAction): void {
    onOverlayClose();
    if (action.kind === 'command') {
      onCommand(action.command);
      return;
    }
    ui.setSelection([action.ref]);
    const accessor: MaybeCommandContextAccessor = commandContext();
    const context: CommandContext | undefined = accessor === undefined ? undefined : accessor();
    const entry = scene()?.geometry()?.byKey[elementKey(action.ref)];
    if (context !== undefined && entry !== undefined) {
      context.ui.setViewport(centerBoundsInRect(context.ui.viewport(), entry.bounds, context.rect));
    }
  }

  function installState(nextState: EditorState): void {
    saveController()?.dispose();
    fileSync?.stop();
    fileSync = undefined;
    // Batched: the Show below is gated on state(), and Canvas reads
    // scene().geometry(). An unbatched setState flushes the render with
    // scene() still null, which the `scene={scene()!}` assertion hides from
    // tsc and which no test sees, because nothing mounts App.
    batch((): void => {
      sceneSlot.install((): Scene =>
        createScene(nextState, () => themes, layoutEngine, activeDelta, standIn));
      setState(nextState);
    });
  }

  function startSession(nextState: EditorState, result: LoadResult): void {
    installState(nextState);
    setSaveController(createSaveController(pair.adapter, nextState, 800));
    fileSync?.stop();
    fileSync = syncToFile(pair.adapter, result.stamp, (stylesheet: Stylesheet): void => {
      nextState.adoptStylesheet(stylesheet);
    });
  }

  async function loadFrom(result: Result<LoadResult, AdapterError>): Promise<void> {
    if (result.kind === 'err') {
      setLoading(false);
      setLoadError(`archeglyph: failed to load diagram: ${result.error.message}`);
      return;
    }
    setLoadError(undefined);
    const loaded: Stylesheet = result.value.stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 });
    let stylesheet: Stylesheet = seedComponentBindings(result.value.diagram, loaded, themes.get('default'));
    const backend: CommentBackend | undefined = pair.backend;
    if (backend !== undefined) {
      setSyncError(undefined);
      const threads = await backend.fetchThreads();
      if (threads.kind === 'ok') {
        stylesheet = mergeThreads(stylesheet, threads.value);
      } else {
        setSyncError(threads.error.message);
      }
    }
    setLoading(false);
    if (result.value.fileName !== undefined) {
      setSessionName(result.value.fileName);
    }
    startSession(createEditorState(result.value.diagram, stylesheet), result.value);
  }

  async function onReply(editRef: string, body: string): Promise<void> {
    setSyncError(undefined);
    const comment = await newComment(body, 'user:local');
    state()?.addComment(editRef, comment);
    const backend: CommentBackend | undefined = pair.backend;
    if (backend !== undefined) {
      const posted = await backend.postComment(editRef, comment);
      if (posted.kind === 'err') {
        setSyncError(posted.error.message);
      }
    }
  }

  function pendingAccept(editId: string): void {
    state()?.acceptPending(editId);
  }

  function pendingReject(editId: string): void {
    state()?.rejectPending(editId);
  }

  function onOpen(): void {
    setLoading(true);
    setLoadError(undefined);
    void pair.adapter.load().then(loadFrom);
  }

  async function attachFrom(source: DiagramSource, ref: string, asTarget: boolean): Promise<void> {
    const result = await source.load();
    if (result.kind === 'err') {
      setSyncError(`archeglyph: failed to load the file to compare: ${result.error.message}`);
      return;
    }
    setSyncError(undefined);
    diff.attach(result.value, ref, asTarget);
    setComparedTo(ref);
  }

  function onCompare(): void {
    const source: FilePickerDiagramSource = new FilePickerDiagramSource();
    void source.load().then((result): void => {
      if (result.kind === 'err') {
        setSyncError(`archeglyph: failed to load the file to compare: ${result.error.message}`);
        return;
      }
      const name: string = source.fileName() ?? 'attached';
      setSyncError(undefined);
      diff.attach(result.value, name, true);
      setComparedTo(name);
    });
  }

  function onClearComparison(): void {
    diff.detach();
    setComparedTo(undefined);
    setDiffOn(true);
  }

  function onToggleDiff(): void {
    setDiffOn((on: boolean): boolean => !on);
  }

  function onSwapDirection(): void {
    diff.swap();
  }

  onMount((): void => {
    if (autoLoad) {
      setLoading(true);
      void pair.adapter.load().then(loadFrom);
      const source: DiagramSource | undefined = selectDiagramSource(params);
      if (source !== undefined) {
        void attachFrom(source, refs.base === '' ? 'base' : refs.base, false);
      }
    }
    onCleanup((): void => {
      saveController()?.dispose();
      fileSync?.stop();
      sceneSlot.dispose();
    });
  });

  const [flash, setFlash] = createSignal<ReadonlyArray<EchoToken>>([]);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  const onKeyEcho = (tokens: ReadonlyArray<EchoToken> | undefined): void => {
    if (flashTimer !== undefined) { clearTimeout(flashTimer); }
    setFlash(tokens ?? []);
    if (tokens === undefined) { return; }
    flashTimer = setTimeout((): void => { setFlash([]); }, ECHO_LINGER_MS);
  };
  onCleanup((): void => {
    if (flashTimer !== undefined) { clearTimeout(flashTimer); }
  });
  const echoTokens = (): ReadonlyArray<EchoToken> => {
    const gesture = ui.modalGesture();
    return gesture === undefined ? flash() : gestureTokens(gesture);
  };

  let lastSceneError: SceneError | undefined;
  createEffect((): void => {
    const error = scene()?.error();
    if (error !== lastSceneError) {
      lastSceneError = error;
      setDismissedError(undefined);
    }
  });

  return (
    <Show
      when={state() !== null}
      fallback={<StartScreen loading={loading()} error={loadError()} onOpen={onOpen} />}
    >
      <>
      <IslandFrame
        canvas={
          <Canvas
            diagram={state()!.diagram()}
            delta={activeDelta()}
            layoutEngine={layoutEngine}
            scene={scene()!}
            stylesheet={state()!.stylesheet()}
            themes={themes}
            ui={ui}
            state={state()!}
            onFocusInspector={onFocusInspector}
            onSave={onSave}
            onContextMenu={(point: Vec2): void => { setContextMenuPoint(point); }}
            onKeyEcho={onKeyEcho}
            onCompare={onCompare}
            onClearComparison={onClearComparison}
            onToggleDiff={onToggleDiff}
            onSwapDirection={onSwapDirection}
            registerCommandContext={(getContext: () => CommandContext): void => {
              setCommandContext((): CommandContextAccessor => getContext);
            }}
          />
        }
        toolbar={<Toolbar tool={ui.tool()} onCommand={onCommand} />}
        inspector={
          <Show when={scene()?.geometry()}>
            {(geometry) => (
              <Inspector
                state={state()!}
                ui={ui}
                geometry={geometry()}
                themes={themes}
                registerFocus={(focus: () => void): void => { focusInspector = focus; }}
              />
            )}
          </Show>
        }
        file={
          <FileIsland
            fileName={sessionName()}
            dirty={state()!.dirty()}
            canSave={pair.adapter.canSave()}
            status={saveController()?.status()}
            errorMessage={saveController()?.errorMessage()}
            onSave={onSave}
            editorTheme={chrome().name}
            onEditorTheme={(name: string): void => { setChrome(findEditorTheme(name) ?? EDITOR_THEMES[0]); }}
            comparedTo={comparedTo()}
            diffOn={diffOn()}
            attachedIsTarget={diff.attachedIsTarget()}
            onCompare={onCompare}
            onToggleDiff={onToggleDiff}
            onSwapDirection={onSwapDirection}
          />
        }
        pending={
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px', width: '100%', 'min-height': '0' }}>
            <PendingBanner
              count={pendingItems(state()!.stylesheet()).length}
              expanded={expanded()}
              onToggle={(): void => { setExpanded(!expanded()); }}
            />
            <Show when={expanded()}>
              <PendingPanel
                items={pendingItems(state()!.stylesheet())}
                selectedId={selectedPendingId()}
                onSelect={setSelectedPendingId}
                onAccept={pendingAccept}
                onReject={pendingReject}
                onReply={(editRef: string, body: string): void => { void onReply(editRef, body); }}
                syncError={syncError()}
              />
            </Show>
          </div>
        }
        zoom={<ZoomIsland onCommand={onCommand} />}
        undo={<UndoIsland canUndo={state()!.canUndo()} canRedo={state()!.canRedo()} onCommand={onCommand} />}
        state={
          <StateIsland
            error={scene()?.error() !== dismissedError() ? scene()?.error()?.message : undefined}
            onDismiss={(): void => { setDismissedError(scene()?.error()); }}
          />
        }
        echo={<EchoIsland tokens={echoTokens()} />}
      />
      <Show when={contextMenuPoint()} keyed>
        {(point) => (
          <ContextMenu
            items={contextMenuItems(ui.selection(), COMMANDS, KEYMAP)}
            at={point}
            onChoose={onContextMenuChoose}
            onClose={onContextMenuClose}
          />
        )}
      </Show>
      <Show when={ui.overlay() === 'palette'} keyed>
        <CommandPalette
          items={commandPaletteItems(COMMANDS, KEYMAP).concat(
            scene()?.geometry() === undefined
              ? []
              : elementPaletteItems(scene()!.geometry()!.diagram),
          )}
          onChoose={onPaletteChoose}
          onClose={onOverlayClose}
        />
      </Show>
      <Show when={ui.overlay() === 'help'} keyed>
        <HelpSheet commands={COMMANDS} keymap={KEYMAP} onClose={onOverlayClose} />
      </Show>
      </>
    </Show>
  );
};
