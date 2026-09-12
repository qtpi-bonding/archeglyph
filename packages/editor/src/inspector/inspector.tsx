// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createMemo, For, JSX, onMount, Show } from 'solid-js';
import type { Theme } from '@archeglyph/proto/gen/theme_pb';
import type { EditorState } from '../state/editor_state';
import type { SceneGeometry } from '../scene/scene';
import type { UiState } from '../ui_state/ui_state';
import { inspectorModel } from './model';
import type { InspectorModelOption, SectionId } from './model';
import { renderableSections } from './inspector_sections';
import { LayoutSection } from './sections/layout_section';
import { TypographySection } from './sections/typography_section';

export interface InspectorProps {
  state: EditorState;
  ui: UiState;
  geometry: SceneGeometry;
  theme: Theme;
  registerFocus: (focus: () => void) => void;
}

/**
 * The editable part of the inspector. Section membership belongs to
 * renderableSections; this component deliberately has no second filter or
 * fallback for sections which this pillar does not ship.
 */
export const Inspector: Component<InspectorProps> = (
  props: InspectorProps,
): JSX.Element => {
  const model = createMemo<InspectorModelOption>(() => (
    inspectorModel(props.ui.selection())
  ));
  let panel!: HTMLDivElement;

  onMount((): void => {
    props.registerFocus((): void => {
      panel.querySelector<HTMLInputElement>('input')?.focus();
    });
  });

  const leavePanel = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    const canvas: HTMLElement | null = document.querySelector<HTMLElement>(
      '[data-archeglyph-canvas="true"]',
    );
    canvas?.focus();
  };

  const section = (id: SectionId): JSX.Element => {
    const current: InspectorModelOption = model();
    if (current === undefined) {
      return <></>;
    }
    if (id === 'layout') {
      return <LayoutSection state={props.state} model={current} geometry={props.geometry} />;
    }
    if (id === 'typography') {
      return <TypographySection state={props.state} model={current} geometry={props.geometry} theme={props.theme} />;
    }
    return <></>;
  };

  return (
    <div
      ref={panel}
      tabIndex={-1}
      onKeyDown={leavePanel}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '8px',
        'box-sizing': 'border-box',
        'font-size': '12px',
        color: 'var(--ag-fg)',
        background: 'var(--ag-panel)',
      }}
    >
      <Show when={model()} fallback={<div style={{ color: 'var(--ag-fg-3)' }}>Nothing selected</div>}>
        {(current) => (
          <For each={renderableSections(current())}>
            {(id) => section(id)}
          </For>
        )}
      </Show>
    </div>
  );
};
