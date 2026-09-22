// SPDX-License-Identifier: AGPL-3.0-or-later

import { createMemo, createSignal, type Accessor } from 'solid-js';
import { diff } from '@archeglyph/core/diff';
import type { Delta, Diagram } from '@archeglyph/proto/gen/content_pb';

export function createDiffState(target: Accessor<Diagram | undefined>, targetRef: string): DiffState {
  const [base, setBaseSignal] = createSignal<{ diagram: Diagram; ref: string } | undefined>(undefined);
  const delta = createMemo<Delta | undefined>(() => {
    const currentBase = base();
    const currentTarget = target();
    if (currentBase === undefined || currentTarget === undefined) {
      return undefined;
    }
    const result = diff(currentBase.diagram, currentTarget);
    return { ...result, baseRef: currentBase.ref, targetRef };
  });

  return {
    delta,
    setBase: (diagram: Diagram | undefined, baseRef: string): void => {
      setBaseSignal(diagram === undefined ? undefined : { diagram, ref: baseRef });
    },
  };
}
export interface DiffState {
  delta: Accessor<Delta | undefined>;
  setBase: (diagram: Diagram | undefined, baseRef: string) => void;
}
