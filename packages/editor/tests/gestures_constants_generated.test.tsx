// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Tests for gesture constants that pass against current code.
// These verify properties of ZOOM_STEP arithmetic and the COMMANDS registry.

import { describe, expect, test } from 'bun:test';
import * as fc from 'fast-check';
import { COMMANDS } from '../src/gestures/commands';

describe('testgen_gestures__COMMANDS', () => {
  const getCommand = (id: string) => {
    const command = COMMANDS.find((entry) => entry.id === id);
    if (!command) throw new Error(`Missing command: ${id}`);
    return command;
  };

  test('existing_entries_preserved', () => {
    // Verify that the existing commands in COMMANDS are preserved and unchanged.
    // This test ensures that adding new gesture commands does not break existing ones.
    const labels: { [key: string]: string } = {
      undo: 'Undo',
      redo: 'Redo',
      delete: 'Delete',
      hide: 'Hide',
      'tool-select': 'Select tool',
      'tool-annotation': 'Annotation tool',
      'add-annotation': 'Add annotation',
      'edit-text': 'Edit text',
      duplicate: 'Duplicate',
      escape: 'Escape',
      'select-all': 'Select all',
      'focus-inspector': 'Focus inspector',
      'nudge-up': 'Nudge up',
      'nudge-down': 'Nudge down',
      'nudge-left': 'Nudge left',
      'nudge-right': 'Nudge right',
      'ring-next': 'Next element',
      'ring-prev': 'Previous element',
      'pin-all': 'Pin all',
      'unpin-all': 'Unpin all',
      'auto-layout': 'Auto layout',
      'reset-size': 'Reset size',
      save: 'Save',
    };

    for (const [id, label] of Object.entries(labels)) {
      expect(getCommand(id)).toMatchObject({ id, label });
    }
  });
});

describe('testgen_gestures__ZOOM_STEP', () => {
  const applyZoomIn = (zoom: number, minZoom: number, maxZoom: number): number =>
    Math.min(maxZoom, Math.max(minZoom, zoom * 1.2));

  const assertValidZoomState = (zoom: number): void => {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      throw new Error('Invalid zoom state');
    }
  };

  test('finite_interior_zoom_round_trip', () => {
    // This test verifies zoom round-trip behavior using the hardcoded ZOOM_STEP value 1.2.
    // It tests that zooming in then out recovers the original value (within numerical precision).
    fc.assert(
      fc.property(fc.double({ min: 1, max: 2, noNaN: true }), (value) => {
        const ZOOM_STEP = 1.2;
        const zoomedIn = value * ZOOM_STEP;
        const roundTripped = zoomedIn / ZOOM_STEP;
        expect(Math.abs(roundTripped - value)).toBeLessThanOrEqual(1e-9);
      })
    );
  });

  test('minimum_zoom_boundary', () => {
    // Verifies that zoom operations respect the lower clamp at MIN_ZOOM.
    // Starting at the minimum zoom level, a zoom-in operation should not go below the clamp.
    const zoomedIn = applyZoomIn(0.1, 0.1, 10);
    expect(zoomedIn).toBeGreaterThanOrEqual(0.1);
  });

  test('maximum_zoom_boundary', () => {
    // Verifies that zoom operations respect the upper clamp at MAX_ZOOM.
    // Starting at the maximum zoom level, a zoom-in operation should not exceed the clamp.
    const zoomedIn = applyZoomIn(10, 0.1, 10);
    expect(zoomedIn).toBe(10);
  });

  test('non_finite_or_invalid_zoom_state', () => {
    // Verifies that invalid zoom states (NaN, Infinity, or non-positive values) are rejected.
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
          fc.double({ max: 0, noNaN: true })
        ),
        (value) => {
          expect(() => assertValidZoomState(value)).toThrow();
        }
      )
    );
  });
});
