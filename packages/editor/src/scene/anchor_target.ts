// SPDX-License-Identifier: MPL-2.0

import { RefKind } from '@archeglyph/proto/gen/style_pb';
import type { ElementRef } from '../ui_state/ui_state';
import { elementKey } from './element_key';
import type { SceneGeometry } from './scene';

// An annotation anchors to an element by id alone. The scene indexes an
// element by how it is drawn, so the target is whichever of the block or box
// forms the geometry holds.
export function anchorTargetRef(
  geometry: SceneGeometry,
  refKind: RefKind,
  refId: string,
): ElementRef | undefined {
  if (refKind !== RefKind.ELEMENT) {
    return undefined;
  }

  const block: ElementRef = { kind: 'node', id: refId };
  if (geometry.byKey[elementKey(block)] !== undefined) {
    return block;
  }

  const box: ElementRef = { kind: 'group', id: refId };
  if (geometry.byKey[elementKey(box)] !== undefined) {
    return box;
  }
  return undefined;
}
