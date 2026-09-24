// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createOpContext } from '../packages/ops/src/op';
import { diffOp } from '../packages/ops/src/diff/op';
import { renderOp } from '../packages/ops/src/render/op';

// Same input, same SVG bytes.
const PROJECT_ROOT: string = resolve(import.meta.dir, '..');
const GOLDEN_DIR: string = join(PROJECT_ROOT, 'test', 'goldens');

// Written rather than compared when set. See CLAUDE.md before accepting one.
const UPDATING: boolean = process.env['UPDATE_GOLDENS'] === '1';

// Where the generated Delta lands. A scratch path, not a repo path: the diff
// cases need a file for `render --delta` to read, and a test that rewrites a
// tracked file every run makes a real regression show up as a dirty tree
// instead of as a failure. The Delta is still compared against a golden, which
// is what pins `diff` and the content_pb JSON round trip.
let deltaPath: string = '';

interface Case {
  readonly name: string;
  readonly diagram: string;
  readonly style: string;
  readonly theme: string;
  readonly diff?: boolean;
}

// Three diagrams over three themes, then the same diff over all three. The
// themes are not interchangeable: `light` and `dark` declare the diff roles and
// take the table path, `blueprint` declares none and rotates hue instead, so
// dropping one would leave a whole branch of diff_color uncovered.
const CASES: ReadonlyArray<Case> = [
  { name: 'stack-managed-light', diagram: 'examples/stack-managed.diag.json', style: 'examples/stack-managed.style.json', theme: 'light' },
  { name: 'stack-managed-dark', diagram: 'examples/stack-managed.diag.json', style: 'examples/stack-managed.style.json', theme: 'dark' },
  { name: 'stack-managed-blueprint', diagram: 'examples/stack-managed.diag.json', style: 'examples/stack-managed.style.json', theme: 'blueprint' },
  { name: 'pipeline-light', diagram: 'examples/pipeline.diag.json', style: 'examples/pipeline.style.json', theme: 'light' },
  { name: 'pipeline-dark', diagram: 'examples/pipeline.diag.json', style: 'examples/pipeline.style.json', theme: 'dark' },
  { name: 'pipeline-blueprint', diagram: 'examples/pipeline.diag.json', style: 'examples/pipeline.style.json', theme: 'blueprint' },
  { name: 'stack-selfhosted-blueprint', diagram: 'examples/stack-selfhosted.diag.json', style: 'examples/stack-selfhosted.style.json', theme: 'blueprint' },
  { name: 'diff-light', diagram: 'examples/stack-selfhosted.diag.json', style: 'examples/stack-selfhosted.style.json', theme: 'light', diff: true },
  { name: 'diff-dark', diagram: 'examples/stack-selfhosted.diag.json', style: 'examples/stack-selfhosted.style.json', theme: 'dark', diff: true },
  { name: 'diff-blueprint', diagram: 'examples/stack-selfhosted.diag.json', style: 'examples/stack-selfhosted.style.json', theme: 'blueprint', diff: true },
];

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
  // Compared as one string on purpose: a per-line diff of an SVG points at a
  // coordinate, and what a reader needs to know is which element moved.
  expect(actual).toBe(expected);
}

describe('golden renders', () => {
  let scratch: string;

  beforeAll(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'archeglyph-golden-'));
    deltaPath = join(scratch, 'stack.delta.json');
  });

  // Runs first, and the diff cases depend on the file it leaves behind. Bun
  // runs tests in declaration order within a file, so this is ordering by
  // position rather than by a hook -- stated because it is easy to break by
  // moving the block.
  test('delta: managed -> self-hosted', async () => {
    const output = await diffOp.execute(
      { base: 'examples/stack-managed.diag.json', target: 'examples/stack-selfhosted.diag.json', out: deltaPath },
      createOpContext(PROJECT_ROOT),
    );
    expect(output.changed).toBe(true);
    const written = await readFile(deltaPath, 'utf8');
    await compare('stack.delta', 'json', written);
  });

  for (const testCase of CASES) {
    test(testCase.name, async () => {
      const out = join(scratch, `${testCase.name}.svg`);
      const output = await renderOp.execute(
        {
          diagram: testCase.diagram,
          style: testCase.style,
          theme: testCase.theme,
          delta: testCase.diff === true ? deltaPath : undefined,
          out,
        },
        createOpContext(PROJECT_ROOT),
      );
      await compare(testCase.name, 'svg', output.svg);
    });
  }

  // The promise is byte-identical output, not merely stable output, so one case
  // renders twice in the same process. A golden alone cannot catch a renderer
  // that varies run to run -- it would simply fail every time, which reads as a
  // stale golden rather than as non-determinism.
  test('rendering twice yields identical bytes', async () => {
    const params = {
      diagram: 'examples/stack-managed.diag.json',
      style: 'examples/stack-managed.style.json',
      theme: 'blueprint',
    };
    const first = await renderOp.execute({ ...params, out: join(scratch, 'twice-a.svg') }, createOpContext(PROJECT_ROOT));
    const second = await renderOp.execute({ ...params, out: join(scratch, 'twice-b.svg') }, createOpContext(PROJECT_ROOT));
    expect(second.svg).toBe(first.svg);
  });
});
