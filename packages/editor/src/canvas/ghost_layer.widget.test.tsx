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

describe('emphasizeProposal', () => {
  test('draws the open proposal solid, the others faint, and hides the rest', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['annotation:note']), new Set(['element:app']));

    expect(opacityOf(host, '#annotation-note')).toBe('1');
    expect(opacityOf(host, '#node-app')).toBe(GHOST_OPACITY);
    expect(opacityOf(host, '#edge-app__cache')).toBe('0');
    host.remove();
  });

  test('with none open, every part a proposal changes is faint', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(), new Set(['annotation:note', 'element:app']));

    expect(opacityOf(host, '#annotation-note')).toBe(GHOST_OPACITY);
    expect(opacityOf(host, '#node-app')).toBe(GHOST_OPACITY);
    host.remove();
  });

  test('a proposal that only another one touches stays on the canvas', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['element:app']), new Set(['annotation:note']));

    expect(opacityOf(host, '#annotation-note')).toBe(GHOST_OPACITY);
    host.remove();
  });

  test('an element and an annotation sharing an id are told apart', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['element:note']), new Set());

    expect(opacityOf(host, '#annotation-note')).toBe('0');
    host.remove();
  });

  test('the defs are left alone', () => {
    const host = ghost();
    emphasizeProposal(host, new Set(['element:app']), new Set());

    expect(host.querySelector('defs')!.getAttribute('opacity')).toBeNull();
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
