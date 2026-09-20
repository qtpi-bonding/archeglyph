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
      tags: (() => {
        const t: Record<string, string> = {};
        t.alpha = '1';
        t.beta = '2';
        return t;
      })(),
    });
    const reversed = create(AnnotationEntrySchema, {
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

