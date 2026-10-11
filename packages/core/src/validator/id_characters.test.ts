// SPDX-License-Identifier: MPL-2.0
//
// An id ends up in an SVG attribute, and XML 1.0 cannot carry a control
// character there however it is escaped. Found when archegraph's edge ids,
// which join their parts with U+001F, were imported unchanged.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { ValidatorImpl } from './validator';
import { ValidateRequest } from './validate_request';
import { init } from '@archeglyph/proto/util/init';

const validator = new ValidatorImpl();

function diagram(elementIds: string[], edgeIds: string[]): Diagram {
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'd',
    graph: {
      elements: Object.fromEntries(elementIds.map((id) => [id, { label: [], tags: {} }])),
      edges: Object.fromEntries(edgeIds.map((id) => [id, { source: 'a', target: 'b', label: [], ordinal: 0, tags: {} }])),
    },
  });
}

function violations(d: Diagram): Array<{ kind: string; location: string }> {
  const r = validator.validate(init(new ValidateRequest(), { diagram: d }));
  if (r.kind !== 'ok') {
    throw new Error('validator returned err');
  }
  return r.value.violations.map((v) => ({ kind: v.kind as string, location: v.location }));
}

describe('ID_CONTROL_CHARACTER', () => {
  test('an edge id with a control character is reported at that id', () => {
    const bad = 'a\u001fb\u001f2';
    const found = violations(diagram(['a', 'b'], [bad])).filter((v) => v.kind === 'ID_CONTROL_CHARACTER');
    expect(found).toEqual([{ kind: 'ID_CONTROL_CHARACTER', location: bad }]);
  });

  test('an element id with a control character is reported at that id', () => {
    const bad = 'x\u0007y';
    const found = violations(diagram(['a', 'b', bad], [])).filter((v) => v.kind === 'ID_CONTROL_CHARACTER');
    expect(found).toEqual([{ kind: 'ID_CONTROL_CHARACTER', location: bad }]);
  });

  test('DEL is a control character too', () => {
    const found = violations(diagram(['a', 'b', 'x\u007f'], [])).filter((v) => v.kind === 'ID_CONTROL_CHARACTER');
    expect(found).toHaveLength(1);
  });

  test('angle brackets, quotes, ampersands and non-ASCII are fine: the renderer escapes them', () => {
    const ids = ['Foo#<constructor>().', 'a"b', 'a&b', "it's", 'café', 'a b'];
    expect(violations(diagram(ids, [])).filter((v) => v.kind === 'ID_CONTROL_CHARACTER')).toEqual([]);
  });
});
