// SPDX-License-Identifier: AGPL-3.0-or-later

<<<<<<< HEAD
import { Component, JSX, Show, createSignal, createUniqueId } from 'solid-js';
=======
import { Component, createEffect, createSignal, JSX } from 'solid-js';
>>>>>>> d8b8d72f20423c81a904cf501479284bceb9ab30
import { NumberField, TextField } from './field_value';

type OptionalNumber = number | undefined;
type OptionalString = string | undefined;
<<<<<<< HEAD
=======
type CommitMarker = string | undefined;
>>>>>>> d8b8d72f20423c81a904cf501479284bceb9ab30

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

<<<<<<< HEAD
export interface TokenFieldProps {
  label: string;
  field: TextField;
  tokens: string[];
  onCommit: (value: OptionalString) => void;
=======
export interface TokenFieldProps extends TextFieldProps {
  tokens: Array<string>;
>>>>>>> d8b8d72f20423c81a904cf501479284bceb9ab30
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

<<<<<<< HEAD
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
=======
function canvasFocus(): void {
  const canvas: HTMLElement | null = document.querySelector('[data-archeglyph-canvas]');
  if (canvas !== null) { canvas.focus(); }
}

function numberText(field: NumberField): string {
  if (field.mixed || field.override === undefined) { return ''; }
  return String(field.override);
}

export const NumberFieldInput: Component<NumberFieldProps> = (props: NumberFieldProps): JSX.Element => {
  const [text, setText] = createSignal<string>(numberText(props.field));
  const [focused, setFocused] = createSignal<boolean>(false);
  const [focusText, setFocusText] = createSignal<string>('');
  const [committedText, setCommittedText] = createSignal<CommitMarker>(undefined);

  createEffect((): void => {
    const next: string = numberText(props.field);
    if (!focused()) { setText(next); }
  });

  function commit(value: string): void {
    if (value === '') {
      props.onCommit(undefined);
      setCommittedText(value);
      return;
    }
    const parsed: number = Number(value);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      setText(focusText());
      setCommittedText(focusText());
      return;
    }
    props.onCommit(parsed);
    setCommittedText(value);
  }

  function onFocus(): void {
    setFocused(true);
    setFocusText(text());
    setCommittedText(undefined);
  }

  function onBlur(): void {
    setFocused(false);
    if (committedText() !== text()) { commit(text()); }
    setCommittedText(undefined);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setText(focusText());
      setFocused(false);
      setCommittedText(focusText());
      canvasFocus();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commit(text());
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const current: number = text() === '' ? (props.field.effective ?? 0) : Number(text());
      if (!Number.isFinite(current)) { return; }
      const amount: number = event.shiftKey ? 10 : 1;
      const next: number = current + (event.key === 'ArrowUp' ? amount : -amount);
      const nextText: string = String(next);
      setText(nextText);
      commit(nextText);
    }
  }

  return (
    <label style={{ display: 'block', 'margin-bottom': '8px' }}>
      <span style={{ display: 'block', 'font-size': '10px', color: 'var(--ag-fg-3)' }}>{props.label}</span>
      <input
        type='number'
        value={text()}
        placeholder={props.field.mixed ? 'Mixed' : props.field.effective === undefined ? '' : String(props.field.effective)}
        onFocus={onFocus}
        onBlur={onBlur}
        onInput={(event: Event): void => { setText((event.currentTarget as HTMLInputElement).value); }}
>>>>>>> d8b8d72f20423c81a904cf501479284bceb9ab30
        onKeyDown={onKeyDown}
        style={inputStyle}
      />
    </label>
  );
};

export const ColorFieldInput: Component<TextFieldProps> = (props: TextFieldProps): JSX.Element => {
<<<<<<< HEAD
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
=======
  const [text, setText] = createSignal<string>(props.field.mixed ? '' : props.field.override ?? '');
  function commit(): void { props.onCommit(text() === '' ? undefined : text()); }
  return (
    <label style={{ display: 'block', 'margin-bottom': '8px' }}>
      <span style={{ display: 'block', 'font-size': '10px', color: 'var(--ag-fg-3)' }}>{props.label}</span>
      <input type='text' value={text()} placeholder={props.field.mixed ? 'Mixed' : props.field.effective ?? ''} onInput={(event: Event): void => { setText((event.currentTarget as HTMLInputElement).value); }} onBlur={commit} onKeyDown={(event: KeyboardEvent): void => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }} style={inputStyle} />
>>>>>>> d8b8d72f20423c81a904cf501479284bceb9ab30
    </label>
  );
};

<<<<<<< HEAD
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
=======
export const TokenFieldInput: Component<TokenFieldProps> = (props: TokenFieldProps): JSX.Element => (
  <label style={{ display: 'block', 'margin-bottom': '8px' }}>
    <span style={{ display: 'block', 'font-size': '10px', color: 'var(--ag-fg-3)' }}>{props.label}</span>
    <input list={`${props.label}-tokens`} type='text' value={props.field.mixed ? '' : props.field.override ?? ''} placeholder={props.field.mixed ? 'Mixed' : props.field.effective ?? ''} onInput={(event: Event): void => { (event.currentTarget as HTMLInputElement).value; }} onBlur={(): void => props.onCommit(undefined)} style={inputStyle} />
    <datalist id={`${props.label}-tokens`}>{props.tokens.map((token: string) => <option value={token} />)}</datalist>
  </label>
);
>>>>>>> d8b8d72f20423c81a904cf501479284bceb9ab30
