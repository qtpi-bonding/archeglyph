// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createMemo, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { Bounds } from '@archeglyph/core/geometry/bounds';
import { Vec2 } from '@archeglyph/core/geometry/vec2';
import { Scene, SceneGeometry } from '../scene/scene';
import { Handle, handleAtPoint, hitTestPoint } from '../scene/hit_test';
import { ElementRef, UiState } from '../ui_state/ui_state';
import { ContainerRect, fitBoundsToRect, screenToDiagram } from '../ui_state/viewport_math';
import { cursorFor } from './cursor';
import { DiagramLayer } from './diagram_layer';
import { GhostLayer } from './ghost_layer';
import { OverlayLayer } from './overlay_layer';
import { routePress, exceedsThreshold, GestureDecision } from '../gestures/pointer_router';
import { MoveSession, MarqueeSession, PanSession, ResizeSession, moveCommit, moveUpdate, marqueeCommit, marqueeUpdate, panUpdate, resizeCommit, resizeUpdate } from '../gestures/drag_machines';
import { applyWheel } from '../gestures/wheel_handler';
import { handleKeyDown } from '../gestures/keyboard_handler';
import { EditorState } from '../state/editor_state';
import { ScenePreview } from '../scene/preview';

type Point = { x: number; y: number };
type CanvasWheelEvent = PointerEvent | WheelEvent;
type GestureSession =
  | { kind: 'pending'; decision: GestureDecision; originScreen: Vec2; originDiagram: Vec2 }
  | { kind: 'pan'; session: PanSession }
  | { kind: 'move'; session: MoveSession }
  | { kind: 'resize'; session: ResizeSession }
  | { kind: 'marquee'; session: MarqueeSession };

export interface CanvasProps {
  diagram: Diagram;
  layoutEngine: LayoutEngine;
  scene: Scene;
  stylesheet: Stylesheet;
  theme: Theme;
  ui: UiState;
  state: EditorState;
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
  const [errorVisible, setErrorVisible] = createSignal<boolean>(false);
  const [fitDone, setFitDone] = createSignal<boolean>(false);
  const [pointerOrigin, setPointerOrigin] = createSignal<Point | undefined>(undefined);
  const [gesture, setGesture] = createSignal<GestureSession | undefined>(undefined);
  const [preview, setPreview] = createSignal<ScenePreview | undefined>(undefined);
  const [marquee, setMarquee] = createSignal<Bounds | undefined>(undefined);
  const [handle, setHandle] = createSignal<Handle | undefined>(undefined);
  let containerRef!: HTMLDivElement;
  let pointerId: number | undefined;

  const geometry = createMemo((): SceneGeometry | undefined => props.scene.geometry());
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
    event.preventDefault();
    containerRef.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    const hit: ElementRef | undefined = hitAt(event);
    const screen: Vec2 = pointFromEvent(event);
    const diagram: Vec2 = screenToDiagram(props.ui.viewport(), containerRect(), screen);
    const currentGeometry: SceneGeometry | undefined = geometry();
    const onHandle: Handle | undefined = currentGeometry === undefined
      ? undefined
      : handleAtPoint(currentGeometry, props.ui.selection(), diagram, 8 / props.ui.viewport().zoom);
    const decision: GestureDecision = routePress({
      point: diagram,
      hit,
      tool: props.ui.tool(),
      button: event.button,
      additive: event.shiftKey || event.metaKey,
      onHandle,
    }, props.ui.selection());
    if (decision.selection !== undefined) { props.ui.setSelection(decision.selection); }
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
    } else if (active?.kind === 'marquee' && currentGeometry !== undefined) {
      const selected = marqueeCommit(currentGeometry, marqueeUpdate(active.session, currentDiagram));
      props.ui.setSelection(selected);
    }
    setGesture(undefined);
    setPreview(undefined);
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

  onMount((): void => {
    refreshRect();
    const observer: ResizeObserver = new ResizeObserver(refreshRect);
    observer.observe(containerRef);
    containerRef.addEventListener('wheel', onWheel, { passive: false });
    const onKeyDown = (event: KeyboardEvent): void => {
      const handled: boolean = handleKeyDown(event, { state: props.state, ui: props.ui, geometry: geometry(), rect: containerRect(), save: (): void => undefined });
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
    const sceneError = props.scene.error();
    if (sceneError !== undefined) { setErrorVisible(true); }
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
          <DiagramLayer svg={geometry()?.svg ?? ''} dimmed={gesture()?.kind === 'move' ? (gesture() as { kind: 'move'; session: MoveSession }).session.refs : []} />
          <Show when={geometry() !== undefined}>
            <OverlayLayer geometry={geometry()!} selection={props.ui.selection()} hover={props.ui.hover()} zoom={props.ui.viewport().zoom} preview={preview()} marquee={marquee()} />
          </Show>
        </g>
      </svg>
      <Show when={errorVisible() && props.scene.error() !== undefined}>
        <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', padding: '8px 12px', background: 'var(--ag-error, #fee)', color: 'var(--ag-error-text, #600)', 'z-index': '2' }}>
          <span>{props.scene.error()!.message}</span>
          <button aria-label="Dismiss error" onClick={(): void => { setErrorVisible(false); }} style={{ float: 'right' }}>×</button>
        </div>
      </Show>
    </div>
  );
};
