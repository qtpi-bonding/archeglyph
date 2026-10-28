// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { injectDiagram } = await import('./diagram_layer');
const { emphasizeProposal, ghostPartKey, GHOST_OPACITY } = await import('./ghost_layer');

// What the renderer emits: <defs>, a background rect, then one flat <g> per
// element, with the edge and annotation id prefixes the editor reads back.
const SVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
  <defs><marker id="m"/></defs>
  <rect width="10" height="10"/>
  <g id="node-app" data-element-id="app" data-kind="node"><rect id="app-shape"/></g>
  <g id="edge-app__cache" data-element-id="app__cache" data-kind="edge"><path id="edge-line"/></g>
  <g id="annotation-note" data-element-id="note" data-kind="annotation"><rect id="note-shape"/></g>
</svg>`;

function ghost(): SVGGElement {
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
  host.setAttribute('data-ghost', 'true');
  document.body.appendChild(host);
  injectDiagram(host, SVG);
  return host;
}

function opacityOf(host: SVGGElement, selector: string): string | null {
  return host.querySelector(selector)!.getAttribute('opacity');
}

function shown(host: SVGGElement, selector: string): boolean {
  return host.querySelector(selector)!.getAttribute('display') !== 'none';
}

describe('emphasizeProposal', () => {
  test('shows the parts a proposal touches and takes the rest out', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['annotation:note']), true);

    expect(shown(host, '#annotation-note')).toBe(true);
    expect(opacityOf(host, '#annotation-note')).toBe('1');
    expect(shown(host, '#node-app')).toBe(false);
    expect(shown(host, '#edge-app__cache')).toBe(false);
    host.remove();
  });

  test('an open proposal is solid and any other is faint', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['element:app']), false);

    expect(opacityOf(host, '#node-app')).toBe(GHOST_OPACITY);
    host.remove();
  });

  test('a part comes back when a later call touches it', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(), true);
    expect(shown(host, '#node-app')).toBe(false);

    emphasizeProposal(host, new Set(['element:app']), true);
    expect(shown(host, '#node-app')).toBe(true);
    host.remove();
  });

  test('an element and an annotation sharing an id are told apart', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['element:note']), true);

    expect(shown(host, '#annotation-note')).toBe(false);
    host.remove();
  });

  test('the defs are left alone', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['element:app']), true);

    expect(host.querySelector('defs')!.getAttribute('display')).toBeNull();
    host.remove();
  });
});

describe('ghostPartKey', () => {
  test('a press on a shape inside a part names that part', () => {
    const host = ghost();
    expect(ghostPartKey(host.querySelector('#note-shape'))).toBe('annotation:note');
    expect(ghostPartKey(host.querySelector('#edge-line'))).toBe('edge:app__cache');
    expect(ghostPartKey(host.querySelector('#app-shape'))).toBe('element:app');
    host.remove();
  });

  test('a press outside the ghost names nothing', () => {
    const real = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    real.setAttribute('data-element-id', 'app');
    document.body.appendChild(real);

    expect(ghostPartKey(real)).toBeUndefined();
    expect(ghostPartKey(null)).toBeUndefined();
    real.remove();
  });
});
