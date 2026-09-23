// SPDX-License-Identifier: AGPL-3.0-or-later

import { createMemo, createSignal, type Accessor } from 'solid-js';
import { diff } from '@archeglyph/core/diff';
import type { Delta, Diagram } from '@archeglyph/proto/gen/content_pb';

export function createDiffState(session: Accessor<Diagram | undefined>, sessionRef: Accessor<string>): DiffState {
  const [attached, setAttached] = createSignal<{ diagram: Diagram; ref: string } | undefined>(undefined);
  const [attachedIsTarget, setAttachedIsTarget] = createSignal<boolean>(true);

  const sides = (): { base: Diagram; baseRef: string; target: Diagram; targetRef: string } | undefined => {
    const other = attached();
    const open = session();
    if (other === undefined || open === undefined) {
      return undefined;
    }
    return attachedIsTarget()
      ? { base: open, baseRef: sessionRef(), target: other.diagram, targetRef: other.ref }
      : { base: other.diagram, baseRef: other.ref, target: open, targetRef: sessionRef() };
  };

  const delta = createMemo<Delta | undefined>(() => {
    const pair = sides();
    if (pair === undefined) {
      return undefined;
    }
    return { ...diff(pair.base, pair.target), baseRef: pair.baseRef, targetRef: pair.targetRef };
  });

  return {
    delta,
    attachedIsTarget,
    baseStandIn: (): Diagram | undefined => (attachedIsTarget() ? undefined : attached()?.diagram),
    swap: (): void => { setAttachedIsTarget((was: boolean): boolean => !was); },
    attach: (diagram: Diagram, ref: string, asTarget: boolean): void => {
      setAttached({ diagram, ref });
      setAttachedIsTarget(asTarget);
    },
    detach: (): void => {
      setAttached(undefined);
      setAttachedIsTarget(true);
    },
  };
}
export interface DiffState {
  delta: Accessor<Delta | undefined>;
  attachedIsTarget: Accessor<boolean>;
  baseStandIn: Accessor<Diagram | undefined>;
  swap: () => void;
  attach: (diagram: Diagram, ref: string, asTarget: boolean) => void;
  detach: () => void;
}
