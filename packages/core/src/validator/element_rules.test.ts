// SPDX-License-Identifier: MPL-2.0
//
// Phase E1: the element-model validator rules. Kinds are asserted by name as
// strings because the enum members are added by the implementation.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementRole, type Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  EdgeStyleEntrySchema,
  ElementStyleEntrySchema,
  GroupRenderMode,
  StylesheetSchema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { ValidatorImpl } from './validator';
import { ValidateRequest } from './validate_request';
import { init } from '@archeglyph/proto/util/init';

const validator = new ValidatorImpl();

interface El {
  parent?: string;
  role?: ElementRole;
}

function diagram(elements: Record<string, El>, edges: Record<string, [string, string]>): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'd',
    graph: {
      elements: Object.fromEntries(
        Object.entries(elements).map(([id, e]) => [id, { label: [], tags: {}, parent: e.parent, role: e.role ?? ElementRole.ENTITY }]),
      ),
      edges: Object.fromEntries(
        Object.entries(edges).map(([id, [source, target]]) => [id, { source, target, label: [], ordinal: 0, tags: {} }]),
      ),
    },
  });
}

function kinds(d: Diagram, s?: Stylesheet): string[] {
  const result = validator.validate(init(new ValidateRequest(), { diagram: d, stylesheet: s }));
  if (result.kind !== 'ok') {
    throw new Error('validator returned err');
  }
  return result.value.violations.map((v) => v.kind as string);
}

const sheet = (init0: Parameters<typeof create<typeof StylesheetSchema>>[1]): Stylesheet =>
  create(StylesheetSchema, { schemaVersion: 2, ...init0 });

describe('EDGE_ENDPOINT_NOT_ENTITY', () => {
  const els = { auth: { role: ElementRole.GROUPING }, a: { parent: 'auth' }, b: {} };

  test('raised when the source is a GROUPING', () => {
    expect(kinds(diagram(els, { e: ['auth', 'b'] }))).toContain('EDGE_ENDPOINT_NOT_ENTITY');
  });

  test('raised when the target is a GROUPING', () => {
    expect(kinds(diagram(els, { e: ['b', 'auth'] }))).toContain('EDGE_ENDPOINT_NOT_ENTITY');
  });

  test('not raised for edges between ENTITY elements, including a container', () => {
    const d = diagram({ k: {}, m: { parent: 'k' }, b: {} }, { e: ['b', 'k'], f: ['m', 'k'] });
    expect(kinds(d)).not.toContain('EDGE_ENDPOINT_NOT_ENTITY');
  });

  test('an UNSPECIFIED role reads as ENTITY and is not flagged', () => {
    const d = diagram({ a: { role: ElementRole.UNSPECIFIED }, b: { role: ElementRole.UNSPECIFIED } }, { e: ['a', 'b'] });
    expect(kinds(d)).not.toContain('EDGE_ENDPOINT_NOT_ENTITY');
  });
});

describe('RENDER_MODE_DISSOLVED_ON_ENTITY', () => {
  const d = diagram({ g: { role: ElementRole.GROUPING }, k: {}, m: { parent: 'k' } }, {});
  const withMode = (id: string, mode: GroupRenderMode) =>
    sheet({ elements: { [id]: create(ElementStyleEntrySchema, { renderMode: mode }) } });

  test('raised for DISSOLVED on an ENTITY container', () => {
    expect(kinds(d, withMode('k', GroupRenderMode.DISSOLVED))).toContain('RENDER_MODE_DISSOLVED_ON_ENTITY');
  });

  test('raised for DISSOLVED on an ENTITY leaf', () => {
    expect(kinds(d, withMode('m', GroupRenderMode.DISSOLVED))).toContain('RENDER_MODE_DISSOLVED_ON_ENTITY');
  });

  test('not raised for DISSOLVED on a GROUPING', () => {
    expect(kinds(d, withMode('g', GroupRenderMode.DISSOLVED))).not.toContain('RENDER_MODE_DISSOLVED_ON_ENTITY');
  });

  test('not raised for OPEN or CLOSED on an ENTITY', () => {
    expect(kinds(d, withMode('k', GroupRenderMode.CLOSED))).not.toContain('RENDER_MODE_DISSOLVED_ON_ENTITY');
    expect(kinds(d, withMode('k', GroupRenderMode.OPEN))).not.toContain('RENDER_MODE_DISSOLVED_ON_ENTITY');
  });
});

describe('OPEN_DEPTH_TOO_SMALL', () => {
  const d = diagram({ a: {} }, {});

  test('raised for openDepth 0', () => {
    expect(kinds(d, sheet({ openDepth: 0 }))).toContain('OPEN_DEPTH_TOO_SMALL');
  });

  test('not raised for openDepth 1', () => {
    expect(kinds(d, sheet({ openDepth: 1 }))).not.toContain('OPEN_DEPTH_TOO_SMALL');
  });

  test('not raised when openDepth is unset', () => {
    expect(kinds(d, sheet({}))).not.toContain('OPEN_DEPTH_TOO_SMALL');
  });
});

describe('STYLE_TARGET_IS_BUNDLE', () => {
  const d = diagram({ a: {}, b: {} }, { e: ['a', 'b'] });

  // A bundle is a derived edge, so it can only be named in the edges map.
  test('raised for an edges key starting with bundle:', () => {
    const s = sheet({ edges: { 'bundle:a__b__00000000': create(EdgeStyleEntrySchema, {}) } });
    expect(kinds(d, s)).toContain('STYLE_TARGET_IS_BUNDLE');
  });

  test('reported instead of, not as well as, a plain missing edge', () => {
    const s = sheet({ edges: { 'bundle:a__b__00000000': create(EdgeStyleEntrySchema, {}) } });
    expect(kinds(d, s)).not.toContain('STYLE_TARGET_MISSING');
  });

  test('not raised for an ordinary element key', () => {
    const s = sheet({ elements: { a: create(ElementStyleEntrySchema, {}) } });
    expect(kinds(d, s)).not.toContain('STYLE_TARGET_IS_BUNDLE');
  });
});
