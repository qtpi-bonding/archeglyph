// SPDX-License-Identifier: MPL-2.0
//
// A bundle is an edge the resolver derives, so it has no style entry and no
// seeded component. It still has to look like an edge of its kind: a closed
// block that swallows twenty `dependency` edges should not turn them into
// default-looking lines.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import {
  ElementStyleEntrySchema,
  GroupRenderMode,
  StrokeSchema,
  Glyph1DSchema,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { EdgeComponentSchema, ThemeSchema } from '@archeglyph/proto/gen/theme_pb';
import { resolvePipeline } from '../pipeline';

const line = (width: number) => create(Glyph1DSchema, { stroke: create(StrokeSchema, { width }) });

const theme = create(ThemeSchema, {
  schemaVersion: 1,
  name: 'fixture',
  defaultEdgeComponent: 'plain',
  edgeComponents: [
    create(EdgeComponentSchema, { name: 'plain', connection: line(1) }),
    create(EdgeComponentSchema, { name: 'dependency', connection: line(5) }),
  ],
});

function diagram(kind: string | undefined) {
  const tags: Record<string, string> = kind === undefined ? {} : { kind };
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'd',
    graph: {
      elements: {
        g: { label: [], tags: {} },
        a: { label: [], parent: 'g', tags: {} },
        b: { label: [], parent: 'g', tags: {} },
        out: { label: [], tags: {} },
      },
      edges: {
        e1: { source: 'a', target: 'out', label: [], ordinal: 0, tags },
        e2: { source: 'b', target: 'out', label: [], ordinal: 0, tags },
      },
    },
  });
}

const closed = create(StylesheetSchema, {
  schemaVersion: 2,
  elements: { g: create(ElementStyleEntrySchema, { renderMode: GroupRenderMode.CLOSED }) },
});

function bundleWidth(kind: string | undefined): number | undefined {
  const r = resolvePipeline(diagram(kind), closed, new Map([['default', theme]]));
  if (r.kind !== 'ok') {
    throw new Error(`resolve failed: ${r.error.detail}`);
  }
  const bundles = Object.values(r.value.edges).filter((e) => e.id.startsWith('bundle:'));
  expect(bundles).toHaveLength(1);
  return bundles[0].connection.stroke?.width;
}

describe('a bundle takes the edge component of its kind', () => {
  test('a kind the theme defines is used', () => {
    expect(bundleWidth('dependency')).toBe(5);
  });

  test('a kind the theme does not define falls back to the default component', () => {
    expect(bundleWidth('invocation')).toBe(1);
  });

  test('no kind at all falls back to the default component', () => {
    expect(bundleWidth(undefined)).toBe(1);
  });
});
