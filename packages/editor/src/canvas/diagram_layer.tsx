// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Component,
  createEffect,
  JSX,
  onMount,
} from 'solid-js';
import { ElementRef } from '../ui_state/ui_state';
import { elementKey } from '../scene/element_key';

export interface DiagramLayerProps {
  svg: string;
  dimmed: Array<ElementRef>;
}

const DIMMED_CLASS: string = 'diagram-layer-dimmed';
const DIMMING_STYLE_ID: string = 'diagram-layer-dimming-style';
const DIMMING_RULE: string = `.diagram-layer[data-dimmed="true"] .${DIMMED_CLASS} { opacity: 0.3; }`;

function installDimmingRule(): void {
  if (typeof document === 'undefined' || document.getElementById(DIMMING_STYLE_ID) !== null) {
    return;
  }
  const style: HTMLStyleElement = document.createElement('style');
  style.id = DIMMING_STYLE_ID;
  style.textContent = DIMMING_RULE;
  document.head.appendChild(style);
}

function isDimmed(element: Element, refs: Array<ElementRef>): boolean {
  const id: string | null = element.getAttribute('data-element-id');
  const kind: string | null = element.getAttribute('data-kind');
  if (id === null || kind === null) {
    return false;
  }
  const key: string = `${kind}:${id}`;
  return refs.some((ref: ElementRef): boolean => elementKey(ref) === key);
}

/**
 * Move the renderer's markup into `host`, dropping the wrapper it came in.
 *
 * The renderer emits a complete `<svg viewBox width height>` document — the
 * same bytes `archeglyph render` writes to a file. Injected as-is inside our
 * own <svg> that becomes a NESTED viewport, which clips everything drawn
 * outside its box and paints the diagram's background as an opaque slab with
 * a visible edge in the middle of the canvas. So the root <svg> is unwrapped
 * and its background <rect> left behind; the canvas element paints that
 * colour instead, edge to edge. Nothing inside the <defs> and <g> children is
 * touched, so editor and CLI still draw the same elements.
 */
export function injectDiagram(host: SVGGElement, svg: string): void {
  host.replaceChildren();
  if (svg === '') {
    return;
  }
  const parsed: Document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root: SVGSVGElement | null = parsed.querySelector('svg');
  if (root === null) {
    return;
  }
  for (const child of Array.from(root.children)) {
    // Direct children are <defs>, the background <rect>, then one <g> per
    // element. The rect is the only one that is neither.
    if (child.tagName === 'defs' || child.tagName === 'g') {
      host.appendChild(document.importNode(child, true));
    }
  }
}

/** Solid component that preserves renderer SVG markup and applies preview dimming. */
export const DiagramLayer: Component<DiagramLayerProps> = (props: DiagramLayerProps): JSX.Element => {
  let host!: SVGGElement;

  onMount((): void => {
    installDimmingRule();
  });

  createEffect((): void => {
    injectDiagram(host, props.svg);
  });

  createEffect((): void => {
    // Read svg so newly injected renderer groups receive the current dimming
    // state as well; the markup itself remains owned by injectDiagram.
    props.svg;
    const refs: Array<ElementRef> = props.dimmed;
    host.setAttribute('data-dimmed', refs.length > 0 ? 'true' : 'false');
    const elements: NodeListOf<Element> = host.querySelectorAll('[data-element-id]');
    elements.forEach((element: Element): void => {
      element.classList.toggle(DIMMED_CLASS, isDimmed(element, refs));
    });
  });

  return (
    <g
      ref={host}
      class="diagram-layer"
      data-dimmed={props.dimmed.length > 0 ? 'true' : 'false'}
    />
  );
};
