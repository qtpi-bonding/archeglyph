// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, createSignal, createUniqueId } from 'solid-js';
import { TextField } from './field_value';

export interface TokenFieldProps {
  label: string;
  field: TextField;
  tokens: string[];
  onCommit: (value: string | undefined) => void;
}

function focusCanvas(): void {
  const markedCanvas: HTMLElement | null = document.querySelector('[data-editor-canvas]') ??
    document.querySelector('[data-canvas]') ??
    document.querySelector('canvas');
  if (markedCanvas !== null) {
    markedCanvas.focus();
    return;
  }

  // The editor canvas is currently a div containing the scene SVG.  Make that
  // host focusable when using this fallback so Escape has a real destination.
  const scene: SVGElement | null = document.querySelector('svg');
  const host: HTMLElement | null = scene?.parentElement ?? null;
  if (host !== null) {
    host.tabIndex = -1;
    host.focus();
  }
}

function initialValue(field: TextField): string {
  if (field.mixed) {
    return '';
  }
  return field.override ?? '';
}

function commitValue(value: string, onCommit: (value: string | undefined) => void): void {
  onCommit(value === '' ? undefined : value);
}

/**
 * A text field that suggests the supplied token names without restricting
 * literal values. Editing stays local until the field is blurred or Enter is
 * pressed.
 */
export const TokenFieldInput: Component<TokenFieldProps> = (props: TokenFieldProps): JSX.Element => {
  const [value, setValue] = createSignal<string>(initialValue(props.field));
  const [focusedValue, setFocusedValue] = createSignal<string>(initialValue(props.field));
  const [skipBlur, setSkipBlur] = createSignal<boolean>(false);
  const listId: string = `token-field-${createUniqueId()}`;

  function commit(): void {
    commitValue(value(), props.onCommit);
  }

  function onFocus(): void {
    setFocusedValue(value());
    setSkipBlur(false);
  }

  function onBlur(): void {
    if (skipBlur()) {
      setSkipBlur(false);
      return;
    }
    commit();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      setSkipBlur(true);
      commit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setValue(focusedValue());
      setSkipBlur(true);
      focusCanvas();
    }
  }

  return (
    <label>
      <span>{props.label}</span>
      <input
        type='text'
        value={value()}
        placeholder={props.field.mixed ? 'Mixed' : undefined}
        list={listId}
        onFocus={onFocus}
        onInput={(event: InputEvent): void => {
          setValue((event.currentTarget as HTMLInputElement).value);
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <datalist id={listId}>
        {props.tokens.map((token: string): JSX.Element => <option value={token} />)}
      </datalist>
    </label>
  );
};
