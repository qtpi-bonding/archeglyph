// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, createEffect, createSignal, JSX } from 'solid-js';
import { NumberField, TextField } from './field_value';

type OptionalNumber = number | undefined;
type OptionalString = string | undefined;
type CommitMarker = string | undefined;

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

export interface TokenFieldProps extends TextFieldProps {
  tokens: Array<string>;
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
        onKeyDown={onKeyDown}
        style={inputStyle}
      />
    </label>
  );
};

export const ColorFieldInput: Component<TextFieldProps> = (props: TextFieldProps): JSX.Element => {
  const [text, setText] = createSignal<string>(props.field.mixed ? '' : props.field.override ?? '');
  function commit(): void { props.onCommit(text() === '' ? undefined : text()); }
  return (
    <label style={{ display: 'block', 'margin-bottom': '8px' }}>
      <span style={{ display: 'block', 'font-size': '10px', color: 'var(--ag-fg-3)' }}>{props.label}</span>
      <input type='text' value={text()} placeholder={props.field.mixed ? 'Mixed' : props.field.effective ?? ''} onInput={(event: Event): void => { setText((event.currentTarget as HTMLInputElement).value); }} onBlur={commit} onKeyDown={(event: KeyboardEvent): void => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }} style={inputStyle} />
    </label>
  );
};

export const TokenFieldInput: Component<TokenFieldProps> = (props: TokenFieldProps): JSX.Element => (
  <label style={{ display: 'block', 'margin-bottom': '8px' }}>
    <span style={{ display: 'block', 'font-size': '10px', color: 'var(--ag-fg-3)' }}>{props.label}</span>
    <input list={`${props.label}-tokens`} type='text' value={props.field.mixed ? '' : props.field.override ?? ''} placeholder={props.field.mixed ? 'Mixed' : props.field.effective ?? ''} onInput={(event: Event): void => { (event.currentTarget as HTMLInputElement).value; }} onBlur={(): void => props.onCommit(undefined)} style={inputStyle} />
    <datalist id={`${props.label}-tokens`}>{props.tokens.map((token: string) => <option value={token} />)}</datalist>
  </label>
);
