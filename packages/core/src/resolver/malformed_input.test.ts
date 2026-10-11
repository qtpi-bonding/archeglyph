// SPDX-License-Identifier: MPL-2.0
//
// Input the validator would reject but the render path never validates: the
// resolver has to refuse it with an error rather than hang or draw nonsense.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementRole, type Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationAnchorSchema,
  AnnotationEntrySchema,
  ElementStyleEntrySchema,
  GroupRenderMode,
  RefKind,
  StylesheetSchema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilterRequest } from './filter_request';
import { VisibilityFilterImpl } from './visibility_filter';

const filterImpl = new VisibilityFilterImpl();

function diagram(
  elements: Record<string, { parent?: string }>,
  edges: Record<string, { source: string; target: string }> = {},
): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'malformed',
    graph: {
      elements: Object.fromEntries(
        Object.entries(elements).map(([id, e]) => [id, { label: [], parent: e.parent, role: ElementRole.ENTITY, tags: {} }]),
      ),
      edges: Object.fromEntries(
        Object.entries(edges).map(([id, e]) => [id, { ...e, label: [], ordinal: 0, tags: {} }]),
      ),
    },
  });
}

function filter(d: Diagram, s?: Stylesheet) {
  return filterImpl.filter(init(new FilterRequest(), { diagram: d, stylesheet: s }));
}

describe('a parent chain that loops back on itself', () => {
  test('two elements that are each other\'s parent are an error, not a hang', () => {
    const r = filter(diagram({ a: { parent: 'b' }, b: { parent: 'a' } }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('cycle');
    }
  });

  test('an element that is its own parent is an error, not a hang', () => {
    const r = filter(diagram({ a: { parent: 'a' } }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('cycle');
    }
  });

  test('a longer loop hanging below a root is also an error', () => {
    const r = filter(diagram({ root: {}, a: { parent: 'c' }, b: { parent: 'a' }, c: { parent: 'b' } }));
    expect(r.kind).toBe('err');
  });
});

describe('an edge to something that does not exist', () => {
  test('a missing source is an error naming it', () => {
    const r = filter(diagram({ a: {} }, { e: { source: 'ghost', target: 'a' } }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('ghost');
    }
  });

  test('a missing target is an error naming it', () => {
    const r = filter(diagram({ a: {} }, { e: { source: 'a', target: 'ghost' } }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('ghost');
    }
  });
});

describe('annotation anchors are matched by kind as well as id', () => {
  test('an annotation anchored to an EDGE keeps its anchor when an absorbed element shares the id', () => {
    const d = diagram(
      { box: {}, shared: { parent: 'box' }, other: {} },
      { shared: { source: 'other', target: 'other' } },
    );
    const s = create(StylesheetSchema, {
      schemaVersion: 2,
      elements: { box: create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.CLOSED }) },
      annotations: {
        note: create(AnnotationEntrySchema, {
          content: [],
          anchor: create(AnnotationAnchorSchema, { refId: 'shared', refKind: RefKind.EDGE }),
        }),
      },
    });
    const r = filter(d, s);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') {
      expect(r.value.annotations['note'].entry.anchor?.refId).toBe('shared');
    }
  });
});

describe('dissolved is only for groupings', () => {
  const dissolved = create(StylesheetSchema, {
    schemaVersion: 2,
    elements: { a: create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.DISSOLVED }) },
  });

  test('a plain entity with no children is refused, not silently ignored', () => {
    const r = filter(diagram({ a: {} }), dissolved);
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('dissolved');
    }
  });

  test('a container entity is refused too', () => {
    const r = filter(diagram({ a: {}, b: { parent: 'a' } }), dissolved);
    expect(r.kind).toBe('err');
  });
});
