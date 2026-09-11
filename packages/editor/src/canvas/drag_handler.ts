// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
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
import { EditorState } from '../state/editor_state';
import { ElementKind } from './selection';
import { Vec2 } from './viewport';

export type DragSession = {
  elementId: string;
  elementKind: ElementKind;
  startCanvasPt: Vec2;
};

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
