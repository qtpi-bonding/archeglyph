// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDiagram, loadStylesheet } from '@archeglyph/core/loaders';
import { BUNDLED_THEME_NAMES, getBundledTheme } from '@archeglyph/themes';
import { layoutPipeline } from '@archeglyph/core/pipeline';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { Diagram } from '@archeglyph/proto/gen/content_pb';
import type { StyleEdit, Stylesheet } from '@archeglyph/proto/gen/style_pb';

import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';

import { ghostStylesheet } from '../canvas/ghost_layer';
import { pendingItems } from './pending_model';

const examples = join(new URL('.', import.meta.url).pathname, '../../../../examples');

async function open(name: string): Promise<{ diagram: Diagram; stylesheet: Stylesheet }> {
  const diagram = await loadDiagram(readFileSync(join(examples, `${name}.diag.json`), 'utf8'));
  const stylesheet = await loadStylesheet(readFileSync(join(examples, `${name}.style.json`), 'utf8'));
  if (diagram.kind === 'err') { throw new Error(`${name}.diag.json: ${diagram.error.message}`); }
  if (stylesheet.kind === 'err') { throw new Error(`${name}.style.json: ${stylesheet.error.message}`); }
  return { diagram: diagram.value, stylesheet: stylesheet.value };
}

async function svgFor(diagram: Diagram, stylesheet: Stylesheet, themeName = 'blueprint'): Promise<string> {
  const theme = getBundledTheme(themeName);
  const engine = new LayoutEngineImpl(new ElkAdapterImpl(new ElkConstructor()));
  const seeded = seedComponentBindings(diagram, stylesheet, theme);
  const laid = await layoutPipeline(diagram, seeded, new Map([['default', theme]]), engine);
  if (laid.kind === 'err') {
    throw new Error(`${themeName} layout: ${laid.error.stage}: ${laid.error.detail ?? ''}`);
  }
  const svg = new SvgRendererImpl().render(laid.value);
  if (svg.kind === 'err') { throw new Error(`render: ${JSON.stringify(svg.error)}`); }
  return svg.value;
}

function strokeColour(entry: { shape?: { stroke?: { paint: { case?: string; value?: unknown } } } } | undefined): unknown {
  const paint = entry?.shape?.stroke?.paint;
  return paint?.case === 'color' ? (paint.value as { value: string }).value : undefined;
}

describe.each(['pipeline', 'stack-managed', 'stack-selfhosted'])('examples/%s', (name: string) => {
  test.each(BUNDLED_THEME_NAMES)('loads and renders under %s', async (themeName: string) => {
    const { diagram, stylesheet } = await open(name);
    expect((await svgFor(diagram, stylesheet, themeName)).length).toBeGreaterThan(0);
  });

  test('the pending layer renders under every theme too', async () => {
    const { diagram, stylesheet } = await open(name);
    for (const edit of stylesheet.pendingEdits) {
      const ghost = ghostStylesheet(stylesheet, edit);
      for (const themeName of BUNDLED_THEME_NAMES) {
        expect((await svgFor(diagram, ghost, themeName)).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('examples/stack-managed carries a review to look at', () => {
  test('three proposals, each with a description and a thread', async () => {
    const { stylesheet } = await open('stack-managed');
    const items = pendingItems(stylesheet);

    expect(items.length).toBe(3);
    for (const item of items) {
      expect({ id: item.id, untitled: item.description === 'Untitled change' }).toEqual({ id: item.id, untitled: false });
      expect(item.changeCount).toBeGreaterThan(0);
      expect(item.comments.length).toBeGreaterThan(0);
    }
  });

  test('each proposal renders differently from the saved diagram', async () => {
    // A proposal that folds to the same stylesheet renders an invisible diff.
    const { diagram, stylesheet } = await open('stack-managed');
    const saved = await svgFor(diagram, stylesheet);

    for (const edit of stylesheet.pendingEdits) {
      expect({ id: edit.id, same: (await svgFor(diagram, ghostStylesheet(stylesheet, edit))) === saved })
        .toEqual({ id: edit.id, same: false });
    }
  });

  test('together they cover a recolour, a move, and an added annotation', async () => {
    const { diagram, stylesheet } = await open('stack-managed');
    const saved = await svgFor(diagram, stylesheet);
    const recolour = await svgFor(diagram, ghostStylesheet(stylesheet, stylesheet.pendingEdits[0]!));
    const annotation = await svgFor(diagram, ghostStylesheet(stylesheet, stylesheet.pendingEdits[2]!));

    const amber = '#F59E0B';
    expect({ saved: saved.includes(amber), ghost: recolour.includes(amber) }).toEqual({ saved: false, ghost: true });
    expect({ saved: saved.includes('egress'), ghost: annotation.includes('egress') }).toEqual({ saved: false, ghost: true });

    const moved = ghostStylesheet(stylesheet, stylesheet.pendingEdits[1]!).elements['segment']?.layout?.position;
    expect({ y: moved?.y }).toEqual({ y: 208 });
    expect(stylesheet.elements['segment']?.layout?.position?.y).toBe(288);
  });

  // `app` is pinned, tinted by the recolour, and touched by nothing else.
  test('a proposal that only recolours does not move what it tints', async () => {
    const { stylesheet } = await open('stack-managed');
    const ghost = ghostStylesheet(stylesheet, stylesheet.pendingEdits[0]!);

    expect(ghost.elements['app']?.layout?.position).toEqual(stylesheet.elements['app']?.layout?.position);
    expect(ghost.elements['app']?.layout?.position?.y).toBe(130);
  });

  // `upstash` is tinted by the first proposal and moved by the second. Folding
  // them into one render would draw each with the other's change as well.
  test('a part two proposals touch is drawn with only that proposal\'s change', async () => {
    const { stylesheet } = await open('stack-managed');
    const tint = ghostStylesheet(stylesheet, stylesheet.pendingEdits[0]!).elements['upstash'];
    const move = ghostStylesheet(stylesheet, stylesheet.pendingEdits[1]!).elements['upstash'];
    const saved = stylesheet.elements['upstash'];

    expect(strokeColour(tint)).toBe('#F59E0B');
    expect(tint?.layout?.position).toEqual(saved?.layout?.position);

    expect(move?.layout?.position?.y).not.toBe(saved?.layout?.position?.y);
    expect(strokeColour(move)).toBe(strokeColour(saved));
  });
});
