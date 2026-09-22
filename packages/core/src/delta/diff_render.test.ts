// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { lightTheme } from '@archeglyph/themes';
import { diff } from '../diff';
import { renderPipeline } from '../pipeline';
import { renderDeltaPipeline } from '../pipeline/delta_render_pipeline';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { LayoutEngineImpl } from '../layout/layout_engine/impl';
import { ElkAdapterImpl } from '../layout/layout_adapter/impl';

const require_ = createRequire(import.meta.url);

function newElk(): unknown {
  return new (ElkConstructor as unknown as new (opts: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });
}

// light is a TABLE-mode theme: it declares all three diff roles, so these are
// literal palette entries rather than a rotation of whatever the element
// already was. That is what makes them assertable as exact strings.
const DIFF_DELETED = '#c62828';
const DIFF_ADDED = '#2e7d32';

function graph(nodeIds: string[]): unknown {
  return {
    schemaVersion: 1,
    id: 'd',
    graph: { nodes: Object.fromEntries(nodeIds.map((id: string) => [id, {}])) },
  };
}

async function renderPlain(json: unknown): Promise<string> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(json));
  const theme = lightTheme();
  const seeded = seedComponentBindings(diagram, create(StylesheetSchema, { schemaVersion: 1 }), theme);
  const result = await renderPipeline(
    diagram, seeded, new Map([['default', theme]]),
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (result.kind === 'err') throw new Error(`plain render failed at ${result.error.stage}`);
  return result.value;
}

async function renderDiff(baseJson: unknown, targetJson: unknown): Promise<string> {
  const base = fromJson(DiagramSchema, JSON.stringify(baseJson));
  const target = fromJson(DiagramSchema, JSON.stringify(targetJson));
  const theme = lightTheme();
  const result = await renderDeltaPipeline(
    target, undefined, new Map([['default', theme]]),
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
    diff(base, target),
  );
  if (result.kind === 'err') throw new Error(`diff render failed at ${result.error.stage}`);
  return result.value;
}

const shapeCount = (svg: string): number => (svg.match(/data-shape-ref=/g) ?? []).length;

describe('a diff render draws what the target no longer contains', () => {
  test('a deleted node is drawn, and a plain render of the same target cannot draw it', async () => {
    const plain = await renderPlain(graph(['kept']));
    const diffed = await renderDiff(graph(['kept', 'removed']), graph(['kept']));

    expect(shapeCount(plain)).toBe(1);
    expect(shapeCount(diffed)).toBe(2);
  });

  test('the deleted node carries diff_deleted, which a plain render never emits', async () => {
    const plain = await renderPlain(graph(['kept']));
    const diffed = await renderDiff(graph(['kept', 'removed']), graph(['kept']));

    expect(plain).not.toContain(DIFF_DELETED);
    expect(diffed).toContain(DIFF_DELETED);
  });

  test('an added node and a deleted node are told apart by colour', async () => {
    const diffed = await renderDiff(graph(['kept', 'removed']), graph(['kept', 'fresh']));

    expect(diffed).toContain(DIFF_DELETED);
    expect(diffed).toContain(DIFF_ADDED);
  });

  test('when nothing changed, neither diff colour appears', async () => {
    const diffed = await renderDiff(graph(['kept']), graph(['kept']));

    expect(diffed).not.toContain(DIFF_DELETED);
    expect(diffed).not.toContain(DIFF_ADDED);
    expect(shapeCount(diffed)).toBe(1);
  });
});
