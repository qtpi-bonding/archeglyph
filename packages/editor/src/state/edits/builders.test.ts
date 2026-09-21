// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Behavioral test suite for the style-edit builders, derived from:
//   1. .archegraph/specs/editor-edits/*.spec.textproto (the authority)
//   2. proto/style.proto (the data model and what field-absence means)
//   3. packages/editor/src/state/apply_style_edit.ts (the consumer of a StyleEdit)
//
// Expectations here come from the doc fields of the spec and the proto
// comments, NOT from reading the implementation bodies. Where the
// implementation appears to diverge, the test is left failing and reported
// rather than adjusted to match the code.

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationAnchorSchema,
  AnnotationEntry,
  AnnotationEntrySchema,
  AnnotationLayoutSchema,
  CanvasStyleSchema,
  EdgeLayoutSchema,
  EdgeRouting,
  EdgeStyleEntrySchema,
  Glyph1DSchema,
  Glyph2DSchema,
  GroupLayoutSchema,
  GroupRenderMode,
  GroupStyleEntry,
  GroupStyleEntrySchema,
  NodeLayoutSchema,
  NodeStyleEntry,
  NodeStyleEntrySchema,
  NodeVisibility,
  RefKind,
  StyleChangeType,
  StyleEditSchema,
  StyleEditState,
  Stylesheet,
  StylesheetSchema,
  TypographySchema,
  Vec2,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { LocalizationSchema } from '@archeglyph/proto/gen/content_pb';

import { applyStyleEditToStylesheet } from '../apply_style_edit';

import {
  patchNodeEntry,
  patchEdgeEntry,
  patchGroupEntry,
  patchAnnotationEntry,
} from './entry_patch';
import { styleEdit, nodeChange, edgeChange, groupChange, annotationChange } from './edit_builder';
import { moveNodeEdit, moveElementsEdit, moveGroupEdit, moveAnnotationEdit, ElementMove } from './move';
import { resizeNodeEdit, resizeGroupEdit, resizeAnnotationEdit, clearNodeSizeEdit } from './resize';
import { setNodeHiddenEdit, setNodesHiddenEdit, showAllEdit } from './visibility';
import { addAnnotationEdit, setAnnotationTextEdit, setAnnotationAnchorEdit, deleteAnnotationEdit, localized } from './annotation';
import {
  setNodeGlyphEdit,
  setNodesGlyphEdit,
  setEdgeGlyphEdit,
  setGroupGlyphEdit,
  setAnnotationGlyphEdit,
} from './glyph';
import { pinAllEdit, unpinAllEdit, unpinElementsEdit } from './layout_command';
import { proposePendingEdit, findPendingEdit, removePendingEdit } from './pending';

import type { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import type { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import type { LaidOutGroup } from '@archeglyph/core/layout/laid_out_group';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function vec2(x: number, y: number): Vec2 {
  return create(Vec2Schema, { x, y });
}

function emptyStylesheet(overrides: Partial<Stylesheet> = {}): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {},
    edges: {},
    groups: {},
    annotations: {},
    pendingEdits: [],
    ...overrides,
  });
}

function nodeEntry(overrides: Partial<NodeStyleEntry> = {}): NodeStyleEntry {
  return create(NodeStyleEntrySchema, overrides);
}

function groupEntry(overrides: Partial<GroupStyleEntry> = {}): GroupStyleEntry {
  return create(GroupStyleEntrySchema, overrides);
}

function annotationEntry(overrides: Partial<Omit<AnnotationEntry, '$typeName' | '$unknown'>> = {}): AnnotationEntry {
  return create(AnnotationEntrySchema, { ...overrides });
}

function laidOutNode(overrides: Partial<LaidOutNode> = {}): LaidOutNode {
  return {
    id: 'n1',
    parentGroup: undefined,
    position: vec2(0, 0),
    size: vec2(10, 10),
    shape: create(Glyph2DSchema, {}),
    typography: create(TypographySchema, {}),
    label: [],
    ...overrides,
  } as LaidOutNode;
}

function laidOutGroup(overrides: Partial<LaidOutGroup> = {}): LaidOutGroup {
  return {
    id: 'g1',
    parentGroup: undefined,
    position: vec2(0, 0),
    size: vec2(10, 10),
    shape: create(Glyph2DSchema, {}),
    typography: create(TypographySchema, {}),
    label: [],
    isSuperNode: false,
    hiddenDescendantCount: 0,
    ...overrides,
  } as LaidOutGroup;
}

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

interface DiagramParts {
  nodes?: LaidOutNode[];
  groups?: LaidOutGroup[];
}

function laidOutDiagram(parts: DiagramParts = {}): LaidOutDiagram {
  return {
    id: 'd1',
    canvas: create(CanvasStyleSchema, {}),
    nodes: byId(parts.nodes ?? []),
    edges: {},
    groups: byId(parts.groups ?? []),
    annotations: {},
  } as LaidOutDiagram;
}

// ===========================================================================
// entry_patch.ts
// ===========================================================================

describe('patchNodeEntry', () => {
  test('an absent existing entry is treated as empty, not an error', () => {
    const result = patchNodeEntry(undefined, { position: vec2(1, 2) });
    expect(result.layout?.position).toEqual(vec2(1, 2));
    expect(result.shape).toBeUndefined();
    expect(result.typography).toBeUndefined();
    expect(result.component).toBeUndefined();
    expect(result.visibility).toBeUndefined();
  });

  test('patching position does not clear existing size or rotation (layout merges field-wise)', () => {
    const existing = nodeEntry({
      layout: create(NodeLayoutSchema, { position: vec2(0, 0), size: vec2(50, 50), rotation: 45 }),
    });
    const result = patchNodeEntry(existing, { position: vec2(9, 9) });
    expect(result.layout?.position).toEqual(vec2(9, 9));
    expect(result.layout?.size).toEqual(vec2(50, 50));
    expect(result.layout?.rotation).toBe(45);
  });

  test('patching one non-layout field preserves the others untouched', () => {
    const existing = nodeEntry({
      shape: create(Glyph2DSchema, { cornerRadius: 4 }),
      typography: create(TypographySchema, { size: 12 }),
      component: 'widget',
      visibility: NodeVisibility.HIDDEN,
    });
    const result = patchNodeEntry(existing, { component: 'button' });
    expect(result.component).toBe('button');
    expect(result.shape?.cornerRadius).toBe(4);
    expect(result.typography?.size).toBe(12);
    expect(result.visibility).toBe(NodeVisibility.HIDDEN);
  });

  test('an unrelated sibling entry is untouched by a patch to this one (no shared mutation)', () => {
    const sibling = nodeEntry({ component: 'sibling-widget' });
    const target = nodeEntry({ component: 'target-widget' });
    patchNodeEntry(target, { position: vec2(5, 5) });
    expect(sibling.component).toBe('sibling-widget');
  });
});

describe('patchEdgeEntry', () => {
  test('patching routing preserves existing waypoints (layout merges field-wise)', () => {
    const existingEdge = create(EdgeStyleEntrySchema, {
      layout: create(EdgeLayoutSchema, {
        waypoints: [vec2(1, 1), vec2(2, 2)],
      }),
    });
    const result = patchEdgeEntry(existingEdge, { routing: EdgeRouting.ROUTING_ORTHOGONAL });
    expect(result.layout?.waypoints).toEqual([vec2(1, 1), vec2(2, 2)]);
    expect(result.layout?.routing).toBe(EdgeRouting.ROUTING_ORTHOGONAL);
  });

  test('an absent existing edge entry is treated as empty', () => {
    const result = patchEdgeEntry(undefined, { component: 'wire' });
    expect(result.component).toBe('wire');
    expect(result.connection).toBeUndefined();
    expect(result.typography).toBeUndefined();
  });
});

describe('patchGroupEntry', () => {
  test('patching position preserves padding, renderMode and labelPosition', () => {
    const existing = groupEntry({
      layout: create(GroupLayoutSchema, {
        position: vec2(0, 0),
        padding: 8,
        renderMode: GroupRenderMode.CONTRACTED,
        labelPosition: 3,
      }),
    });
    const result = patchGroupEntry(existing, { position: vec2(3, 3) });
    expect(result.layout?.position).toEqual(vec2(3, 3));
    expect(result.layout?.padding).toBe(8);
    expect(result.layout?.renderMode).toBe(GroupRenderMode.CONTRACTED);
    expect(result.layout?.labelPosition).toBe(3);
  });
});

describe('patchAnnotationEntry', () => {
  test('patching position preserves content, shape and component', () => {
    const existing = annotationEntry({
      content: [create(LocalizationSchema, { locale: 'en', source: 'hello' })],
      shape: create(Glyph2DSchema, { cornerRadius: 2 }),
      component: 'note',
    });
    const result = patchAnnotationEntry(existing, { position: vec2(4, 4) });
    expect(result.layout?.position).toEqual(vec2(4, 4));
    expect(result.content).toEqual(existing.content);
    expect(result.shape?.cornerRadius).toBe(2);
    expect(result.component).toBe('note');
  });
});

// ===========================================================================
// edit_builder.ts
// ===========================================================================

describe('styleEdit', () => {
  test('stamps state APPLIED and author user:local', () => {
    const edit = styleEdit({});
    expect(edit.state).toBe(StyleEditState.APPLIED);
    expect(edit.author).toBe('user:local');
  });

  test('stamps a current timestamp', () => {
    const before = BigInt(Date.now());
    const edit = styleEdit({});
    const after = BigInt(Date.now());
    expect(edit.timestampMs >= before && edit.timestampMs <= after).toBe(true);
  });

  test('description stays absent (undefined) when not supplied', () => {
    const edit = styleEdit({});
    expect(edit.description).toBeUndefined();
  });

  test('description is carried through when supplied', () => {
    const edit = styleEdit({ description: 'Did a thing' });
    expect(edit.description).toBe('Did a thing');
  });
});

describe('nodeChange / edgeChange / groupChange — change_type per spec doc', () => {
  test('nodeChange with an after entry is MODIFIED (first write and update are not distinguished)', () => {
    const entry = nodeEntry({ component: 'x' });
    const change = nodeChange('n1', entry);
    expect(change.changeType).toBe(StyleChangeType.MODIFIED);
    expect(change.after).toEqual(entry);
  });

  // Spec (edit_builder.spec.textproto, nodeChange doc): "DELETED (used by
  // layout_command) drops the entry entirely and is spelled with an absent
  // `after`." An absent `after` should therefore produce changeType DELETED.
  test('nodeChange with no after is spelled DELETED per spec doc', () => {
    const change = nodeChange('n1');
    expect(change.after).toBeUndefined();
    expect(change.changeType).toBe(StyleChangeType.DELETED);
  });

  test('edgeChange with no after is spelled DELETED per the same parallel-structure contract', () => {
    const change = edgeChange('e1');
    expect(change.after).toBeUndefined();
    expect(change.changeType).toBe(StyleChangeType.DELETED);
  });

  test('groupChange with no after is spelled DELETED per the same parallel-structure contract', () => {
    const change = groupChange('g1');
    expect(change.after).toBeUndefined();
    expect(change.changeType).toBe(StyleChangeType.DELETED);
  });
});

describe('annotationChange — annotations ADD/DELETE rather than MODIFY (annotation.spec.textproto)', () => {
  test('with an after entry, changeType is ADDED', () => {
    const entry = annotationEntry({});
    const change = annotationChange('a1', entry);
    expect(change.changeType).toBe(StyleChangeType.ADDED);
  });

  test('with no after, changeType is DELETED', () => {
    const change = annotationChange('a1');
    expect(change.changeType).toBe(StyleChangeType.DELETED);
    expect(change.after).toBeUndefined();
  });
});

// ===========================================================================
// move.ts
// ===========================================================================

describe('moveNodeEdit', () => {
  test('preserves size, rotation and every visual field on the existing entry (per doc)', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({
          layout: create(NodeLayoutSchema, { size: vec2(20, 20), rotation: 15 }),
          shape: create(Glyph2DSchema, { cornerRadius: 3 }),
          typography: create(TypographySchema, { size: 10 }),
          component: 'box',
          visibility: NodeVisibility.HIDDEN,
        }),
      },
    });
    const edit = moveNodeEdit(sheet, 'n1', vec2(100, 100));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const after = applied.nodes['n1'];
    expect(after.layout?.position).toEqual(vec2(100, 100));
    expect(after.layout?.size).toEqual(vec2(20, 20));
    expect(after.layout?.rotation).toBe(15);
    expect(after.shape?.cornerRadius).toBe(3);
    expect(after.typography?.size).toBe(10);
    expect(after.component).toBe('box');
    expect(after.visibility).toBe(NodeVisibility.HIDDEN);
  });

  test('moving one node does not disturb a sibling node entry', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({ component: 'moved' }),
        n2: nodeEntry({ component: 'sibling' }),
      },
    });
    const edit = moveNodeEdit(sheet, 'n1', vec2(5, 5));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n2']).toEqual(sheet.nodes['n2']);
  });

  test('moving a node with no prior entry pins only its position, leaving other fields absent', () => {
    const sheet = emptyStylesheet();
    const edit = moveNodeEdit(sheet, 'n1', vec2(3, 4));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const after = applied.nodes['n1'];
    expect(after.layout?.position).toEqual(vec2(3, 4));
    expect(after.layout?.size).toBeUndefined();
    expect(after.shape).toBeUndefined();
  });

  test('is idempotent: applying the same move twice yields the same stylesheet', () => {
    const sheet = emptyStylesheet({ nodes: { n1: nodeEntry({ component: 'box' }) } });
    const edit = moveNodeEdit(sheet, 'n1', vec2(7, 7));
    const once = applyStyleEditToStylesheet(sheet, edit);
    const editAgain = moveNodeEdit(once, 'n1', vec2(7, 7));
    const twice = applyStyleEditToStylesheet(once, editAgain);
    expect(twice.nodes['n1']).toEqual(once.nodes['n1']);
  });
});

describe('moveElementsEdit', () => {
  test('one edit moves nodes, groups and annotations together, each keeping its own other fields', () => {
    const sheet = emptyStylesheet({
      nodes: { n1: nodeEntry({ component: 'node-comp' }) },
      groups: { g1: groupEntry({ component: 'group-comp' }) },
      annotations: { a1: annotationEntry({ component: 'annot-comp' }) },
    });
    const moves: ElementMove[] = [
      { kind: 'node', id: 'n1', position: vec2(1, 1) },
      { kind: 'group', id: 'g1', position: vec2(2, 2) },
      { kind: 'annotation', id: 'a1', position: vec2(3, 3) },
    ];
    const edit = moveElementsEdit(sheet, moves);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].layout?.position).toEqual(vec2(1, 1));
    expect(applied.nodes['n1'].component).toBe('node-comp');
    expect(applied.groups['g1'].layout?.position).toEqual(vec2(2, 2));
    expect(applied.groups['g1'].component).toBe('group-comp');
    expect(applied.annotations['a1'].layout?.position).toEqual(vec2(3, 3));
    expect(applied.annotations['a1'].component).toBe('annot-comp');
  });

  test('an empty move list produces an edit that changes nothing when applied', () => {
    const sheet = emptyStylesheet({ nodes: { n1: nodeEntry({ component: 'unchanged' }) } });
    const edit = moveElementsEdit(sheet, []);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1']).toEqual(sheet.nodes['n1']);
  });

  // Doc: "Edges are not movable and are skipped if present". ElementMove's
  // declared kind union has no 'edge' variant, but the gesture layer's own
  // selection type is wider, so a stray 'edge' kind can reach this function.
  test('an element move of kind "edge" is skipped rather than throwing', () => {
    const sheet = emptyStylesheet();
    const strayEdgeMove = { kind: 'edge', id: 'e1', position: vec2(9, 9) } as unknown as ElementMove;
    expect(() => moveElementsEdit(sheet, [strayEdgeMove])).not.toThrow();
    const edit = moveElementsEdit(sheet, [strayEdgeMove]);
    expect(edit.edgeChanges).toEqual([]);
  });
});

describe('moveGroupEdit / moveAnnotationEdit', () => {
  test('moveGroupEdit preserves the group size', () => {
    const sheet = emptyStylesheet({
      groups: { g1: groupEntry({ layout: create(GroupLayoutSchema, { size: vec2(40, 40) }) }) },
    });
    const edit = moveGroupEdit(sheet, 'g1', vec2(11, 11));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.groups['g1'].layout?.position).toEqual(vec2(11, 11));
    expect(applied.groups['g1'].layout?.size).toEqual(vec2(40, 40));
  });

  test('moveAnnotationEdit preserves content and shape', () => {
    const sheet = emptyStylesheet({
      annotations: {
        a1: annotationEntry({
          content: [create(LocalizationSchema, { locale: 'en', source: 'hi' })],
          shape: create(Glyph2DSchema, { cornerRadius: 1 }),
        }),
      },
    });
    const edit = moveAnnotationEdit(sheet, 'a1', vec2(6, 6));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].layout?.position).toEqual(vec2(6, 6));
    expect(applied.annotations['a1'].content[0].source).toBe('hi');
    expect(applied.annotations['a1'].shape?.cornerRadius).toBe(1);
  });
});

// ===========================================================================
// resize.ts
// ===========================================================================

describe('resizeNodeEdit / resizeGroupEdit / resizeAnnotationEdit', () => {
  test('resizeNodeEdit writes both position and size, preserving rotation and shape', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({
          layout: create(NodeLayoutSchema, { rotation: 30 }),
          shape: create(Glyph2DSchema, { cornerRadius: 5 }),
        }),
      },
    });
    const edit = resizeNodeEdit(sheet, 'n1', vec2(1, 1), vec2(50, 60));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const after = applied.nodes['n1'];
    expect(after.layout?.position).toEqual(vec2(1, 1));
    expect(after.layout?.size).toEqual(vec2(50, 60));
    expect(after.layout?.rotation).toBe(30);
    expect(after.shape?.cornerRadius).toBe(5);
  });

  test('resizeGroupEdit does not touch renderMode or labelPosition', () => {
    const sheet = emptyStylesheet({
      groups: {
        g1: groupEntry({
          layout: create(GroupLayoutSchema, { renderMode: GroupRenderMode.EXPANDED, labelPosition: 2 }),
        }),
      },
    });
    const edit = resizeGroupEdit(sheet, 'g1', vec2(0, 0), vec2(10, 10));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.groups['g1'].layout?.renderMode).toBe(GroupRenderMode.EXPANDED);
    expect(applied.groups['g1'].layout?.labelPosition).toBe(2);
  });

  test('resizeAnnotationEdit preserves the anchor', () => {
    const anchor = create(AnnotationAnchorSchema, { refId: 'n9', refKind: RefKind.NODE });
    const sheet = emptyStylesheet({ annotations: { a1: annotationEntry({ anchor }) } });
    const edit = resizeAnnotationEdit(sheet, 'a1', vec2(2, 2), vec2(30, 30));
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].anchor).toEqual(anchor);
    expect(applied.annotations['a1'].layout?.size).toEqual(vec2(30, 30));
  });
});

describe('clearNodeSizeEdit', () => {
  test('hands the size back to the label measurement while keeping position and rotation', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({
          layout: create(NodeLayoutSchema, { position: vec2(1, 2), size: vec2(99, 99), rotation: 7 }),
          shape: create(Glyph2DSchema, { cornerRadius: 6 }),
        }),
      },
    });
    const edit = clearNodeSizeEdit(sheet, 'n1');
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const after = applied.nodes['n1'];
    expect(after.layout?.size).toBeUndefined();
    expect(after.layout?.position).toEqual(vec2(1, 2));
    expect(after.layout?.rotation).toBe(7);
    expect(after.shape?.cornerRadius).toBe(6);
  });

  test('clearing the size of a node that has no entry does not fabricate one', () => {
    const sheet = emptyStylesheet();
    const edit = clearNodeSizeEdit(sheet, 'ghost');
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['ghost']).toBeUndefined();
  });
});

// ===========================================================================
// visibility.ts
// ===========================================================================

describe('setNodeHiddenEdit / setNodesHiddenEdit / showAllEdit', () => {
  test('hiding sets NODE_VISIBILITY_HIDDEN and preserves other fields', () => {
    const sheet = emptyStylesheet({
      nodes: { n1: nodeEntry({ component: 'kept', layout: create(NodeLayoutSchema, { position: vec2(1, 1) }) }) },
    });
    const edit = setNodeHiddenEdit(sheet, 'n1', true);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].visibility).toBe(NodeVisibility.HIDDEN);
    expect(applied.nodes['n1'].component).toBe('kept');
    expect(applied.nodes['n1'].layout?.position).toEqual(vec2(1, 1));
  });

  test('un-hiding sets UNSPECIFIED, not some other "visible" variant (the schema has none)', () => {
    const sheet = emptyStylesheet({ nodes: { n1: nodeEntry({ visibility: NodeVisibility.HIDDEN }) } });
    const edit = setNodeHiddenEdit(sheet, 'n1', false);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].visibility).toBe(NodeVisibility.UNSPECIFIED);
  });

  test('setNodesHiddenEdit hides a selection as one edit without touching an unselected sibling', () => {
    const sheet = emptyStylesheet({
      nodes: { n1: nodeEntry({}), n2: nodeEntry({ component: 'untouched' }) },
    });
    const edit = setNodesHiddenEdit(sheet, ['n1'], true);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].visibility).toBe(NodeVisibility.HIDDEN);
    expect(applied.nodes['n2']).toEqual(sheet.nodes['n2']);
  });

  test('setNodesHiddenEdit with an empty selection changes nothing', () => {
    const sheet = emptyStylesheet({ nodes: { n1: nodeEntry({ component: 'x' }) } });
    const edit = setNodesHiddenEdit(sheet, [], true);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1']).toEqual(sheet.nodes['n1']);
  });

  test('showAllEdit clears every hidden node in the stylesheet', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({ visibility: NodeVisibility.HIDDEN, component: 'a' }),
        n2: nodeEntry({ visibility: NodeVisibility.HIDDEN, component: 'b' }),
        n3: nodeEntry({ component: 'c' }),
      },
    });
    const edit = showAllEdit(sheet);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].visibility).toBe(NodeVisibility.UNSPECIFIED);
    expect(applied.nodes['n2'].visibility).toBe(NodeVisibility.UNSPECIFIED);
    expect(applied.nodes['n1'].component).toBe('a');
    expect(applied.nodes['n2'].component).toBe('b');
    expect(applied.nodes['n3'].visibility).not.toBe(NodeVisibility.HIDDEN);
    expect(applied.nodes['n3'].component).toBe('c');
  });

  // Doc says showAllEdit "Clears every NODE_VISIBILITY_HIDDEN" — implying only
  // hidden nodes are the target. The implementation (delegating to
  // setNodesHiddenEdit over every node id) rewrites every node's entry, even
  // ones that were never hidden, stamping an explicit UNSPECIFIED where the
  // field was previously simply absent.
  test('showAllEdit does not rewrite a node that was never hidden', () => {
    const sheet = emptyStylesheet({ nodes: { n3: nodeEntry({ component: 'c' }) } });
    const applied = applyStyleEditToStylesheet(sheet, showAllEdit(sheet));
    expect(applied.nodes['n3']).toEqual(sheet.nodes['n3']);
  });

  test('showAllEdit on a stylesheet with no nodes is a no-op, not an error', () => {
    const sheet = emptyStylesheet();
    expect(() => showAllEdit(sheet)).not.toThrow();
    const applied = applyStyleEditToStylesheet(sheet, showAllEdit(sheet));
    expect(applied.nodes).toEqual({});
  });
});

// ===========================================================================
// annotation.ts
// ===========================================================================

describe('addAnnotationEdit', () => {
  test('creates a new annotation at the given position with the given text under the canonical locale', () => {
    const sheet = emptyStylesheet();
    const edit = addAnnotationEdit(sheet, 'a1', vec2(5, 5), 'hello world');
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const entry = applied.annotations['a1'];
    expect(entry.layout?.position).toEqual(vec2(5, 5));
    expect(entry.content).toEqual([{ $typeName: 'archeglyph.content.v1.Localization', locale: 'en', source: 'hello world' }]);
  });

  test('the caller-supplied id is used verbatim, not regenerated', () => {
    const sheet = emptyStylesheet();
    const edit = addAnnotationEdit(sheet, 'caller-chosen-id', vec2(0, 0), 'x');
    expect(edit.annotationChanges[0].annotationId).toBe('caller-chosen-id');
  });
});

describe('setAnnotationTextEdit', () => {
  test('replaces the canonical (en) locale entry, leaving other locales untouched', () => {
    const sheet = emptyStylesheet({
      annotations: {
        a1: annotationEntry({
          content: [
            create(LocalizationSchema, { locale: 'en', source: 'old' }),
            create(LocalizationSchema, { locale: 'fr', source: 'vieux' }),
          ],
        }),
      },
    });
    const edit = setAnnotationTextEdit(sheet, 'a1', 'new');
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const content = applied.annotations['a1'].content;
    expect(content.find((l) => l.locale === 'en')?.source).toBe('new');
    expect(content.find((l) => l.locale === 'fr')?.source).toBe('vieux');
  });

  test('adds a canonical locale entry when none existed yet', () => {
    const sheet = emptyStylesheet({ annotations: { a1: annotationEntry({ content: [] }) } });
    const edit = setAnnotationTextEdit(sheet, 'a1', 'first text');
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].content).toEqual([
      { $typeName: 'archeglyph.content.v1.Localization', locale: 'en', source: 'first text' },
    ]);
  });
});

describe('setAnnotationAnchorEdit', () => {
  test('anchors the annotation at a graph element', () => {
    const sheet = emptyStylesheet({ annotations: { a1: annotationEntry({}) } });
    const anchor = create(AnnotationAnchorSchema, { refId: 'n1', refKind: RefKind.NODE });
    const edit = setAnnotationAnchorEdit(sheet, 'a1', anchor);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].anchor).toEqual(anchor);
  });

  test('detaches the annotation when anchor is absent, actually clearing the field', () => {
    const anchor = create(AnnotationAnchorSchema, { refId: 'n1', refKind: RefKind.NODE });
    const sheet = emptyStylesheet({ annotations: { a1: annotationEntry({ anchor }) } });
    const edit = setAnnotationAnchorEdit(sheet, 'a1', undefined);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].anchor).toBeUndefined();
  });

  test('detaching preserves the rest of the annotation (content, shape)', () => {
    const anchor = create(AnnotationAnchorSchema, { refId: 'n1', refKind: RefKind.NODE });
    const sheet = emptyStylesheet({
      annotations: {
        a1: annotationEntry({
          anchor,
          content: [create(LocalizationSchema, { locale: 'en', source: 'keep me' })],
          shape: create(Glyph2DSchema, { cornerRadius: 9 }),
        }),
      },
    });
    const edit = setAnnotationAnchorEdit(sheet, 'a1', undefined);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].content[0].source).toBe('keep me');
    expect(applied.annotations['a1'].shape?.cornerRadius).toBe(9);
  });
});

describe('deleteAnnotationEdit', () => {
  test('really removes the annotation from the stylesheet (D3: the one true delete)', () => {
    const sheet = emptyStylesheet({ annotations: { a1: annotationEntry({}), a2: annotationEntry({}) } });
    const edit = deleteAnnotationEdit(sheet, 'a1');
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1']).toBeUndefined();
    expect(applied.annotations['a2']).toBeDefined();
  });

  test('deleting a non-existent annotation id is a no-op, not an error', () => {
    const sheet = emptyStylesheet({ annotations: { a1: annotationEntry({}) } });
    expect(() => deleteAnnotationEdit(sheet, 'never-existed')).not.toThrow();
    const applied = applyStyleEditToStylesheet(sheet, deleteAnnotationEdit(sheet, 'never-existed'));
    expect(applied.annotations['a1']).toBeDefined();
  });
});

describe('localized', () => {
  test('produces one Localization under the canonical "en" locale', () => {
    const result = localized('some text');
    expect(result).toHaveLength(1);
    expect(result[0].locale).toBe('en');
    expect(result[0].source).toBe('some text');
  });
});

// ===========================================================================
// glyph.ts
// ===========================================================================

describe('setNodeGlyphEdit / setNodesGlyphEdit', () => {
  test('absent patch fields are left alone — a single-field commit does not clobber the rest', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({
          typography: create(TypographySchema, { size: 14 }),
          component: 'kept-component',
          layout: create(NodeLayoutSchema, { position: vec2(1, 1) }),
        }),
      },
    });
    const edit = setNodeGlyphEdit(sheet, 'n1', { shape: create(Glyph2DSchema, { cornerRadius: 2 }) });
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const after = applied.nodes['n1'];
    expect(after.shape?.cornerRadius).toBe(2);
    expect(after.typography?.size).toBe(14);
    expect(after.component).toBe('kept-component');
    expect(after.layout?.position).toEqual(vec2(1, 1));
  });

  test('setNodesGlyphEdit applies the same patch across a multi-selection as one edit, each node keeping its own other fields', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({ component: 'one' }),
        n2: nodeEntry({ component: 'two' }),
      },
    });
    const edit = setNodesGlyphEdit(sheet, ['n1', 'n2'], { typography: create(TypographySchema, { size: 20 }) });
    expect(edit.nodeChanges).toHaveLength(2);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].typography?.size).toBe(20);
    expect(applied.nodes['n1'].component).toBe('one');
    expect(applied.nodes['n2'].typography?.size).toBe(20);
    expect(applied.nodes['n2'].component).toBe('two');
  });
});

describe('setEdgeGlyphEdit', () => {
  test('preserves edge layout while patching connection', () => {
    const sheet = emptyStylesheet({
      edges: {
        e1: create(EdgeStyleEntrySchema, { layout: create(EdgeLayoutSchema, { waypoints: [vec2(1, 1)] }) }),
      },
    });
    const edit = setEdgeGlyphEdit(sheet, 'e1', { component: 'edge-comp' });
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.edges['e1'].component).toBe('edge-comp');
    expect(applied.edges['e1'].layout?.waypoints).toEqual([vec2(1, 1)]);
  });
});

describe('setGroupGlyphEdit', () => {
  test('setting renderMode preserves position and size', () => {
    const sheet = emptyStylesheet({
      groups: { g1: groupEntry({ layout: create(GroupLayoutSchema, { position: vec2(2, 2), size: vec2(30, 30) }) }) },
    });
    const edit = setGroupGlyphEdit(sheet, 'g1', { renderMode: GroupRenderMode.CONTRACTED });
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.groups['g1'].layout?.renderMode).toBe(GroupRenderMode.CONTRACTED);
    expect(applied.groups['g1'].layout?.position).toEqual(vec2(2, 2));
    expect(applied.groups['g1'].layout?.size).toEqual(vec2(30, 30));
  });
});

describe('setAnnotationGlyphEdit', () => {
  test('patching callout preserves anchor and content', () => {
    const anchor = create(AnnotationAnchorSchema, { refId: 'n1', refKind: RefKind.NODE });
    const sheet = emptyStylesheet({
      annotations: {
        a1: annotationEntry({ anchor, content: [create(LocalizationSchema, { locale: 'en', source: 'text' })] }),
      },
    });
    const edit = setAnnotationGlyphEdit(sheet, 'a1', { callout: create(Glyph1DSchema, {}) });
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].anchor).toEqual(anchor);
    expect(applied.annotations['a1'].content[0].source).toBe('text');
  });
});

// ===========================================================================
// layout_command.ts
// ===========================================================================

describe('pinAllEdit', () => {
  test('writes a child node position relative to its parent group, not canvas-absolute', () => {
    const sheet = emptyStylesheet();
    const group = laidOutGroup({ id: 'g1', position: vec2(100, 100), size: vec2(300, 300) });
    const node = laidOutNode({ id: 'n1', parentGroup: 'g1', position: vec2(150, 120) });
    const diagram = laidOutDiagram({ groups: [group], nodes: [node] });
    const edit = pinAllEdit(sheet, diagram);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].layout?.position).toEqual(vec2(50, 20));
  });

  test('a top-level node (no parent group) is pinned at its absolute position unchanged', () => {
    const sheet = emptyStylesheet();
    const node = laidOutNode({ id: 'n1', parentGroup: undefined, position: vec2(42, 43) });
    const diagram = laidOutDiagram({ nodes: [node] });
    const edit = pinAllEdit(sheet, diagram);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].layout?.position).toEqual(vec2(42, 43));
  });

  test('an already-pinned element is rewritten with the new laid-out value rather than skipped', () => {
    const sheet = emptyStylesheet({
      nodes: { n1: nodeEntry({ layout: create(NodeLayoutSchema, { position: vec2(1, 1) }) }) },
    });
    const node = laidOutNode({ id: 'n1', position: vec2(77, 77) });
    const diagram = laidOutDiagram({ nodes: [node] });
    const edit = pinAllEdit(sheet, diagram);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].layout?.position).toEqual(vec2(77, 77));
  });

  test('pins groups relative to their own parent group', () => {
    const sheet = emptyStylesheet();
    const outer = laidOutGroup({ id: 'outer', position: vec2(10, 10) });
    const inner = laidOutGroup({ id: 'inner', parentGroup: 'outer', position: vec2(30, 40) });
    const diagram = laidOutDiagram({ groups: [outer, inner] });
    const edit = pinAllEdit(sheet, diagram);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.groups['inner'].layout?.position).toEqual(vec2(20, 30));
    expect(applied.groups['outer'].layout?.position).toEqual(vec2(10, 10));
  });
});

describe('unpinAllEdit', () => {
  test('clears position but keeps every other field on a node (colours survive unpinning)', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({
          layout: create(NodeLayoutSchema, { position: vec2(5, 5), size: vec2(20, 20) }),
          shape: create(Glyph2DSchema, { cornerRadius: 3 }),
          component: 'keep',
        }),
      },
    });
    const edit = unpinAllEdit(sheet);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    const after = applied.nodes['n1'];
    expect(after.layout?.position).toBeUndefined();
    expect(after.layout?.size).toEqual(vec2(20, 20));
    expect(after.shape?.cornerRadius).toBe(3);
    expect(after.component).toBe('keep');
  });

  test('drops layout entirely when position was the only thing it held', () => {
    const sheet = emptyStylesheet({
      nodes: { n1: nodeEntry({ layout: create(NodeLayoutSchema, { position: vec2(5, 5) }), component: 'keep' }) },
    });
    const edit = unpinAllEdit(sheet);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].layout).toBeUndefined();
    expect(applied.nodes['n1'].component).toBe('keep');
  });

  test('also clears group positions while keeping group renderMode', () => {
    const sheet = emptyStylesheet({
      groups: {
        g1: groupEntry({ layout: create(GroupLayoutSchema, { position: vec2(1, 1), renderMode: GroupRenderMode.EXPANDED }) }),
      },
    });
    const edit = unpinAllEdit(sheet);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.groups['g1'].layout?.position).toBeUndefined();
    expect(applied.groups['g1'].layout?.renderMode).toBe(GroupRenderMode.EXPANDED);
  });

  test('a node with no layout at all is unaffected (nothing to unpin, no crash)', () => {
    const sheet = emptyStylesheet({ nodes: { n1: nodeEntry({ component: 'plain' }) } });
    expect(() => unpinAllEdit(sheet)).not.toThrow();
    const applied = applyStyleEditToStylesheet(sheet, unpinAllEdit(sheet));
    expect(applied.nodes['n1'].component).toBe('plain');
    expect(applied.nodes['n1'].layout).toBeUndefined();
  });
});

describe('unpinElementsEdit', () => {
  test('unpins only the referenced elements, leaving an un-referenced sibling pinned', () => {
    const sheet = emptyStylesheet({
      nodes: {
        n1: nodeEntry({ layout: create(NodeLayoutSchema, { position: vec2(1, 1) }) }),
        n2: nodeEntry({ layout: create(NodeLayoutSchema, { position: vec2(2, 2) }) }),
      },
    });
    const refs: ElementMove[] = [{ kind: 'node', id: 'n1', position: vec2(0, 0) }];
    const edit = unpinElementsEdit(sheet, refs);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.nodes['n1'].layout?.position).toBeUndefined();
    expect(applied.nodes['n2'].layout?.position).toEqual(vec2(2, 2));
  });

  // Doc: "Annotations in `refs` are skipped: they are always explicitly
  // positioned, so there is no auto-layout for an unpinned one to fall back to."
  test('an annotation in refs is skipped, keeping its position exactly as-is', () => {
    const sheet = emptyStylesheet({
      annotations: { a1: annotationEntry({ layout: create(AnnotationLayoutSchema, { position: vec2(9, 9) }) }) },
    });
    const refs: ElementMove[] = [{ kind: 'annotation', id: 'a1', position: vec2(0, 0) }];
    const edit = unpinElementsEdit(sheet, refs);
    expect(edit.annotationChanges).toEqual([]);
    const applied = applyStyleEditToStylesheet(sheet, edit);
    expect(applied.annotations['a1'].layout?.position).toEqual(vec2(9, 9));
  });

  test('an empty refs list changes nothing', () => {
    const sheet = emptyStylesheet({ nodes: { n1: nodeEntry({ layout: create(NodeLayoutSchema, { position: vec2(1, 1) }) }) } });
    const applied = applyStyleEditToStylesheet(sheet, unpinElementsEdit(sheet, []));
    expect(applied.nodes['n1']).toEqual(sheet.nodes['n1']);
  });
});

// ===========================================================================
// pending.ts
// ===========================================================================

describe('proposePendingEdit', () => {
  test('appends the proposal with state PENDING and the given author, without mutating the original stylesheet', () => {
    const sheet = emptyStylesheet();
    const proposal = styleEdit({ description: 'AI suggestion' });
    const result = proposePendingEdit(sheet, proposal, 'ai:claude');
    expect(sheet.pendingEdits).toHaveLength(0);
    expect(result.pendingEdits).toHaveLength(1);
    expect(result.pendingEdits[0].state).toBe(StyleEditState.PENDING);
    expect(result.pendingEdits[0].author).toBe('ai:claude');
  });

  test('a second proposal appends rather than replacing the first', () => {
    const sheet = emptyStylesheet();
    const first = proposePendingEdit(sheet, styleEdit({ description: 'one' }), 'ai:a');
    const second = proposePendingEdit(first, styleEdit({ description: 'two' }), 'ai:b');
    expect(second.pendingEdits).toHaveLength(2);
    expect(second.pendingEdits[0].description).toBe('one');
    expect(second.pendingEdits[1].description).toBe('two');
  });
});

describe('findPendingEdit', () => {
  test('returns undefined when the list has moved on under a stale panel', () => {
    const sheet = emptyStylesheet();
    expect(findPendingEdit(sheet, 'does-not-exist')).toBeUndefined();
  });

  test('returns the matching edit by id', () => {
    const proposal = create(StyleEditSchema, {
      id: 'edit-1',
      state: StyleEditState.PENDING,
    });
    const sheet = emptyStylesheet({ pendingEdits: [proposal] });
    expect(findPendingEdit(sheet, 'edit-1')).toEqual(proposal);
  });
});

describe('removePendingEdit', () => {
  test('drops the matching edit, keeping the others', () => {
    const e1 = create(StyleEditSchema, { id: 'e1' });
    const e2 = create(StyleEditSchema, { id: 'e2' });
    const sheet = emptyStylesheet({ pendingEdits: [e1, e2] });
    const result = removePendingEdit(sheet, 'e1');
    expect(result.pendingEdits.map((e) => e.id)).toEqual(['e2']);
  });

  test('removing a non-existent id is a no-op', () => {
    const e1 = create(StyleEditSchema, { id: 'e1' });
    const sheet = emptyStylesheet({ pendingEdits: [e1] });
    const result = removePendingEdit(sheet, 'never-there');
    expect(result.pendingEdits.map((e) => e.id)).toEqual(['e1']);
  });
});
