// SPDX-License-Identifier: AGPL-3.0-or-later

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
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';

import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';

import { applyAllPendingEdits } from '../canvas/ghost_layer';
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

describe.each(['pipeline', 'checkout', 'checkout-v2'])('examples/%s', (name: string) => {
  test.each(BUNDLED_THEME_NAMES)('loads and renders under %s', async (themeName: string) => {
    const { diagram, stylesheet } = await open(name);
    expect((await svgFor(diagram, stylesheet, themeName)).length).toBeGreaterThan(0);
  });

  test('the pending layer renders under every theme too', async () => {
    const { diagram, stylesheet } = await open(name);
    const ghost = applyAllPendingEdits(stylesheet);
    for (const themeName of BUNDLED_THEME_NAMES) {
      expect((await svgFor(diagram, ghost, themeName)).length).toBeGreaterThan(0);
    }
  });
});

describe('examples/checkout carries a review to look at', () => {
  test('three proposals, each with a description and a thread', async () => {
    const { stylesheet } = await open('checkout');
    const items = pendingItems(stylesheet);

    expect(items.length).toBe(3);
    for (const item of items) {
      expect({ id: item.id, untitled: item.description === 'Untitled change' }).toEqual({ id: item.id, untitled: false });
      expect(item.changeCount).toBeGreaterThan(0);
      expect(item.comments.length).toBeGreaterThan(0);
    }
  });

  test('the ghost layer differs from the saved one', async () => {
    // A proposal that folds to the same stylesheet renders an invisible diff.
    const { diagram, stylesheet } = await open('checkout');
    const saved = await svgFor(diagram, stylesheet);
    const ghost = await svgFor(diagram, applyAllPendingEdits(stylesheet));

    expect(ghost).not.toBe(saved);
  });

  test('it covers a recolour, a move, and an added annotation', async () => {
    const { diagram, stylesheet } = await open('checkout');
    const saved = await svgFor(diagram, stylesheet);
    const ghost = await svgFor(diagram, applyAllPendingEdits(stylesheet));

    const amber = '#F59E0B';
    expect({ saved: saved.includes(amber), ghost: ghost.includes(amber) }).toEqual({ saved: false, ghost: true });
    expect({ saved: saved.includes('retries'), ghost: ghost.includes('retries') }).toEqual({ saved: false, ghost: true });

    const moved = applyAllPendingEdits(stylesheet).nodes['payments']?.layout?.position;
    expect({ y: moved?.y }).toEqual({ y: 176 });
    expect(stylesheet.nodes['payments']?.layout?.position?.y).toBe(96);
  });
});
