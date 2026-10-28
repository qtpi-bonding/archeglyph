#!/usr/bin/env bun
// SPDX-License-Identifier: MPL-2.0

// Re-renders the diagrams a pull request touches and writes the markdown for
// one comment showing each of them, and what changed in it.
//
// A picture in a comment needs a URL, and the only one that is stable is a
// committed file at a commit SHA -- hence the convention this enforces:
// `x.diag.json` renders to `x.svg` beside it, and that file is committed.
// Re-rendering here also says whether the committed one is still current,
// which is the same determinism the golden renders check. The "before" picture
// is the SVG the base commit committed, so no image has to be hosted anywhere.
//
// Usage:
//   bun run scripts/pr_diagrams.ts --sha <head-sha> --repo owner/name \
//     [--base <base-sha>] [--pr <number>] [--editor <base-url>] \
//     [--out body.md] [--strict] [--list] [paths...]
//
// With --base and no paths it works out which diagrams the change touches
// (see selectDiagrams); with neither it considers every tracked diagram.
// --list prints those paths and stops.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  buildBody,
  selectDiagrams,
  summarizeDelta,
  SUFFIX,
  type Context,
  type Entry,
  type Status,
} from './pr_comment';

const ROOT = resolve(import.meta.dir, '..');
const CLI = 'packages/cli/bin/archeglyph.ts';

const VALUE_FLAGS: ReadonlyArray<string> = ['sha', 'repo', 'base', 'pr', 'editor', 'out'];

function flag(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

const sha: string = flag('sha') ?? 'HEAD';
const repo: string = flag('repo') ?? process.env['GITHUB_REPOSITORY'] ?? '';
const base: string | undefined = flag('base');
const out: string | undefined = flag('out');
const pr: string | undefined = flag('pr');
// Where the editor is served from. Another project running this workflow
// points it at its own deployment, or at any instance it trusts.
const editor: string = flag('editor') ?? 'https://qtpi-bonding.github.io/archeglyph/';
const strict: boolean = process.argv.includes('--strict');
const listOnly: boolean = process.argv.includes('--list');

// Paths are whatever is left once every flag and its value is removed.
const named: string[] = process.argv.slice(2).filter((arg: string, at: number, all: string[]): boolean => {
  if (arg.startsWith('--')) {
    return false;
  }
  const previous: string | undefined = all[at - 1];
  return !(previous !== undefined && previous.startsWith('--') && VALUE_FLAGS.includes(previous.slice(2)));
});

function git(args: string[]): { status: number | null; stdout: string } {
  const result = spawnSync('git', args, { encoding: 'utf8', cwd: ROOT });
  return { status: result.status, stdout: result.stdout };
}

function tracked(): string[] {
  return git(['ls-files', '-z', `*${SUFFIX}`]).stdout.split('\0').filter((p: string): boolean => p.length > 0);
}

/** Every file this pull request changes, against the commit it branched from. */
function changedSince(baseSha: string): string[] {
  return git(['diff', '--name-only', `${baseSha}...${sha}`]).stdout.split('\n').filter((p: string): boolean => p.length > 0);
}

function render(diagram: string, style: string, outPath: string): void {
  const args: string[] = [CLI, 'render', '--diagram', diagram, '--out', outPath];
  if (existsSync(join(ROOT, style))) {
    args.push('--style', style);
  }
  const run = spawnSync('bun', args, { cwd: ROOT, encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(`render failed for ${diagram}:\n${run.stderr}`);
  }
}

/** The diagram as the base commit had it, summarised against the head's. */
function againstBase(baseSha: string, diagram: string, svg: string, scratch: string): Entry['base'] {
  const before = git(['show', `${baseSha}:${diagram}`]);
  if (before.status !== 0) {
    return undefined;
  }
  const baseFile: string = join(scratch, 'base.diag.json');
  const deltaFile: string = join(scratch, 'delta.json');
  writeFileSync(baseFile, before.stdout, 'utf8');
  const run = spawnSync('bun', [CLI, 'diff', '--base', baseFile, '--target', diagram, '--out', deltaFile], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    throw new Error(`diff failed for ${diagram}:\n${run.stderr}`);
  }
  const delta = JSON.parse(readFileSync(deltaFile, 'utf8')) as Parameters<typeof summarizeDelta>[0];
  const baseSvg = git(['show', `${baseSha}:${svg}`]);
  const hasSvg: boolean = baseSvg.status === 0;
  const headSvg: string | undefined = existsSync(join(ROOT, svg)) ? readFileSync(join(ROOT, svg), 'utf8') : undefined;
  return {
    hasSvg,
    svgChanged: !hasSvg || headSvg !== baseSvg.stdout,
    summary: summarizeDelta(delta),
  };
}

/** Render `diagram` and say whether the committed SVG beside it still matches. */
function check(diagram: string, scratch: string): Entry {
  const stem: string = diagram.slice(0, -SUFFIX.length);
  const svg: string = `${stem}.svg`;
  const fresh: string = join(scratch, 'fresh.svg');
  render(diagram, `${stem}.style.json`, fresh);

  const against: Entry['base'] = base === undefined ? undefined : againstBase(base, diagram, svg, scratch);
  let status: Status = 'missing';
  if (existsSync(join(ROOT, svg))) {
    status = readFileSync(join(ROOT, svg), 'utf8') === readFileSync(fresh, 'utf8') ? 'current' : 'stale';
  }
  return { diagram, svg, status, base: against };
}

const candidates: string[] = named.length > 0
  ? named.filter((p: string): boolean => p.endsWith(SUFFIX))
  : base === undefined
    ? tracked()
    : selectDiagrams(changedSince(base), tracked());

if (listOnly) {
  console.log(candidates.join('\n'));
  process.exit(0);
}

if (candidates.length === 0) {
  console.log('pr_diagrams: no diagrams touched');
  process.exit(0);
}

const context: Context = { repo, sha, baseSha: base, pr, editor };
const scratch: string = mkdtempSync(join(tmpdir(), 'archeglyph-pr-'));
const entries: Entry[] = candidates.map((d: string): Entry => check(d, scratch));
const markdown: string = buildBody(context, entries);

if (out !== undefined) {
  writeFileSync(out, markdown, 'utf8');
} else {
  console.log(markdown);
}

for (const entry of entries) {
  console.error(`${entry.status.padEnd(8)} ${entry.diagram}`);
}

const broken: Entry[] = entries.filter((e: Entry): boolean => e.status !== 'current');
if (strict && broken.length > 0) {
  console.error(`\npr_diagrams: ${String(broken.length)} diagram(s) need re-rendering`);
  process.exit(1);
}
