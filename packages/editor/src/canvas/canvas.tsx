// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createMemo, createSignal, JSX, onCleanup, onMount, Show } from 'solid-js';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { Bounds } from '@archeglyph/core/geometry/bounds';
import { Vec2 } from '@archeglyph/core/geometry/vec2';
import { Scene, SceneGeometry } from '../scene/scene';
import { hitTestPoint } from '../scene/hit_test';
import { ElementRef, UiState } from '../ui_state/ui_state';
import { clearSelection, replaceSelection, toggleSelection } from '../ui_state/selection_ops';
import { ContainerRect, fitBoundsToRect, screenToDiagram, zoomAboutPoint } from '../ui_state/viewport_math';
import { cursorFor } from './cursor';
import { DiagramLayer } from './diagram_layer';
import { GhostLayer } from './ghost_layer';
import { OverlayLayer } from './overlay_layer';

type Point = { x: number; y: number };
type CanvasWheelEvent = PointerEvent | WheelEvent;

export interface CanvasProps {
  diagram: Diagram;
  layoutEngine: LayoutEngine;
  scene: Scene;
  stylesheet: Stylesheet;
  theme: Theme;
  ui: UiState;
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
  const hovering = createMemo((): boolean => props.ui.hover() !== undefined);
  const cursor = createMemo((): string => cursorFor(props.ui.tool(), hovering(), panning()));
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

  function updateSelection(hit: ElementRef | undefined, event: PointerEvent): void {
    if (hit === undefined) {
      props.ui.setSelection(clearSelection());
    } else if (event.shiftKey || event.metaKey) {
      props.ui.setSelection(toggleSelection(props.ui.selection(), hit));
    } else {
      props.ui.setSelection(replaceSelection(hit));
    }
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    containerRef.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    const hit: ElementRef | undefined = hitAt(event);
    const hand = props.ui.tool() === 'hand';
    if (!hand && event.button !== 1) { updateSelection(hit, event); }
    if (hit === undefined || hand || event.button === 1) {
      setPanning(true);
      setPointerOrigin({ x: event.clientX, y: event.clientY });
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (panning()) {
      const origin: Point | undefined = pointerOrigin();
      if (origin === undefined) { return; }
      const viewport = props.ui.viewport();
      props.ui.setViewport({
        ...viewport,
        panX: viewport.panX + event.clientX - origin.x,
        panY: viewport.panY + event.clientY - origin.y,
      });
      setPointerOrigin({ x: event.clientX, y: event.clientY });
      return;
    }

    const hit: ElementRef | undefined = hitAt(event);
    props.ui.setHover(hit);
  }

  function onPointerUp(event: PointerEvent): void {
    if (pointerId === event.pointerId) {
      containerRef.releasePointerCapture(event.pointerId);
      pointerId = undefined;
    }
    setPanning(false);
    setPointerOrigin(undefined);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const viewport = props.ui.viewport();
    // A horizontal component is the reliable signal available on WheelEvent
    // for a two-finger scroll.  Keep the ordinary vertical wheel gesture as
    // zoom, while preserving trackpad scrolling when it supplies both axes.
    const trackpadScroll: boolean = !event.ctrlKey && (
      event.deltaX !== 0 || event.deltaMode !== WheelEvent.DOM_DELTA_LINE || !Number.isInteger(event.deltaY)
    );
    if (trackpadScroll) {
      props.ui.setViewport({ ...viewport, panX: viewport.panX - event.deltaX, panY: viewport.panY - event.deltaY });
      return;
    }
    const factor: number = Math.exp(-event.deltaY * 0.01);
    props.ui.setViewport(zoomAboutPoint(viewport, pointFromEvent(event), containerRect(), factor, 0.1, 8));
  }

  onMount((): void => {
    refreshRect();
    const observer: ResizeObserver = new ResizeObserver(refreshRect);
    observer.observe(containerRef);
    containerRef.addEventListener('wheel', onWheel, { passive: false });
    onCleanup((): void => {
      observer.disconnect();
      containerRef.removeEventListener('wheel', onWheel);
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
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: background(), 'touch-action': 'none', cursor: cursor() }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        <g transform={transform()}>
          <GhostLayer diagram={props.diagram} stylesheet={props.stylesheet} theme={props.theme} layoutEngine={props.layoutEngine} />
          <DiagramLayer svg={geometry()?.svg ?? ''} dimmed={[]} />
          <Show when={geometry() !== undefined}>
            <OverlayLayer geometry={geometry()!} selection={props.ui.selection()} hover={props.ui.hover()} zoom={props.ui.viewport().zoom} />
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
