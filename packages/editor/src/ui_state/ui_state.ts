// SPDX-License-Identifier: MPL-2.0

import { Accessor, createSignal, Setter } from 'solid-js';
import { Overlay } from './overlay';
import type { ModalGesture } from './modal_gesture';

export function createUiState(): UiState {
  const [selection, setSelection] = createSignal<ElementRef[]>([]);
  const [hover, setHover] = createSignal<ElementRef | undefined>(undefined);
  const [textEditTarget, setTextEditTarget] = createSignal<ElementRef | undefined>(undefined);
  const [tool, setTool] = createSignal<Tool>('select');
  const [viewport, setViewport] = createSignal<Viewport>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });
  const [overlay, setOverlay] = createSignal<Overlay | undefined>(undefined);
  const [modalGesture, setModalGesture] = createSignal<ModalGesture | undefined>(undefined);

  return {
    selection,
    setSelection,
    hover,
    setHover,
    textEditTarget,
    setTextEditTarget,
    tool,
    setTool,
    viewport,
    setViewport,
    overlay,
    setOverlay,
    modalGesture,
    setModalGesture,
  };
}
export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}
export interface ElementRef {
  id: string;
  kind: 'node' | 'edge' | 'group' | 'annotation';
}
export interface UiState {
  selection: Accessor<ElementRef[]>;
  setSelection: Setter<ElementRef[]>;
  hover: Accessor<ElementRef | undefined>;
  setHover: Setter<ElementRef | undefined>;
  textEditTarget: Accessor<ElementRef | undefined>;
  setTextEditTarget: Setter<ElementRef | undefined>;
  tool: Accessor<Tool>;
  setTool: Setter<Tool>;
  viewport: Accessor<Viewport>;
  setViewport: Setter<Viewport>;
  overlay: Accessor<Overlay | undefined>;
  setOverlay: Setter<Overlay | undefined>;
  modalGesture: Accessor<ModalGesture | undefined>;
  setModalGesture: Setter<ModalGesture | undefined>;
}
export type Tool = 'select' | 'hand' | 'annotation';
