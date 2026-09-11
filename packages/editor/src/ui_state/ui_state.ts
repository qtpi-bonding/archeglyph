// SPDX-License-Identifier: AGPL-3.0-or-later

import { Accessor, createSignal, Setter } from 'solid-js';

export function createUiState(): UiState {
  const [selection, setSelection] = createSignal<ElementRef[]>([]);
  const [hover, setHover] = createSignal<ElementRef | undefined>(undefined);
  const [tool, setTool] = createSignal<Tool>('select');
  const [viewport, setViewport] = createSignal<Viewport>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });

  return {
    selection,
    setSelection,
    hover,
    setHover,
    tool,
    setTool,
    viewport,
    setViewport,
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
  tool: Accessor<Tool>;
  setTool: Setter<Tool>;
  viewport: Accessor<Viewport>;
  setViewport: Setter<Viewport>;
}
export type Tool = 'select' | 'hand' | 'annotation';
