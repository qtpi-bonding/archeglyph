// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createMemo, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet, Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { Bounds } from '@archeglyph/core/geometry/bounds';
import { Vec2 } from '@archeglyph/core/geometry/vec2';
import { Scene, SceneGeometry } from '../scene/scene';
import { Handle, handleAtPoint, hitTestPoint } from '../scene/hit_test';
import { ElementRef, UiState } from '../ui_state/ui_state';
import { centerBoundsInRect, ContainerRect, fitBoundsToRect, screenToDiagram } from '../ui_state/viewport_math';
import { cursorFor } from './cursor';
import { DiagramLayer } from './diagram_layer';
import { GhostLayer } from './ghost_layer';
import { OverlayLayer } from './overlay_layer';
import { routePress, exceedsThreshold, GestureDecision } from '../gestures/pointer_router';
import { MoveSession, MarqueeSession, PanSession, ResizeSession, moveCommit, moveUpdate, marqueeCommit, marqueeUpdate, panUpdate, resizeCommit, resizeUpdate } from '../gestures/drag_machines';
import { applyWheel } from '../gestures/wheel_handler';
import { handleKeyDown } from '../gestures/keyboard_handler';
import { CommandContext } from '../gestures/commands';
import { EditorState } from '../state/editor_state';
import { ScenePreview } from '../scene/preview';
import { elementKey } from '../scene/element_key';
import { anchorGripAt } from '../scene/anchor_grip';
import { calloutPreviews } from '../scene/callout_preview';
import { AnchorSession, anchorCommit, anchorUpdate } from '../gestures/anchor_machine';
import { addAnnotationEdit, setAnnotationTextEdit } from '../state/edits/annotation';
import { NEW_ANNOTATION_SIZE, NEW_ANNOTATION_TEXT, newAnnotationId } from '../state/edits/annotation_defaults';
import { TextEditor } from './text_editor';
import { init } from '@archeglyph/proto/util/init';
import { modalPreview } from '../gestures/modal_apply';

type Point = { x: number; y: number };
type CanvasWheelEvent = PointerEvent | WheelEvent;
type GestureSession =
  | { kind: 'pending'; decision: GestureDecision; originScreen: Vec2; originDiagram: Vec2 }
  | { kind: 'pan'; session: PanSession }
  | { kind: 'move'; session: MoveSession }
  | { kind: 'resize'; session: ResizeSession }
  | { kind: 'anchor'; session: AnchorSession }
  | { kind: 'marquee'; session: MarqueeSession };

export interface CanvasProps {
  diagram: Diagram;
  layoutEngine: LayoutEngine;
  scene: Scene;
  stylesheet: Stylesheet;
  theme: Theme;
  ui: UiState;
  state: EditorState;
  /** Called by the shell after a canvas interaction changes the selection. */
  onFocusInspector?: () => void;
  /** Called for the Save command. The canvas owns the keydown listener, so
      Cmd/Ctrl+S is dead without it. */
  onSave?: () => void;
  /** Registers an accessor for the live command context owned by the canvas. */
  registerCommandContext: (getContext: () => CommandContext) => void;
}

function pointFromEvent(event: CanvasWheelEvent): Vec2 {
  return { x: event.clientX, y: event.clientY };
}

/** The single SVG scene and its navigation and selection gestures. */
export const Canvas: Component<CanvasProps> = (props: CanvasProps): JSX.Element => {
  const [containerRect, setContainerRect] = createSignal<ContainerRect>({
    left: 0, top: 0, width: 0, height: 0,
  });
  const [panning, setPanning] = createSignal<boolean>(false);
  const [fitDone, setFitDone] = createSignal<boolean>(false);
  const [pointerOrigin, setPointerOrigin] = createSignal<Point | undefined>(undefined);
  const [gesture, setGesture] = createSignal<GestureSession | undefined>(undefined);
  const [preview, setPreview] = createSignal<ScenePreview | undefined>(undefined);
  const [marquee, setMarquee] = createSignal<Bounds | undefined>(undefined);
  const [handle, setHandle] = createSignal<Handle | undefined>(undefined);
  const [anchorLine, setAnchorLine] = createSignal<Array<Vec2> | undefined>(undefined);
  const [editorFallback, setEditorFallback] = createSignal<Bounds | undefined>(undefined);
  let containerRef!: HTMLDivElement;
  let pointerId: number | undefined;

  const geometry = createMemo((): SceneGeometry | undefined => props.scene.geometry());
  const overlayPreview = createMemo((): ScenePreview | undefined => {
    const modal = props.ui.modalGesture();
    if (modal !== undefined) {
      const currentGeometry = geometry();
      return currentGeometry === undefined ? undefined : modalPreview(modal, currentGeometry);
    }
    return preview();
  });
  // The diagram's own background, painted edge to edge by the canvas element
  // rather than as a slab inside the injected SVG (see diagram_layer's
  // injectDiagram). Falls back to the chrome token before the first scene.
  const background = createMemo((): string => {
    const value: string | undefined = geometry()?.diagram.canvas?.background?.value;
    return value === undefined || value === '' ? 'var(--ag-bg, #0f1a2b)' : value;
  });
  // The D12 drafting grid: dots on the intersections, faint lines between.
  // Tied to the viewport so it pans and zooms with the diagram rather than
  // floating over it — a grid that does not track the content reads as
  // wallpaper instead of graph paper.
  const gridSize = createMemo((): number => 24 * props.ui.viewport().zoom);
  const gridPosition = createMemo((): string => {
    const viewport = props.ui.viewport();
    return `${viewport.panX}px ${viewport.panY}px`;
  });
  const hovering = createMemo((): boolean => props.ui.hover() !== undefined);
  const cursor = createMemo((): string => cursorFor(props.ui.tool(), hovering(), panning(), handle()));
  const transform = createMemo((): string => {
    const viewport = props.ui.viewport();
    return `translate(${viewport.panX} ${viewport.panY}) scale(${viewport.zoom})`;
  });

  function refreshRect(): void {
    const rect: DOMRect = containerRef.getBoundingClientRect();
    setContainerRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  }

  function hitAt(event: PointerEvent): ElementRef | undefined {
    const currentGeometry: SceneGeometry | undefined = geometry();
    if (currentGeometry === undefined) { return undefined; }
    const diagramPoint: Vec2 = screenToDiagram(props.ui.viewport(), containerRect(), pointFromEvent(event));
    return hitTestPoint(currentGeometry, diagramPoint, 6 / props.ui.viewport().zoom);
  }

  function onPointerDown(event: PointerEvent): void {
    props.ui.setModalGesture(undefined);
    event.preventDefault();
    const screen: Vec2 = pointFromEvent(event);
    const diagram: Vec2 = screenToDiagram(props.ui.viewport(), containerRect(), screen);
    const hit: ElementRef | undefined = hitAt(event);
    if (event.detail === 2 && hit?.kind === 'annotation') {
      setGesture(undefined);
      props.ui.setSelection([hit]);
      props.ui.setTextEditTarget(hit);
      return;
    }
    containerRef.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    const currentGeometry: SceneGeometry | undefined = geometry();
    const onHandle: Handle | undefined = currentGeometry === undefined
      ? undefined
      : handleAtPoint(currentGeometry, props.ui.selection(), diagram, 8 / props.ui.viewport().zoom);
    const onAnchorGrip: ElementRef | undefined = currentGeometry === undefined
      ? undefined
      : anchorGripAt(currentGeometry, props.ui.selection(), diagram, 8 / props.ui.viewport().zoom);
    const decision: GestureDecision = routePress({
      point: diagram,
      hit,
      tool: props.ui.tool(),
      button: event.button,
      additive: event.shiftKey || event.metaKey,
      onHandle,
      onAnchorGrip,
    }, props.ui.selection());
    // Selecting does NOT move keyboard focus into the inspector. Focus
    // belongs to the canvas so arrow keys nudge and the chords reach
    // handleKeyDown; Cmd+I is the deliberate way into the panel. The build
    // added a focus call here that the spec does not ask for, and because
    // pointerdown is preventDefault'd the inspector then kept focus through
    // the whole drag -- so its stale X/Y was written back on the next blur.
    if (decision.selection !== undefined) {
      props.ui.setSelection(decision.selection);
    }
    if (decision.kind === 'create-annotation') {
      const id: string = newAnnotationId(props.stylesheet, 'annotation');
      const ref: ElementRef = { kind: 'annotation', id };
      props.state.applyStyleEdit(addAnnotationEdit(props.stylesheet, id, create(Vec2Schema, diagram), NEW_ANNOTATION_TEXT));
      props.ui.setSelection([ref]);
      setEditorFallback({ minX: diagram.x, minY: diagram.y, maxX: diagram.x + NEW_ANNOTATION_SIZE.x, maxY: diagram.y + NEW_ANNOTATION_SIZE.y });
      props.ui.setTextEditTarget(ref);
      setGesture(undefined);
      return;
    }
    if (decision.kind !== 'none') {
      setGesture({ kind: 'pending', decision, originScreen: screen, originDiagram: diagram });
    }
  }

  function onPointerMove(event: PointerEvent): void {
    const currentScreen: Vec2 = pointFromEvent(event);
    const currentDiagram: Vec2 = screenToDiagram(props.ui.viewport(), containerRect(), currentScreen);
    const currentGesture: GestureSession | undefined = gesture();
    let active: GestureSession | undefined = currentGesture;
    if (currentGesture?.kind === 'pending') {
      if (!exceedsThreshold(currentGesture.originScreen, currentScreen)) { return; }
      const decision: GestureDecision = currentGesture.decision;
      if (decision.kind === 'pan') {
        const session: PanSession = { origin: currentGesture.originScreen, viewport: props.ui.viewport() };
        setGesture({ kind: 'pan', session });
        setPanning(true);
        active = { kind: 'pan', session };
      } else if (decision.kind === 'move') {
        const session: MoveSession = { refs: decision.selection ?? props.ui.selection(), origin: currentGesture.originDiagram };
        setGesture({ kind: 'move', session });
        active = { kind: 'move', session };
      } else if (decision.kind === 'resize' && decision.handle !== undefined) {
        const selection: Array<ElementRef> = props.ui.selection();
        if (selection.length !== 1) { return; }
        const session: ResizeSession = { ref: selection[0], handle: decision.handle, origin: currentGesture.originDiagram };
        setGesture({ kind: 'resize', session });
        setHandle(session.handle);
        active = { kind: 'resize', session };
      } else if (decision.kind === 'anchor' && decision.ref !== undefined) {
        const session: AnchorSession = init(new AnchorSession(), { ref: decision.ref });
        setGesture({ kind: 'anchor', session });
        active = { kind: 'anchor', session };
      } else if (decision.kind === 'marquee') {
        const session: MarqueeSession = { origin: currentGesture.originDiagram };
        setGesture({ kind: 'marquee', session });
        active = { kind: 'marquee', session };
      } else {
        return;
      }
    }
    if (active?.kind === 'pan') { props.ui.setViewport(panUpdate(active.session, currentScreen)); return; }
    if (active?.kind === 'move') {
      const currentGeometry: SceneGeometry | undefined = geometry();
      if (currentGeometry !== undefined) { setPreview(moveUpdate(active.session, currentGeometry, currentDiagram)); }
      return;
    }
    if (active?.kind === 'resize') {
      const currentGeometry: SceneGeometry | undefined = geometry();
      if (currentGeometry !== undefined) { setPreview(resizeUpdate(active.session, currentGeometry, currentDiagram, event.shiftKey)); }
      return;
    }
    if (active?.kind === 'anchor') {
      const currentGeometry: SceneGeometry | undefined = geometry();
      if (currentGeometry !== undefined) {
        const hit: ElementRef | undefined = hitAt(event);
        setAnchorLine(anchorUpdate(active.session, currentGeometry, currentDiagram, hit));
      }
      return;
    }
    if (active?.kind === 'marquee') { setMarquee(marqueeUpdate(active.session, currentDiagram)); return; }

    const hit: ElementRef | undefined = hitAt(event);
    props.ui.setHover(hit);
    const currentGeometry: SceneGeometry | undefined = geometry();
    const hoveredHandle: Handle | undefined = currentGeometry === undefined
      ? undefined
      : handleAtPoint(currentGeometry, props.ui.selection(), currentDiagram, 8 / props.ui.viewport().zoom);
    setHandle(hoveredHandle);
  }

  function onPointerUp(event: PointerEvent): void {
    if (pointerId === event.pointerId) {
      containerRef.releasePointerCapture(event.pointerId);
      pointerId = undefined;
    }
    const active: GestureSession | undefined = gesture();
    const currentDiagram: Vec2 = screenToDiagram(props.ui.viewport(), containerRect(), pointFromEvent(event));
    const currentGeometry: SceneGeometry | undefined = geometry();
    if (active?.kind === 'move' && currentGeometry !== undefined) {
      const edit = moveCommit(active.session, currentGeometry, props.stylesheet, currentDiagram);
      if (edit !== undefined) { props.state.applyStyleEdit(edit); }
    } else if (active?.kind === 'resize' && currentGeometry !== undefined) {
      const edit = resizeCommit(active.session, currentGeometry, props.stylesheet, currentDiagram, event.shiftKey);
      if (edit !== undefined) { props.state.applyStyleEdit(edit); }
    } else if (active?.kind === 'anchor') {
      const hit: ElementRef | undefined = hitAt(event);
      props.state.applyStyleEdit(anchorCommit(active.session, props.stylesheet, hit));
    } else if (active?.kind === 'marquee' && currentGeometry !== undefined) {
      const selected = marqueeCommit(currentGeometry, marqueeUpdate(active.session, currentDiagram));
      props.ui.setSelection(selected);
    }
    setGesture(undefined);
    setPreview(undefined);
    setAnchorLine(undefined);
    setMarquee(undefined);
    setPanning(false);
    setHandle(undefined);
    setPointerOrigin(undefined);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    props.ui.setViewport(applyWheel(props.ui.viewport(), containerRect(), {
      deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode,
      ctrlKey: event.ctrlKey, point: pointFromEvent(event),
    }));
  }

  function annotationText(ref: ElementRef): string {
    return props.stylesheet.annotations[ref.id]?.content.find((entry) => entry.locale === 'en')?.source ?? NEW_ANNOTATION_TEXT;
  }

  function editorBounds(ref: ElementRef): Bounds | undefined {
    return geometry()?.byKey[elementKey(ref)]?.bounds ?? editorFallback();
  }

  function dimmedRefs(): Array<ElementRef> {
    const modal = props.ui.modalGesture();
    const refs: Array<ElementRef> = modal !== undefined
      ? modal.kind === 'grab'
        ? modal.refs.slice()
        : modal.refs.length === 0 ? [] : [modal.refs[0]]
      : (() => {
        const current = gesture();
        return current?.kind === 'move'
          ? current.session.refs.slice()
          : current?.kind === 'resize'
            ? [current.session.ref]
            : [];
      })();
    const currentGeometry = geometry();
    const currentPreview = overlayPreview();
    if (currentGeometry !== undefined && currentPreview !== undefined) {
      for (const edge of calloutPreviews(currentGeometry, currentPreview.bounds)) {
        const ref: ElementRef = { kind: 'annotation', id: edge.id };
        if (!refs.some((candidate) => elementKey(candidate) === elementKey(ref))) { refs.push(ref); }
      }
    }
    return refs;
  }

  onMount((): void => {
    refreshRect();
    const observer: ResizeObserver = new ResizeObserver(refreshRect);
    observer.observe(containerRef);
    containerRef.addEventListener('wheel', onWheel, { passive: false });
    const beginTextEdit = (ref: ElementRef): void => {
      setEditorFallback(undefined);
      const currentGeometry: SceneGeometry | undefined = geometry();
      const entry = currentGeometry?.byKey[elementKey(ref)];
      if (entry === undefined && ref.kind === 'annotation') {
        const position = props.stylesheet.annotations[ref.id]?.layout?.position;
        if (position !== undefined) {
          setEditorFallback({
            minX: position.x,
            minY: position.y,
            maxX: position.x + NEW_ANNOTATION_SIZE.x,
            maxY: position.y + NEW_ANNOTATION_SIZE.y,
          });
        }
      }
      if (entry !== undefined) {
        const viewport = props.ui.viewport();
        const minX: number = entry.bounds.minX * viewport.zoom + viewport.panX;
        const maxX: number = entry.bounds.maxX * viewport.zoom + viewport.panX;
        const minY: number = entry.bounds.minY * viewport.zoom + viewport.panY;
        const maxY: number = entry.bounds.maxY * viewport.zoom + viewport.panY;
        if (minX < 0 || maxX > containerRect().width || minY < 0 || maxY > containerRect().height) {
          props.ui.setViewport(centerBoundsInRect(viewport, entry.bounds, containerRect()));
        }
      }
      props.ui.setTextEditTarget(ref);
    };
    // Keep the context construction in one place.  The registered accessor and
    // the keyboard route must observe the same live canvas state; in
    // particular, rect and geometry must not be captured at mount time.
    const getCommandContext = (): CommandContext => ({
      state: props.state,
      ui: props.ui,
      geometry: geometry(),
      rect: containerRect(),
      save: (): void => { props.onSave?.(); },
      focusInspector: props.onFocusInspector,
      beginTextEdit,
    });
    props.registerCommandContext(getCommandContext);
    const onKeyDown = (event: KeyboardEvent): void => {
      const handled: boolean = handleKeyDown(event, getCommandContext());
      if (handled) { event.preventDefault(); }
    };
    document.addEventListener('keydown', onKeyDown);
    onCleanup((): void => {
      observer.disconnect();
      containerRef.removeEventListener('wheel', onWheel);
      document.removeEventListener('keydown', onKeyDown);
    });
  });

  createEffect((): void => {
    const currentGeometry: SceneGeometry | undefined = geometry();
    const rect: ContainerRect = containerRect();
    if (!fitDone() && currentGeometry !== undefined && rect.width > 0 && rect.height > 0) {
      const bounds: Bounds = currentGeometry.contentBounds;
      props.ui.setViewport(fitBoundsToRect(bounds, rect, 24));
      setFitDone(true);
    }
  });

  return (
    <div
      ref={containerRef}
      data-archeglyph-canvas="true"
      tabIndex={-1}
      style={{
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
        'background-color': background(),
        'background-image': 'var(--ag-grid)',
        'background-size': `${gridSize()}px ${gridSize()}px`,
        'background-position': gridPosition(),
        'touch-action': 'none', cursor: cursor(),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        <g transform={transform()}>
          <GhostLayer diagram={props.diagram} stylesheet={props.stylesheet} theme={props.theme} layoutEngine={props.layoutEngine} />
          <DiagramLayer svg={geometry()?.svg ?? ''} dimmed={dimmedRefs()} />
          <Show when={geometry() !== undefined}>
            <OverlayLayer geometry={geometry()!} selection={props.ui.selection()} hover={props.ui.hover()} zoom={props.ui.viewport().zoom} preview={overlayPreview()} anchorLine={anchorLine()} marquee={marquee()} />
          </Show>
          <Show when={props.ui.textEditTarget() !== undefined && editorBounds(props.ui.textEditTarget()!) !== undefined}>
            <TextEditor
              text={annotationText(props.ui.textEditTarget()!)}
              bounds={editorBounds(props.ui.textEditTarget()!)!}
              onCommit={(text: string): void => {
                const target = props.ui.textEditTarget();
                if (target !== undefined) { props.state.applyStyleEdit(setAnnotationTextEdit(props.stylesheet, target.id, text)); }
                props.ui.setTextEditTarget(undefined);
              }}
              onCancel={(): void => { props.ui.setTextEditTarget(undefined); }}
            />
          </Show>
        </g>
      </svg>
    </div>
  );
};
