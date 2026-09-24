// SPDX-License-Identifier: MPL-2.0

import { Component, JSX, onMount } from 'solid-js';
import type { Command } from '../gestures/commands';
import type { KeymapEntry } from '../ui_state/keymap';
import { formatChord } from './chord_label';

export interface HelpSheetProps {
  commands: ReadonlyArray<Command>;
  keymap: ReadonlyArray<KeymapEntry>;
  onClose: () => void;
}

/**
 * The keyboard shortcut reference.  The keymap is deliberately supplied by
 * the caller: this keeps the sheet useful in isolation and, more importantly,
 * makes the displayed order the order in which the bindings are configured.
 */
export const HelpSheet: Component<HelpSheetProps> = (
  props: HelpSheetProps,
): JSX.Element => {
  let root!: HTMLDivElement;

  onMount((): void => {
    root.focus();
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    props.onClose();
  };

  const onScrimClick = (event: MouseEvent): void => {
    if (event.target === event.currentTarget) {
      props.onClose();
    }
  };

  return (
    <div
      ref={root}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={onScrimClick}
      data-archeglyph-help-scrim="true"
      style={{
        position: 'fixed',
        inset: '0',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        'z-index': '10',
      }}
    >
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        data-archeglyph-help-sheet="true"
        style={{
          width: 'min(520px, calc(100vw - 32px))',
          'max-height': 'calc(100vh - 32px)',
          overflow: 'auto',
          padding: '20px',
          'box-sizing': 'border-box',
          color: 'var(--ag-fg)',
          background: 'var(--ag-panel)',
          'border-radius': '8px',
          'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.35)',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0' }}>Keyboard shortcuts</h2>
        <div>
          {props.keymap.map((entry) => {
            const command: Command | undefined = props.commands.find(
              (candidate: Command): boolean => candidate.id === entry.command,
            );
            if (command === undefined) {
              return <></>;
            }
            return (
              <div
                data-archeglyph-help-row="true"
                style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  gap: '24px',
                  padding: '7px 0',
                  'border-bottom': '1px solid var(--ag-border)',
                }}
              >
                <span>{command.label}</span>
                <kbd>{formatChord(entry.chord)}</kbd>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
