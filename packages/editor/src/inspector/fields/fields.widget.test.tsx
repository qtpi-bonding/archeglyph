// SPDX-License-Identifier: MPL-2.0
//
// The first widget tests in this repo -- the tier that was missing when three
// bugs in a row reached the user.
//
// What they exist to pin is one rule, shared by every text-ish field:
//
//   An input the user has not typed into is a READOUT, not a pending edit.
//
// That rule has two halves, and the bug needed both to be broken. A pristine
// field must keep tracking the model even while it holds focus, and blur must
// commit only if the user actually typed. Before the fix, selecting a node put
// focus in the X field, dragging moved the node while the field kept showing
// the old value, and clicking away wrote that old value back -- the node
// visibly jumped to where it started.
//
// Note how focus is driven: explicitly, with .focus() and fireEvent.blur.
// happy-dom does NOT implement focus-on-click (verified: mousedown elsewhere
// leaves activeElement alone and fires no blur), so these tests cannot
// DISCOVER that something steals focus. They can only pin what the component
// does once focus is where it is -- which is exactly where the defect lived.
// Whole-app focus behaviour still needs a real browser.

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Guarded: bun runs every test file in one process, so a second file that also
// needs the DOM would throw here ("Happy DOM has already been globally
// registered") and take this whole file down with it. Whoever gets there first
// registers; everyone else reuses it.
if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, fireEvent, cleanup } = await import('@solidjs/testing-library');
const { createSignal } = await import('solid-js');
const { NumberFieldInput } = await import('./number_field');
const { ColorFieldInput } = await import('./color_field');
const { TokenFieldInput } = await import('./token_field');
const { numberField, textField } = await import('../field_value');

const input = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('input') as HTMLInputElement;

describe('NumberFieldInput', () => {
  test('a pristine field follows the model while it holds focus', () => {
    // The X/Y readout during a drag. The canvas preventDefaults its
    // pointerdown, so focus does not leave the inspector for the whole
    // gesture -- the field has to keep up on its own.
    const [value, setValue] = createSignal<number>(169);
    const { container } = render(() => (
      <NumberFieldInput label="X" field={numberField([value()], [value()])} onCommit={(): void => undefined} />
    ));
    const el = input(container);

    el.focus();
    expect(el.value).toBe('169');

    setValue(369);
    expect(el.value).toBe('369');
    cleanup();
  });

  test('blurring a field the user never typed into commits nothing', () => {
    const commits: Array<number | undefined> = [];
    const [value, setValue] = createSignal<number>(169);
    const { container } = render(() => (
      <NumberFieldInput
        label="X"
        field={numberField([value()], [value()])}
        onCommit={(next: number | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    setValue(369);
    fireEvent.blur(el);

    expect(commits).toEqual([]);
    cleanup();
  });

  test('blurring a field the user DID type into commits the typed value', () => {
    const commits: Array<number | undefined> = [];
    const { container } = render(() => (
      <NumberFieldInput
        label="X"
        field={numberField([169], [169])}
        onCommit={(next: number | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    fireEvent.input(el, { target: { value: '42' } });
    fireEvent.blur(el);

    expect(commits).toEqual([42]);
    cleanup();
  });

  test('clearing the field commits undefined, which is how an override is removed', () => {
    const commits: Array<number | undefined> = [];
    const { container } = render(() => (
      <NumberFieldInput
        label="X"
        field={numberField([169], [169])}
        onCommit={(next: number | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    fireEvent.input(el, { target: { value: '' } });
    fireEvent.blur(el);

    expect(commits).toEqual([undefined]);
    cleanup();
  });

  test('Escape restores the pre-edit text and commits nothing', () => {
    const commits: Array<number | undefined> = [];
    const { container } = render(() => (
      <NumberFieldInput
        label="X"
        field={numberField([169], [169])}
        onCommit={(next: number | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    fireEvent.input(el, { target: { value: '999' } });
    fireEvent.keyDown(el, { key: 'Escape' });

    expect(commits).toEqual([]);
    expect(el.value).toBe('169');
    cleanup();
  });
});

describe('ColorFieldInput', () => {
  test('a pristine field follows the model and commits nothing on blur', () => {
    const commits: Array<string | undefined> = [];
    const [value, setValue] = createSignal<string>('#111111');
    const { container } = render(() => (
      <ColorFieldInput
        label="Fill"
        field={textField([value()], [value()])}
        onCommit={(next: string | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    expect(el.value).toBe('#111111');
    setValue('#222222');
    expect(el.value).toBe('#222222');

    fireEvent.blur(el);
    expect(commits).toEqual([]);
    cleanup();
  });

  test('a typed value still commits on blur', () => {
    const commits: Array<string | undefined> = [];
    const { container } = render(() => (
      <ColorFieldInput
        label="Fill"
        field={textField(['#111111'], ['#111111'])}
        onCommit={(next: string | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    fireEvent.input(el, { target: { value: '#abcdef' } });
    fireEvent.blur(el);

    expect(commits).toEqual(['#abcdef']);
    cleanup();
  });
});

describe('TokenFieldInput', () => {
  test('a pristine field follows the model and commits nothing on blur', () => {
    const commits: Array<string | undefined> = [];
    const [value, setValue] = createSignal<string>('accent');
    const { container } = render(() => (
      <TokenFieldInput
        label="Token"
        tokens={['accent', 'muted']}
        field={textField([value()], [value()])}
        onCommit={(next: string | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    setValue('muted');
    expect(el.value).toBe('muted');

    fireEvent.blur(el);
    expect(commits).toEqual([]);
    cleanup();
  });

  test('a typed value still commits on blur', () => {
    const commits: Array<string | undefined> = [];
    const { container } = render(() => (
      <TokenFieldInput
        label="Token"
        tokens={['accent', 'muted']}
        field={textField(['accent'], ['accent'])}
        onCommit={(next: string | undefined): void => { commits.push(next); }}
      />
    ));
    const el = input(container);

    el.focus();
    fireEvent.input(el, { target: { value: 'muted' } });
    fireEvent.blur(el);

    expect(commits).toEqual(['muted']);
    cleanup();
  });
});
