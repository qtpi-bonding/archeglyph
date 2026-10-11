// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { render, cleanup } = await import('@solidjs/testing-library');
const { createSignal } = await import('solid-js');
const { StateIsland } = await import('./state_island');
const { PendingBanner } = await import('../pending/pending_banner');
const { EchoIsland } = await import('./echo_island');
const { DiagramLayer } = await import('../canvas/diagram_layer');
const { gestureTokens } = await import('./key_echo');
const { beginModalGesture } = await import('../ui_state/modal_gesture');

describe('StateIsland follows the model', () => {
  test('an error raised after mount is shown', () => {
    const [error, setError] = createSignal<string | undefined>(undefined);
    const { container } = render(() => <StateIsland error={error()} />);

    expect(container.textContent).toBe('');

    setError('layout failed: cyclic containment');
    expect(container.textContent).toContain('cyclic containment');

    cleanup();
  });
});

describe('PendingBanner follows the model', () => {
  test('it appears when the first proposal arrives', () => {
    const [count, setCount] = createSignal<number>(0);
    const { container } = render(() => (
      <PendingBanner count={count()} expanded={false} onToggle={(): void => undefined} />
    ));

    expect(container.querySelector('button')).toBeNull();

    setCount(2);
    expect(container.querySelector('button')).not.toBeNull();
    expect(container.textContent).toContain('2 proposed changes');

    cleanup();
  });

  test('the count and its pluralisation track the model', () => {
    const [count, setCount] = createSignal<number>(3);
    const { container } = render(() => (
      <PendingBanner count={count()} expanded={false} onToggle={(): void => undefined} />
    ));

    expect(container.textContent).toContain('3 proposed changes');

    setCount(1);
    expect(container.textContent).toContain('1 proposed change');
    expect(container.textContent).not.toContain('changes');

    setCount(0);
    expect(container.querySelector('button')).toBeNull();

    cleanup();
  });
});

describe('EchoIsland follows the model', () => {
  test('a gesture built key by key appears one part at a time', () => {
    const [gesture, setGesture] = createSignal(beginModalGesture('grab', []));
    const { container } = render(() => <EchoIsland tokens={gestureTokens(gesture())} />);

    expect(container.textContent).toBe('g');

    setGesture((g) => ({ ...g, direction: 'up' }));
    expect(container.textContent).toBe('g↑');

    setGesture((g) => ({ ...g, digits: '12' }));
    expect(container.textContent).toBe('g↑12');

    cleanup();
  });

  test('it is absent with nothing to show, so it takes no space', () => {
    const [tokens, setTokens] = createSignal<Array<{ text: string }>>([]);
    const { container } = render(() => <EchoIsland tokens={tokens()} />);

    expect(container.querySelector('.ag-echo')).toBeNull();

    setTokens([{ text: '⌫' }, { text: 'Delete' }]);
    expect(container.querySelector('.ag-echo')).not.toBeNull();

    setTokens([]);
    expect(container.querySelector('.ag-echo')).toBeNull();

    cleanup();
  });
});

describe('DiagramLayer dims by element id, not by the SVG kind attribute', () => {
  // A closed container is a group in the scene but is drawn like a block, and
  // the SVG's `data-kind` is a rendering detail the editor must not depend on.
  // The attribute here deliberately disagrees with the scene's ref kind.
  const svg = [
    '<svg viewBox="0 0 10 10">',
    '<g id="group-P" data-element-id="P" data-kind="node"></g>',
    '<g id="node-x" data-element-id="x" data-kind="node"></g>',
    '</svg>',
  ].join('');

  test('a closed container named by its scene ref is dimmed whatever the SVG calls it', () => {
    const { container } = render(() => (
      <svg><DiagramLayer svg={svg} dimmed={[{ kind: 'group', id: 'P' }]} /></svg>
    ));

    expect(container.querySelector('[data-element-id="P"]')?.classList.contains('diagram-layer-dimmed')).toBe(true);
    expect(container.querySelector('[data-element-id="x"]')?.classList.contains('diagram-layer-dimmed')).toBe(false);

    cleanup();
  });
});

describe('DiagramLayer keeps edges, elements and annotations apart', () => {
  // Edges, elements and annotations are separate id namespaces, so an edge and
  // an element can share an id; dimming one must not dim the other.
  const svg = [
    '<svg viewBox="0 0 10 10">',
    '<g id="node-a" data-element-id="a" data-kind="node"></g>',
    '<g id="edge-a" data-element-id="a" data-kind="edge"></g>',
    '<g id="annotation-a" data-element-id="a" data-kind="annotation"></g>',
    '</svg>',
  ].join('');

  const dimmedIds = (dimmed: Array<{ kind: 'node' | 'group' | 'edge' | 'annotation'; id: string }>): string[] => {
    const { container } = render(() => (
      <svg><DiagramLayer svg={svg} dimmed={dimmed} /></svg>
    ));
    const out = Array.from(container.querySelectorAll('.diagram-layer-dimmed')).map((el) => el.id);
    cleanup();
    return out.sort();
  };

  test('an edge ref dims the edge only', () => {
    expect(dimmedIds([{ kind: 'edge', id: 'a' }])).toEqual(['edge-a']);
  });

  test('an element ref dims the element only', () => {
    expect(dimmedIds([{ kind: 'node', id: 'a' }])).toEqual(['node-a']);
  });

  test('an annotation ref dims the annotation only', () => {
    expect(dimmedIds([{ kind: 'annotation', id: 'a' }])).toEqual(['annotation-a']);
  });
});
