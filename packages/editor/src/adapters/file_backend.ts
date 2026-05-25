// SPDX-License-Identifier: AGPL-3.0-or-later

import { Accessor, Setter } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import {
  Comment,
  CommentThread,
  CommentThreadSchema,
  StyleEdit,
  StyleEditSchema,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { CommentBackend, ThreadEntry } from './comment_backend';

export class FileBackend implements CommentBackend {
  private readonly getStylesheet: Accessor<Stylesheet>;
  private readonly setStylesheet: Setter<Stylesheet>;

  constructor(getStylesheet: Accessor<Stylesheet>, setStylesheet: Setter<Stylesheet>) {
    this.getStylesheet = getStylesheet;
    this.setStylesheet = setStylesheet;
  }

  async fetchThreads(): Promise<Array<ThreadEntry>> {
    const stylesheet: Stylesheet = this.getStylesheet();
    const entries: ThreadEntry[] = [];
    for (const edit of stylesheet.pendingEdits) {
      if (edit.thread !== undefined && edit.thread.comments.length > 0) {
        entries.push(Object.assign(new ThreadEntry(), { editRef: edit.id, thread: edit.thread }));
      }
    }
    return entries;
  }

  async postComment(editRef: string, comment: Comment): Promise<void> {
    const stylesheet: Stylesheet = this.getStylesheet();
    const updatedEdits: StyleEdit[] = [];
    for (const edit of stylesheet.pendingEdits) {
      if (edit.id === editRef) {
        const prior: Comment[] = edit.thread !== undefined ? edit.thread.comments : [];
        const updatedThread: CommentThread = create(CommentThreadSchema, {
          comments: prior.concat([comment]),
          resolved: edit.thread !== undefined ? edit.thread.resolved : false,
          resolvedBy: edit.thread !== undefined ? edit.thread.resolvedBy : undefined,
          resolvedAtMs: edit.thread !== undefined ? edit.thread.resolvedAtMs : undefined,
        });
        updatedEdits.push(create(StyleEditSchema, {
          schemaVersion: edit.schemaVersion,
          id: edit.id,
          baseHash: edit.baseHash,
          nodeChanges: edit.nodeChanges,
          edgeChanges: edit.edgeChanges,
          groupChanges: edit.groupChanges,
          annotationChanges: edit.annotationChanges,
          canvasAfter: edit.canvasAfter,
          themeRefAfter: edit.themeRefAfter,
          author: edit.author,
          description: edit.description,
          timestampMs: edit.timestampMs,
          state: edit.state,
          reviewedBy: edit.reviewedBy,
          reviewedAtMs: edit.reviewedAtMs,
          thread: updatedThread,
        }));
      } else {
        updatedEdits.push(edit);
      }
    }
    const updated: Stylesheet = create(StylesheetSchema, {
      schemaVersion: stylesheet.schemaVersion,
      themeRef: stylesheet.themeRef,
      canvas: stylesheet.canvas,
      nodes: stylesheet.nodes,
      edges: stylesheet.edges,
      groups: stylesheet.groups,
      annotations: stylesheet.annotations,
      pendingEdits: updatedEdits,
    });
    this.setStylesheet(updated);
  }
}
