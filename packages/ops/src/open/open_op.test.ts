// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createOpContext } from '../op';
import { parseArgv } from '../zod_argv';
import { REGISTRY } from '../registry';
import { openOp } from './op';
import { openParamsSchema } from './open_params';

const ctx = createOpContext(tmpdir());

// F > C > M > P, F > C2, and a second file G > D > D1, both under a grouping
// directory `dir`; H is a loose file.
const parents: Record<string, string | undefined> = {
  dir: undefined, F: 'dir', C: 'F', M: 'C', P: 'M', C2: 'F', G: 'dir', D: 'G', D1: 'D', H: undefined,
};

async function project(style?: unknown): Promise<{ diagram: string; stylePath: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'archeglyph-open-'));
  const diagram = join(dir, 'code.diag.json');
  const stylePath = join(dir, 'code.style.json');
  await writeFile(diagram, JSON.stringify({
    schemaVersion: 2,
    id: 'code',
    graph: {
      elements: Object.fromEntries(Object.entries(parents).map(([id, parent]) => [id, {
        label: [], tags: {}, ...(parent === undefined ? {} : { parent }), ...(id === 'dir' ? { role: 'ELEMENT_ROLE_GROUPING' } : {}),
      }])),
      edges: {
        e1: { source: 'P', target: 'D', tags: { kind: 'invocation' } },
        e2: { source: 'H', target: 'M', tags: { kind: 'uses' } },
      },
    },
  }), 'utf8');
  if (style !== undefined) {
    await writeFile(stylePath, JSON.stringify(style), 'utf8');
  }
  return { diagram, stylePath };
}

interface Style {
  openDepth?: number;
  shownEdgeKinds?: string[];
  elements?: Record<string, { renderMode?: string; visibility?: string; layout?: unknown }>;
}
const read = async (path: string): Promise<Style> => JSON.parse(await readFile(path, 'utf8')) as Style;
const hiddenIds = (s: Style): string[] =>
  Object.entries(s.elements ?? {}).filter(([, e]) => e.visibility === 'NODE_VISIBILITY_HIDDEN').map(([id]) => id).sort();
const opened = (s: Style): string[] =>
  Object.entries(s.elements ?? {}).filter(([, e]) => e.renderMode === 'GROUP_RENDER_MODE_OPEN').map(([id]) => id).sort();

describe('open op', () => {
  test('it is in the registry under the name the CLI dispatches on', () => {
    expect(REGISTRY.map((op): string => op.name)).toContain('open');
  });

  test('it writes the stylesheet beside the diagram: depth 1 default, the picks and what is above them open', async () => {
    const { diagram, stylePath } = await project();
    const out = await openOp.execute({ diagram, id: ['C'], depth: 1 }, ctx);
    const style = await read(stylePath);

    expect(style.openDepth).toBe(1);
    expect(opened(style)).toEqual(['C', 'F', 'dir']);
    expect(out.path).toBe(stylePath);
    expect(out.opened).toBe(3);
    expect(out.picks).toBe(1);
  });

  test('depth goes further into the pick', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['F'], depth: 3 }, ctx);
    expect(opened(await read(stylePath))).toEqual(['C', 'F', 'M', 'dir']);
  });

  test('depth 0 leaves the pick closed and opens what is above it', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['C'], depth: 0 }, ctx);
    expect(opened(await read(stylePath))).toEqual(['F', 'dir']);
  });

  test('several picks are combined', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['C', 'D'], depth: 1 }, ctx);
    expect(opened(await read(stylePath))).toEqual(['C', 'D', 'F', 'G', 'dir']);
  });

  test('an explicit --style path is used instead of the derived one', async () => {
    const { diagram } = await project();
    const elsewhere = join(await mkdtemp(join(tmpdir(), 'archeglyph-open-')), 'view.style.json');
    const out = await openOp.execute({ diagram, style: elsewhere, id: ['C'], depth: 1 }, ctx);
    expect(out.path).toBe(elsewhere);
    expect(opened(await read(elsewhere))).toEqual(['C', 'F', 'dir']);
  });

  test('running it again replaces the previous view rather than adding to it', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['C'], depth: 1 }, ctx);
    await openOp.execute({ diagram, id: ['D'], depth: 1 }, ctx);
    expect(opened(await read(stylePath))).toEqual(['D', 'G', 'dir']);
  });

  test('the rest of the stylesheet is left alone', async () => {
    const layout = { position: { x: 5, y: 7 } };
    const { diagram, stylePath } = await project({
      schemaVersion: 2,
      canvas: { nodeSpacing: 40 },
      elements: { H: { layout } },
    });
    await openOp.execute({ diagram, id: ['C'], depth: 1 }, ctx);
    const style = await read(stylePath) as Style & { canvas?: { nodeSpacing?: number } };
    expect(style.elements?.['H']?.layout).toEqual(layout);
    expect(style.canvas?.nodeSpacing).toBe(40);
  });

  test('an earlier explicit open or closed is cleared, but a dissolved grouping is kept', async () => {
    const { diagram, stylePath } = await project({
      schemaVersion: 2,
      elements: {
        G: { renderMode: 'GROUP_RENDER_MODE_OPEN' },
        H: { renderMode: 'GROUP_RENDER_MODE_CLOSED' },
        dir: { renderMode: 'GROUP_RENDER_MODE_DISSOLVED' },
      },
    });
    await openOp.execute({ diagram, id: ['C'], depth: 1 }, ctx);
    const style = await read(stylePath);
    expect(style.elements?.['G']?.renderMode).toBeUndefined();
    expect(style.elements?.['H']?.renderMode).toBeUndefined();
    expect(style.elements?.['dir']?.renderMode).toBe('GROUP_RENDER_MODE_DISSOLVED');
  });

  test('an unknown id is an error that names it, and nothing is written', async () => {
    const { diagram, stylePath } = await project();
    await expect(openOp.execute({ diagram, id: ['C', 'nope'], depth: 1 }, ctx)).rejects.toMatchObject({ stage: 'unknown_id' });
    await expect(readFile(stylePath, 'utf8')).rejects.toThrow();
  });

  test('the summary says what was opened', async () => {
    const { diagram } = await project();
    const out = await openOp.execute({ diagram, id: ['C'], depth: 1 }, ctx);
    expect(openOp.format(out)).toContain('3 element(s) opened for 1 pick(s)');
  });
});

describe('open op with --hops', () => {
  test('without it nothing is hidden', async () => {
    const { diagram, stylePath } = await project();
    const out = await openOp.execute({ diagram, id: ['F'], depth: 1 }, ctx);
    expect(hiddenIds(await read(stylePath))).toEqual([]);
    expect(out.hidden).toBe(0);
  });

  test('0 hops hides everything but the picks and what holds them', async () => {
    const { diagram, stylePath } = await project();
    const out = await openOp.execute({ diagram, id: ['F'], depth: 1, hops: 0 }, ctx);
    expect(hiddenIds(await read(stylePath))).toEqual(['G', 'H']);
    expect(out.hidden).toBe(2);
  });

  test('1 hop keeps what the pick is connected to, so here nothing is hidden', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['F'], depth: 1, hops: 1 }, ctx);
    expect(hiddenIds(await read(stylePath))).toEqual([]);
  });

  test('a pick with fewer connections hides the rest', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['H'], depth: 1, hops: 1 }, ctx);
    // H touches F (through M), so F and the directory holding it stay; G does not.
    expect(hiddenIds(await read(stylePath))).toEqual(['G']);
  });

  test('running it again without --hops shows everything again', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['F'], depth: 1, hops: 0 }, ctx);
    await openOp.execute({ diagram, id: ['F'], depth: 1 }, ctx);
    expect(hiddenIds(await read(stylePath))).toEqual([]);
  });

  test('an element hidden by hand before is shown again: the op owns the view', async () => {
    const { diagram, stylePath } = await project({
      schemaVersion: 2,
      elements: { H: { visibility: 'NODE_VISIBILITY_HIDDEN' } },
    });
    await openOp.execute({ diagram, id: ['F'], depth: 1 }, ctx);
    expect(hiddenIds(await read(stylePath))).toEqual([]);
  });

  test('the summary says how much was hidden', async () => {
    const { diagram } = await project();
    const out = await openOp.execute({ diagram, id: ['F'], depth: 1, hops: 0 }, ctx);
    expect(openOp.format(out)).toContain('2 hidden');
  });
});

describe('open op with --kind', () => {
  test('the kinds are written to the stylesheet', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['F'], depth: 1, kind: ['invocation', 'uses'] }, ctx);
    expect((await read(stylePath)).shownEdgeKinds).toEqual(['invocation', 'uses']);
  });

  test('without it every kind is drawn: nothing is written', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['F'], depth: 1 }, ctx);
    expect((await read(stylePath)).shownEdgeKinds ?? []).toEqual([]);
  });

  test('running it again without --kind draws every kind again: the op owns the view', async () => {
    const { diagram, stylePath } = await project();
    await openOp.execute({ diagram, id: ['F'], depth: 1, kind: ['uses'] }, ctx);
    await openOp.execute({ diagram, id: ['F'], depth: 1 }, ctx);
    expect((await read(stylePath)).shownEdgeKinds ?? []).toEqual([]);
  });

  test('a hop follows only the kinds that are drawn', async () => {
    const { diagram, stylePath } = await project();
    // F reaches G through e1 (invocation) and H through e2 (uses). With only
    // `uses` drawn, G is no longer connected to F.
    const out = await openOp.execute({ diagram, id: ['F'], depth: 1, hops: 1, kind: ['uses'] }, ctx);
    expect(hiddenIds(await read(stylePath))).toEqual(['G']);
    expect(out.hidden).toBe(1);
  });

  test('the rest of the stylesheet is untouched', async () => {
    const layout = { position: { x: 1, y: 2 } };
    const { diagram, stylePath } = await project({ schemaVersion: 2, elements: { H: { layout } } });
    await openOp.execute({ diagram, id: ['F'], depth: 1, kind: ['uses'] }, ctx);
    expect((await read(stylePath)).elements?.['H']?.layout).toEqual(layout);
  });
});

describe('open params', () => {
  test('--kind can be repeated and is optional', () => {
    const p = parseArgv<{ kind?: string[] }>(openParamsSchema as never, ['--diagram', 'x', '--id', 'a', '--kind', 'uses', '--kind', 'invocation']);
    expect(p.kind).toEqual(['uses', 'invocation']);
    expect(parseArgv<{ kind?: string[] }>(openParamsSchema as never, ['--diagram', 'x', '--id', 'a']).kind).toBeUndefined();
  });
});

describe('open params', () => {
  test('--id can be repeated and --depth is a number', () => {
    const p = parseArgv<{ id: string[]; depth: number; diagram: string }>(
      openParamsSchema as never,
      ['--diagram', 'x.diag.json', '--id', 'a', '--id', 'b', '--depth', '2'],
    );
    expect(p.id).toEqual(['a', 'b']);
    expect(p.depth).toBe(2);
  });

  test('--hops is optional and a whole number from 0', () => {
    expect(parseArgv<{ hops?: number }>(openParamsSchema as never, ['--diagram', 'x', '--id', 'a']).hops).toBeUndefined();
    expect(parseArgv<{ hops?: number }>(openParamsSchema as never, ['--diagram', 'x', '--id', 'a', '--hops', '2']).hops).toBe(2);
    expect(() => parseArgv(openParamsSchema as never, ['--diagram', 'x', '--id', 'a', '--hops', '-1'])).toThrow();
  });

  test('depth defaults to 1', () => {
    const p = parseArgv<{ depth: number }>(openParamsSchema as never, ['--diagram', 'x', '--id', 'a']);
    expect(p.depth).toBe(1);
  });

  test('at least one id is required, and depth cannot be negative or fractional', () => {
    expect(() => parseArgv(openParamsSchema as never, ['--diagram', 'x'])).toThrow();
    expect(() => parseArgv(openParamsSchema as never, ['--diagram', 'x', '--id', 'a', '--depth', '-1'])).toThrow();
    expect(() => parseArgv(openParamsSchema as never, ['--diagram', 'x', '--id', 'a', '--depth', '1.5'])).toThrow();
  });
});
