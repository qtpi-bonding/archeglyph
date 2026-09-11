// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createMemo, JSX, onCleanup, onMount } from 'solid-js';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { Scene } from '../scene/scene';
import { ElementRef, UiState } from '../ui_state/ui_state';
import { ElementKind } from './selection';

export interface CanvasProps {
  diagram: Diagram;
  layoutEngine: LayoutEngine;
  scene: Scene;
  stylesheet: Stylesheet;
  theme: Theme;
  ui: UiState;
}

type ElementTarget = { id: string; kind: ElementKind };

type Point = { x: number; y: number };

function elementKindFromSvgId(svgId: string): ElementKind | undefined {
  if (svgId.startsWith('node-')) { return ElementKind.NODE; }
  if (svgId.startsWith('group-')) { return ElementKind.GROUP; }
  if (svgId.startsWith('edge-')) { return ElementKind.EDGE; }
  if (svgId.startsWith('annotation-')) { return ElementKind.ANNOTATION; }
  return undefined;
}

function elementIdFromSvgId(svgId: string): string {
  if (svgId.startsWith('node-')) { return svgId.slice(5); }
  if (svgId.startsWith('group-')) { return svgId.slice(6); }
  if (svgId.startsWith('edge-')) { return svgId.slice(5); }
  if (svgId.startsWith('annotation-')) { return svgId.slice(11); }
  return svgId;
}

function findElementTarget(target: EventTarget | null): ElementTarget | undefined {
  let element: Element | null = target instanceof Element ? target : null;
  while (element !== null) {
    const kind: ElementKind | undefined = elementKindFromSvgId(element.id);
    if (kind !== undefined) {
      return { id: elementIdFromSvgId(element.id), kind };
    }
    element = element.parentElement;
  }
  return undefined;
}

function toElementRef(target: ElementTarget): ElementRef {
  const kind = target.kind === ElementKind.NODE ? 'node'
    : target.kind === ElementKind.GROUP ? 'group'
    : target.kind === ElementKind.EDGE ? 'edge'
    : 'annotation';
  return { id: target.id, kind };
}

/** Canvas view. Geometry comes from scene; transient interaction state comes from ui. */
export const Canvas: Component<CanvasProps> = (props: CanvasProps): JSX.Element => {
  const transform = createMemo((): string => {
    const viewport = props.ui.viewport();
    return `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`;
  });

  let containerRef!: HTMLDivElement;
  let panningFrom: Point | undefined;
  let movedDuringPointerSession: boolean = false;

  onMount((): void => {
    const wheelHandler = (event: WheelEvent): void => {
      event.preventDefault();
      const viewport = props.ui.viewport();
      const scaleFactor: number = event.deltaY > 0 ? 0.9 : 1.1;
      props.ui.setViewport({ ...viewport, zoom: viewport.zoom * scaleFactor });
    };
    containerRef.addEventListener('wheel', wheelHandler, { passive: false });
    onCleanup((): void => containerRef.removeEventListener('wheel', wheelHandler));
  });

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    movedDuringPointerSession = false;
    const target: ElementTarget | undefined = findElementTarget(event.target);
    if (target === undefined) {
      panningFrom = { x: event.clientX, y: event.clientY };
    } else {
      props.ui.setSelection([toElementRef(target)]);
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (panningFrom === undefined) { return; }
    movedDuringPointerSession = true;
    const dx: number = event.clientX - panningFrom.x;
    const dy: number = event.clientY - panningFrom.y;
    const viewport = props.ui.viewport();
    props.ui.setViewport({ ...viewport, panX: viewport.panX + dx, panY: viewport.panY + dy });
    panningFrom = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    panningFrom = undefined;
  }

  function onClick(event: MouseEvent): void {
    if (movedDuringPointerSession) { return; }
    const target: ElementTarget | undefined = findElementTarget(event.target);
    if (target === undefined) {
      props.ui.setSelection([]);
    } else {
      props.ui.setSelection([toElementRef(target)]);
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
        <div
          style={{ position: 'absolute', top: '0', left: '0' }}
          innerHTML={props.scene.geometry()?.svg ?? ''}
        />
      </div>
    </div>
  );
};
