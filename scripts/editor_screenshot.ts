// SPDX-License-Identifier: MPL-2.0

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const DIST = resolve(ROOT, 'packages/editor/dist');
const OUT = resolve(ROOT, 'docs/img/editor-review.png');
const PORT = 8748;

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path: string): boolean => existsSync(path));

if (CHROME === undefined) {
  console.error('no Chrome or Chromium found; install one or set it by hand');
  process.exit(1);
}
if (!existsSync(resolve(DIST, 'index.html'))) {
  console.error(`no build at ${DIST} — run \`bun run build:editor\` first`);
  process.exit(1);
}

const b64 = (text: string): string => encodeURIComponent(Buffer.from(text).toString('base64'));
const diagram = b64(await readFile(resolve(ROOT, 'examples/stack-managed.diag.json'), 'utf8'));
const stylesheet = b64(await readFile(resolve(ROOT, 'examples/stack-managed.style.json'), 'utf8'));

const url = `http://127.0.0.1:${PORT}/?review=open#d=${diagram}&s=${stylesheet}`;

const server = Bun.serve({
  port: PORT,
  fetch(request: Request): Response | Promise<Response> {
    const path = new URL(request.url).pathname;
    const file = Bun.file(resolve(DIST, path === '/' ? 'index.html' : path.slice(1)));
    return file.exists().then((ok: boolean) => ok ? new Response(file) : new Response('not found', { status: 404 }));
  },
});

const chrome = spawn(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=2',
  '--virtual-time-budget=10000',
  '--window-size=2300,980',
  `--screenshot=${OUT}`,
  url,
], { stdio: 'ignore' });

await new Promise<void>((done) => { chrome.on('exit', () => { done(); }); });
server.stop(true);

console.log(existsSync(OUT) ? `wrote ${OUT}` : 'chrome produced no screenshot');
