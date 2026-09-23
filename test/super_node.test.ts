// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createOpContext } from '../packages/ops/src/op';
import { renderOp } from '../packages/ops/src/render/op';

const PROJECT_ROOT: string = resolve(import.meta.dir, '..');

const DIAGRAM = {
  schemaVersion: 1,
  id: 'super-node',
  graph: {
    nodes: {
      outside: { label: [{ locale: 'en', source: 'out' }] },
      a1: { label: [{ locale: 'en', source: 'a1' }], parentGroup: 'g' },
      a2: { label: [{ locale: 'en', source: 'a2' }], parentGroup: 'g' },
      a3: { label: [{ locale: 'en', source: 'a3' }], parentGroup: 'g' },
    },
    edges: { e1: { source: 'a1', target: 'outside' } },
    groups: { g: { label: [{ locale: 'en', source: 'G' }] } },
  },
  metadata: { generator: 'test', canonicalLocale: 'en' },
};

const style = (renderMode: string | undefined): unknown => ({
  schemaVersion: 1,
  nodes: {},
  edges: {},
  groups: renderMode === undefined ? {} : { g: { layout: { renderMode } } },
});

function texts(svg: string): string[] {
  return [...svg.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map(([, t]) => t);
}

describe('a contracted group says what it stands for', () => {
  let scratch: string;

  beforeAll(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'archeglyph-supernode-'));
  });

  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  const render = async (name: string, renderMode: string | undefined): Promise<string> => {
    const diagramPath = join(scratch, `${name}.diag.json`);
    const stylePath = join(scratch, `${name}.style.json`);
    await writeFile(diagramPath, JSON.stringify(DIAGRAM), 'utf8');
    await writeFile(stylePath, JSON.stringify(style(renderMode)), 'utf8');
    const output = await renderOp.execute(
      { diagram: diagramPath, style: stylePath, theme: 'blueprint', out: join(scratch, `${name}.svg`) },
      createOpContext(PROJECT_ROOT),
    );
    return output.svg;
  };

  test('the count of what it hides is on its label', async () => {
    const svg = await render('contracted', 'GROUP_RENDER_MODE_CONTRACTED');
    expect(texts(svg)).toContain('G +3');
  });

  test('an uncontracted group is untouched', async () => {
    const svg = await render('bounded', undefined);
    const labels = texts(svg);
    expect(labels).toContain('G');
    expect(labels.some((t) => t.includes('+'))).toBe(false);
  });

  test('the label centres, since a contracted group has no children to clear', async () => {
    const svg = await render('centred', 'GROUP_RENDER_MODE_CONTRACTED');
    const match = svg.match(/<text x="([\d.]+)"[^>]*text-anchor="([a-z]+)"[^>]*>(?:<tspan[^>]*>)?G \+3/);
    if (match === null) { throw new Error('no super-node label found'); }
    expect(match[2]).toBe('middle');
  });
});
