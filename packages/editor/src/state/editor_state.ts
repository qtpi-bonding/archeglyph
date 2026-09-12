// SPDX-License-Identifier: AGPL-3.0-or-later

import { Accessor } from 'solid-js';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { StyleEdit, Stylesheet } from '@archeglyph/proto/gen/style_pb';

/** Reactive handle for one editor session. */
export interface EditorState {
  diagram(): Diagram;
  stylesheet(): Stylesheet;
  canUndo(): boolean;
  canRedo(): boolean;
  applyStyleEdit(edit: StyleEdit, coalesceKey?: string): void;
  undo(): void;
  redo(): void;
  appendPendingEdit(edit: StyleEdit): void;
  adoptStylesheet(stylesheet: Stylesheet): void;
  dirty: Accessor<boolean>;
  version: Accessor<number>;
}
