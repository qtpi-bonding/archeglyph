// SPDX-License-Identifier: MPL-2.0

import { Component, JSX, createSignal, onMount } from 'solid-js';
import type { Bounds } from '@archeglyph/core/geometry/bounds';

export interface TextEditorProps {
  text: string;
  bounds: Bounds;
  /** Opaque, or the annotation's own label stays legible underneath. */
  background: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

/**
 * An in-place editor for annotation text. The editor lives in the SVG's
 * coordinate system so its caret follows the annotation while the canvas is
 * panned or zoomed.
 */
export const TextEditor: Component<TextEditorProps> = (props: TextEditorProps): JSX.Element => {
  const [value, setValue] = createSignal<string>(props.text);
  let editor!: HTMLTextAreaElement;
  let finished: boolean = false;

  function finishCommit(): void {
    if (finished) { return; }
    finished = true;
    props.onCommit(value());
  }

  function finishCancel(): void {
    if (finished) { return; }
    finished = true;
    props.onCancel();
  }

  function onKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (finished) { return; }
    if (event.key === 'Escape') {
      event.preventDefault();
      finishCancel();
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      finishCommit();
    }
  }

  function onInput(event: InputEvent): void {
    setValue((event.currentTarget as HTMLTextAreaElement).value);
  }

  function onBlur(): void {
    finishCommit();
  }

  onMount((): void => {
    editor.focus();
    editor.select();
  });

  // Read through a function, or the editor keeps the size the annotation had
  // when the edit began and stops tracking a zoom or a re-layout under it.
  const width = (): number => props.bounds.maxX - props.bounds.minX;
  const height = (): number => props.bounds.maxY - props.bounds.minY;

  return (
    <foreignObject
      x={props.bounds.minX}
      y={props.bounds.minY}
      width={width()}
      height={height()}
      class="text-editor"
    >
      <textarea
        ref={editor}
        value={props.text}
        onKeyDown={onKeyDown}
        onInput={onInput}
        onBlur={onBlur}
        wrap="soft"
        style={{
          width: '100%',
          height: '100%',
          padding: '0',
          margin: '0',
          border: 'none',
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
          'background-color': props.background,
          'font-family': 'inherit',
          'font-size': 'inherit',
          color: 'inherit',
        }}
      />
    </foreignObject>
  );
};
