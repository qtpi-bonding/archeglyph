// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { Accessor, createSignal, Setter } from 'solid-js';
import {
  AnnotationEntry,
  AnnotationEntrySchema,
  AnnotationLayoutSchema,
  AnnotationStyleChange,
  AnnotationStyleChangeSchema,
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
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { Option } from '@archeglyph/proto/util/result';
import { EditorState } from '../state/editor_state';
import { ElementKind } from './selection';
import { Vec2, ViewportState } from './viewport';

export type DragSession = {
  elementId: string;
  elementKind: ElementKind;
  startCanvasPt: Vec2;
};

/** Handles one pointer drag and commits it as one stylesheet edit. */
export class DragHandler {
  state!: EditorState;
  viewport!: ViewportState;

  private _session: Option<DragSession> = null;
  private readonly _getOffset: Accessor<Option<Vec2>>;
  private readonly _setOffset: Setter<Option<Vec2>>;

  constructor() {
    const [get, set] = createSignal<Option<Vec2>>(null);
    this._getOffset = get;
    this._setOffset = set;
  }

<<<<<<< HEAD
  dragOffset(): Option<Vec2> {
    return this._getOffset();
=======
  activeSession(): DragSession | null {
    return this._session;
>>>>>>> 3015428ce37465ea6881374f56533dff22ce0e90
  }

  onPointerDown(elementId: string, elementKind: ElementKind, startPt: Vec2): void {
    const startCanvasPt: Vec2 = this.viewport.toCanvas(startPt);
    this._session = { elementId, elementKind, startCanvasPt };
    this._setOffset({ x: 0, y: 0 });
  }

<<<<<<< HEAD
  onPointerMove(screenPt: Vec2): void {
    const session: Option<DragSession> = this._session;
    if (session === null) {
      return;
    }
    const currentCanvasPt: Vec2 = this.viewport.toCanvas(screenPt);
    this._setOffset({
      x: currentCanvasPt.x - session.startCanvasPt.x,
      y: currentCanvasPt.y - session.startCanvasPt.y,
    });
  }

  onPointerUp(): void {
    const session: Option<DragSession> = this._session;
    if (session === null) {
      return;
    }
    const offset: Vec2 = this._getOffset() ?? { x: 0, y: 0 };
    const edit: StyleEdit = buildDragEdit(this.state, session.elementId, session.elementKind, offset);
    this.state.applyStyleEdit(edit);
    this._session = null;
    this._setOffset(null);
  }
=======
>>>>>>> 9ed1d105356cf621b53a6b2bb2166a3473c1f1e7
}

function buildDragEdit(
  state: EditorState,
  elementId: string,
  elementKind: ElementKind,
  delta: Vec2,
): StyleEdit {
  const stylesheet = state.stylesheet();
  switch (elementKind) {
    case ElementKind.NODE: {
      const existing: NodeStyleEntry | undefined = stylesheet.nodes[elementId];
      const existingPos = existing?.layout?.position;
      const newX: number = (existingPos?.x ?? 0) + delta.x;
      const newY: number = (existingPos?.y ?? 0) + delta.y;
      const after: NodeStyleEntry = create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, {
          position: create(Vec2Schema, { x: newX, y: newY }),
          size: existing?.layout?.size,
          rotation: existing?.layout?.rotation,
        }),
        shape: existing?.shape,
        typography: existing?.typography,
        component: existing?.component,
        visibility: existing?.visibility,
      });
      const change: NodeStyleChange = create(NodeStyleChangeSchema, {
        nodeId: elementId,
        changeType: StyleChangeType.MODIFIED,
        after,
        kinds: [StyleChangeKind.LAYOUT],
      });
      return create(StyleEditSchema, {
        state: StyleEditState.APPLIED,
        nodeChanges: [change],
      });
    }
    case ElementKind.GROUP: {
      const existing: GroupStyleEntry | undefined = stylesheet.groups[elementId];
      const existingPos = existing?.layout?.position;
      const newX: number = (existingPos?.x ?? 0) + delta.x;
      const newY: number = (existingPos?.y ?? 0) + delta.y;
      const after: GroupStyleEntry = create(GroupStyleEntrySchema, {
        layout: create(GroupLayoutSchema, {
          position: create(Vec2Schema, { x: newX, y: newY }),
          size: existing?.layout?.size,
          padding: existing?.layout?.padding,
          renderMode: existing?.layout?.renderMode,
          labelPosition: existing?.layout?.labelPosition,
        }),
        shape: existing?.shape,
        typography: existing?.typography,
        component: existing?.component,
      });
      const change: GroupStyleChange = create(GroupStyleChangeSchema, {
        groupId: elementId,
        changeType: StyleChangeType.MODIFIED,
        after,
        kinds: [StyleChangeKind.LAYOUT],
      });
      return create(StyleEditSchema, {
        state: StyleEditState.APPLIED,
        groupChanges: [change],
      });
    }
    case ElementKind.ANNOTATION: {
      const existing: AnnotationEntry | undefined = stylesheet.annotations[elementId];
      const existingPos = existing?.layout?.position;
      const newX: number = (existingPos?.x ?? 0) + delta.x;
      const newY: number = (existingPos?.y ?? 0) + delta.y;
      const after: AnnotationEntry = create(AnnotationEntrySchema, {
        id: elementId,
        content: existing?.content ?? [],
        anchor: existing?.anchor,
        layout: create(AnnotationLayoutSchema, {
          position: create(Vec2Schema, { x: newX, y: newY }),
          size: existing?.layout?.size,
          rotation: existing?.layout?.rotation,
        }),
        shape: existing?.shape,
        typography: existing?.typography,
        callout: existing?.callout,
        component: existing?.component,
        tags: existing?.tags ?? {},
      });
      const change: AnnotationStyleChange = create(AnnotationStyleChangeSchema, {
        annotationId: elementId,
        changeType: StyleChangeType.MODIFIED,
        after,
        kinds: [StyleChangeKind.LAYOUT],
      });
      return create(StyleEditSchema, {
        state: StyleEditState.APPLIED,
        annotationChanges: [change],
      });
    }
    default: {
      return create(StyleEditSchema, { state: StyleEditState.APPLIED });
    }
  }
}
