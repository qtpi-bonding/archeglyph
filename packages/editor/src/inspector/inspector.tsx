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
import { ShapeSection } from './sections/shape_section';
import { LineSection } from './sections/line_section';
import { TypographySection } from './sections/typography_section';
import { GroupSection } from './sections/group_section';
import { AnnotationSection } from './sections/annotation_section';

export interface InspectorProps {
  state: EditorState;
  ui: UiState;
  geometry: SceneGeometry;
  themes: ReadonlyMap<string, Theme>;
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

  const SECTION_TITLES: Record<SectionId, string> = {
    layout: 'Layout',
    shape: 'Shape',
    line: 'Line',
    typography: 'Typography',
    group: 'Group',
    annotation: 'Annotation',
  };

  const section = (id: SectionId): JSX.Element => {
    const current: InspectorModelOption = model();
    if (current === undefined) {
      return <></>;
    }
    if (id === 'layout') {
      return <LayoutSection state={props.state} model={current} geometry={props.geometry} />;
    }
    if (id === 'shape') {
      return <ShapeSection state={props.state} model={current} geometry={props.geometry} />;
    }
    if (id === 'line') {
      return <LineSection state={props.state} model={current} geometry={props.geometry} />;
    }
    if (id === 'group') {
      return <GroupSection state={props.state} model={current} geometry={props.geometry} />;
    }
    if (id === 'annotation') {
      return <AnnotationSection state={props.state} model={current} geometry={props.geometry} />;
    }
    if (id === 'typography') {
      return <TypographySection state={props.state} model={current} geometry={props.geometry} theme={props.themes.get('default')} />;
    }
    return <></>;
  };

  return (
    <div
      class="ag-island ag-inspector"
      ref={panel}
      tabIndex={-1}
      onKeyDown={leavePanel}
      style={{
        'max-height': '100%',
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
            {(id) => (
              <div>
                <div class="ag-section-title">{SECTION_TITLES[id]}</div>
                {section(id)}
              </div>
            )}
          </For>
        )}
      </Show>
    </div>
  );
};
