// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DeltaSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';

import { createOpContext } from '../op';
import { diffOp } from './op';
import { REGISTRY } from '../registry';

const repoRoot = join(new URL('.', import.meta.url).pathname, '../../../..');
const ctx = createOpContext(repoRoot);

const BEFORE = 'examples/stack-managed.diag.json';
const AFTER = 'examples/stack-selfhosted.diag.json';

describe('diff op', () => {
  test('it is in the registry under the name the CLI dispatches on', () => {
    expect(REGISTRY.map((op): string => op.name)).toContain('diff');
  });

  test('a difference is not a failure', () => {
    // A diff is the normal state of a change under review. Exiting non-zero on
    // every pull request teaches people to ignore the tool.
    expect(diffOp.exitCode?.({ changed: true } as never)).toBe(0);
    expect(diffOp.exitCode?.({ changed: false } as never)).toBe(0);
  });

  test('it counts every change type across all three entity kinds', async () => {
    const out = await diffOp.execute({ base: BEFORE, target: AFTER }, ctx);

    expect(out.nodes).toEqual({ added: 5, deleted: 5, modified: 0 });
    expect(out.edges).toEqual({ added: 5, deleted: 5, modified: 0 });
    expect(out.groups).toEqual({ added: 1, deleted: 1, modified: 0 });
    expect(out.changed).toBe(true);
  });

  test('the refs name the two files, not the diagram id', async () => {
    const out = await diffOp.execute({ base: BEFORE, target: AFTER }, ctx);
    expect({ base: out.baseRef, target: out.targetRef }).toEqual({ base: BEFORE, target: AFTER });
  });

  test('a diagram against itself reports no change', async () => {
    const out = await diffOp.execute({ base: BEFORE, target: BEFORE }, ctx);
    expect(out.changed).toBe(false);
    expect(diffOp.format?.(out)).toContain('no changes');
  });

  test('--out writes a Delta that loads back through the schema', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'archeglyph-diff-'));
    const target = join(dir, 'delta.json');
    const out = await diffOp.execute({ base: BEFORE, target: AFTER, out: target }, ctx);

    expect(out.outPath).toBe(target);
    const delta = fromJson(DeltaSchema, await readFile(target, 'utf8'));
    expect(delta.groupDeltas.map((d): string => d.groupId)).toEqual(['hosted', 'ours']);
    expect(delta.baseRef).toBe(BEFORE);
  });

  test('without --out nothing is written and the summary still reports', async () => {
    const out = await diffOp.execute({ base: BEFORE, target: AFTER }, ctx);
    expect(out.outPath).toBeUndefined();
    expect(diffOp.format?.(out)).toContain('groups: +1 -1 ~0');
  });

  test('a node whose label changes reports as modified', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'archeglyph-diff-node-'));
    const edited = join(dir, 'relabelled.diag.json');
    const source = JSON.parse(await readFile(BEFORE, 'utf8')) as {
      graph: { nodes: Record<string, { label: { locale: string; source: string }[] }> };
    };
    source.graph.nodes['app'].label = [{ locale: 'en', source: 'Django + Alpine' }];
    await writeFile(edited, JSON.stringify(source), 'utf8');

    const out = await diffOp.execute({ base: BEFORE, target: edited }, ctx);
    expect(out.nodes).toEqual({ added: 0, deleted: 0, modified: 1 });
  });

  test('a group whose label changes reports as modified', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'archeglyph-diff-group-'));
    const edited = join(dir, 'relabelled.diag.json');
    const source = JSON.parse(await readFile(BEFORE, 'utf8')) as {
      graph: { groups: Record<string, { label: { locale: string; source: string }[] }> };
    };
    source.graph.groups['hosted'].label = [{ locale: 'en', source: 'Rented servers' }];
    await writeFile(edited, JSON.stringify(source), 'utf8');

    const out = await diffOp.execute({ base: BEFORE, target: edited }, ctx);
    expect(out.groups).toEqual({ added: 0, deleted: 0, modified: 1 });
  });

  test('a bad path fails at the load stage rather than throwing raw', async () => {
    const attempt = diffOp.execute({ base: 'examples/nope.diag.json', target: AFTER }, ctx);
    await expect(attempt).rejects.toThrow();
  });
});
