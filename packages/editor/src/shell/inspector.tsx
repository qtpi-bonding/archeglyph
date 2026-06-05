// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Match, Show, Switch } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import {
  GroupLayoutSchema,
  GroupStyleChange,
  GroupStyleChangeSchema,
  GroupStyleEntry,
  GroupStyleEntrySchema,
  NodeLayoutSchema,
  NodeStyleChange,
  NodeStyleChangeSchema,
  NodeStyleEntry,
  NodeStyleEntrySchema,
  StyleChangeKind,
  StyleChangeType,
  StyleEdit,
  StyleEditSchema,
  StyleEditState,
  Vec2,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { ElementKind, SelectedElement, useSelection } from '../canvas/selection';
import { EditorState } from '../state/editor_state';

export interface InspectorProps {
  state: EditorState;
}

function buildNodeEntry(existing: NodeStyleEntry | undefined, position?: Vec2, size?: Vec2): NodeStyleEntry {
  return create(NodeStyleEntrySchema, {
    layout: create(NodeLayoutSchema, {
      position: position !== undefined ? position : existing?.layout?.position,
      size: size !== undefined ? size : existing?.layout?.size,
      rotation: existing?.layout?.rotation,
    }),
    shape: existing?.shape,
    typography: existing?.typography,
    component: existing?.component,
    visibility: existing?.visibility,
  });
}

function buildGroupEntry(existing: GroupStyleEntry | undefined, position: Vec2): GroupStyleEntry {
  return create(GroupStyleEntrySchema, {
    layout: create(GroupLayoutSchema, {
      position,
      size: existing?.layout?.size,
      padding: existing?.layout?.padding,
      renderMode: existing?.layout?.renderMode,
      labelPosition: existing?.layout?.labelPosition,
    }),
    shape: existing?.shape,
    typography: existing?.typography,
    component: existing?.component,
  });
}

function applyNodeEdit(state: EditorState, nodeId: string, position?: Vec2, size?: Vec2): void {
  const existing: NodeStyleEntry | undefined = state.stylesheet().nodes[nodeId];
  const after: NodeStyleEntry = buildNodeEntry(existing, position, size);
  const change: NodeStyleChange = create(NodeStyleChangeSchema, {
    nodeId,
    changeType: StyleChangeType.MODIFIED,
    after,
    kinds: [StyleChangeKind.LAYOUT],
  });
  const edit: StyleEdit = create(StyleEditSchema, {
    state: StyleEditState.APPLIED,
    nodeChanges: [change],
  });
  state.applyStyleEdit(edit);
}

function applyGroupEdit(state: EditorState, groupId: string, position: Vec2): void {
  const existing: GroupStyleEntry | undefined = state.stylesheet().groups[groupId];
  const after: GroupStyleEntry = buildGroupEntry(existing, position);
  const change: GroupStyleChange = create(GroupStyleChangeSchema, {
    groupId,
    changeType: StyleChangeType.MODIFIED,
    after,
    kinds: [StyleChangeKind.LAYOUT],
  });
  const edit: StyleEdit = create(StyleEditSchema, {
    state: StyleEditState.APPLIED,
    groupChanges: [change],
  });
  state.applyStyleEdit(edit);
}

function numberFromEvent(e: Event): number {
  return Number((e.currentTarget as HTMLInputElement).value);
}

const inputStyle: JSX.CSSProperties = {
  width: '100%',
  'box-sizing': 'border-box',
  padding: '2px 4px',
  border: '1px solid #ccc',
  'border-radius': '2px',
  'font-size': '12px',
  background: '#fff',
  color: '#333',
};

const labelTextStyle: JSX.CSSProperties = {
  display: 'block',
  'font-size': '10px',
  color: '#888',
};

const sectionLabelStyle: JSX.CSSProperties = {
  'margin-bottom': '4px',
  color: '#888',
};

const fieldRowStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '4px',
};

const fieldRowBottomMarginStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '4px',
  'margin-bottom': '8px',
};

const NodeForm: Component<{ state: EditorState; id: string }> = (props): JSX.Element => {
  const position = (): Vec2 | undefined => props.state.stylesheet().nodes[props.id]?.layout?.position;
  const size = (): Vec2 | undefined => props.state.stylesheet().nodes[props.id]?.layout?.size;
  return (
    <div>
      <div style={{ 'font-weight': 'bold', 'margin-bottom': '8px' }}>Node</div>
      <div style={{ 'margin-bottom': '8px' }}>
        <span style={{ color: '#888' }}>id: </span>
        <span>{props.id}</span>
      </div>
      <div style={sectionLabelStyle}>position</div>
      <div style={fieldRowBottomMarginStyle}>
        <label style={{ flex: '1' }}>
          <span style={labelTextStyle}>x</span>
          <input
            type='number'
            value={position()?.x ?? 0}
            onInput={(e: Event): void => {
              const x: number = numberFromEvent(e);
              const y: number = position()?.y ?? 0;
              applyNodeEdit(props.state, props.id, create(Vec2Schema, { x, y }));
            }}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: '1' }}>
          <span style={labelTextStyle}>y</span>
          <input
            type='number'
            value={position()?.y ?? 0}
            onInput={(e: Event): void => {
              const x: number = position()?.x ?? 0;
              const y: number = numberFromEvent(e);
              applyNodeEdit(props.state, props.id, create(Vec2Schema, { x, y }));
            }}
            style={inputStyle}
          />
        </label>
      </div>
      <div style={sectionLabelStyle}>size</div>
      <div style={fieldRowStyle}>
        <label style={{ flex: '1' }}>
          <span style={labelTextStyle}>w</span>
          <input
            type='number'
            value={size()?.x ?? 0}
            onInput={(e: Event): void => {
              const w: number = numberFromEvent(e);
              const h: number = size()?.y ?? 0;
              applyNodeEdit(props.state, props.id, undefined, create(Vec2Schema, { x: w, y: h }));
            }}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: '1' }}>
          <span style={labelTextStyle}>h</span>
          <input
            type='number'
            value={size()?.y ?? 0}
            onInput={(e: Event): void => {
              const w: number = size()?.x ?? 0;
              const h: number = numberFromEvent(e);
              applyNodeEdit(props.state, props.id, undefined, create(Vec2Schema, { x: w, y: h }));
            }}
            style={inputStyle}
          />
        </label>
      </div>
    </div>
  );
};

const GroupForm: Component<{ state: EditorState; id: string }> = (props): JSX.Element => {
  const position = (): Vec2 | undefined => props.state.stylesheet().groups[props.id]?.layout?.position;
  return (
    <div>
      <div style={{ 'font-weight': 'bold', 'margin-bottom': '8px' }}>Group</div>
      <div style={{ 'margin-bottom': '8px' }}>
        <span style={{ color: '#888' }}>id: </span>
        <span>{props.id}</span>
      </div>
      <div style={sectionLabelStyle}>position</div>
      <div style={fieldRowStyle}>
        <label style={{ flex: '1' }}>
          <span style={labelTextStyle}>x</span>
          <input
            type='number'
            value={position()?.x ?? 0}
            onInput={(e: Event): void => {
              const x: number = numberFromEvent(e);
              const y: number = position()?.y ?? 0;
              applyGroupEdit(props.state, props.id, create(Vec2Schema, { x, y }));
            }}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: '1' }}>
          <span style={labelTextStyle}>y</span>
          <input
            type='number'
            value={position()?.y ?? 0}
            onInput={(e: Event): void => {
              const x: number = position()?.x ?? 0;
              const y: number = numberFromEvent(e);
              applyGroupEdit(props.state, props.id, create(Vec2Schema, { x, y }));
            }}
            style={inputStyle}
          />
        </label>
      </div>
    </div>
  );
};

const IdOnlyPanel: Component<{ label: string; id: string }> = (props): JSX.Element => {
  return (
    <div>
      <div style={{ 'font-weight': 'bold', 'margin-bottom': '8px' }}>{props.label}</div>
      <div>
        <span style={{ color: '#888' }}>id: </span>
        <span>{props.id}</span>
      </div>
    </div>
  );
};

function labelFor(kind: ElementKind): string {
  if (kind === ElementKind.NODE) { return 'Node'; }
  else if (kind === ElementKind.EDGE) { return 'Edge'; }
  else if (kind === ElementKind.GROUP) { return 'Group'; }
  else if (kind === ElementKind.ANNOTATION) { return 'Annotation'; }
  else { return 'Element'; }
}

export const Inspector: Component<InspectorProps> = (props: InspectorProps): JSX.Element => {
  const selection = useSelection();
  const selected = (): SelectedElement | null => selection.selected();

  return (
    <div style={{ width: '100%', height: '100%', background: '#fafafa', 'border-left': '1px solid #ddd', 'box-sizing': 'border-box', padding: '8px', 'font-size': '12px', color: '#333', overflow: 'auto' }}>
      <Show
        when={selected()}
        fallback={<div style={{ color: '#888' }}>Nothing selected</div>}
        keyed
      >
        {(sel) => (
          <Switch fallback={<IdOnlyPanel label={labelFor(sel.kind)} id={sel.id} />}>
            <Match when={sel.kind === ElementKind.NODE}>
              <NodeForm state={props.state} id={sel.id} />
            </Match>
            <Match when={sel.kind === ElementKind.GROUP}>
              <GroupForm state={props.state} id={sel.id} />
            </Match>
          </Switch>
        )}
      </Show>
    </div>
  );
};
