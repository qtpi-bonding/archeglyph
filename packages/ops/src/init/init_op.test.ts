// SPDX-License-Identifier: AGPL-3.0-or-later

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

  test('the scaffold carries nodes and an edge, not an empty graph', async () => {
    const output = await initOp.execute({ name: 'scaffold' }, createOpContext(scratch));
    const written = JSON.parse(await readFile(output.path, 'utf8')) as {
      graph?: { nodes?: Record<string, unknown>; edges?: Record<string, unknown> };
    };

    expect(Object.keys(written.graph?.nodes ?? {}).length).toBeGreaterThan(1);
    expect(Object.keys(written.graph?.edges ?? {}).length).toBeGreaterThan(0);
  });

  test('every node it writes carries a label', async () => {
    const output = await initOp.execute({ name: 'labelled' }, createOpContext(scratch));
    const written = JSON.parse(await readFile(output.path, 'utf8')) as {
      graph?: { nodes?: Record<string, { label?: { source?: string }[] }> };
    };

    const nodes = Object.values(written.graph?.nodes ?? {});
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node.label?.[0]?.source).toBeTruthy();
    }
  });
});
