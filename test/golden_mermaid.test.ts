// SPDX-License-Identifier: MPL-2.0

import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { create } from '@bufbuild/protobuf';
import { render } from 'pele';
import { toMermaid } from '../packages/core/src/mermaid';
import { FilteredDiagram } from '../packages/core/src/resolver/filtered_diagram';
import { FilteredEdge } from '../packages/core/src/resolver/filtered_edge';
import { FilteredGroup } from '../packages/core/src/resolver/filtered_group';
import { FilteredNode } from '../packages/core/src/resolver/filtered_node';
import { LocalizationSchema } from '../packages/proto/src/gen/content_pb';
import { init } from '../packages/proto/src/util/init';
import { createOpContext } from '../packages/ops/src/op';
import { mermaidOp } from '../packages/ops/src/mermaid/op';

// Same input, same Mermaid bytes; and Mermaid's own renderer accepts them.
const PROJECT_ROOT: string = resolve(import.meta.dir, '..');
const GOLDEN_DIR: string = join(PROJECT_ROOT, 'test', 'goldens');

// Written rather than compared when set. See CLAUDE.md before accepting one.
const UPDATING: boolean = process.env['UPDATE_GOLDENS'] === '1';

// Mermaid's default limits, so a parse here means a parse in a default viewer.
const PELE_LIMITS = { limit: 1_000_000, outputLimit: 8_000_000, maxEdges: 10_000 };

const CASES: ReadonlyArray<string> = ['stack-managed', 'pipeline', 'stack-selfhosted'];

async function compare(name: string, extension: string, actual: string): Promise<void> {
  const path = join(GOLDEN_DIR, `${name}.${extension}`);
  if (UPDATING) {
    await writeFile(path, actual, 'utf8');
    return;
  }
  if (!existsSync(path)) {
    throw new Error(`no golden at ${path} -- run \`bun run test:golden:update\` and review the result`);
  }
  const expected = await readFile(path, 'utf8');
  expect(actual).toBe(expected);
}

async function expectParses(text: string): Promise<void> {
  const drawn = await render(text, PELE_LIMITS);
  expect(drawn.svg.length).toBeGreaterThan(0);
}

const lab = (source: string) => [create(LocalizationSchema, { locale: 'en', source })];

function node(id: string, label: string | null, parentGroup?: string): FilteredNode {
  return init(new FilteredNode(), { id, parentGroup, tags: new Map(), label: label === null ? [] : lab(label) });
}

function group(id: string, label: string | null, parentGroup?: string): FilteredGroup {
  return init(new FilteredGroup(), {
    id,
    parentGroup,
    viewRole: 'box',
    tags: new Map(),
    label: label === null ? [] : lab(label),
    isSuperNode: false,
    hiddenDescendantCount: 0,
  });
}

function edge(id: string, source: string, target: string, ordinal: number, label: string | null = null): FilteredEdge {
  return init(new FilteredEdge(), { id, source, target, ordinal, tags: new Map(), label: label === null ? [] : lab(label) });
}

function diagram(parts: { nodes?: FilteredNode[]; groups?: FilteredGroup[]; edges?: FilteredEdge[] }): FilteredDiagram {
  const byId = <T extends { id: string }>(items: T[] = []): Record<string, T> =>
    Object.fromEntries(items.map((i) => [i.id, i]));
  return init(new FilteredDiagram(), {
    id: 'd',
    nodes: byId(parts.nodes),
    groups: byId(parts.groups),
    edges: byId(parts.edges),
  });
}

function mermaidOf(d: FilteredDiagram): string {
  const result = toMermaid(d, 'LR');
  if (result.kind === 'err') throw new Error(result.error);
  return result.value;
}

describe('golden mermaid', () => {
  let scratch: string;

  beforeAll(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'archeglyph-golden-mermaid-'));
  });

  for (const name of CASES) {
    test(name, async () => {
      const params = { diagram: `examples/${name}.diag.json`, style: `examples/${name}.style.json` };
      const first = await mermaidOp.execute({ ...params, out: join(scratch, `${name}-a.mmd`) }, createOpContext(PROJECT_ROOT));
      const second = await mermaidOp.execute({ ...params, out: join(scratch, `${name}-b.mmd`) }, createOpContext(PROJECT_ROOT));
      const a = await readFile(first.outPath, 'utf8');
      const b = await readFile(second.outPath, 'utf8');
      // The promise is byte-identical output, so each case runs twice.
      expect(b).toBe(a);
      await compare(name, 'mmd', a);
      await expectParses(a);
    });
  }
});

describe('mermaid parses in Pele', () => {
  test('awkward labels', async () => {
    const labels = ['a"b', 'c#d', '<e>', 'f;g', 'h&i', 'line one\nline two', '`tick'];
    const d = diagram({ nodes: labels.map((l, k) => node(`n${k}`, l)), edges: [edge('e', 'n0', 'n1', 0, 'say "hi" #1')] });
    await expectParses(mermaidOf(d));
  });

  // escapeLabel turns a bare \r into a space; Mermaid may treat it as a line break.
  test('bare carriage return in a label', async () => {
    await expectParses(mermaidOf(diagram({ nodes: [node('a', 'one\rtwo')] })));
  });

  test('U+2028 and U+2029 in a label', async () => {
    await expectParses(mermaidOf(diagram({ nodes: [node('a', 'one two'), node('b', 'x y')] })));
  });

  test('empty diagram', async () => {
    await expectParses(mermaidOf(diagram({})));
  });

  test('open container with no visible children', async () => {
    await expectParses(mermaidOf(diagram({ groups: [group('g', 'Empty')] })));
  });

  test('empty-string node label', async () => {
    await expectParses(mermaidOf(diagram({ nodes: [node('a', '')] })));
  });

  test('empty-string subgraph label', async () => {
    await expectParses(mermaidOf(diagram({ groups: [group('g', '')], nodes: [node('a', 'A', 'g')] })));
  });

  test('empty-string edge label', async () => {
    const d = diagram({ nodes: [node('a', 'A'), node('b', 'B')], edges: [edge('e', 'a', 'b', 0, '')] });
    await expectParses(mermaidOf(d));
  });

  test('edge from a child to its own ancestor container', async () => {
    const d = diagram({
      groups: [group('outer', 'Outer'), group('inner', 'Inner', 'outer')],
      nodes: [node('c', 'Child', 'inner')],
      edges: [edge('up', 'c', 'outer', 0), edge('up2', 'c', 'inner', 1)],
    });
    await expectParses(mermaidOf(d));
  });

  test('edge to an open container', async () => {
    const d = diagram({
      groups: [group('g', 'Group')],
      nodes: [node('a', 'A'), node('b', 'B', 'g')],
      edges: [edge('in', 'a', 'g', 0, 'into'), edge('out', 'g', 'a', 1)],
    });
    await expectParses(mermaidOf(d));
  });
});
