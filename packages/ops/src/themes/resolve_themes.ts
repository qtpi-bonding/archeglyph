// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadTheme } from '@archeglyph/core/loaders';
import { findBundledTheme } from '@archeglyph/themes';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';

export interface ThemeResolveError {
  readonly message: string;
}

/** Applied when a stylesheet binds nothing, preserving the style-less render. */
const FALLBACK_BINDING: ReadonlyArray<readonly [string, string]> = [['default', 'dark']];

export async function resolveThemes(
  bindings: Record<string, string>,
  override: string | undefined,
  projectRoot: string,
): Promise<Result<Map<string, Theme>, ThemeResolveError>> {
  const wanted = new Map<string, string>(
    Object.keys(bindings).length > 0 ? Object.entries(bindings) : FALLBACK_BINDING,
  );

  if (override !== undefined) {
    const eq = override.indexOf('=');
    if (eq < 0) {
      wanted.set('default', override);
    } else {
      const name = override.slice(0, eq);
      if (name === '') {
        return Err({ message: `--theme '${override}': expected <name>=<theme> or <theme>` });
      }
      wanted.set(name, override.slice(eq + 1));
    }
  }

  const loaded = new Map<string, Theme>();
  for (const [name, ref] of wanted) {
    const bundled = findBundledTheme(ref);
    if (bundled !== null) {
      loaded.set(name, bundled);
      continue;
    }
    const text = await readFile(resolve(projectRoot, ref), 'utf8');
    const result = await loadTheme(text);
    if (result.kind === 'err') {
      return Err({ message: `theme '${name}' (${ref}): ${result.error.message}` });
    }
    loaded.set(name, result.value);
  }
  return Ok(loaded);
}
