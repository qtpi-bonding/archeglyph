// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createOpContext } from '../packages/ops/src/op';
import { renderOp } from '../packages/ops/src/render/op';

const PROJECT_ROOT: string = resolve(import.meta.dir, '..');
const THEMES: ReadonlyArray<string> = ['light', 'dark', 'blueprint'];

const DIAGRAM = {
  schemaVersion: 1,
  id: 'label-contrast',
  title: [{ locale: 'en', source: 'Label contrast' }],
  graph: {
    nodes: {
      a: { label: [{ locale: 'en', source: 'A' }], parentGroup: 'g' },
      b: { label: [{ locale: 'en', source: 'B' }] },
    },
    edges: {
      a__b: { source: 'a', target: 'b', label: [{ locale: 'en', source: 'edge label' }] },
    },
    groups: { g: { label: [{ locale: 'en', source: 'Group' }] } },
  },
  metadata: { generator: 'test', canonicalLocale: 'en' },
};

function unfilled(svg: string): string[] {
  return [...svg.matchAll(/<text([^>]*)>(.*?)<\/text>/gs)]
    .filter(([, attrs]) => !attrs.includes('fill='))
    .map(([, , body]) => body.replace(/<[^>]*>/g, '').trim());
}

describe('every rendered label carries an explicit colour', () => {
  let scratch: string;
  let diagramPath: string;

  beforeAll(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'archeglyph-contrast-'));
    diagramPath = join(scratch, 'label-contrast.diag.json');
    await writeFile(diagramPath, JSON.stringify(DIAGRAM), 'utf8');
  });

  afterAll(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  for (const theme of THEMES) {
    test(theme, async () => {
      const output = await renderOp.execute(
        { diagram: diagramPath, theme, out: join(scratch, `${theme}.svg`) },
        createOpContext(PROJECT_ROOT),
      );
      expect(unfilled(output.svg)).toEqual([]);
    });
  }
});
