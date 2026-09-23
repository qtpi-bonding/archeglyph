// SPDX-License-Identifier: AGPL-3.0-or-later

import { createMemo, createSignal, type Accessor } from 'solid-js';
import { diff } from '@archeglyph/core/diff';
import type { Delta, Diagram } from '@archeglyph/proto/gen/content_pb';

export function createDiffState(session: Accessor<Diagram | undefined>, sessionRef: string): DiffState {
  const [attached, setAttached] = createSignal<{ diagram: Diagram; ref: string } | undefined>(undefined);
  const [reversed, setReversed] = createSignal<boolean>(false);

  const delta = createMemo<Delta | undefined>(() => {
    const other = attached();
    const open = session();
    if (other === undefined || open === undefined) {
      return undefined;
    }
    const [base, baseRef, target, targetRef] = reversed()
      ? [open, sessionRef, other.diagram, other.ref]
      : [other.diagram, other.ref, open, sessionRef];
    return { ...diff(base, target), baseRef, targetRef };
  });

  return {
    delta,
    reversed,
    setReversed,
    setBase: (diagram: Diagram | undefined, baseRef: string): void => {
      setAttached(diagram === undefined ? undefined : { diagram, ref: baseRef });
    },
  };
}
export interface DiffState {
  delta: Accessor<Delta | undefined>;
  reversed: Accessor<boolean>;
  setReversed: (next: (prev: boolean) => boolean) => void;
  setBase: (diagram: Diagram | undefined, baseRef: string) => void;
}
