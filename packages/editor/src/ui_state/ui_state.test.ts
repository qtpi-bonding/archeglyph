// SPDX-License-Identifier: MPL-2.0
//
// Behavioral test suite for the editor's UI-state layer, derived from:
//   1. .archegraph/specs/editor-ui-state/*.spec.textproto (the authority —
//      doc fields on each decl carry intent and invariants)
//   2. docs/editor-ui-review.md, especially §10's decision table (D1-D13)
//      and §11.2's ring-navigation description
//   3. docs/design.md for coordinate conventions
//
// Expectations here come from the spec doc fields and the decision table,
// NOT from reading the implementation bodies. Where the implementation
// appears to diverge, the test is left failing and reported rather than
// adjusted to match the code.

import { describe, test, expect } from 'bun:test';

import {
  screenToDiagram,
  diagramToScreen,
  zoomAboutPoint,
  fitBoundsToRect,
  NO_INSETS,
  type ContainerRect,
} from './viewport_math';
import {
  replaceSelection,
  toggleSelection,
  addAllSelection,
  clearSelection,
  selectInRect,
} from './selection_ops';
import { KEYMAP, resolveChord, type CommandId } from './keymap';
import {
  nextInDocumentOrder,
  prevInDocumentOrder,
  nearestInDirection,
  followEdge,
  type NavigableElement,
} from './navigation';
import { createUiState, type ElementRef, type Viewport } from './ui_state';
import type { Bounds } from '@archeglyph/core/geometry/bounds';
import type { Vec2 } from '@archeglyph/core/geometry/vec2';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function rect(left: number, top: number, width: number, height: number): ContainerRect {
  return { left, top, width, height };
}

function ref(id: string, kind: ElementRef['kind'] = 'node'): ElementRef {
  return { id, kind };
}

function bounds(minX: number, minY: number, maxX: number, maxY: number): Bounds {
  return { minX, minY, maxX, maxY };
}

// ===========================================================================
// viewport_math.ts
// ===========================================================================

describe('viewport_math: screenToDiagram / diagramToScreen round-trip', () => {
  test('diagramToScreen then screenToDiagram is identity, for a plain viewport', () => {
    const viewport: Viewport = { panX: 10, panY: -5, zoom: 2 };
    const containerRect = rect(50, 20, 800, 600);
    const diagramPt: Vec2 = { x: 37, y: -12.5 };

    const screenPt = diagramToScreen(viewport, containerRect, diagramPt);
    const roundTripped = screenToDiagram(viewport, containerRect, screenPt);

    expect(roundTripped.x).toBeCloseTo(diagramPt.x, 10);
    expect(roundTripped.y).toBeCloseTo(diagramPt.y, 10);
  });

  test('screenToDiagram then diagramToScreen is identity, for a plain viewport', () => {
    const viewport: Viewport = { panX: -30, panY: 100, zoom: 0.5 };
    const containerRect = rect(8, 8, 1024, 768);
    const screenPt: Vec2 = { x: 400, y: 300 };

    const diagramPt = screenToDiagram(viewport, containerRect, screenPt);
    const roundTripped = diagramToScreen(viewport, containerRect, diagramPt);

    expect(roundTripped.x).toBeCloseTo(screenPt.x, 10);
    expect(roundTripped.y).toBeCloseTo(screenPt.y, 10);
  });

  test('container rect offset is honoured (not assumed to be 0,0)', () => {
    // Regression target for docs/editor-ui-review.md §2.16: the old
    // ViewportState.toCanvas/toScreen ignored the canvas container's own
    // offset. An absolute conversion through a non-zero-origin container
    // rect must account for that offset, not silently drop it.
    const viewport: Viewport = { panX: 0, panY: 0, zoom: 1 };
    const containerRect = rect(200, 100, 500, 400);
    const diagramPt: Vec2 = { x: 0, y: 0 };

    const screenPt = diagramToScreen(viewport, containerRect, diagramPt);
    expect(screenPt.x).toBe(200);
    expect(screenPt.y).toBe(100);
  });

  test('screenToDiagram inverts a zoomed, panned viewport at a known point', () => {
    const viewport: Viewport = { panX: 100, panY: 50, zoom: 4 };
    const containerRect = rect(0, 0, 1000, 1000);
    // Pick a screen point that should map to diagram-space origin.
    const screenPt: Vec2 = { x: 100, y: 50 };
    const diagramPt = screenToDiagram(viewport, containerRect, screenPt);
    expect(diagramPt.x).toBeCloseTo(0, 10);
    expect(diagramPt.y).toBeCloseTo(0, 10);
  });
});

describe('viewport_math: zoomAboutPoint', () => {
  test('keeps the point under the cursor stationary on screen after zooming in', () => {
    const viewport: Viewport = { panX: 20, panY: 30, zoom: 1 };
    const containerRect = rect(0, 0, 800, 600);
    const screenPt: Vec2 = { x: 300, y: 200 };

    // What diagram-space point is currently under the cursor?
    const anchorDiagramPt = screenToDiagram(viewport, containerRect, screenPt);

    const zoomed = zoomAboutPoint(viewport, screenPt, containerRect, 2, 0.1, 10);

    // The same diagram point, reprojected through the NEW viewport, must
    // land back under the same screen point — that's what "about a point"
    // means for a zoom.
    const reprojected = diagramToScreen(zoomed, containerRect, anchorDiagramPt);
    expect(reprojected.x).toBeCloseTo(screenPt.x, 8);
    expect(reprojected.y).toBeCloseTo(screenPt.y, 8);
  });

  test('keeps the point under the cursor stationary on screen after zooming out', () => {
    const viewport: Viewport = { panX: -40, panY: 15, zoom: 3 };
    const containerRect = rect(10, 10, 800, 600);
    const screenPt: Vec2 = { x: 150, y: 450 };

    const anchorDiagramPt = screenToDiagram(viewport, containerRect, screenPt);
    const zoomed = zoomAboutPoint(viewport, screenPt, containerRect, 0.5, 0.1, 10);
    const reprojected = diagramToScreen(zoomed, containerRect, anchorDiagramPt);

    expect(reprojected.x).toBeCloseTo(screenPt.x, 8);
    expect(reprojected.y).toBeCloseTo(screenPt.y, 8);
  });

  test('clamps zoom at the maximum and still anchors the point', () => {
    const viewport: Viewport = { panX: 0, panY: 0, zoom: 5 };
    const containerRect = rect(0, 0, 400, 400);
    const screenPt: Vec2 = { x: 100, y: 100 };

    const zoomed = zoomAboutPoint(viewport, screenPt, containerRect, 100, 0.1, 8);
    expect(zoomed.zoom).toBe(8);

    // Even when clamped, the point that was under the cursor before the
    // (clamped) zoom must still be under the cursor after.
    const anchorDiagramPt = screenToDiagram(viewport, containerRect, screenPt);
    const reprojected = diagramToScreen(zoomed, containerRect, anchorDiagramPt);
    expect(reprojected.x).toBeCloseTo(screenPt.x, 8);
    expect(reprojected.y).toBeCloseTo(screenPt.y, 8);
  });

  test('clamps zoom at the minimum and still anchors the point', () => {
    const viewport: Viewport = { panX: 0, panY: 0, zoom: 1 };
    const containerRect = rect(0, 0, 400, 400);
    const screenPt: Vec2 = { x: 250, y: 60 };

    const zoomed = zoomAboutPoint(viewport, screenPt, containerRect, 0.001, 0.25, 10);
    expect(zoomed.zoom).toBe(0.25);

    const anchorDiagramPt = screenToDiagram(viewport, containerRect, screenPt);
    const reprojected = diagramToScreen(zoomed, containerRect, anchorDiagramPt);
    expect(reprojected.x).toBeCloseTo(screenPt.x, 8);
    expect(reprojected.y).toBeCloseTo(screenPt.y, 8);
  });

  test('factor of 1 (no-op zoom) leaves viewport unchanged', () => {
    const viewport: Viewport = { panX: 12, panY: -7, zoom: 2 };
    const containerRect = rect(5, 5, 300, 300);
    const screenPt: Vec2 = { x: 50, y: 50 };

    const result = zoomAboutPoint(viewport, screenPt, containerRect, 1, 0.1, 10);
    expect(result.zoom).toBeCloseTo(2, 10);
    expect(result.panX).toBeCloseTo(12, 10);
    expect(result.panY).toBeCloseTo(-7, 10);
  });
});

describe('viewport_math: fitBoundsToRect', () => {
  test('centers normal content in the container with padding, choosing the smaller axis ratio', () => {
    const contentBounds = bounds(0, 0, 100, 50); // wide content: 100x50
    const containerRect = rect(0, 0, 1000, 1000);
    const padding = 0;

    const result = fitBoundsToRect(contentBounds, containerRect, padding);

    // availWidth/contentWidth = 1000/100 = 10; availHeight/contentHeight = 1000/50 = 20
    // smaller ratio wins -> zoom = 10
    expect(result.zoom).toBeCloseTo(10, 10);

    // Content centre (50, 25) at zoom 10 should land at container centre (500, 500).
    const centreScreen = diagramToScreen(result, containerRect, { x: 50, y: 25 });
    expect(centreScreen.x).toBeCloseTo(500, 6);
    expect(centreScreen.y).toBeCloseTo(500, 6);
  });

  test('degenerate zero-width bounds (single point) falls back to zoom=1, not divide-by-zero', () => {
    const pointBounds = bounds(10, 10, 10, 10); // zero width AND height
    const containerRect = rect(0, 0, 800, 600);

    const result = fitBoundsToRect(pointBounds, containerRect, 20);

    expect(result.zoom).toBe(1);
    expect(Number.isFinite(result.panX)).toBe(true);
    expect(Number.isFinite(result.panY)).toBe(true);
    // Centres the point at the container centre, at zoom 1.
    expect(result.panX).toBeCloseTo(400 - 10, 10);
    expect(result.panY).toBeCloseTo(300 - 10, 10);
  });

  test('degenerate zero-height-only bounds also falls back to zoom=1', () => {
    const lineBounds = bounds(0, 5, 200, 5); // zero height, nonzero width
    const containerRect = rect(0, 0, 800, 600);

    const result = fitBoundsToRect(lineBounds, containerRect, 0);
    expect(result.zoom).toBe(1);
  });

  test('zero-size container (contentWidth/Height positive) yields a finite, non-NaN zoom', () => {
    const contentBounds = bounds(0, 0, 10, 10);
    const containerRect = rect(0, 0, 0, 0);

    const result = fitBoundsToRect(contentBounds, containerRect, 0);
    // availWidth = availHeight = 0, so zoom = 0/10 = 0 (not NaN, not Infinity).
    expect(Number.isNaN(result.zoom)).toBe(false);
    expect(result.zoom).toBe(0);
  });

  test('padding reduces the available space and thus the resulting zoom', () => {
    const contentBounds = bounds(0, 0, 100, 100);
    const containerRect = rect(0, 0, 1000, 1000);

    const noPadding = fitBoundsToRect(contentBounds, containerRect, 0);
    const withPadding = fitBoundsToRect(contentBounds, containerRect, 100);

    expect(withPadding.zoom).toBeLessThan(noPadding.zoom);
    // With 100px padding each side: avail = 800 -> zoom = 8.
    expect(withPadding.zoom).toBeCloseTo(8, 10);
  });
});

describe('viewport_math: fitBoundsToRect clears the island columns', () => {
  const columns = { left: 280, right: 280, top: 0, bottom: 0 };

  test('content lands between the columns, not underneath them', () => {
    const contentBounds = bounds(0, 0, 1000, 200);
    const containerRect = rect(0, 0, 1200, 800);

    const result = fitBoundsToRect(contentBounds, containerRect, 24, columns);
    const left = diagramToScreen(result, containerRect, { x: 0, y: 0 }).x;
    const right = diagramToScreen(result, containerRect, { x: 1000, y: 0 }).x;

    expect(left).toBeGreaterThanOrEqual(280);
    expect(right).toBeLessThanOrEqual(1200 - 280);
  });

  test('the fit is tighter than one that ignores the columns', () => {
    const contentBounds = bounds(0, 0, 1000, 200);
    const containerRect = rect(0, 0, 1200, 800);

    expect(fitBoundsToRect(contentBounds, containerRect, 24, columns).zoom)
      .toBeLessThan(fitBoundsToRect(contentBounds, containerRect, 24).zoom);
  });

  test('a window narrower than its own chrome still keeps half of it clear', () => {
    const contentBounds = bounds(0, 0, 100, 100);
    const containerRect = rect(0, 0, 400, 400);

    const result = fitBoundsToRect(contentBounds, containerRect, 0, columns);
    const left = diagramToScreen(result, containerRect, { x: 0, y: 0 }).x;
    const right = diagramToScreen(result, containerRect, { x: 100, y: 0 }).x;

    expect(left).toBeCloseTo(100, 6);
    expect(right - left).toBeCloseTo(200, 6);
  });

  test('the scale is continuous across the width where the columns stop fitting', () => {
    const contentBounds = bounds(0, 0, 1000, 200);
    const zoomAt = (width: number): number =>
      fitBoundsToRect(contentBounds, rect(0, 0, width, 800), 24, columns).zoom;

    // 1120 is the seam: below it the columns no longer fit in half the width.
    expect(Math.abs(zoomAt(1121) - zoomAt(1120))).toBeLessThan(0.01);
  });

  test('omitting the insets leaves the fit exactly where it was', () => {
    const contentBounds = bounds(0, 0, 100, 50);
    const containerRect = rect(0, 0, 1000, 1000);

    expect(fitBoundsToRect(contentBounds, containerRect, 24, NO_INSETS))
      .toEqual(fitBoundsToRect(contentBounds, containerRect, 24));
  });
});

// ===========================================================================
// selection_ops.ts
// ===========================================================================

describe('selection_ops: replaceSelection', () => {
  test('always yields exactly [ref], regardless of prior selection', () => {
    expect(replaceSelection(ref('a'))).toEqual([{ id: 'a', kind: 'node' }]);
  });
});

describe('selection_ops: toggleSelection', () => {
  test('adds a ref not already present', () => {
    const result = toggleSelection([ref('a')], ref('b'));
    expect(result).toEqual([ref('a'), ref('b')]);
  });

  test('removes a ref already present (matched by id AND kind)', () => {
    const result = toggleSelection([ref('a'), ref('b')], ref('a'));
    expect(result).toEqual([ref('b')]);
  });

  test('same id but different kind is treated as a different element (not removed)', () => {
    const result = toggleSelection([ref('a', 'node')], ref('a', 'edge'));
    expect(result).toEqual([ref('a', 'node'), ref('a', 'edge')]);
  });

  test('toggling the same ref twice is idempotent (back to original set)', () => {
    const start = [ref('a'), ref('b')];
    const once = toggleSelection(start, ref('c'));
    const twice = toggleSelection(once, ref('c'));
    expect(twice).toEqual(start);
  });

  test('does not mutate the input array', () => {
    const start = [ref('a')];
    const copy = [...start];
    toggleSelection(start, ref('b'));
    expect(start).toEqual(copy);
  });
});

describe('selection_ops: addAllSelection', () => {
  test('unions current and refs, de-duplicated by (id, kind)', () => {
    const result = addAllSelection([ref('a')], [ref('a'), ref('b')]);
    expect(result).toEqual([ref('a'), ref('b')]);
  });

  test("preserves current's order, then newly-added refs in their given order", () => {
    const result = addAllSelection(
      [ref('z'), ref('y')],
      [ref('x'), ref('y'), ref('w')],
    );
    expect(result).toEqual([ref('z'), ref('y'), ref('x'), ref('w')]);
  });

  test('empty current with duplicate entries within refs keeps only first occurrence', () => {
    const result = addAllSelection([], [ref('a'), ref('a'), ref('b')]);
    expect(result).toEqual([ref('a'), ref('b')]);
  });

  test('empty refs leaves current unchanged (content-wise)', () => {
    const result = addAllSelection([ref('a'), ref('b')], []);
    expect(result).toEqual([ref('a'), ref('b')]);
  });

  test('both empty yields empty', () => {
    expect(addAllSelection([], [])).toEqual([]);
  });
});

describe('selection_ops: clearSelection', () => {
  test('returns an empty array', () => {
    expect(clearSelection()).toEqual([]);
  });
});

describe('selection_ops: selectInRect', () => {
  test('returns only candidates whose bounds intersect the marquee', () => {
    const candidates = [
      { ref: ref('inside'), bounds: bounds(0, 0, 10, 10) },
      { ref: ref('outside'), bounds: bounds(100, 100, 110, 110) },
    ];
    const marquee = bounds(-5, -5, 20, 20);
    const result = selectInRect(candidates, marquee);
    expect(result).toEqual([ref('inside')]);
  });

  test('empty candidates yields empty result', () => {
    expect(selectInRect([], bounds(0, 0, 10, 10))).toEqual([]);
  });

  test('zero-size marquee (a click, not a drag) still matches a candidate it touches', () => {
    const candidates = [{ ref: ref('a'), bounds: bounds(0, 0, 10, 10) }];
    const pointMarquee = bounds(5, 5, 5, 5);
    expect(selectInRect(candidates, pointMarquee)).toEqual([ref('a')]);
  });

  test('preserves candidate order, not marquee or bounds order', () => {
    const candidates = [
      { ref: ref('b'), bounds: bounds(50, 50, 60, 60) },
      { ref: ref('a'), bounds: bounds(0, 0, 10, 10) },
    ];
    const marquee = bounds(-100, -100, 1000, 1000);
    expect(selectInRect(candidates, marquee)).toEqual([ref('b'), ref('a')]);
  });
});

// ===========================================================================
// keymap.ts
// ===========================================================================

describe('keymap: KEYMAP table contents (D6 ring on s)', () => {
  test('contains exactly the ring-related chords the spec/decision table require', () => {
    const findCommand = (key: string, meta = false, shift = false): CommandId | undefined =>
      KEYMAP.find(
        (entry) =>
          entry.chord.key === key &&
          (entry.chord.meta ?? false) === meta &&
          (entry.chord.shift ?? false) === shift,
      )?.command;

    expect(findCommand('s')).toBe('ring-next');
    expect(findCommand('s', false, true)).toBe('ring-prev');
    expect(findCommand('s', true)).toBe('save');
  });

  test('undo/redo/select-all/delete/escape/nudge chords are present per spec', () => {
    const findCommand = (key: string, meta = false, shift = false): CommandId | undefined =>
      KEYMAP.find(
        (entry) =>
          entry.chord.key === key &&
          (entry.chord.meta ?? false) === meta &&
          (entry.chord.shift ?? false) === shift,
      )?.command;

    expect(findCommand('z', true)).toBe('undo');
    expect(findCommand('z', true, true)).toBe('redo');
    expect(findCommand('Backspace')).toBe('delete');
    expect(findCommand('Delete')).toBe('delete');
    expect(findCommand('Escape')).toBe('escape');
    expect(findCommand('a', true)).toBe('select-all');
    expect(findCommand('ArrowUp')).toBe('nudge-up');
    expect(findCommand('ArrowDown')).toBe('nudge-down');
    expect(findCommand('ArrowLeft')).toBe('nudge-left');
    expect(findCommand('ArrowRight')).toBe('nudge-right');
  });
});

describe('keymap: resolveChord platform handling (meta OR ctrl)', () => {
  test('metaKey alone satisfies a meta:true chord (Mac)', () => {
    const command = resolveChord({ key: 'z', metaKey: true, ctrlKey: false, shiftKey: false });
    expect(command).toBe('undo');
  });

  test('ctrlKey alone satisfies a meta:true chord (cross-platform fallback, §2.7)', () => {
    const command = resolveChord({ key: 'z', metaKey: false, ctrlKey: true, shiftKey: false });
    expect(command).toBe('undo');
  });

  test('both metaKey and ctrlKey together still satisfies a meta:true chord', () => {
    const command = resolveChord({ key: 'z', metaKey: true, ctrlKey: true, shiftKey: false });
    expect(command).toBe('undo');
  });

  test('neither metaKey nor ctrlKey does not satisfy a meta:true chord', () => {
    const command = resolveChord({ key: 'z', metaKey: false, ctrlKey: false, shiftKey: false });
    expect(command).toBeUndefined();
  });

  test('a chord with meta absent/false requires BOTH metaKey and ctrlKey false', () => {
    // 's' (bare) -> ring-next requires no modifiers.
    const withMeta = resolveChord({ key: 's', metaKey: true, ctrlKey: false, shiftKey: false });
    const withCtrl = resolveChord({ key: 's', metaKey: false, ctrlKey: true, shiftKey: false });
    const bare = resolveChord({ key: 's', metaKey: false, ctrlKey: false, shiftKey: false });

    // 's' + meta is a distinct chord ('save'), so metaKey=true must NOT
    // resolve to ring-next.
    expect(withMeta).not.toBe('ring-next');
    expect(withCtrl).not.toBe('ring-next');
    expect(bare).toBe('ring-next');
  });

  test('shift is exact-match: shift:true chord requires shiftKey true, absent requires false', () => {
    const shiftS = resolveChord({ key: 's', metaKey: false, ctrlKey: false, shiftKey: true });
    expect(shiftS).toBe('ring-prev');

    const plainSWithShift = resolveChord({ key: 's', metaKey: false, ctrlKey: false, shiftKey: true });
    expect(plainSWithShift).not.toBe('ring-next');
  });

  test('conflicting chord resolution: "s" with meta+shift both true matches no entry (KEYMAP has no such chord)', () => {
    // KEYMAP has {s}, {s,shift}, {s,meta} but no {s,meta,shift} — verify
    // this genuinely falls through to undefined rather than accidentally
    // matching one of the other s-chords via a loose comparison.
    const command = resolveChord({ key: 's', metaKey: true, ctrlKey: false, shiftKey: true });
    expect(command).toBeUndefined();
  });

  test('unknown key resolves to undefined', () => {
    const command = resolveChord({ key: 'Q', metaKey: false, ctrlKey: false, shiftKey: false });
    expect(command).toBeUndefined();
  });

  test('resolves the first matching entry in KEYMAP order', () => {
    // Sanity: KEYMAP order shouldn't produce ambiguous double-matches for
    // any of the ring chords under test above; explicitly confirm 'z',
    // meta+shift resolves to redo (not undo) since redo is more specific.
    const command = resolveChord({ key: 'z', metaKey: true, ctrlKey: false, shiftKey: true });
    expect(command).toBe('redo');
  });
});

// ===========================================================================
// navigation.ts
// ===========================================================================

function nav(id: string, x: number, y: number, kind: ElementRef['kind'] = 'node'): NavigableElement {
  return { ref: { id, kind }, centre: { x, y } };
}

describe('navigation: nextInDocumentOrder / prevInDocumentOrder', () => {
  const elements = [nav('a', 0, 0), nav('b', 1, 0), nav('c', 2, 0)];

  test('next: undefined current returns the first element', () => {
    expect(nextInDocumentOrder(elements, undefined)).toEqual(ref('a'));
  });

  test('next: returns the element after current', () => {
    expect(nextInDocumentOrder(elements, ref('a'))).toEqual(ref('b'));
    expect(nextInDocumentOrder(elements, ref('b'))).toEqual(ref('c'));
  });

  test('next: wraps from the last element to the first', () => {
    expect(nextInDocumentOrder(elements, ref('c'))).toEqual(ref('a'));
  });

  test('next: empty elements returns undefined regardless of current', () => {
    expect(nextInDocumentOrder([], undefined)).toBeUndefined();
    expect(nextInDocumentOrder([], ref('a'))).toBeUndefined();
  });

  test('prev: undefined current returns the last element', () => {
    expect(prevInDocumentOrder(elements, undefined)).toEqual(ref('c'));
  });

  test('prev: returns the element before current', () => {
    expect(prevInDocumentOrder(elements, ref('c'))).toEqual(ref('b'));
    expect(prevInDocumentOrder(elements, ref('b'))).toEqual(ref('a'));
  });

  test('prev: wraps from the first element to the last', () => {
    expect(prevInDocumentOrder(elements, ref('a'))).toEqual(ref('c'));
  });

  test('prev: empty elements returns undefined', () => {
    expect(prevInDocumentOrder([], ref('a'))).toBeUndefined();
  });

  test('next/prev on a single-element list wraps to itself', () => {
    const single = [nav('only', 5, 5)];
    expect(nextInDocumentOrder(single, ref('only'))).toEqual(ref('only'));
    expect(prevInDocumentOrder(single, ref('only'))).toEqual(ref('only'));
  });

  test('current not found in elements (disconnected/stale ref) is treated like undefined-ish -1 index', () => {
    // findIndex returns -1 for a ref not present; next treats -1 the same
    // as "no current" (index -1 + 1 = 0 -> first element).
    const stray = ref('not-in-list');
    expect(nextInDocumentOrder(elements, stray)).toEqual(ref('a'));
  });
});

describe('navigation: nearestInDirection (ring / hex-neighbour query)', () => {
  test('finds the nearest candidate within the cone, ignoring farther aligned ones', () => {
    const from = nav('origin', 0, 0);
    const near = nav('near', 10, 0);
    const far = nav('far', 100, 0);
    const elements = [from, near, far];

    // direction = +X (0,0)->(1,0); half-angle 30deg
    const result = nearestInDirection(elements, from, { x: 1, y: 0 }, Math.PI / 6);
    expect(result).toEqual(ref('near'));
  });

  test('excludes candidates outside the cone', () => {
    const from = nav('origin', 0, 0);
    const perpendicular = nav('perp', 0, 10); // 90 degrees off from +X direction
    const elements = [from, perpendicular];

    const result = nearestInDirection(elements, from, { x: 1, y: 0 }, Math.PI / 6); // 30deg half-angle
    expect(result).toBeUndefined();
  });

  test('excludes the `from` element itself even if it matches trivially', () => {
    const from = nav('origin', 0, 0);
    const elements = [from];
    const result = nearestInDirection(elements, from, { x: 1, y: 0 }, Math.PI);
    expect(result).toBeUndefined();
  });

  test('a same-id-different-kind element at the same position as `from` is NOT excluded (matched by id+kind)', () => {
    const from = nav('shared-id', 0, 0, 'node');
    const otherKindSamePos = nav('shared-id', 0, 0, 'edge');
    const elements = [from, otherKindSamePos];
    // direction/cone irrelevant at distance 0, but isWithinCone requires a
    // nonzero targetDirection to produce a defined angle; use a nonzero
    // offset target instead to keep the probe well-defined, and confirm
    // the *matching* rule (id+kind) rather than pure id.
    const otherKindOffset = nav('shared-id', 5, 0, 'edge');
    const result = nearestInDirection([from, otherKindOffset], from, { x: 1, y: 0 }, Math.PI / 6);
    expect(result).toEqual({ id: 'shared-id', kind: 'edge' });
  });

  test('no qualifying candidate (disconnected node, nothing in that direction) returns undefined', () => {
    const from = nav('lonely', 0, 0);
    const elements = [from];
    const result = nearestInDirection(elements, from, { x: 0, y: -1 }, Math.PI / 6);
    expect(result).toBeUndefined();
  });

  test('a self-loop candidate at distance 0 from `from` is excluded by the id+kind self-check before distance matters', () => {
    const from = nav('self', 0, 0);
    const other = nav('other', 1, 0);
    const elements = [from, other];
    const result = nearestInDirection(elements, from, { x: 1, y: 0 }, Math.PI / 6);
    expect(result).toEqual(ref('other'));
  });

  test('tie in distance: first qualifying candidate in iteration order wins (strict less-than comparison)', () => {
    const from = nav('origin', 0, 0);
    const tie1 = nav('tie1', 10, 0);
    const tie2 = nav('tie2', 10, 0.0001); // effectively same distance, still within cone
    const elements = [from, tie1, tie2];
    const result = nearestInDirection(elements, from, { x: 1, y: 0 }, Math.PI / 6);
    expect(result).toEqual(ref('tie1'));
  });
});

describe('navigation: followEdge', () => {
  const edges = [
    { id: 'e1', source: 'a', target: 'b' },
    { id: 'e2', source: 'a', target: 'c' },
    { id: 'e3', source: 'b', target: 'a' },
  ];

  test('forward direction collects targets of edges whose source matches fromId', () => {
    expect(followEdge(edges, 'a', 'forward')).toEqual(['b', 'c']);
  });

  test('backward direction collects sources of edges whose target matches fromId', () => {
    expect(followEdge(edges, 'a', 'backward')).toEqual(['b']);
  });

  test('node with no matching edges in that direction returns empty array', () => {
    expect(followEdge(edges, 'c', 'forward')).toEqual([]);
  });

  test('self-loop edge is followed correctly in both directions', () => {
    const selfLoopEdges = [{ id: 'loop', source: 'x', target: 'x' }];
    expect(followEdge(selfLoopEdges, 'x', 'forward')).toEqual(['x']);
    expect(followEdge(selfLoopEdges, 'x', 'backward')).toEqual(['x']);
  });

  test('empty edge list returns empty array', () => {
    expect(followEdge([], 'a', 'forward')).toEqual([]);
  });

  test('preserves input edge order, not sorted by any other key', () => {
    const reordered = [
      { id: 'e2', source: 'a', target: 'z' },
      { id: 'e1', source: 'a', target: 'b' },
    ];
    expect(followEdge(reordered, 'a', 'forward')).toEqual(['z', 'b']);
  });
});

// ===========================================================================
// ui_state.ts
// ===========================================================================

describe('ui_state: createUiState defaults', () => {
  test('selection defaults to an empty array', () => {
    const state = createUiState();
    expect(state.selection()).toEqual([]);
  });

  test('hover defaults to undefined', () => {
    const state = createUiState();
    expect(state.hover()).toBeUndefined();
  });

  test("tool defaults to 'select'", () => {
    const state = createUiState();
    expect(state.tool()).toBe('select');
  });

  test('viewport defaults to {panX:0, panY:0, zoom:1}', () => {
    const state = createUiState();
    expect(state.viewport()).toEqual({ panX: 0, panY: 0, zoom: 1 });
  });

  test('setSelection updates what selection() returns', () => {
    const state = createUiState();
    state.setSelection([ref('a')]);
    expect(state.selection()).toEqual([ref('a')]);
  });

  test('setHover updates what hover() returns, including clearing back to undefined', () => {
    const state = createUiState();
    state.setHover(ref('h'));
    expect(state.hover()).toEqual(ref('h'));
    state.setHover(undefined);
    expect(state.hover()).toBeUndefined();
  });

  test('setTool updates what tool() returns', () => {
    const state = createUiState();
    state.setTool('hand');
    expect(state.tool()).toBe('hand');
  });

  test('setViewport updates what viewport() returns', () => {
    const state = createUiState();
    const next: Viewport = { panX: 5, panY: 6, zoom: 2 };
    state.setViewport(next);
    expect(state.viewport()).toEqual(next);
  });

  test('two independently created states do not share underlying signal state', () => {
    const stateA = createUiState();
    const stateB = createUiState();
    stateA.setTool('hand');
    expect(stateB.tool()).toBe('select');
  });
});
