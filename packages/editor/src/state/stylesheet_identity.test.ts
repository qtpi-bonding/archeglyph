// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Behavioral test suite for stylesheet identity (hash) and diffing, derived from:
//   1. .archegraph/specs/editor-external-change/stylesheet_hash.spec.textproto
//      and stylesheet_diff.spec.textproto (the authority)
//   2. proto/style.proto (the data model — StyleEdit.id, StyleEdit.base_hash,
//      StyleEditState, and the four *StyleChange messages)
//
// Expectations here come from the doc fields of the specs and the proto
// comments, NOT from reading the implementation bodies. Where the
// implementation appears to diverge, the test is left failing and reported
// rather than adjusted to match the code.

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntry,
  AnnotationEntrySchema,
  EdgeStyleEntry,
  EdgeStyleEntrySchema,
  GroupStyleEntry,
  GroupStyleEntrySchema,
  NodeLayoutSchema,
  NodeStyleEntry,
  NodeStyleEntrySchema,
  StyleChangeType,
  StyleEditSchema,
  StyleEditState,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import { hashStylesheet } from './stylesheet_hash';
import { diffStylesheets } from './stylesheet_diff';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function node(x: number, y: number): NodeStyleEntry {
  return create(NodeStyleEntrySchema, {
    layout: create(NodeLayoutSchema, { position: { x, y } }),
  });
}

function edge(color: string): EdgeStyleEntry {
  return create(EdgeStyleEntrySchema, {
    connection: { stroke: { paint: { case: 'color', value: { value: color } } } },
  });
}

function group(padding: number): GroupStyleEntry {
  return create(GroupStyleEntrySchema, {
    layout: { padding },
  });
}

function annotation(text: string): AnnotationEntry {
  return create(AnnotationEntrySchema, {
    id: 'a1',
    content: [{ locale: 'en', source: text }],
  });
}

const HEX16 = /^[0-9a-f]{16}$/;

// ---------------------------------------------------------------------------
// hashStylesheet
// ---------------------------------------------------------------------------

describe('hashStylesheet', () => {
  test('is deterministic across repeated calls on the same stylesheet', async () => {
    const sheet = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(1, 2), n2: node(3, 4) },
    });
    const h1 = await hashStylesheet(sheet);
    const h2 = await hashStylesheet(sheet);
    expect(h1).toBe(h2);
  });

  test('shape: 16 lowercase hex characters', async () => {
    const sheet = create(StylesheetSchema, { schemaVersion: 1 });
    const h = await hashStylesheet(sheet);
    expect(h).toMatch(HEX16);
  });

  test('empty stylesheet hashes without throwing and matches the hex shape', async () => {
    const sheet = create(StylesheetSchema, {});
    const h = await hashStylesheet(sheet);
    expect(h).toMatch(HEX16);
  });

  test('empty maps vs. absent maps hash identically (protobuf makes these the same value)', async () => {
    const withEmptyMaps = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {},
      edges: {},
      groups: {},
      annotations: {},
    });
    const withoutMaps = create(StylesheetSchema, { schemaVersion: 1 });
    const h1 = await hashStylesheet(withEmptyMaps);
    const h2 = await hashStylesheet(withoutMaps);
    expect(h1).toBe(h2);
  });

  test('ORDER INDEPENDENCE: top-level map insertion order does not affect the hash (nodes)', async () => {
    const a: Record<string, NodeStyleEntry> = {};
    a.n1 = node(1, 2);
    a.n2 = node(3, 4);
    a.n3 = node(5, 6);

    const b: Record<string, NodeStyleEntry> = {};
    b.n3 = node(5, 6);
    b.n1 = node(1, 2);
    b.n2 = node(3, 4);

    const sheetA = create(StylesheetSchema, { schemaVersion: 1, nodes: a });
    const sheetB = create(StylesheetSchema, { schemaVersion: 1, nodes: b });

    expect(await hashStylesheet(sheetA)).toBe(await hashStylesheet(sheetB));
  });

  test('ORDER INDEPENDENCE across all four map kinds combined', async () => {
    const buildForward = (): Stylesheet => {
      const nodes: Record<string, NodeStyleEntry> = {};
      nodes.n1 = node(1, 2);
      nodes.n2 = node(3, 4);
      const edges: Record<string, EdgeStyleEntry> = {};
      edges.e1 = edge('#ff0000');
      edges.e2 = edge('#00ff00');
      const groups: Record<string, GroupStyleEntry> = {};
      groups.g1 = group(1);
      groups.g2 = group(2);
      const annotations: Record<string, AnnotationEntry> = {};
      annotations.a1 = annotation('hello');
      annotations.a2 = annotation('world');
      return create(StylesheetSchema, { schemaVersion: 1, nodes, edges, groups, annotations });
    };

    const buildReversed = (): Stylesheet => {
      const nodes: Record<string, NodeStyleEntry> = {};
      nodes.n2 = node(3, 4);
      nodes.n1 = node(1, 2);
      const edges: Record<string, EdgeStyleEntry> = {};
      edges.e2 = edge('#00ff00');
      edges.e1 = edge('#ff0000');
      const groups: Record<string, GroupStyleEntry> = {};
      groups.g2 = group(2);
      groups.g1 = group(1);
      const annotations: Record<string, AnnotationEntry> = {};
      annotations.a2 = annotation('world');
      annotations.a1 = annotation('hello');
      return create(StylesheetSchema, { schemaVersion: 1, nodes, edges, groups, annotations });
    };

    expect(await hashStylesheet(buildForward())).toBe(await hashStylesheet(buildReversed()));
  });

  test('NESTED order independence: a map inside an annotation entry (tags) does not affect the hash', async () => {
    const forward = create(AnnotationEntrySchema, {
      id: 'a1',
      tags: (() => {
        const t: Record<string, string> = {};
        t.alpha = '1';
        t.beta = '2';
        return t;
      })(),
    });
    const reversed = create(AnnotationEntrySchema, {
      id: 'a1',
      tags: (() => {
        const t: Record<string, string> = {};
        t.beta = '2';
        t.alpha = '1';
        return t;
      })(),
    });

    const sheetForward = create(StylesheetSchema, { schemaVersion: 1, annotations: { a1: forward } });
    const sheetReversed = create(StylesheetSchema, { schemaVersion: 1, annotations: { a1: reversed } });

    expect(await hashStylesheet(sheetForward)).toBe(await hashStylesheet(sheetReversed));
  });

  test('pendingEdits do NOT affect the hash', async () => {
    const base = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(1, 2) },
    });
    const withPending = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(1, 2) },
      pendingEdits: [
        create(StyleEditSchema, {
          schemaVersion: 1,
          id: 'deadbeefdeadbeef',
          author: 'ai:claude',
          state: StyleEditState.PENDING,
        }),
      ],
    });

    expect(await hashStylesheet(base)).toBe(await hashStylesheet(withPending));
  });

  test('two stylesheets differing only in pendingEdits contents still hash identically', async () => {
    const editA = create(StyleEditSchema, {
      schemaVersion: 1,
      id: 'aaaaaaaaaaaaaaaa',
      author: 'ai:claude',
      state: StyleEditState.PENDING,
    });
    const editB = create(StyleEditSchema, {
      schemaVersion: 1,
      id: 'bbbbbbbbbbbbbbbb',
      author: 'user:alice',
      state: StyleEditState.PENDING,
      description: 'totally different proposal',
    });

    const sheetA = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) }, pendingEdits: [editA] });
    const sheetB = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) }, pendingEdits: [editB] });

    expect(await hashStylesheet(sheetA)).toBe(await hashStylesheet(sheetB));
  });

  test('sensitivity: a changed colour value changes the hash', async () => {
    const red = create(StylesheetSchema, { schemaVersion: 1, edges: { e1: edge('#ff0000') } });
    const blue = create(StylesheetSchema, { schemaVersion: 1, edges: { e1: edge('#0000ff') } });
    expect(await hashStylesheet(red)).not.toBe(await hashStylesheet(blue));
  });

  test('sensitivity: a changed position value changes the hash', async () => {
    const a = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    const b = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 999) } });
    expect(await hashStylesheet(a)).not.toBe(await hashStylesheet(b));
  });

  test('sensitivity: an added map entry changes the hash', async () => {
    const a = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    const b = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2), n2: node(3, 4) } });
    expect(await hashStylesheet(a)).not.toBe(await hashStylesheet(b));
  });

  test('sensitivity: a removed map entry changes the hash', async () => {
    const a = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2), n2: node(3, 4) } });
    const b = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    expect(await hashStylesheet(a)).not.toBe(await hashStylesheet(b));
  });
});

// ---------------------------------------------------------------------------
// diffStylesheets
// ---------------------------------------------------------------------------

describe('diffStylesheets', () => {
  test('identical inputs (by value, separately constructed) return undefined', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    expect(diffStylesheets(base, incoming, 'ai:claude')).toBeUndefined();
  });

  test('compares by VALUE, not by reference: two structurally-equal but separately-parsed stylesheets diff to undefined', () => {
    // Simulate "separate parses" by round-tripping through plain-object literals
    // built independently, matching how a real load would produce two distinct
    // message instances with no shared object identity.
    const base = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(10, 20) },
      edges: { e1: edge('#123456') },
      groups: { g1: group(4) },
      annotations: { a1: annotation('text') },
    });
    const incoming = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(10, 20) },
      edges: { e1: edge('#123456') },
      groups: { g1: group(4) },
      annotations: { a1: annotation('text') },
    });
    expect(base).not.toBe(incoming);
    expect(base.nodes.n1).not.toBe(incoming.nodes.n1);
    expect(diffStylesheets(base, incoming, 'ai:claude')).toBeUndefined();
  });

  test('an added node entry produces one ADDED NodeStyleChange on the right id, with author and PENDING state', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, nodes: {} });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });

    const result = diffStylesheets(base, incoming, 'ai:claude');
    expect(result).toBeDefined();
    expect(result!.state).toBe(StyleEditState.PENDING);
    expect(result!.author).toBe('ai:claude');
    expect(result!.nodeChanges.length).toBe(1);
    expect(result!.nodeChanges[0].nodeId).toBe('n1');
    expect(result!.nodeChanges[0].changeType).toBe(StyleChangeType.ADDED);
    expect(result!.nodeChanges[0].after).toBeDefined();
  });

  test('a removed node entry produces DELETED with no `after`', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, nodes: {} });

    const result = diffStylesheets(base, incoming, 'ai:claude');
    expect(result).toBeDefined();
    expect(result!.nodeChanges.length).toBe(1);
    expect(result!.nodeChanges[0].nodeId).toBe('n1');
    expect(result!.nodeChanges[0].changeType).toBe(StyleChangeType.DELETED);
    expect(result!.nodeChanges[0].after).toBeUndefined();
  });

  test('a modified node entry produces MODIFIED carrying the whole new entry', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 999) } });

    const result = diffStylesheets(base, incoming, 'ai:claude');
    expect(result).toBeDefined();
    expect(result!.nodeChanges.length).toBe(1);
    expect(result!.nodeChanges[0].nodeId).toBe('n1');
    expect(result!.nodeChanges[0].changeType).toBe(StyleChangeType.MODIFIED);
    expect(result!.nodeChanges[0].after?.layout?.position?.y).toBe(999);
  });

  test('an entry that moved keys but did not change content does not appear as a change', () => {
    // base has n1 then n2; incoming has the same content with n2 then n1 inserted
    // in the object — same set of ids/values, different insertion order only.
    const baseNodes: Record<string, NodeStyleEntry> = {};
    baseNodes.n1 = node(1, 2);
    baseNodes.n2 = node(3, 4);

    const incomingNodes: Record<string, NodeStyleEntry> = {};
    incomingNodes.n2 = node(3, 4);
    incomingNodes.n1 = node(1, 2);

    const base = create(StylesheetSchema, { schemaVersion: 1, nodes: baseNodes });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, nodes: incomingNodes });

    expect(diffStylesheets(base, incoming, 'ai:claude')).toBeUndefined();
  });

  test('changes across all four element types are all reported in one StyleEdit', () => {
    const base = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(1, 2) },
      edges: { e1: edge('#ff0000') },
      groups: { g1: group(1) },
      annotations: { a1: annotation('hello') },
    });
    const incoming = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: node(1, 999) },
      edges: { e1: edge('#0000ff') },
      groups: { g1: group(2) },
      annotations: { a1: annotation('goodbye') },
    });

    const result = diffStylesheets(base, incoming, 'ai:claude');
    expect(result).toBeDefined();
    expect(result!.nodeChanges.length).toBe(1);
    expect(result!.edgeChanges.length).toBe(1);
    expect(result!.groupChanges.length).toBe(1);
    expect(result!.annotationChanges.length).toBe(1);
    expect(result!.nodeChanges[0].changeType).toBe(StyleChangeType.MODIFIED);
    expect(result!.edgeChanges[0].changeType).toBe(StyleChangeType.MODIFIED);
    expect(result!.groupChanges[0].changeType).toBe(StyleChangeType.MODIFIED);
    expect(result!.annotationChanges[0].changeType).toBe(StyleChangeType.MODIFIED);
  });

  test('an added edge entry produces ADDED on the right id', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, edges: {} });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, edges: { e1: edge('#ff0000') } });
    const result = diffStylesheets(base, incoming, 'importer:archegraph');
    expect(result).toBeDefined();
    expect(result!.edgeChanges.length).toBe(1);
    expect(result!.edgeChanges[0].edgeId).toBe('e1');
    expect(result!.edgeChanges[0].changeType).toBe(StyleChangeType.ADDED);
  });

  test('a removed group entry produces DELETED with no `after`', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, groups: { g1: group(1) } });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, groups: {} });
    const result = diffStylesheets(base, incoming, 'ai:claude');
    expect(result).toBeDefined();
    expect(result!.groupChanges.length).toBe(1);
    expect(result!.groupChanges[0].groupId).toBe('g1');
    expect(result!.groupChanges[0].changeType).toBe(StyleChangeType.DELETED);
    expect(result!.groupChanges[0].after).toBeUndefined();
  });

  test('a modified annotation entry produces MODIFIED on the right id', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, annotations: { a1: annotation('hello') } });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, annotations: { a1: annotation('goodbye') } });
    const result = diffStylesheets(base, incoming, 'ai:claude');
    expect(result).toBeDefined();
    expect(result!.annotationChanges.length).toBe(1);
    expect(result!.annotationChanges[0].annotationId).toBe('a1');
    expect(result!.annotationChanges[0].changeType).toBe(StyleChangeType.MODIFIED);
  });

  test('author is threaded through verbatim to the returned StyleEdit', () => {
    const base = create(StylesheetSchema, { schemaVersion: 1, nodes: {} });
    const incoming = create(StylesheetSchema, { schemaVersion: 1, nodes: { n1: node(1, 2) } });
    const result = diffStylesheets(base, incoming, 'user:alice');
    expect(result).toBeDefined();
    expect(result!.author).toBe('user:alice');
  });
});
