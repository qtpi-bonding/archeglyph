// SPDX-License-Identifier: AGPL-3.0-or-later

import { Accessor, Component, createSignal, For, JSX, onCleanup, onMount } from 'solid-js';
import { CommandId } from '../ui_state/keymap';
import { MenuItem } from './menu_items';
import { Vec2 } from '@archeglyph/core/geometry/vec2';

export interface ContextMenuProps {
  items: ReadonlyArray<MenuItem>;
  at: Vec2;
  onChoose: (a0: CommandId) => void;
  onClose: () => void;
}

interface MenuCorner {
  x: number;
  y: number;
}

export const ContextMenu: Component<ContextMenuProps> = (
  props: ContextMenuProps,
): JSX.Element => {
  const [highlighted, setHighlighted] = createSignal<number>(0);
  const [corner, setCorner] = createSignal<MenuCorner>({ x: props.at.x, y: props.at.y });
  let menu: HTMLDivElement | undefined;

  function place(): void {
    if (menu === undefined) {
      return;
    }
    const bounds: DOMRect = menu.getBoundingClientRect();
    setCorner({
      x: Math.max(0, Math.min(props.at.x, window.innerWidth - bounds.width)),
      y: Math.max(0, Math.min(props.at.y, window.innerHeight - bounds.height)),
    });
  }

  onMount((): void => {
    menu?.focus();
    place();
    window.addEventListener('resize', props.onClose);
    window.addEventListener('scroll', props.onClose, true);
    onCleanup((): void => {
      window.removeEventListener('resize', props.onClose);
      window.removeEventListener('scroll', props.onClose, true);
    });
  });

  function choose(item: MenuItem): void {
    props.onChoose(item.id);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' ||
        event.key === 'Enter' || event.key === 'Escape') {
      event.stopPropagation();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index: number): number => Math.min(index + 1, props.items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index: number): number => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item: MenuItem | undefined = props.items[highlighted()];
      if (item !== undefined) {
        choose(item);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      props.onClose();
    }
  }

  if (props.items.length === 0) {
    return <></>;
  }

  const scrimStyle: JSX.CSSProperties = {
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
    outline: 'none',
    position: 'fixed',
    // Corner clamping bounds the position, not the height; a menu taller than
    // the viewport needs this to stay reachable.
    'max-height': 'calc(100vh - 16px)',
    'overflow-y': 'auto',
  };

  return (
    <div
      style={scrimStyle}
      onClick={(): void => props.onClose()}
    >
      <div
        ref={menu}
        aria-label="Context menu"
        onClick={(event: MouseEvent): void => event.stopPropagation()}
        onKeyDown={onKeyDown}
        role="menu"
        style={{ ...surfaceStyle, left: `${corner().x}px`, top: `${corner().y}px` }}
        tabindex={-1}
      >
        <For each={props.items}>
          {(item: MenuItem, index: Accessor<number>): JSX.Element => (
            <button
              aria-checked={index() === highlighted()}
              onClick={(): void => choose(item)}
              role="menuitemradio"
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
              }}>{item.chord}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
