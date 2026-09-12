// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The save controller against a fake host, the way a repository is faked in a
// unit test. No DOM: Solid's reactivity runs headless inside createRoot.
//
// Written after the editor was found raising a file dialog on EVERY edit. The
// controller was arming its debounce on canSave(), which for the browser host
// is true as soon as a diagram file is open -- with no style file to write to,
// each save then had to raise showSaveFilePicker. Nothing about that is
// visible from a test of the adapter or of the controller in isolation; it
// needs the two put together, which is exactly what this file does.

import { describe, expect, test } from 'bun:test';
import { createRoot, createSignal, type Accessor } from 'solid-js';
import { create } from '@bufbuild/protobuf';
import { StylesheetSchema, type StyleEdit, type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Ok, type Result } from '@archeglyph/proto/util/result';
import type { AdapterError, FileStamp, HostAdapter, LoadResult } from '../adapters/host_adapter';
import type { EditorState } from '../state/editor_state';
import { createSaveController, type SaveController } from './save_controller';

/** A host that records writes instead of performing them. */
class FakeAdapter implements HostAdapter {
  saves: number = 0;
  autosaveAllowed: boolean;
  saveable: boolean;

  constructor(options: { saveable: boolean; autosaveAllowed: boolean }) {
    this.saveable = options.saveable;
    this.autosaveAllowed = options.autosaveAllowed;
  }

  canSave(): boolean {
    return this.saveable;
  }

  canAutosave(): boolean {
    return this.autosaveAllowed;
  }

  async load(): Promise<Result<LoadResult, AdapterError>> {
    throw new Error('not used');
  }

  async save(_stylesheet: Stylesheet): Promise<Result<void, AdapterError>> {
    this.saves += 1;
    // The real BrowserFsAdapter acquires its handle on the first successful
    // write, and only then can it save silently. Model that here -- it is the
    // behaviour the explicit-Save path depends on.
    this.autosaveAllowed = true;
    return Ok(undefined);
  }

  async stat(): Promise<Result<FileStamp, AdapterError>> {
    throw new Error('not used');
  }
}

/** Just enough EditorState to drive the controller's version effect. */
function fakeState(): { state: EditorState; edit: () => void } {
  const [version, setVersion] = createSignal<number>(0);
  const sheet = create(StylesheetSchema, { schemaVersion: 1 });
  const state = {
    diagram: () => { throw new Error('not used'); },
    stylesheet: (): Stylesheet => sheet,
    canUndo: (): boolean => false,
    canRedo: (): boolean => false,
    applyStyleEdit: (_edit: StyleEdit): void => undefined,
    undo: (): void => undefined,
    redo: (): void => undefined,
    appendPendingEdit: (_edit: StyleEdit): void => undefined,
    adoptStylesheet: (_stylesheet: Stylesheet): void => undefined,
    dirty: (() => false) as Accessor<boolean>,
    version: version as Accessor<number>,
  } as unknown as EditorState;
  return { state, edit: (): void => { setVersion((current) => current + 1); } };
}

const tick = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Run body inside a reactive root, disposing it afterwards. */
async function withController(
  adapter: FakeAdapter,
  body: (controller: SaveController, edit: () => void) => Promise<void>,
): Promise<void> {
  const { state, edit } = fakeState();
  let dispose = (): void => undefined;
  const controller = createRoot((disposer) => {
    dispose = disposer;
    return createSaveController(adapter, state, 5);
  });
  try {
    // Solid schedules effects rather than running them inline, so let the
    // controller's initial (deliberately ignored) run happen before the body
    // starts making edits -- otherwise the first edit is folded into it.
    await tick(0);
    await body(controller, edit);
  } finally {
    controller.dispose();
    dispose();
  }
}

describe('background saving', () => {
  test('a host that cannot autosave writes nothing, however many edits arrive', async () => {
    // This is the bug. The browser host reports canSave() true with only a
    // diagram open, but saving then has to raise a picker -- and a debounce
    // timer has no user activation to raise one with. Six edits used to mean
    // six dialogs.
    const adapter = new FakeAdapter({ saveable: true, autosaveAllowed: false });
    await withController(adapter, async (controller, edit) => {
      for (let i = 0; i < 6; i += 1) {
        edit();
      }
      await tick(40);
      expect(adapter.saves).toBe(0);
      expect(controller.status()).toBe('unsaved');
    });
  });

  test('a host that can autosave writes once the debounce settles', async () => {
    const adapter = new FakeAdapter({ saveable: true, autosaveAllowed: true });
    await withController(adapter, async (controller, edit) => {
      edit();
      await tick(40);
      expect(adapter.saves).toBe(1);
      expect(controller.status()).toBe('saved');
    });
  });

  test('a burst of edits coalesces into one write', async () => {
    const adapter = new FakeAdapter({ saveable: true, autosaveAllowed: true });
    await withController(adapter, async (_controller, edit) => {
      for (let i = 0; i < 5; i += 1) {
        edit();
      }
      await tick(40);
      expect(adapter.saves).toBe(1);
    });
  });

  test('loading a document does not immediately save it back', async () => {
    const adapter = new FakeAdapter({ saveable: true, autosaveAllowed: true });
    await withController(adapter, async (_controller) => {
      await tick(40);
      expect(adapter.saves).toBe(0);
    });
  });
});

describe('explicit save', () => {
  test('it writes even when the host cannot autosave, and starts autosave off', async () => {
    // The other half of the same bug: autosave cannot bootstrap itself,
    // because the first write must raise a picker and only a real click
    // carries the activation for one. Explicit Save is what gets the handle.
    const adapter = new FakeAdapter({ saveable: true, autosaveAllowed: false });
    await withController(adapter, async (controller, edit) => {
      edit();
      await tick(40);
      expect(adapter.saves).toBe(0);

      await controller.saveNow();
      expect(adapter.saves).toBe(1);
      expect(controller.status()).toBe('saved');

      // The handle now exists, so subsequent edits save silently.
      edit();
      await tick(40);
      expect(adapter.saves).toBe(2);
    });
  });

  test('a host that cannot save at all writes nothing even when asked', async () => {
    const adapter = new FakeAdapter({ saveable: false, autosaveAllowed: false });
    await withController(adapter, async (controller) => {
      await controller.saveNow();
      expect(adapter.saves).toBe(0);
    });
  });
});
