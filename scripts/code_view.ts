#!/usr/bin/env bun
// SPDX-License-Identifier: MPL-2.0

// Regenerates docs/img/code-view.svg: archegraph's view of this repository's own
// source, cut down to something readable with `archeglyph open`.
//
// The whole code graph is thousands of elements and tens of thousands of edges,
// so it is never drawn in full. This picks two files, opens each one level,
// keeps what is one edge away, and draws only `invocation` edges. The picks,
// depth, hops and kind below are the whole recipe; change them here and the
// README caption follows.
//
// Needs `archegraph` on PATH (it runs the TypeScript scanner, so it needs `npx`).
//
// Usage: bun --conditions browser scripts/code_view.ts [--out docs/img/code-view.svg]

import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fromBinary } from '@bufbuild/protobuf';
import { ArcheviewSchema } from '@archeglyph/proto/gen/archegraph/view_pb';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { toJson } from '@archeglyph/proto/util/json';
import { fromArchegraph } from '@archeglyph/importer-archegraph';

const ROOT = resolve(import.meta.dir, '..');
const CLI = 'packages/cli/bin/archeglyph.ts';

const PICKS: ReadonlyArray<string> = [
  'file://packages/core/src/resolver/visibility_filter/impl.ts',
  'file://packages/core/src/layout/layout_adapter/impl.ts',
];
const DEPTH = 1;
const HOPS = 1;
const KIND = 'invocation';

const outAt: number = process.argv.indexOf('--out');
const out: string = resolve(ROOT, outAt === -1 ? 'docs/img/code-view.svg' : (process.argv[outAt + 1] ?? ''));

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${String(result.status)}`);
  }
}

const scratch: string = mkdtempSync(join(tmpdir(), 'archeglyph-code-view-'));
const gcode: string = join(scratch, 'gcode.pb');
const diagram: string = join(scratch, 'code.diag.json');

run('archegraph', ['index', '--lang', 'typescript', '--output', gcode]);

const view = fromBinary(ArcheviewSchema, new Uint8Array(await Bun.file(gcode).arrayBuffer()));
await Bun.write(diagram, toJson(DiagramSchema, fromArchegraph(view)));

run('bun', [
  CLI, 'open', '--diagram', diagram,
  ...PICKS.flatMap((id: string): string[] => ['--id', id]),
  '--depth', String(DEPTH), '--hops', String(HOPS), '--kind', KIND,
]);
run('bun', [CLI, 'render', '--diagram', diagram, '--theme', 'light', '--out', out]);

console.log(`wrote ${out}`);
