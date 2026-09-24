#!/usr/bin/env bun
// SPDX-License-Identifier: MPL-2.0

// Re-renders the diagrams a pull request touches and writes the markdown for
// one comment showing each of them.
//
// A picture in a comment needs a URL, and the only one that is stable is a
// committed file at a commit SHA -- hence the convention this enforces:
// `x.diag.json` renders to `x.svg` beside it, and that file is committed.
// Re-rendering here also says whether the committed one is still current,
// which is the same determinism the golden renders check.
//
// Usage:
//   bun run scripts/pr_diagrams.ts --sha <head-sha> --repo owner/name \
//     [--pr <number>] [--editor <base-url>] [--out body.md] [--strict] \
//     [changed paths...]
//
// With no paths it considers every tracked diagram.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const MARKER = '<!-- archeglyph-diagrams -->';
const SUFFIX = '.diag.json';

function flag(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

const sha: string = flag('sha') ?? 'HEAD';
const repo: string = flag('repo') ?? process.env['GITHUB_REPOSITORY'] ?? '';
const out: string | undefined = flag('out');
const pr: string | undefined = flag('pr');
// Where the editor is served from. Another project running this workflow
// points it at its own deployment, or at any instance it trusts.
const editor: string = flag('editor') ?? 'https://qtpi-bonding.github.io/archeglyph/';
const strict: boolean = process.argv.includes('--strict');

const named: string[] = process.argv
  .slice(2)
  .filter((a: string): boolean => !a.startsWith('--'))
  .filter((a: string): boolean => a !== sha && a !== repo && a !== out);

function tracked(): string[] {
  const result = spawnSync('git', ['ls-files', '-z', `*${SUFFIX}`], { encoding: 'utf8', cwd: ROOT });
  return result.stdout.split('\0').filter((p: string): boolean => p.length > 0);
}

type Status = 'current' | 'stale' | 'missing';

interface Rendered {
  diagram: string;
  svg: string;
  status: Status;
}

/** Render `diagram` and say whether the committed SVG beside it still matches. */
function check(diagram: string, scratch: string): Rendered {
  const svg: string = `${diagram.slice(0, -SUFFIX.length)}.svg`;
  const style: string = `${diagram.slice(0, -SUFFIX.length)}.style.json`;
  const fresh: string = join(scratch, 'fresh.svg');

  const args: string[] = ['packages/cli/bin/archeglyph.ts', 'render', '--diagram', diagram, '--out', fresh];
  if (existsSync(join(ROOT, style))) {
    args.push('--style', style);
  }
  const run = spawnSync('bun', args, { cwd: ROOT, encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(`render failed for ${diagram}:\n${run.stderr}`);
  }

  if (!existsSync(join(ROOT, svg))) {
    return { diagram, svg, status: 'missing' };
  }
  const committed: string = readFileSync(join(ROOT, svg), 'utf8');
  const current: string = readFileSync(fresh, 'utf8');
  return { diagram, svg, status: committed === current ? 'current' : 'stale' };
}

function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${repo}/${sha}/${path}`;
}

/**
 * The editor, opened on this diagram as the pull request leaves it.
 *
 * `ref` is the head SHA rather than the branch, so the link keeps showing
 * what the comment described. `pr` makes the editor read this pull
 * request's review comments, so a proposal's thread is there too.
 */
function editorUrl(diagram: string): string {
  const query: string[] = [`gh=${repo}`, `path=${diagram}`, `ref=${sha}`];
  if (pr !== undefined) {
    query.push(`pr=${repo}/${pr}`, 'review=open');
  }
  return `${editor}?${query.join('&')}`;
}

function body(rendered: ReadonlyArray<Rendered>): string {
  const lines: string[] = [MARKER, '### Diagrams', ''];
  for (const entry of rendered) {
    lines.push(`**\`${entry.diagram}\`**`, '');
    if (entry.status === 'missing') {
      lines.push(
        `> No \`${entry.svg}\` is committed, so there is nothing to show here.`,
        `> Run \`bun run archeglyph render --diagram ${entry.diagram} --out ${entry.svg}\` and commit it.`,
        '',
      );
      continue;
    }
    if (entry.status === 'stale') {
      lines.push(
        `> \`${entry.svg}\` no longer matches its source, so the picture below is out of date.`,
        `> Run \`bun run archeglyph render --diagram ${entry.diagram} --out ${entry.svg}\` and commit it.`,
        '',
      );
    }
    lines.push(
      `<img src="${rawUrl(entry.svg)}" width="640" alt="${entry.diagram}">`,
      '',
      `[Open in the editor](${editorUrl(entry.diagram)})`,
      '',
    );
  }
  // Pinned to this commit, so the picture stays what the comment described.
  lines.push(`<sub>Rendered from \`${sha.slice(0, 7)}\` by archeglyph.</sub>`);
  return lines.join('\n');
}

const candidates: string[] = (named.length > 0 ? named : tracked()).filter(
  (p: string): boolean => p.endsWith(SUFFIX),
);

if (candidates.length === 0) {
  console.log('pr_diagrams: no diagrams touched');
  process.exit(0);
}

const scratch: string = mkdtempSync(join(tmpdir(), 'archeglyph-pr-'));
const rendered: Rendered[] = candidates.map((d: string): Rendered => check(d, scratch));
const markdown: string = body(rendered);

if (out !== undefined) {
  writeFileSync(out, markdown, 'utf8');
} else {
  console.log(markdown);
}

for (const entry of rendered) {
  console.error(`${entry.status.padEnd(8)} ${entry.diagram}`);
}

const broken: Rendered[] = rendered.filter((r: Rendered): boolean => r.status !== 'current');
if (strict && broken.length > 0) {
  console.error(`\npr_diagrams: ${String(broken.length)} diagram(s) need re-rendering`);
  process.exit(1);
}
