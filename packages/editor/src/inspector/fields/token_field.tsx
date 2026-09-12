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
  // See number_field: an untouched field tracks the model and commits nothing
  // on blur, or it writes stale values back over edits made elsewhere.
  const [dirty, setDirty] = createSignal<boolean>(false);
  const datalistId: string = `token-field-${nextDatalistId}`;
  nextDatalistId += 1;

  createEffect((): void => {
    const field: TextField = props.field;
    if (!dirty()) {
      setText(writtenValue(field));
      setBeforeFocus(writtenValue(field));
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
          setDirty(true);
          setText((event.currentTarget as HTMLInputElement).value);
        }}
        onBlur={(): void => {
          setFocused(false);
          const pending: boolean = dirty();
          if (skipBlurCommit()) {
            setSkipBlurCommit(false);
            setDirty(false);
            return;
          }
          if (pending) {
            commit();
          }
          // AFTER the commit, never before: clearing dirty re-runs the sync
          // effect, which resets text() to the model value -- so committing
          // afterwards would read back the old value, not what was typed.
          setDirty(false);
        }}
        onKeyDown={(event: KeyboardEvent): void => {
          const input: HTMLInputElement = event.currentTarget as HTMLInputElement;
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
            setDirty(false);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setText(beforeFocus());
            setDirty(false);
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
