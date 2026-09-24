// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { ArcheviewSchema, ViewNodeSchema } from '@archeglyph/proto/gen/archegraph/view_pb';

describe('the package entry point', () => {
  test('imports by package name and converts a view', async () => {
    const { fromArchegraph } = await import('@archeglyph/importer-archegraph');
    const view = create(ArcheviewSchema, {
      nodes: { 'a#': create(ViewNodeSchema, { displayName: 'A', kindLabel: 'Struct' }) },
    });

    const diagram = fromArchegraph(view);

    expect(Object.keys(diagram.graph?.nodes ?? {})).toEqual(['a#']);
  });
});
