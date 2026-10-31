// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MERMAID_WARN_CHARS, MERMAID_WARN_EDGES } from '@archeglyph/core/mermaid';

import { createOpContext, type OpContext } from '../op';
import { REGISTRY } from '../registry';
import { MermaidOpError } from './mermaid_op_error';

const byName = (): (typeof REGISTRY)[number] => {
  const op = REGISTRY.find((o): boolean => o.name === 'mermaid');
  if (op === undefined) throw new Error('mermaid op is not registered');
  return op;
};

function spyCtx(root: string): { ctx: OpContext; warnings: string[] } {
  const warnings: string[] = [];
  return {
    ctx: { ...createOpContext(root), logger: { info: () => {}, error: () => {}, warn: (m) => { warnings.push(m); } } },
    warnings,
  };
}

// Container F holding C, plus P and D joined by an invocation edge.
async function project(style?: unknown): Promise<{ dir: string; diagram: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'archeglyph-mermaid-'));
  const diagram = join(dir, 'code.diag.json');
  await writeFile(diagram, JSON.stringify({
    schemaVersion: 2,
    id: 'code',
    graph: {
      elements: {
        F: { label: [], tags: {} },
        C: { label: [], tags: {}, parent: 'F' },
        P: { label: [], tags: {} },
        D: { label: [], tags: {} },
      },
      edges: { e1: { source: 'P', target: 'D', tags: { kind: 'invocation' } } },
    },
  }), 'utf8');
  if (style !== undefined) await writeFile(join(dir, 'code.style.json'), JSON.stringify(style), 'utf8');
  return { dir, diagram };
}

describe('mermaid op', () => {
  test('it writes <name>.diag.mmd for <name>.diag.json, starting with a flowchart header', async () => {
    const { dir, diagram } = await project();
    const out = (await byName().execute({ diagram }, createOpContext(dir))) as { outPath: string; bytesWritten: number; nodes: number; edges: number };
    expect(out.outPath).toBe(join(dir, 'code.diag.mmd'));
    const text = await readFile(out.outPath, 'utf8');
    expect(text.split('\n')[0]).toBe('flowchart LR');
    expect(out.bytesWritten).toBe(Buffer.byteLength(text, 'utf8'));
    expect(out.edges).toBe(1);
    expect(out.nodes).toBe(4);
  });

  test('fence writes <name>.diag.md wrapped in a mermaid code fence', async () => {
    const { dir, diagram } = await project();
    const out = (await byName().execute({ diagram, fence: true }, createOpContext(dir))) as { outPath: string };
    expect(out.outPath).toBe(join(dir, 'code.diag.md'));
    const lines = (await readFile(out.outPath, 'utf8')).trimEnd().split('\n');
    expect(lines[0]).toBe('```mermaid');
    expect(lines[lines.length - 1]).toBe('```');
  });

  test('a stylesheet that closes the container gives a block and no subgraph', async () => {
    const { dir, diagram } = await project({ schemaVersion: 2, openDepth: 1 });
    const out = (await byName().execute({ diagram }, createOpContext(dir))) as { outPath: string };
    const text = await readFile(out.outPath, 'utf8');
    expect(text).toContain('[[');
    expect(text).not.toContain('subgraph');
  });

  test('an edge kind the stylesheet does not show yields no edge line', async () => {
    const { dir, diagram } = await project({ schemaVersion: 2, shownEdgeKinds: ['uses'] });
    const out = (await byName().execute({ diagram }, createOpContext(dir))) as { outPath: string; edges: number };
    expect(out.edges).toBe(0);
    expect(await readFile(out.outPath, 'utf8')).not.toContain('-->');
  });

  test('a diagram with no stylesheet beside it still converts', async () => {
    const { dir, diagram } = await project();
    const out = (await byName().execute({ diagram, direction: 'TB' }, createOpContext(dir))) as { outPath: string };
    expect((await readFile(out.outPath, 'utf8')).split('\n')[0]).toBe('flowchart TB');
  });

  test('a missing diagram rejects with a load-stage MermaidOpError', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'archeglyph-mermaid-'));
    const err = await byName().execute({ diagram: join(dir, 'nope.diag.json') }, createOpContext(dir)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MermaidOpError);
    expect((err as MermaidOpError).stage).toBe('load');
  });

  test('crossing the edge limit warns once with the count, and still writes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'archeglyph-mermaid-'));
    const diagram = join(dir, 'big.diag.json');
    const count = MERMAID_WARN_EDGES + 1;
    const edges: Record<string, unknown> = {};
    for (let i = 0; i < count; i++) edges[`e${i}`] = { source: 'A', target: 'B', tags: { kind: 'uses' } };
    await writeFile(diagram, JSON.stringify({
      schemaVersion: 2,
      id: 'big',
      graph: { elements: { A: { label: [], tags: {} }, B: { label: [], tags: {} } }, edges },
    }), 'utf8');
    const { ctx, warnings } = spyCtx(dir);
    const out = (await byName().execute({ diagram }, ctx)) as { outPath: string };
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain(String(count));
    expect((await readFile(out.outPath, 'utf8')).length).toBeGreaterThan(0);

    const small = await project();
    const quiet = spyCtx(small.dir);
    await byName().execute({ diagram: small.diagram }, quiet.ctx);
    expect(quiet.warnings.length).toBe(0);
  });

  test('crossing the character limit warns once with the count, and still writes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'archeglyph-mermaid-'));
    const diagram = join(dir, 'wide.diag.json');
    const source = 'x'.repeat(MERMAID_WARN_CHARS + 1);
    await writeFile(diagram, JSON.stringify({
      schemaVersion: 2,
      id: 'wide',
      graph: { elements: { A: { label: [{ locale: 'en', source }], tags: {} } }, edges: {} },
    }), 'utf8');
    const { ctx, warnings } = spyCtx(dir);
    const out = (await byName().execute({ diagram }, ctx)) as { outPath: string };
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toMatch(/\d+ characters/);
    expect(warnings[0]).toContain(String(MERMAID_WARN_CHARS));
    expect((await readFile(out.outPath, 'utf8')).length).toBeGreaterThan(MERMAID_WARN_CHARS);
  });
});
