// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Makes Solid components renderable under `bun test`.
//
// Solid's JSX is not a runtime library call -- it is a COMPILE step. Babel
// rewrites `<input value={text()} />` into fine-grained reactive updates, and
// without that pass a component is just a function returning nothing useful.
// The app gets this from vite-plugin-solid; the test runner has no build step,
// so the same transform is installed here as a Bun loader plugin.
//
// Four things here are load-bearing, each found the hard way:
//
//  - The presets are IMPORTED, not named as strings. `bun test` runs with
//    --conditions browser (see package.json; Solid's server build no-ops
//    every effect), and under that condition Babel resolves its own browser
//    build, which cannot resolve a preset by name.
//  - `parserOpts.plugins` is explicit. Babel 8 no longer infers JSX from the
//    .tsx extension here.
//  - `onlyRemoveTypeImports: false` lets the editor's existing
//    `import { Component, JSX } from 'solid-js'` style work untouched. With
//    the default, those type-only names survive the transform as value
//    imports and blow up at runtime.
//  - Only .tsx is transformed. Plain .ts needs no JSX pass, and routing it
//    through Babel would slow every other package's tests for nothing.

import { plugin } from 'bun';
import { transformAsync } from '@babel/core';
// @ts-expect-error -- babel presets ship no types
import solid from 'babel-preset-solid';
// @ts-expect-error -- babel presets ship no types
import typescript from '@babel/preset-typescript';
import { readFileSync } from 'node:fs';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Importing a Solid component runs delegateEvents at module scope, which needs
// `window` -- so a DOM must exist before any component import, not just before
// a render. Guarded: bun runs every test file in one process and a second
// register throws.
if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

plugin({
  name: 'solid-jsx',
  setup(build): void {
    build.onLoad({ filter: /\.tsx$/ }, async (args: { path: string }) => {
      const source: string = readFileSync(args.path, 'utf8');
      const result = await transformAsync(source, {
        filename: args.path,
        presets: [[solid, {}], [typescript, { onlyRemoveTypeImports: false }]],
        parserOpts: { plugins: ['jsx', 'typescript'] },
        babelrc: false,
        configFile: false,
      });
      return { contents: result?.code ?? source, loader: 'js' };
    });
  },
});
