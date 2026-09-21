// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, JSX } from 'solid-js';

export interface PendingBannerProps {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}

// A <button>, so Enter and Space reach onToggle via the browser's own
// synthesized click; no keydown handler, and one activation fires once.
export const PendingBanner: Component<PendingBannerProps> = (
  props: PendingBannerProps,
): JSX.Element => {
  if (props.count === 0) {
    return <></>;
  }

  const label: string = props.count === 1
    ? '1 proposed change'
    : `${props.count} proposed changes`;

  return (
    <button
      type="button"
      class="ag-island"
      aria-expanded={props.expanded}
      onClick={props.onToggle}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 10px',
        color: 'var(--ag-fg)',
        background: 'var(--ag-panel)',
        border: '1px solid var(--ag-edge)',
        'border-radius': 'var(--ag-radius)',
        'box-shadow': 'var(--ag-shadow)',
        'text-align': 'left',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
};
