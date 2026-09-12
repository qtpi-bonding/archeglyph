// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createSignal, JSX } from 'solid-js';
import type { TextField } from '../field_value';
import type { TextFieldProps } from './color_field';

/** Common text-field properties plus values offered by a datalist. */
export interface TokenFieldProps extends TextFieldProps {
  /** Values offered by the datalist, in display order. */
  tokens: string[];
}

let nextDatalistId: number = 0;

function writtenValue(field: TextField): string {
  return field.mixed ? '' : (field.override ?? '');
}

/** A free-form input whose datalist offers the supplied tokens. */
export const TokenFieldInput: Component<TokenFieldProps> = (props: TokenFieldProps): JSX.Element => {
  const [text, setText] = createSignal<string>(writtenValue(props.field));
  const [focused, setFocused] = createSignal<boolean>(false);
  const [beforeFocus, setBeforeFocus] = createSignal<string>(writtenValue(props.field));
  const [skipBlurCommit, setSkipBlurCommit] = createSignal<boolean>(false);
  const datalistId: string = `token-field-${nextDatalistId}`;
  nextDatalistId += 1;

  createEffect((): void => {
    const field: TextField = props.field;
    if (!focused()) {
      setText(writtenValue(field));
    }
  });

  const commit = (): void => {
    const value: string = text();
    props.onCommit(value === '' ? undefined : value);
  };

  return (
    <label>
      <span>{props.label}</span>
      <input
        type='text'
        list={datalistId}
        value={text()}
        placeholder={props.field.mixed ? 'Mixed' : props.field.effective}
        onFocus={(): void => {
          setBeforeFocus(text());
          setFocused(true);
        }}
        onInput={(event: InputEvent): void => {
          setText((event.currentTarget as HTMLInputElement).value);
        }}
        onBlur={(): void => {
          setFocused(false);
          if (skipBlurCommit()) {
            setSkipBlurCommit(false);
            return;
          }
          commit();
        }}
        onKeyDown={(event: KeyboardEvent): void => {
          const input: HTMLInputElement = event.currentTarget as HTMLInputElement;
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setText(beforeFocus());
            setSkipBlurCommit(true);
            input.blur();
          }
        }}
      />
      <datalist id={datalistId}>
        {props.tokens.map((token: string) => <option value={token}>{token}</option>)}
      </datalist>
    </label>
  );
};
