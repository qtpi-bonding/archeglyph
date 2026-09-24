// SPDX-License-Identifier: MPL-2.0

import { Component, For, JSX, Show, createSignal } from 'solid-js';
import { Comment } from '../../../proto/src/gen/style_pb';

export interface ThreadViewProps {
  comments: ReadonlyArray<Comment>;
  onReply: (a0: string) => void;
}

interface ThreadNode {
  comment: Comment;
  replies: Array<ThreadNode>;
}

/**
 * The flat comment list as the tree its `reply_to` references describe.
 *
 * A comment joins its parent only when the parent appears earlier in the
 * list, so the result is a forest whatever the data says -- a reply to a
 * later comment, to itself, or to a comment that is not here reads as a
 * root rather than recursing forever.
 */
export function threadTree(comments: ReadonlyArray<Comment>): Array<ThreadNode> {
  const nodes: Map<string, ThreadNode> = new Map<string, ThreadNode>();
  const rank: Map<string, number> = new Map<string, number>();
  comments.forEach((comment: Comment, index: number): void => {
    nodes.set(comment.id, { comment, replies: [] });
    rank.set(comment.id, index);
  });

  const roots: Array<ThreadNode> = [];
  comments.forEach((comment: Comment, index: number): void => {
    const node: ThreadNode = nodes.get(comment.id)!;
    const parentId: string | undefined = comment.replyTo;
    const parentRank: number | undefined = parentId === undefined ? undefined : rank.get(parentId);
    if (parentId !== undefined && parentRank !== undefined && parentRank < index) {
      nodes.get(parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/** "ai:claude" -> "claude". The prefix becomes the badge instead. */
function displayName(author: string | undefined): string {
  if (author === undefined || author === '') {
    return 'unknown';
  }
  const separator: number = author.indexOf(':');
  return separator === -1 ? author : author.slice(separator + 1);
}

function authorKind(author: string | undefined): string {
  return author !== undefined && author.startsWith('ai:') ? 'ai' : 'user';
}

function commentTime(comment: Comment): string {
  return new Date(Number(comment.timestampMs)).toLocaleString();
}

const CommentNode: Component<{ node: ThreadNode }> = (props: { node: ThreadNode }): JSX.Element => (
  <article class="ag-thread-comment" data-kind={authorKind(props.node.comment.author)}>
    <header>
      <span class="ag-thread-author">{displayName(props.node.comment.author)}</span>
      <Show when={authorKind(props.node.comment.author) === 'ai'}>
        <span class="ag-thread-badge">AI</span>
      </Show>
      <time dateTime={new Date(Number(props.node.comment.timestampMs)).toISOString()}>
        {commentTime(props.node.comment)}
      </time>
    </header>
    <div class="ag-thread-body">{props.node.comment.body}</div>
    <Show when={props.node.replies.length > 0}>
      <div class="ag-thread-replies">
        <For each={props.node.replies}>
          {(reply: ThreadNode): JSX.Element => <CommentNode node={reply} />}
        </For>
      </div>
    </Show>
  </article>
);

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

  return (
    <div class="ag-thread-view">
      <div class="ag-thread-comments">
        {props.comments.length === 0 ? (
          <div class="ag-thread-empty">No comments yet</div>
        ) : (
          <For each={threadTree(props.comments)}>
            {(node: ThreadNode): JSX.Element => <CommentNode node={node} />}
          </For>
        )}
      </div>
      <div class="ag-thread-reply">
        <textarea
          aria-label="Reply"
          placeholder="Reply to this proposal"
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
