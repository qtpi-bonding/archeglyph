// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationEntry,
  CanvasStyle,
  EdgeStyleEntry,
  GroupStyleEntry,
  NodeStyleEntry,
  StyleChangeType,
  StyleEdit,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { Result } from '@archeglyph/proto/util/result';
import { PipelineError, renderPipeline } from '@archeglyph/core/pipeline';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createBrowserElk } from '@archeglyph/core/layout/elk_host_browser';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { EditorState } from '../state/editor_state';
import { Vec2, ViewportState } from './viewport';
import { DragHandler } from './drag_handler';
import {
  ElementKind,
  useSelection,
} from './selection';

export interface CanvasProps {
  state: EditorState;
  theme: Theme;
}

type RenderSource = { diagram: Diagram; stylesheet: Stylesheet; theme: Theme };

function elementKindFromSvgId(svgId: string): ElementKind | null {
  if (svgId.startsWith('node-')) { return ElementKind.NODE; }
  else if (svgId.startsWith('group-')) { return ElementKind.GROUP; }
  else if (svgId.startsWith('edge-')) { return ElementKind.EDGE; }
  else if (svgId.startsWith('annotation-')) { return ElementKind.ANNOTATION; }
  else { return null; }
}

function elementIdFromSvgId(svgId: string): string {
  if (svgId.startsWith('node-')) { return svgId.slice(5); }
  else if (svgId.startsWith('group-')) { return svgId.slice(6); }
  else if (svgId.startsWith('edge-')) { return svgId.slice(5); }
  else if (svgId.startsWith('annotation-')) { return svgId.slice(11); }
  else { return svgId; }
}

function findElementTarget(target: EventTarget | null): { id: string; kind: ElementKind } | null {
  let el: Element | null = target instanceof Element ? target : null;
  while (el !== null) {
    const elId: string = el.id;
    const kind: ElementKind | null = elementKindFromSvgId(elId);
    if (kind !== null) {
      return { id: elementIdFromSvgId(elId), kind };
    } else {
      el = el.parentElement;
    }
  }
  return null;
}

function applyAllPendingEdits(stylesheet: Stylesheet): Stylesheet {
  let result: Stylesheet = stylesheet;
  for (const edit of stylesheet.pendingEdits) {
    result = applyStyleEditToStylesheet(result, edit);
  }
  return result;
}

/** Solid component (Component<CanvasProps>). Creates ViewportState + DragHandler per mount.
 * Pure consumer of SelectionContext — calls useSelection() to read/write the
 * current selection. SelectionContext.Provider lives one level above (in App).
 * Renders diagram via renderOp from @archeglyph/core. When
 * state.stylesheet().pending_edits is non-empty, renders two SVG layers:
 *   1. saved state (top, full opacity)
 *   2. saved+pending merged state (bottom, reduced opacity ghost)
 * Pointer events: pointerdown on an element → DragHandler.onPointerDown;
 * pointerdown on empty canvas → pan start (direct ViewportState mutation);
 * wheel → zoom (direct ViewportState mutation);
 * click without drag → setSelected via SelectionState. */

const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createBrowserElk()));

export const Canvas: Component<CanvasProps> = (props: CanvasProps): JSX.Element => {
  const viewport: ViewportState = Object.assign(new ViewportState(), { panX: 0, panY: 0, zoom: 1.0 });
  const drag: DragHandler = Object.assign(new DragHandler(), { state: props.state, viewport });

  const selection = useSelection();

  const [panX, setPanX] = createSignal<number>(0);
  const [panY, setPanY] = createSignal<number>(0);
  const [zoom, setZoom] = createSignal<number>(1.0);

  const savedSource = createMemo((): RenderSource => ({
    diagram: props.state.diagram(),
    stylesheet: props.state.stylesheet(),
    theme: props.theme,
  }));

  const [savedSvg] = createResource<string, RenderSource>(savedSource, async (src: RenderSource): Promise<string> => {
    const result: Result<string, PipelineError> = await renderPipeline(src.diagram, src.stylesheet, src.theme, layoutEngine);
    if (result.kind === 'err') { return ''; }
    else { return result.value; }
  });

  const ghostSource = createMemo((): RenderSource | false => {
    const stylesheet: Stylesheet = props.state.stylesheet();
    if (stylesheet.pendingEdits.length === 0) { return false; }
    else {
      const merged: Stylesheet = applyAllPendingEdits(stylesheet);
      return { diagram: props.state.diagram(), stylesheet: merged, theme: props.theme };
    }
  });

  const [ghostSvg] = createResource<string, RenderSource>(ghostSource, async (src: RenderSource): Promise<string> => {
    const result: Result<string, PipelineError> = await renderPipeline(src.diagram, src.stylesheet, src.theme, layoutEngine);
    if (result.kind === 'err') { return ''; }
    else { return result.value; }
  });

  const hasPending = createMemo((): boolean => props.state.stylesheet().pendingEdits.length > 0);

  const transform = createMemo((): string =>
    `translate(${panX()}px, ${panY()}px) scale(${zoom()})`
  );

  let panningFrom: Vec2 | null = null;
  let movedDuringPointerSession: boolean = false;
  let containerRef!: HTMLDivElement;
  let svgContainerRef!: HTMLDivElement;
  let draggedEl: SVGElement | null = null;
  let draggedElOriginalTransform: string = '';

  function svgIdPrefix(kind: ElementKind): string {
    if (kind === ElementKind.NODE) { return 'node-'; }
    else if (kind === ElementKind.GROUP) { return 'group-'; }
    else if (kind === ElementKind.EDGE) { return 'edge-'; }
    else { return 'annotation-'; }
  }

  createEffect((): void => {
    const offset: Vec2 | null = drag.dragOffset();
    if (offset !== null) {
      const session = drag.activeSession();
      if (session === null) { return; }
      if (draggedEl === null) {
        const svgId: string = svgIdPrefix(session.elementKind) + session.elementId;
        draggedEl = svgContainerRef.querySelector<SVGElement>(`#${svgId}`) ?? null;
        if (draggedEl !== null) {
          draggedElOriginalTransform = draggedEl.getAttribute('transform') ?? '';
        }
      }
      if (draggedEl !== null) {
        draggedEl.setAttribute('transform', `${draggedElOriginalTransform} translate(${offset.x}, ${offset.y})`);
      }
    } else {
      if (draggedEl !== null) {
        if (draggedElOriginalTransform !== '') {
          draggedEl.setAttribute('transform', draggedElOriginalTransform);
        } else {
          draggedEl.removeAttribute('transform');
        }
        draggedEl = null;
        draggedElOriginalTransform = '';
      }
    }
  });

  onMount((): void => {
    const wheelHandler = (e: WheelEvent): void => {
      e.preventDefault();
      const scaleFactor: number = e.deltaY > 0 ? 0.9 : 1.1;
      viewport.zoom = viewport.zoom * scaleFactor;
      setZoom(viewport.zoom);
    };
    containerRef.addEventListener('wheel', wheelHandler, { passive: false });
    onCleanup((): void => {
      containerRef.removeEventListener('wheel', wheelHandler);
    });
  });

  function onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    movedDuringPointerSession = false;
    const screenPt: Vec2 = { x: e.clientX, y: e.clientY };
    const elTarget: { id: string; kind: ElementKind } | null = findElementTarget(e.target);
    if (elTarget !== null) {
      drag.onPointerDown(elTarget.id, elTarget.kind, screenPt);
    } else {
      panningFrom = screenPt;
    }
  }

  function onPointerMove(e: PointerEvent): void {
    const screenPt: Vec2 = { x: e.clientX, y: e.clientY };
    if (panningFrom !== null) {
      movedDuringPointerSession = true;
      const dx: number = e.clientX - panningFrom.x;
      const dy: number = e.clientY - panningFrom.y;
      viewport.panX = viewport.panX + dx;
      viewport.panY = viewport.panY + dy;
      setPanX(viewport.panX);
      setPanY(viewport.panY);
      panningFrom = screenPt;
    } else if (drag.dragOffset() !== null) {
      movedDuringPointerSession = true;
      drag.onPointerMove(screenPt);
    } else {
      // no-op — no active pan or drag session
    }
  }

  function onPointerUp(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (panningFrom !== null) {
      panningFrom = null;
    } else {
      drag.onPointerUp();
    }
  }

  function onClick(e: MouseEvent): void {
    if (!movedDuringPointerSession) {
      const elTarget: { id: string; kind: ElementKind } | null = findElementTarget(e.target);
      if (elTarget !== null) {
        selection.setSelected({ id: elTarget.id, kind: elTarget.kind });
      } else {
        selection.setSelected(null);
      }
    } else {
      // no-op — pointer moved during session, not a clean click
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#fff', 'touch-action': 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      <div style={{ transform: transform(), position: 'absolute', 'transform-origin': '0 0' }}>
        <Show when={hasPending()}>
          <div
            style={{ position: 'absolute', top: '0', left: '0', opacity: '0.3' }}
            innerHTML={ghostSvg() ?? ''}
          />
        </Show>
        <div
          ref={svgContainerRef}
          style={{ position: 'absolute', top: '0', left: '0' }}
          innerHTML={savedSvg() ?? ''}
        />
      </div>
    </div>
  );
};
