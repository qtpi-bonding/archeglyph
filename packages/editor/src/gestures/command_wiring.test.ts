// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Commands as a WIRE, not as behaviour.
//
// Two bugs of the same shape shipped despite full green tests. `focus-inspector`
// was in COMMANDS, bound in KEYMAP, and its `uses:` edge was satisfied -- but
// the optional callback carrying it was never populated by any caller, so the
// chord resolved to a command that called `undefined?.()` forever. Later,
// Cmd+S resolved to a command whose context supplied `save: () => undefined`,
// a literal placeholder. Both look correct from every angle except "does
// anything actually happen".
//
// So this file asks exactly that, for every command: run it against a context
// where every collaborator is a spy, and require an observable effect. A
// command that does nothing at all fails here.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  NodeLayoutSchema,
  NodeStyleEntrySchema,
  StylesheetSchema,
  Vec2Schema,
  type StyleEdit,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import type { EditorState } from '../state/editor_state';
import type { ElementRef, UiState } from '../ui_state/ui_state';
import { KEYMAP, type CommandId } from '../ui_state/keymap';
import { buildSceneGeometry } from '../scene/scene';
import { COMMANDS, runCommand, type CommandContext } from './commands';

interface Spy {
  calls: string[];
  context: CommandContext;
}

function node(id: string, x: number, y: number): LaidOutNode {
  return Object.assign(new LaidOutNode(), {
    id,
    position: create(Vec2Schema, { x, y }),
    size: create(Vec2Schema, { x: 100, y: 40 }),
  });
}

function sheet(): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {
      n1: create(NodeStyleEntrySchema, {
        layout: create(NodeLayoutSchema, {
          position: create(Vec2Schema, { x: 10, y: 20 }),
          size: create(Vec2Schema, { x: 100, y: 40 }),
        }),
      }),
    },
  });
}

/**
 * A CommandContext whose every collaborator records that it was reached.
 *
 * Note what is NOT here: no optional field is left undefined. That is the
 * point -- this is the fully-wired shell the commands are entitled to assume,
 * so anything that still does nothing is inert by its own fault.
 */
function spyContext(selection: Array<ElementRef>): Spy {
  const calls: string[] = [];
  let current: Array<ElementRef> = selection;
  let stylesheet: Stylesheet = sheet();

  const state = {
    diagram: () => { throw new Error('not used'); },
    stylesheet: (): Stylesheet => stylesheet,
    canUndo: (): boolean => true,
    canRedo: (): boolean => true,
    applyStyleEdit: (edit: StyleEdit): void => {
      calls.push(`applyStyleEdit:${edit.description}`);
    },
    undo: (): void => { calls.push('undo'); },
    redo: (): void => { calls.push('redo'); },
    appendPendingEdit: (): void => { calls.push('appendPendingEdit'); },
    adoptStylesheet: (next: Stylesheet): void => { stylesheet = next; },
    dirty: () => false,
    version: () => 0,
  } as unknown as EditorState;

  const ui = {
    selection: (): Array<ElementRef> => current,
    setSelection: (next: Array<ElementRef>): void => {
      current = next;
      calls.push('setSelection');
    },
    hover: () => undefined,
    setHover: (): void => undefined,
    tool: () => 'select',
    setTool: (): void => undefined,
    viewport: () => ({ panX: 0, panY: 0, zoom: 1 }),
    setViewport: (): void => { calls.push('setViewport'); },
  } as unknown as UiState;

  const geometry = buildSceneGeometry(
    Object.assign(new LaidOutDiagram(), { nodes: [node('n1', 10, 20), node('n2', 300, 20)] }),
    '<svg/>',
  );

  return {
    calls,
    context: {
      state,
      ui,
      geometry,
      rect: { left: 0, top: 0, width: 800, height: 600 },
      save: (): void => { calls.push('save'); },
      focusInspector: (): void => { calls.push('focusInspector'); },
      beginTextEdit: (): void => { calls.push('beginTextEdit'); },
    },
  };
}

describe('every bound chord reaches a command', () => {
  test('no keymap entry names a command that does not exist', () => {
    const known = new Set(COMMANDS.map((command) => command.id));
    const orphans = KEYMAP.filter((entry) => !known.has(entry.command)).map((entry) => entry.command);
    expect(orphans).toEqual([]);
  });

  test('no two commands share an id', () => {
    const ids = COMMANDS.map((command) => command.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe('no command is inert', () => {
  // A selection is supplied because most commands legitimately do nothing
  // without one; the question here is whether they do anything WITH one.
  const selection: Array<ElementRef> = [{ id: 'n1', kind: 'node' }];

  for (const command of COMMANDS) {
    test(`${command.id} has an observable effect`, () => {
      const spy = spyContext(selection);
      runCommand(command.id as CommandId, spy.context);
      expect(spy.calls).not.toEqual([]);
    });
  }

  test('save reaches the host, rather than a placeholder', () => {
    const spy = spyContext(selection);
    runCommand('save' as CommandId, spy.context);
    expect(spy.calls).toEqual(['save']);
  });

  test('focus-inspector reaches the panel, rather than an unset callback', () => {
    const spy = spyContext(selection);
    runCommand('focus-inspector' as CommandId, spy.context);
    expect(spy.calls).toEqual(['focusInspector']);
  });
});
