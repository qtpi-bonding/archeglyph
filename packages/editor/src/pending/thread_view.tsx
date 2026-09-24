// SPDX-License-Identifier: MPL-2.0

import { Component, For, JSX, createSignal } from 'solid-js';
import { Comment } from '../../../proto/src/gen/style_pb';

export interface ThreadViewProps {
  comments: ReadonlyArray<Comment>;
  onReply: (a0: string) => void;
}

export const ThreadView: Component<ThreadViewProps> = (
  props: ThreadViewProps,
): JSX.Element => {
  const [reply, setReply] = createSignal<string>('');

  function onInput(event: InputEvent): void {
    const target: HTMLTextAreaElement = event.currentTarget as HTMLTextAreaElement;
    setReply(target.value);
  }

  function onKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  function submitReply(): void {
    const body: string = reply().trim();
    if (body.length === 0) {
      return;
    }
    props.onReply(body);
    setReply('');
  }

  function commentTime(comment: Comment): string {
    return new Date(Number(comment.timestampMs)).toLocaleString();
  }

  return (
    <div class="ag-thread-view">
      <div class="ag-thread-comments">
        {props.comments.length === 0 ? (
          <div>No comments yet</div>
        ) : (
          <For each={props.comments}>
            {(comment: Comment): JSX.Element => (
              <article class="ag-thread-comment">
                <header>
                  <span>{comment.author !== undefined && comment.author !== '' ? comment.author : 'unknown'}</span>
                  <time dateTime={new Date(Number(comment.timestampMs)).toISOString()}>
                    {commentTime(comment)}
                  </time>
                </header>
                <div>{comment.body}</div>
              </article>
            )}
          </For>
        )}
      </div>
      <div class="ag-thread-reply">
        <textarea
          aria-label="Reply"
          onInput={onInput}
          onKeyDown={onKeyDown}
          value={reply()}
        />
        <button disabled={reply().trim().length === 0} onClick={submitReply} type="button">
          Reply
        </button>
      </div>
    </div>
  );
};
