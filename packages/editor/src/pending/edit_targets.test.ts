// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { StyleEditSchema, StylesheetSchema, type StyleEdit, type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { proposalAfterPress, proposalForKey, refForKey, targetKey, toggledProposal, touchedKeys } from './edit_targets';

function edit(id: string, parts: { element?: string[]; edge?: string[]; annotation?: string[] }): StyleEdit {
  return create(StyleEditSchema, {
    id,
    elementChanges: (parts.element ?? []).map((elementId: string) => ({ elementId })),
    edgeChanges: (parts.edge ?? []).map((edgeId: string) => ({ edgeId })),
    annotationChanges: (parts.annotation ?? []).map((annotationId: string) => ({ annotationId })),
  });
}

function sheet(...edits: StyleEdit[]): Stylesheet {
  return create(StylesheetSchema, { pendingEdits: edits });
}

describe('touchedKeys', () => {
  test('names every element, edge and annotation a proposal changes, each in its own namespace', () => {
    const keys = touchedKeys(edit('a', { element: ['app'], edge: ['app__cache'], annotation: ['note'] }));
    expect([...keys].sort()).toEqual(['annotation:note', 'edge:app__cache', 'element:app']);
  });

  test('an element and an edge with the same id are different targets', () => {
    const keys = touchedKeys(edit('a', { element: ['x'] }));
    expect(keys.has(targetKey('element', 'x'))).toBe(true);
    expect(keys.has(targetKey('edge', 'x'))).toBe(false);
  });
});

describe('proposalForKey', () => {
  test('a part no proposal touches selects nothing', () => {
    expect(proposalForKey(sheet(edit('a', { element: ['app'] })), 'element:other', undefined)).toBeUndefined();
  });

  test('a part one proposal touches selects it', () => {
    const s = sheet(edit('a', { element: ['app'] }), edit('b', { annotation: ['note'] }));
    expect(proposalForKey(s, 'annotation:note', undefined)).toBe('b');
  });

  test('where several proposals touch a part, each click moves to the next and wraps', () => {
    const s = sheet(edit('a', { element: ['app'] }), edit('b', { element: ['app'] }), edit('c', { element: ['other'] }));
    expect(proposalForKey(s, 'element:app', undefined)).toBe('a');
    expect(proposalForKey(s, 'element:app', 'a')).toBe('b');
    expect(proposalForKey(s, 'element:app', 'b')).toBe('a');
  });

  test('a selection that does not touch the part falls back to the first that does', () => {
    const s = sheet(edit('a', { element: ['app'] }), edit('c', { element: ['other'] }));
    expect(proposalForKey(s, 'element:app', 'c')).toBe('a');
  });
});

describe('proposalAfterPress', () => {
  const s = sheet(edit('a', { element: ['app'] }));

  test('a press on a faint part selects its proposal', () => {
    expect(proposalAfterPress(s, 'element:app', undefined)).toBe('a');
  });

  test('a press anywhere else clears the selection', () => {
    expect(proposalAfterPress(s, undefined, 'a')).toBeUndefined();
  });

  test('a press on a faint part no proposal touches clears it too', () => {
    expect(proposalAfterPress(s, 'element:other', 'a')).toBeUndefined();
  });
});

describe('toggledProposal', () => {
  test('clicking the open proposal closes it', () => {
    expect(toggledProposal('a', 'a')).toBeUndefined();
  });

  test('clicking another proposal, or any with none open, opens that one', () => {
    expect(toggledProposal('a', 'b')).toBe('b');
    expect(toggledProposal(undefined, 'b')).toBe('b');
  });
});

describe('refForKey', () => {
  test('turns each namespace into the canvas reference that dims it', () => {
    expect(refForKey('element:app')).toEqual({ kind: 'node', id: 'app' });
    expect(refForKey('edge:app__cache')).toEqual({ kind: 'edge', id: 'app__cache' });
    expect(refForKey('annotation:egress-budget')).toEqual({ kind: 'annotation', id: 'egress-budget' });
  });

  test('an id containing a colon keeps it', () => {
    expect(refForKey('element:a:b')).toEqual({ kind: 'node', id: 'a:b' });
  });
});
