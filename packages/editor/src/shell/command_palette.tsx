// SPDX-License-Identifier: MPL-2.0

import { Accessor, Component, createMemo, createSignal, For, JSX, onMount } from 'solid-js';
import { PaletteAction, PaletteItem } from './palette_item';
import { filterPaletteItems } from './palette_search';

export interface CommandPaletteProps {
  items: ReadonlyArray<PaletteItem>;
  onChoose: (a0: PaletteAction) => void;
  onClose: () => void;
}

export const CommandPalette: Component<CommandPaletteProps> = (
  props: CommandPaletteProps,
): JSX.Element => {
  const [query, setQuery] = createSignal<string>('');
  const [highlighted, setHighlighted] = createSignal<number>(0);
  const filtered = createMemo<Array<PaletteItem>>((): Array<PaletteItem> =>
    filterPaletteItems(props.items, query()),
  );
  let input: HTMLInputElement | undefined;

  onMount((): void => {
    input?.focus();
  });

  function choose(item: PaletteItem): void {
    props.onChoose(item.action);
  }

  function onInput(event: InputEvent): void {
    const target = event.currentTarget as HTMLInputElement;
    setQuery(target.value);
    setHighlighted(0);
  }

  function onKeyDown(event: KeyboardEvent): void {
    const rows: Array<PaletteItem> = filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (rows.length > 0) {
        setHighlighted((index: number): number => Math.min(index + 1, rows.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index: number): number => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (rows.length > 0) {
        choose(rows[highlighted()]);
      }
    } else if (event.key === 'Escape') {
      props.onClose();
    }
  }

  const scrimStyle: JSX.CSSProperties = {
    'align-items': 'center',
    // Not `opacity`: the surface is a child of this element, and opacity
    // composites the whole subtree, so it would fade the palette too.
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    'justify-content': 'center',
    inset: '0',
    position: 'fixed',
    'z-index': '1000',
  };
  const surfaceStyle: JSX.CSSProperties = {
    background: 'var(--ag-panel)',
    border: '1px solid var(--ag-edge)',
    'border-radius': 'var(--ag-radius)',
    'box-shadow': 'var(--ag-shadow)',
    color: 'var(--ag-fg)',
    'font-family': 'var(--ag-font-ui)',
    'max-width': '640px',
    width: 'min(640px, calc(100vw - 32px))',
    // Without a cap the surface grows past the viewport, and because the scrim
    // centres it the overflow is split across the top AND bottom edges -- the
    // first rows are unreachable, not just the last. Column layout keeps the
    // input pinned while only the list scrolls.
    'max-height': 'calc(100vh - 64px)',
    display: 'flex',
    'flex-direction': 'column',
    overflow: 'hidden',
  };
  const inputStyle: JSX.CSSProperties = {
    background: 'var(--ag-field)',
    border: '0',
    'border-bottom': '1px solid var(--ag-edge)',
    color: 'var(--ag-fg)',
    'font-family': 'var(--ag-font-ui)',
    'font-size': '15px',
    outline: 'none',
    padding: '14px 16px',
    width: '100%',
  };

  return (
    <div style={scrimStyle} onClick={(): void => props.onClose()}>
      <div style={surfaceStyle} onClick={(event: MouseEvent): void => event.stopPropagation()}>
        <input
          ref={input}
          aria-label="Command palette"
          autofocus={true}
          onInput={onInput}
          onKeyDown={onKeyDown}
          placeholder="Type a command or element"
          style={inputStyle}
          type="text"
        />
        {/* min-height:0 or the flex item refuses to shrink and scrolls nothing. */}
        <div role="listbox" style={{ 'overflow-y': 'auto', 'min-height': '0' }}>
          <For each={filtered()}>
            {(item: PaletteItem, index: Accessor<number>): JSX.Element => (
              <button
                aria-selected={index() === highlighted()}
                onClick={(): void => choose(item)}
                role="option"
                style={{
                  background: index() === highlighted() ? 'var(--ag-blue-soft)' : 'var(--ag-panel)',
                  border: '0',
                  'border-bottom': '1px solid var(--ag-edge)',
                  color: 'var(--ag-fg)',
                  display: 'flex',
                  'font-family': 'var(--ag-font-ui)',
                  'justify-content': 'space-between',
                  padding: '10px 16px',
                  'text-align': 'left',
                  width: '100%',
                }}
              >
                <span>{item.label}</span>
                <span style={{
                  color: 'var(--ag-fg-2)',
                  'font-family': 'var(--ag-font-mono)',
                  'margin-left': '24px',
                }}>{item.detail}</span>
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
