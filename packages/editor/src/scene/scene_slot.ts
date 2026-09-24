// SPDX-License-Identifier: MPL-2.0

import { createRoot, createSignal, type Accessor } from 'solid-js';
import { Scene } from './scene';

export interface SceneSlot {
  scene: Accessor<Scene | null>;
  install: (make: () => Scene) => void;
  dispose: () => void;
}

export function createSceneSlot(): SceneSlot {
  const [scene, setScene] = createSignal<Scene | null>(null);
  let disposeCurrent: (() => void) | undefined;

  return {
    scene,
    install: (make: () => Scene): void => {
      const previous: (() => void) | undefined = disposeCurrent;
      setScene(createRoot((dispose: () => void): Scene => {
        disposeCurrent = dispose;
        return make();
      }));
      previous?.();
    },
    dispose: (): void => {
      disposeCurrent?.();
      disposeCurrent = undefined;
      setScene(null);
    },
  };
}
