// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, For, JSX, Show } from 'solid-js';
import { PendingItem } from './pending_model';
import { ThreadView } from './thread_view';

export interface PendingPanelProps {
  items: ReadonlyArray<PendingItem>;
  selectedId?: string;
  onSelect: (a0: string) => void;
  onAccept: (a0: string) => void;
  onReject: (a0: string) => void;
  onReply: (a0: string, a1: string) => void;
  syncError?: string;
}

// Holds no state: accept and reject must be one undo entry, and only
// EditorState can snapshot before writing.
export const PendingPanel: Component<PendingPanelProps> = (
  props: PendingPanelProps,
): JSX.Element => {
  if (props.items.length === 0) {
    return <></>;
  }

  function stopClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  return (
    <div
      class="ag-island"
      style={{
        width: '100%',
        'max-height': 'calc(50vh - (2 * var(--ag-island-inset)))',
        overflow: 'auto',
        padding: '8px',
        'box-sizing': 'border-box',
        'font-size': '12px',
        color: 'var(--ag-fg)',
        background: 'var(--ag-panel)',
      }}
    >
      <Show when={props.syncError !== undefined}>
        <div
          class="ag-pending-sync-error"
          role="alert"
          style={{
            padding: '6px 8px',
            margin: '0 0 8px',
            color: 'var(--ag-error-text)',
            background: 'var(--ag-error)',
          }}
        >
          {props.syncError}
        </div>
      </Show>
      <For each={props.items}>
        {(item: PendingItem): JSX.Element => (
          <div
            class="ag-pending-row"
            onClick={(): void => props.onSelect(item.id)}
            style={{
              padding: '8px 0',
              'border-bottom': '1px solid var(--ag-edge)',
              cursor: 'pointer',
            }}
          >
            <div class="ag-pending-row-summary">
              <div class="ag-pending-description">{item.description}</div>
              <div class="ag-pending-meta">
                <span class="ag-pending-author">{item.author}</span>
                <span>{item.changeCount} changes</span>
                <span>{item.comments.length} comments</span>
              </div>
              <div class="ag-pending-actions">
                <button
                  type="button"
                  onClick={(event: MouseEvent): void => {
                    stopClick(event);
                    props.onAccept(item.id);
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={(event: MouseEvent): void => {
                    stopClick(event);
                    props.onReject(item.id);
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
            <Show when={props.selectedId === item.id}>
              <div class="ag-pending-thread" onClick={stopClick}>
                <ThreadView
                  comments={item.comments}
                  onReply={(body: string): void => props.onReply(item.id, body)}
                />
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};
