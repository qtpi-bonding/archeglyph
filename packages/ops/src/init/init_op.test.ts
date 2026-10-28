// SPDX-License-Identifier: MPL-2.0

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOpContext } from '../op';
import { initOp } from './op';

describe('init scaffolds something you can see', () => {
  let scratch: string;

  beforeAll(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'archeglyph-init-'));
  });

  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  test('the scaffold carries elements and an edge, not an empty graph', async () => {
    const output = await initOp.execute({ name: 'scaffold' }, createOpContext(scratch));
    const written = JSON.parse(await readFile(output.path, 'utf8')) as {
      graph?: { elements?: Record<string, unknown>; edges?: Record<string, unknown> };
    };

    expect(Object.keys(written.graph?.elements ?? {}).length).toBeGreaterThan(1);
    expect(Object.keys(written.graph?.edges ?? {}).length).toBeGreaterThan(0);
  });

  test('every element it writes carries a label', async () => {
    const output = await initOp.execute({ name: 'labelled' }, createOpContext(scratch));
    const written = JSON.parse(await readFile(output.path, 'utf8')) as {
      graph?: { elements?: Record<string, { label?: { source?: string }[] }> };
    };

    const nodes = Object.values(written.graph?.elements ?? {});
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node.label?.[0]?.source).toBeTruthy();
    }
  });
});
