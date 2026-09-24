// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { BUNDLED_THEME_NAMES, getBundledTheme } from './index';

// Derived from the component messages' reachable Color fields. Note
// AnnotationComponent.shape is a Glyph2D, so it carries a decoration slot.
const ROLES: string[] = [
  'node_outline', 'node_fill', 'node_glow', 'node_label',
  'node_label_background', 'node_decoration',

  'edge_stroke', 'edge_glow', 'edge_label', 'edge_label_background',

  'group_outline', 'group_fill', 'group_glow', 'group_label',
  'group_label_background', 'group_decoration',

  'annotation_outline', 'annotation_fill', 'annotation_glow',
  'annotation_label', 'annotation_label_background', 'annotation_decoration',
  'annotation_callout', 'annotation_callout_glow',

  'background',
];

// Optional, and all-or-none: a theme declares all three or none.
const DIFF_ROLES: string[] = ['diff_added', 'diff_modified', 'diff_deleted'];

// Only the component region is hex-free; palettes above it are literal.
const COMPONENT_REGION_START = '// --- components: no literal colours below ---';
const COMPONENT_REGION_END = '// --- end components ---';

const SOURCE: string = readFileSync(new URL('./index.ts', import.meta.url).pathname, 'utf8');

describe('bundled themes are layered palette -> roles -> components', () => {
  for (const name of BUNDLED_THEME_NAMES) {
    test(`${name} declares every role exhaustively`, () => {
      const theme: Theme = getBundledTheme(name);
      const roles: Record<string, string> = theme.tokens?.roles ?? {};
      for (const role of ROLES) {
        expect(roles[role]).toBeDefined();
      }
    });

    test(`${name} declares no role outside the vocabulary`, () => {
      const theme: Theme = getBundledTheme(name);
      const declared: string[] = Object.keys(theme.tokens?.roles ?? {});
      const unknown: string[] = declared.filter(
        (r: string): boolean => !ROLES.includes(r) && !DIFF_ROLES.includes(r),
      );
      expect(unknown).toEqual([]);
    });

    test(`${name} declares all three diff roles or none of them`, () => {
      const theme: Theme = getBundledTheme(name);
      const roles: Record<string, string> = theme.tokens?.roles ?? {};
      const present: number = DIFF_ROLES.filter(
        (r: string): boolean => roles[r] !== undefined,
      ).length;
      expect([0, DIFF_ROLES.length]).toContain(present);
    });

    test(`${name} palette values are literals, never references`, () => {
      const theme: Theme = getBundledTheme(name);
      for (const value of Object.values(theme.tokens?.palette ?? {})) {
        expect(value.startsWith('$')).toBe(false);
      }
    });

    test(`${name} roles reference the palette or a literal, never another role`, () => {
      const theme: Theme = getBundledTheme(name);
      for (const value of Object.values(theme.tokens?.roles ?? {})) {
        if (value.startsWith('$')) {
          expect(value.startsWith('$palette.')).toBe(true);
        }
      }
    });

    test(`${name} every role reference names a palette entry that exists`, () => {
      const theme: Theme = getBundledTheme(name);
      const palette: Record<string, string> = theme.tokens?.palette ?? {};
      for (const [role, value] of Object.entries(theme.tokens?.roles ?? {})) {
        if (value.startsWith('$palette.')) {
          expect({ role, defined: palette[value.slice('$palette.'.length)] !== undefined })
            .toEqual({ role, defined: true });
        }
      }
    });

    test(`${name} declares no dead palette entry`, () => {
      const theme: Theme = getBundledTheme(name);
      const referenced = new Set(
        Object.values(theme.tokens?.roles ?? {})
          .filter((v: string): boolean => v.startsWith('$palette.'))
          .map((v: string): string => v.slice('$palette.'.length)),
      );
      for (const key of Object.keys(theme.tokens?.palette ?? {})) {
        expect({ key, referenced: referenced.has(key) }).toEqual({ key, referenced: true });
      }
    });
  }
});

// Layering: only roles may name the palette.
test('$palette. appears only on a roles-map line', () => {
  const offenders: string[] = SOURCE
    .split('\n')
    .filter((line: string): boolean => line.includes("'$palette."))
    .filter((line: string): boolean => !/^\s+[a-z_]+: +'\$palette\.[a-z_]+',$/.test(line));
  expect(offenders).toEqual([]);
});

// Colour-only: "5,4" is not a hex, so dash values are NOT covered here.
test('no component factory carries a literal hex — every colour goes through a role', () => {
  const start: number = SOURCE.indexOf(COMPONENT_REGION_START);
  const end: number = SOURCE.indexOf(COMPONENT_REGION_END);
  // If the markers move, the guard silently checks nothing. Pin them.
  expect({ start: start > 0, end: end > start }).toEqual({ start: true, end: true });
  expect(SOURCE.slice(start, end).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
});
