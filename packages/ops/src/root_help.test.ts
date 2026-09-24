// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { REGISTRY } from './registry';
import { formatRootHelp } from './zod_argv';
import type { Operation } from './op';

describe('the root help advertises only what exists', () => {
  test('no subcommand is listed that the registry cannot run', () => {
    const names = new Set((REGISTRY as Operation<unknown, unknown>[]).map((op) => op.name));
    names.add('help');

    const listed = formatRootHelp(REGISTRY as Operation<unknown, unknown>[])
      .split('Subcommands:')[1]
      .split('Run `archeglyph')[0]
      .split('\n')
      .map((line) => line.trim().split(/\s+/)[0])
      .filter((name) => name.length > 0);

    expect(listed.length).toBeGreaterThan(0);
    for (const name of listed) {
      expect(names).toContain(name);
    }
  });
});
