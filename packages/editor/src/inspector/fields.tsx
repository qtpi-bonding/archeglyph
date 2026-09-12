// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX, Show, createSignal, createUniqueId } from 'solid-js';
import { NumberField, TextField } from './field_value';

type OptionalNumber = number | undefined;
type OptionalString = string | undefined;

export interface NumberFieldProps {
  label: string;
  field: NumberField;
  onCommit: (value: OptionalNumber) => void;
}

export interface TextFieldProps {
  label: string;
  field: TextField;
  onCommit: (value: OptionalString) => void;
}

export interface TokenFieldProps {
  label: string;
  field: TextField;
  tokens: string[];
  onCommit: (value: OptionalString) => void;
}

const inputStyle: JSX.CSSProperties = {
  width: '100%',
  'box-sizing': 'border-box',
  padding: '2px 4px',
  border: '1px solid var(--ag-edge)',
  'border-radius': '2px',
  'font-size': '12px',
  background: 'var(--ag-field)',
  color: 'var(--ag-fg)',
};

const labelStyle: JSX.CSSProperties = {
  display: 'flex',
  'align-items': 'center',
  gap: '4px',
};

function focusCanvas(): void {
  const markedCanvas: HTMLElement | null = document.querySelector('[data-editor-canvas]') ??
    document.querySelector('[data-canvas]') ??
    document.querySelector('canvas');
  if (markedCanvas !== null) {
    markedCanvas.focus();
    return;
  }

  const scene: SVGElement | null = document.querySelector('svg');
  const host: HTMLElement | null = scene?.parentElement ?? null;
  if (host !== null) {
    host.tabIndex = -1;
    host.focus();
  }
}

function textValue(field: TextField): string {
  if (field.mixed || field.override === undefined) {
    return '';
  }
  return field.override;
}

function numberValue(field: NumberField): string {
  if (field.mixed || field.override === undefined) {
    return '';
  }
  return String(field.override);
}

function optionalText(value: string): OptionalString {
  return value === '' ? undefined : value;
}

function commitText(value: string, onCommit: (value: OptionalString) => void): void {
  onCommit(optionalText(value));
}

export const NumberFieldInput: Component<NumberFieldProps> = (props: NumberFieldProps): JSX.Element => {
  const [value, setValue] = createSignal<string>(numberValue(props.field));
  let valueOnFocus: string = value();

  const commit = (): void => {
    const raw: string = value();
    if (raw === '') {
      props.onCommit(undefined);
      return;
    }
    const parsed: number = Number(raw);
    if (Number.isFinite(parsed)) {
      props.onCommit(parsed);
      return;
    }
    setValue(valueOnFocus);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const current: number = Number(value());
      const fallback: number = props.field.effective ?? 0;
      const base: number = Number.isFinite(current) ? current : fallback;
      const amount: number = event.shiftKey ? 10 : 1;
      const direction: number = event.key === 'ArrowUp' ? 1 : -1;
      setValue(String(base + direction * amount));
      props.onCommit(base + direction * amount);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setValue(valueOnFocus);
      focusCanvas();
    }
  };

  return (
    <label style={labelStyle}>
      <span>{props.label}</span>
      <input
        type='number'
        value={value()}
        placeholder={props.field.mixed ? 'Mixed' : props.field.effective === undefined ? '' : String(props.field.effective)}
        onFocus={(): void => { valueOnFocus = value(); }}
        onInput={(event: Event): void => { setValue((event.currentTarget as HTMLInputElement).value); }}
        onBlur={commit}
        onKeyDown={onKeyDown}
        style={inputStyle}
      />
    </label>
  );
};

export const ColorFieldInput: Component<TextFieldProps> = (props: TextFieldProps): JSX.Element => {
  const [value, setValue] = createSignal<string>(textValue(props.field));
  let valueOnFocus: string = value();

  const commit = (): void => commitText(value(), props.onCommit);
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setValue(valueOnFocus);
      focusCanvas();
    }
  };

  return (
    <label style={labelStyle}>
      <span>{props.label}</span>
      <Show when={props.field.effective !== undefined}>
        <span
          aria-label='Effective colour'
          style={{ width: '14px', height: '14px', 'flex-shrink': '0', background: props.field.effective, border: '1px solid var(--ag-edge)', 'border-radius': '2px' }}
        />
      </Show>
      <input
        type='text'
        value={value()}
        placeholder={props.field.mixed ? 'Mixed' : ''}
        onFocus={(): void => { valueOnFocus = value(); }}
        onInput={(event: Event): void => { setValue((event.currentTarget as HTMLInputElement).value); }}
        onBlur={commit}
        onKeyDown={onKeyDown}
        style={inputStyle}
      />
    </label>
  );
};

export const TokenFieldInput: Component<TokenFieldProps> = (props: TokenFieldProps): JSX.Element => {
  const [value, setValue] = createSignal<string>(textValue(props.field));
  const [focusedValue, setFocusedValue] = createSignal<string>(textValue(props.field));
  const [skipBlur, setSkipBlur] = createSignal<boolean>(false);
  const listId: string = `token-field-${createUniqueId()}`;

  const commit = (): void => commitText(value(), props.onCommit);
  const onFocus = (): void => {
    setFocusedValue(value());
    setSkipBlur(false);
  };
  const onBlur = (): void => {
    if (skipBlur()) {
      setSkipBlur(false);
      return;
    }
    commit();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setSkipBlur(true);
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setValue(focusedValue());
      setSkipBlur(true);
      focusCanvas();
    }
  };

  return (
    <label style={labelStyle}>
      <span>{props.label}</span>
      <input
        type='text'
        value={value()}
        placeholder={props.field.mixed ? 'Mixed' : ''}
        list={listId}
        onFocus={onFocus}
        onInput={(event: Event): void => { setValue((event.currentTarget as HTMLInputElement).value); }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={inputStyle}
      />
      <datalist id={listId}>
        {props.tokens.map((token: string): JSX.Element => <option value={token} />)}
      </datalist>
    </label>
  );
};
