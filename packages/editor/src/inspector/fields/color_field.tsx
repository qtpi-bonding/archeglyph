// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, createEffect, createSignal, onCleanup } from 'solid-js';
import { TextField } from '../field_value';

/** Common properties for inspector fields containing written text. */
export interface TextFieldProps {
  /** Label displayed beside the field. */
  label: string;
  /** Written and effective values for the selection. */
  field: TextField;
  /** Called when the current text is committed. */
  onCommit: (value: string | undefined) => void;
}

const rowStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '4px',
  'align-items': 'center',
};

const inputStyle: JSX.CSSProperties = {
  flex: '1',
  'min-width': '0',
  'box-sizing': 'border-box',
  padding: '2px 4px',
  border: '1px solid var(--ag-edge)',
  'border-radius': '2px',
  'font-size': '12px',
  background: 'var(--ag-field)',
  color: 'var(--ag-fg)',
};

const swatchStyle: JSX.CSSProperties = {
  width: '16px',
  height: '16px',
  flex: '0 0 16px',
  border: '1px solid var(--ag-edge)',
  'border-radius': '2px',
};

function isBrowserColor(value: string | undefined): boolean {
  if (value === undefined || value.trim() === '') {
    return false;
  }
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', value);
  }
  return false;
}

function focusCanvas(): void {
  const canvas: HTMLElement | null = document.querySelector('canvas');
  canvas?.focus();
}

export const ColorFieldInput: Component<TextFieldProps> = (props: TextFieldProps): JSX.Element => {
  const [text, setText] = createSignal<string>(props.field.mixed ? '' : (props.field.override ?? ''));
  const [focused, setFocused] = createSignal<boolean>(false);
  let beforeFocus: string = text();
  let skipBlur: boolean = false;

  createEffect((): void => {
    if (!focused()) {
      setText(props.field.mixed ? '' : (props.field.override ?? ''));
    }
  });

  onCleanup((): void => {
    skipBlur = true;
  });

  const commit = (): void => {
    const value: string = text();
    props.onCommit(value === '' ? undefined : value);
  };

  const handleFocus = (): void => {
    beforeFocus = text();
    skipBlur = false;
    setFocused(true);
  };

  const handleBlur = (): void => {
    setFocused(false);
    if (!skipBlur) {
      commit();
    }
    skipBlur = false;
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      skipBlur = true;
      (event.currentTarget as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setText(beforeFocus);
      skipBlur = true;
      setFocused(false);
      (event.currentTarget as HTMLInputElement).blur();
      focusCanvas();
    }
  };

  return (
    <label>
      <span style={{ display: 'block', 'font-size': '10px', color: 'var(--ag-fg-3)' }}>{props.label}</span>
      <div style={rowStyle}>
        <input
          type='text'
          value={text()}
          placeholder={props.field.mixed ? 'Mixed' : props.field.effective}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={(event: InputEvent): void => {
            setText((event.currentTarget as HTMLInputElement).value);
          }}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />
        {isBrowserColor(props.field.effective) ? (
          <span
            aria-label={`Effective color ${props.field.effective}`}
            style={{ ...swatchStyle, background: props.field.effective }}
          />
        ) : undefined}
      </div>
    </label>
  );
};
