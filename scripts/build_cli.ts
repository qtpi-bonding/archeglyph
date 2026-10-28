#!/usr/bin/env bun
// SPDX-License-Identifier: MPL-2.0

// Bundles the CLI into bin/archeglyph.js, the one committed file that
// `npx github:qtpi-bonding/archeglyph` runs. The workspace packages are
// inlined; elkjs and web-worker stay external because elk locates its worker
// file by `require.resolve` at run time, which a bundle cannot carry. They are
// the root package's runtime dependencies, so the installer fetches them.
//
// It is committed rather than built on install so that running it needs only
// node, not bun and the whole workspace. CI fails when the committed copy is
// stale (--check).
//
// The bundle runs under Node and Bun alike, so the shebang is rewritten from
// the `bun` one the bundler copies from the entry file.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(ROOT, 'bin/archeglyph.js');

const built = await Bun.build({
  entrypoints: [resolve(ROOT, 'packages/cli/bin/archeglyph.ts')],
  target: 'node',
  external: ['elkjs', 'web-worker'],
});
if (!built.success || built.outputs.length !== 1) {
  for (const log of built.logs) console.error(String(log));
  process.exit(1);
}

const raw: string = await built.outputs[0]!.text();
const text: string = `#!/usr/bin/env node\n// SPDX-License-Identifier: MPL-2.0\n${raw.replace(/^#!.*\n(\/\/ @bun\n)?/, '')}`;

if (process.argv.includes('--check')) {
  const current: string | undefined = existsSync(OUT) ? readFileSync(OUT, 'utf8') : undefined;
  if (current !== text) {
    console.error('bin/archeglyph.js is stale: run `bun run build:cli` and commit it');
    process.exit(1);
  }
  console.log('bin/archeglyph.js is current');
} else {
  mkdirSync(resolve(ROOT, 'bin'), { recursive: true });
  writeFileSync(OUT, text, { mode: 0o755 });
  console.log(`wrote ${OUT}`);
}
