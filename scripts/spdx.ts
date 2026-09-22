#!/usr/bin/env bun
// SPDX-License-Identifier: AGPL-3.0-or-later

// Adds or checks the AGPL SPDX header on every source file. --fix writes.
//
// Files come from `git ls-files` rather than a directory walk: a walk would
// have to re-implement .gitignore to avoid node_modules and build output.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const SPDX = 'SPDX-License-Identifier: AGPL-3.0-or-later';

// How the header is written in each language. A file type absent here is one
// the script leaves alone -- notably .json, which has no comment syntax at all,
// and so cannot carry a header however much we would like it to.
const COMMENT: Record<string, (text: string) => string> = {
  '.ts': (t) => `// ${t}`,
  '.tsx': (t) => `// ${t}`,
  '.js': (t) => `// ${t}`,
  '.proto': (t) => `// ${t}`,
  '.css': (t) => `/* ${t} */`,
  '.html': (t) => `<!-- ${t} -->`,
  '.sh': (t) => `# ${t}`,
};

// Deliberately absent above: .yaml and .yml. Tool configuration is not the work
// the licence protects, and a header on buf.yaml is cargo cult.

// Emitted wholesale by another tool, so a header added here is gone after the
// next run. `buf generate` rewrites packages/proto/src/gen; `archegraph test`
// rewrites the testgen files. Both are excluded so the check stays honest --
// a check that fails until someone re-runs codegen teaches people to skip it.
const GENERATED: ReadonlyArray<RegExp> = [
  /^packages\/proto\/src\/gen\//,
  /\/testgen_[^/]*\.test\.tsx?$/,
  /^\.archegraph\//,
];

function tracked(): string[] {
  const result = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8', cwd: ROOT });
  if (result.status !== 0) {
    throw new Error(`git ls-files failed: ${result.stderr}`);
  }
  return result.stdout.split('\0').filter((path) => path.length > 0);
}

const ROOT = join(import.meta.dir, '..');
const FIX = process.argv.includes('--fix');

function eligible(path: string): boolean {
  if (GENERATED.some((pattern) => pattern.test(path))) {
    return false;
  }
  return COMMENT[extname(path)] !== undefined;
}

// Anywhere in the first few lines, not just the first. A shebang legitimately
// comes before the header, and a .html file may open with a doctype.
function hasHeader(body: string): boolean {
  return body.split('\n', 5).some((line) => line.includes(SPDX));
}

function withHeader(body: string, path: string): string {
  const header = COMMENT[extname(path)]!(SPDX);
  const lines = body.split('\n');
  // The shebang must stay on line 1 or the kernel will not honour it.
  const offset = lines[0]?.startsWith('#!') === true ? 1 : 0;
  lines.splice(offset, 0, ...(offset === 1 ? [header] : [header, '']));
  return lines.join('\n');
}

const missing: string[] = [];
for (const path of tracked()) {
  if (!eligible(path)) {
    continue;
  }
  const absolute = join(ROOT, path);
  const body = readFileSync(absolute, 'utf8');
  if (hasHeader(body)) {
    continue;
  }
  missing.push(path);
  if (FIX) {
    writeFileSync(absolute, withHeader(body, path), 'utf8');
  }
}

if (missing.length === 0) {
  console.log('spdx: every source file carries the AGPL header');
  process.exit(0);
}

for (const path of missing) {
  console.log(`${FIX ? 'added  ' : 'missing'} ${path}`);
}
console.log(`\nspdx: ${missing.length} file${missing.length === 1 ? '' : 's'} ${FIX ? 'updated' : 'missing the header'}`);
if (!FIX) {
  console.log('run `bun run spdx:fix` to add it');
}
process.exit(FIX ? 0 : 1);
