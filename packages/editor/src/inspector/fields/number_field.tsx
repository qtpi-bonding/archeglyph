// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createSignal, JSX } from 'solid-js';
import { NumberField } from '../field_value';

export type NumberValue = number | undefined;
export type NumberCommit = (value: NumberValue, coalesceKey?: string) => void;

export interface NumberFieldProps {
  label: string;
  field: NumberField;
  onCommit: NumberCommit;
}

function textForField(field: NumberField): string {
  if (field.mixed || field.override === undefined) {
    return '';
  }
  return String(field.override);
}

/** A numeric inspector input whose edits are committed as a whole value. */
export const NumberFieldInput: Component<NumberFieldProps> = (
  props: NumberFieldProps,
): JSX.Element => {
  const [text, setText] = createSignal<string>(textForField(props.field));
  const [focused, setFocused] = createSignal<boolean>(false);
  let beforeFocus: string = text();
  let ignoreNextBlur: boolean = false;

  createEffect((): void => {
    const field: NumberField = props.field;
    if (!focused()) {
      setText(textForField(field));
    }
  });

  const commitText = (value: string, restoreOnFailure: boolean): void => {
    if (value === '') {
      props.onCommit(undefined);
      return;
    }
    const parsed: number = Number(value);
    if (Number.isFinite(parsed)) {
      props.onCommit(parsed);
      return;
    }
    if (restoreOnFailure) {
      setText(beforeFocus);
    }
  };

  const finishEditing = (): void => {
    commitText(text(), true);
    setFocused(false);
  };

  const restoreAndFocusCanvas = (): void => {
    setText(beforeFocus);
    setFocused(false);
    const canvas: HTMLElement | null = document.querySelector<HTMLElement>(
      '[data-archeglyph-canvas="true"]',
    );
    canvas?.focus();
  };

  const step = (direction: number, shift: boolean): void => {
    const currentText: string = text();
    const fallback: number | undefined = props.field.override ?? props.field.effective;
    const current: number = currentText === '' ? (fallback ?? 0) : Number(currentText);
    if (!Number.isFinite(current)) {
      return;
    }
    const amount: number = shift ? 10 : 1;
    const next: number = current + direction * amount;
    setText(String(next));
    props.onCommit(next, `number-field:${props.label}`);
  };

  const onInput = (event: Event): void => {
    setText((event.currentTarget as HTMLInputElement).value);
  };

  const onFocus = (): void => {
    beforeFocus = text();
    setFocused(true);
  };

  const onBlur = (): void => {
    if (ignoreNextBlur) {
      ignoreNextBlur = false;
      return;
    }
    finishEditing();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      ignoreNextBlur = true;
      restoreAndFocusCanvas();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      ignoreNextBlur = true;
      finishEditing();
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey);
    }
  };

  return (
    <label>
      <span>{props.label}</span>
      <input
        type="number"
        value={text()}
        placeholder={props.field.mixed ? 'Mixed' : props.field.effective === undefined ? '' : String(props.field.effective)}
        onInput={onInput}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </label>
  );
};
