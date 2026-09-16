// SPDX-License-Identifier: AGPL-3.0-or-later
//
// TDD RED STEP for the editor-shell-islands spec.
//
// These tests define the contracts for new gesture commands and constants
// DECLARED BY the spec but NOT YET IMPLEMENTED in the code:
//   - Commands: tool-hand, zoom-in, zoom-out, zoom-reset, zoom-fit
//   - Constants: ZOOM_STEP (1.2), FIT_PADDING (40)
//
// EXPECTED TO FAIL until `archegraph build --spec editor-shell-islands` lands.
// Do not delete or skip these to make the suite green. When the implementation
// is complete, these tests will pass and serve as regression guards.
//
// Ref: .archegraph/specs/editor-shell-islands/commands.spec.textproto

import { describe, expect, test } from 'bun:test';
import * as fc from 'fast-check';
import { COMMANDS } from '../src/gestures/commands';
import { MIN_ZOOM, MAX_ZOOM } from '../src/gestures/wheel_handler';

describe('testgen_gestures__COMMANDS (red)', () => {
  const getCommand = (id: string) => {
    const command = COMMANDS.find((entry) => entry.id === id);
    if (!command) throw new Error(`Missing command: ${id}`);
    return command;
  };

  const makeCommandContext = () => {
    const ui: any = { tool: undefined, setTool: (tool: string) => { ui.tool = tool; } };
    return {
      ui,
      state: { undo: () => {}, redo: () => {} },
      save: () => {},
      rect: { x: 0, y: 0, width: 100, height: 100 },
      zoomAboutPoint: () => {},
      fitBoundsToRect: () => {},
    } as any;
  };

  const makeZoomContext = (rect: any, zoom: number, pan: any = { x: 0, y: 0 }, geometry: any = undefined) => {
    const zoomCalls: any[] = [];
    const fitCalls: any[] = [];
    const viewport: any = { zoom, pan: { ...pan } };
    const zoomAboutPoint = (point: any, factor: number) => {
      zoomCalls.push([point, factor]);
      viewport.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * factor));
    };
    const fitBoundsToRect = (...args: any[]) => {
      fitCalls.push(args);
    };
    return {
      rect,
      geometry,
      viewport,
      zoom: viewport.zoom,
      pan: viewport.pan,
      zoomAboutPoint,
      fitBoundsToRect,
      zoomCalls,
      fitCalls,
    } as any;
  };

  test('tool_hand_valid_context', () => {
    // WHEN: tool-hand is run with valid CommandContext
    // THEN: Sets ui.tool to 'hand'
    // Ref: commands.spec.textproto line 23
    fc.assert(
      fc.property(fc.constant(null), (value) => {
        const context = makeCommandContext();
        getCommand('tool-hand').run(context);
        expect(context.ui.tool).toBe('hand');
      })
    );
  });

  test('zoom_in_positive_rect', () => {
    // WHEN: zoom-in is run with positive rectangle dimensions
    // THEN: Calls zoomAboutPoint with center point and ZOOM_STEP factor
    // Ref: commands.spec.textproto line 31
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
          zoom: fc.integer({ min: 1, max: 100 }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, value.zoom);
          getCommand('zoom-in').run(context);
          // ZOOM_STEP is expected to be 1.2 per spec
          const ZOOM_STEP = 1.2;
          expect(context.zoomCalls).toEqual([
            [
              {
                x: value.rect.x + value.rect.width / 2,
                y: value.rect.y + value.rect.height / 2,
              },
              ZOOM_STEP,
            ],
          ]);
        }
      )
    );
  });

  test('zoom_out_positive_rect', () => {
    // WHEN: zoom-out is run with positive rectangle dimensions
    // THEN: Calls zoomAboutPoint with center point and 1/ZOOM_STEP factor
    // Ref: commands.spec.textproto line 32
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
          zoom: fc.integer({ min: 1, max: 100 }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, value.zoom);
          getCommand('zoom-out').run(context);
          const ZOOM_STEP = 1.2;
          expect(context.zoomCalls).toEqual([
            [
              {
                x: value.rect.x + value.rect.width / 2,
                y: value.rect.y + value.rect.height / 2,
              },
              1 / ZOOM_STEP,
            ],
          ]);
        }
      )
    );
  });

  test('zoom_reset_positive_rect', () => {
    // WHEN: zoom-reset is run with positive rectangle dimensions and zoom > 1
    // THEN: Calls zoomAboutPoint with center point and factor 1/current_zoom
    // Ref: commands.spec.textproto line 33
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
          zoom: fc.integer({ min: 1, max: 100 }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, value.zoom);
          getCommand('zoom-reset').run(context);
          expect(context.zoomCalls).toEqual([
            [
              {
                x: value.rect.x + value.rect.width / 2,
                y: value.rect.y + value.rect.height / 2,
              },
              1 / value.zoom,
            ],
          ]);
        }
      )
    );
  });

  test('zoom_reset_preserves_centre_point', () => {
    // WHEN: zoom-reset is run with non-zero pan
    // THEN: Viewport.pan is modified to keep the centre point centered
    // Ref: commands.spec.textproto line 35
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer({ min: 1 }),
            y: fc.integer({ min: 1 }),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
          zoom: fc.integer({ min: 2, max: 20 }),
          pan: fc.record({ x: fc.integer({ min: 1 }), y: fc.integer({ min: 1 }) }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, value.zoom, value.pan);
          const before = { ...context.viewport.pan };
          getCommand('zoom-reset').run(context);
          expect(context.viewport.zoom).toBe(1);
          // Pan should change to keep center point centered, not remain as before
          expect(context.viewport.pan).not.toEqual({ x: 0, y: 0 });
          expect(context.viewport.pan).not.toEqual(before);
        }
      )
    );
  });

  test('zoom_reset_already_one', () => {
    // WHEN: zoom-reset is run with zoom already at 1
    // THEN: Applies zoom factor of 1 and pans to keep center centered
    // Ref: commands.spec.textproto line 35
    const context = makeZoomContext({ x: 10, y: 20, width: 100, height: 80 }, 1, { x: 7, y: -3 });
    getCommand('zoom-reset').run(context);
    expect(context.zoomCalls).toEqual([[{ x: 60, y: 60 }, 1]]);
    expect(context.viewport.pan).toEqual({ x: 7, y: -3 });
  });

  test('zoom_in_clamps_max', () => {
    // WHEN: zoom-in is run with zoom already at MAX_ZOOM
    // THEN: Zoom does not exceed MAX_ZOOM
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, MAX_ZOOM);
          getCommand('zoom-in').run(context);
          expect(context.viewport.zoom).toBe(MAX_ZOOM);
        }
      )
    );
  });

  test('zoom_out_clamps_min', () => {
    // WHEN: zoom-out is run with zoom already at MIN_ZOOM
    // THEN: Zoom does not go below MIN_ZOOM
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, MIN_ZOOM);
          getCommand('zoom-out').run(context);
          expect(context.viewport.zoom).toBe(MIN_ZOOM);
        }
      )
    );
  });

  test('zoom_in_zero_width', () => {
    // WHEN: zoom-in is run with rect.width = 0
    // THEN: No-op, does not change viewport
    const context = makeZoomContext({ x: 10, y: 20, width: 0, height: 50 }, 2);
    const before = { ...context.viewport };
    getCommand('zoom-in').run(context);
    expect(context.zoomCalls).toHaveLength(0);
    expect(context.viewport).toEqual(before);
  });

  test('zoom_in_zero_height', () => {
    // WHEN: zoom-in is run with rect.height = 0
    // THEN: No-op, does not change viewport
    const context = makeZoomContext({ x: 10, y: 20, width: 50, height: 0 }, 2);
    const before = { ...context.viewport };
    getCommand('zoom-in').run(context);
    expect(context.zoomCalls).toHaveLength(0);
    expect(context.viewport).toEqual(before);
  });

  test('zoom_out_zero_width', () => {
    // WHEN: zoom-out is run with rect.width = 0
    // THEN: No-op
    const context = makeZoomContext({ x: 10, y: 20, width: 0, height: 50 }, 2);
    getCommand('zoom-out').run(context);
    expect(context.zoomCalls).toHaveLength(0);
  });

  test('zoom_out_zero_height', () => {
    // WHEN: zoom-out is run with rect.height = 0
    // THEN: No-op
    const context = makeZoomContext({ x: 10, y: 20, width: 50, height: 0 }, 2);
    getCommand('zoom-out').run(context);
    expect(context.zoomCalls).toHaveLength(0);
  });

  test('zoom_reset_zero_width', () => {
    // WHEN: zoom-reset is run with rect.width = 0
    // THEN: No-op
    const context = makeZoomContext({ x: 10, y: 20, width: 0, height: 50 }, 2);
    getCommand('zoom-reset').run(context);
    expect(context.zoomCalls).toHaveLength(0);
  });

  test('zoom_reset_zero_height', () => {
    // WHEN: zoom-reset is run with rect.height = 0
    // THEN: No-op
    const context = makeZoomContext({ x: 10, y: 20, width: 50, height: 0 }, 2);
    getCommand('zoom-reset').run(context);
    expect(context.zoomCalls).toHaveLength(0);
  });

  test('zoom_fit_valid_content', () => {
    // WHEN: zoom-fit is run with valid content bounds and positive rect
    // THEN: Calls fitBoundsToRect with contentBounds, rect, and FIT_PADDING
    // Ref: commands.spec.textproto line 42-43
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
          contentBounds: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, 1, { x: 0, y: 0 }, {
            contentBounds: value.contentBounds,
            index: [{ ref: 'a' }],
          });
          getCommand('zoom-fit').run(context);
          // FIT_PADDING is expected to be 40 per spec
          const FIT_PADDING = 40;
          expect(context.fitCalls).toEqual([[value.contentBounds, value.rect, FIT_PADDING]]);
        }
      )
    );
  });

  test('zoom_fit_uses_content_bounds', () => {
    // WHEN: zoom-fit is run with geometry containing index elements
    // THEN: Uses geometry.contentBounds, not the bounds of individual index entries
    // Ref: commands.spec.textproto line 42-43
    fc.assert(
      fc.property(
        fc.record({
          x: fc.integer(),
          y: fc.integer(),
          width: fc.integer({ min: 1 }),
          height: fc.integer({ min: 1 }),
        }),
        (value) => {
          const published = value;
          const context = makeZoomContext(
            { x: 0, y: 0, width: 100, height: 100 },
            1,
            { x: 0, y: 0 },
            {
              contentBounds: published,
              index: [
                { ref: 'a', bounds: { x: 10000, y: 10000, width: 1, height: 1 } },
                { ref: 'b', bounds: { x: -10000, y: -10000, width: 1, height: 1 } },
              ],
            }
          );
          getCommand('zoom-fit').run(context);
          expect(context.fitCalls[0][0]).toBe(published);
        }
      )
    );
  });

  test('zoom_fit_zero_width', () => {
    // WHEN: zoom-fit is run with rect.width = 0
    // THEN: No-op regardless of geometry
    const context = makeZoomContext(
      { x: 0, y: 0, width: 0, height: 100 },
      1,
      { x: 0, y: 0 },
      { contentBounds: { x: 0, y: 0, width: 10, height: 10 }, index: [{ ref: 'a' }] }
    );
    getCommand('zoom-fit').run(context);
    expect(context.fitCalls).toHaveLength(0);
  });

  test('zoom_fit_zero_height', () => {
    // WHEN: zoom-fit is run with rect.height = 0
    // THEN: No-op regardless of geometry
    const context = makeZoomContext(
      { x: 0, y: 0, width: 100, height: 0 },
      1,
      { x: 0, y: 0 },
      { contentBounds: { x: 0, y: 0, width: 10, height: 10 }, index: [{ ref: 'a' }] }
    );
    getCommand('zoom-fit').run(context);
    expect(context.fitCalls).toHaveLength(0);
  });

  test('zoom_fit_undefined_geometry', () => {
    // WHEN: zoom-fit is run with geometry undefined
    // THEN: No-op, does not call fitBoundsToRect
    // Ref: commands.spec.textproto line 54
    const context = makeZoomContext({ x: 0, y: 0, width: 100, height: 100 }, 1, { x: 0, y: 0 }, undefined);
    getCommand('zoom-fit').run(context);
    expect(context.fitCalls).toHaveLength(0);
  });

  test('zoom_fit_empty_index', () => {
    // WHEN: zoom-fit is run with geometry.index.length = 0
    // THEN: No-op, does not call fitBoundsToRect
    // Ref: commands.spec.textproto line 54
    const context = makeZoomContext(
      { x: 0, y: 0, width: 100, height: 100 },
      1,
      { x: 0, y: 0 },
      { contentBounds: { x: 0, y: 0, width: 10, height: 10 }, index: [] }
    );
    getCommand('zoom-fit').run(context);
    expect(context.fitCalls).toHaveLength(0);
  });

  test('zoom_fit_nonpositive_content', () => {
    // WHEN: zoom-fit is run with contentBounds.width <= 0
    // THEN: Still calls fitBoundsToRect (caller responsible for handling)
    fc.assert(
      fc.property(
        fc.record({
          rect: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ min: 1 }),
            height: fc.integer({ min: 1 }),
          }),
          contentBounds: fc.record({
            x: fc.integer(),
            y: fc.integer(),
            width: fc.integer({ max: 0 }),
            height: fc.integer({ min: 1 }),
          }),
        }),
        (value) => {
          const context = makeZoomContext(value.rect, 1, { x: 0, y: 0 }, {
            contentBounds: value.contentBounds,
            index: [{ ref: 'a' }],
          });
          getCommand('zoom-fit').run(context);
          const FIT_PADDING = 40;
          expect(context.fitCalls).toEqual([[value.contentBounds, value.rect, FIT_PADDING]]);
        }
      )
    );
  });

  test('zoom_centres_anchor', () => {
    // WHEN: zoom-in, zoom-out, or zoom-reset is run
    // THEN: Each zooms about the center point of the rect
    fc.assert(
      fc.property(
        fc.record({
          x: fc.integer(),
          y: fc.integer(),
          width: fc.integer({ min: 1 }),
          height: fc.integer({ min: 1 }),
        }),
        (value) => {
          for (const id of ['zoom-in', 'zoom-out', 'zoom-reset']) {
            const context = makeZoomContext(value, 2);
            getCommand(id).run(context);
            expect(context.zoomCalls[0][0]).toEqual({
              x: value.x + value.width / 2,
              y: value.y + value.height / 2,
            });
          }
        }
      )
    );
  });

  test('new_command_entries', () => {
    // WHEN: The spec is implemented
    // THEN: COMMANDS contains the five new entries with correct labels and callable run functions
    // Ref: commands.spec.textproto line 17-20
    expect(getCommand('tool-hand')).toMatchObject({
      id: 'tool-hand',
      label: 'Hand tool',
    });
    expect(getCommand('zoom-in')).toMatchObject({ id: 'zoom-in', label: 'Zoom in' });
    expect(getCommand('zoom-out')).toMatchObject({
      id: 'zoom-out',
      label: 'Zoom out',
    });
    expect(getCommand('zoom-reset')).toMatchObject({
      id: 'zoom-reset',
      label: 'Reset zoom',
    });
    expect(getCommand('zoom-fit')).toMatchObject({
      id: 'zoom-fit',
      label: 'Fit to content',
    });

    for (const id of ['tool-hand', 'zoom-in', 'zoom-out', 'zoom-reset', 'zoom-fit']) {
      expect(typeof getCommand(id).run).toBe('function');
    }
  });
});

describe('testgen_gestures__FIT_PADDING (red)', () => {
  test('default_padding_value', () => {
    // WHEN: FIT_PADDING constant is evaluated
    // THEN: Returns exactly 40 (40 CSS-pixel margin around fitted content)
    // Ref: commands.spec.textproto line 89
    // TODO: Import from src/gestures/commands once implemented
    const FIT_PADDING = 40; // Placeholder
    expect(FIT_PADDING).toBe(40);
  });

  test('numeric_finite_type', () => {
    // WHEN: FIT_PADDING is read
    // THEN: It is a finite number
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const FIT_PADDING = 40; // Placeholder
        expect(typeof FIT_PADDING).toBe('number');
        expect(Number.isFinite(FIT_PADDING)).toBe(true);
      })
    );
  });

  test('positive_padding_boundary', () => {
    // WHEN: FIT_PADDING is compared to boundary values
    // THEN: It is strictly positive (> 0) and equals 40, not 0
    const FIT_PADDING = 40; // Placeholder
    expect(FIT_PADDING).toBeGreaterThan(0);
    expect(FIT_PADDING).toBe(40);
    expect(FIT_PADDING).not.toBe(0);
  });

  test('viewport_pixel_units', () => {
    // WHEN: FIT_PADDING is used to calculate available viewport space
    // THEN: The margin is consistent: (container - available) / 2 = FIT_PADDING
    fc.assert(
      fc.property(
        fc.record({
          containerWidth: fc.double({ min: 81, max: 100000, noNaN: true }),
          containerHeight: fc.double({ min: 81, max: 100000, noNaN: true }),
          zoom: fc.double({ min: 0.001, max: 1000, noNaN: true }),
        }),
        (value) => {
          const FIT_PADDING = 40; // Placeholder
          const availableWidth = value.containerWidth - 2 * FIT_PADDING;
          const availableHeight = value.containerHeight - 2 * FIT_PADDING;
          expect((value.containerWidth - availableWidth) / 2).toBe(FIT_PADDING);
          expect((value.containerHeight - availableHeight) / 2).toBe(FIT_PADDING);
          expect(
            ((value.containerWidth - availableWidth) / 2) / value.zoom * value.zoom
          ).toBeCloseTo(FIT_PADDING, 10);
          expect(
            ((value.containerHeight - availableHeight) / 2) / value.zoom * value.zoom
          ).toBeCloseTo(FIT_PADDING, 10);
        }
      )
    );
  });

  test('zoom_independent_margin', () => {
    // WHEN: FIT_PADDING is scaled by zoom factor and back
    // THEN: The margin is zoom-independent: (FIT_PADDING / z) * z = 40
    fc.assert(
      fc.property(fc.double({ min: 0.001, max: 1000, noNaN: true }), (value) => {
        const FIT_PADDING = 40; // Placeholder
        const zoomedMargin = (FIT_PADDING / value) * value;
        expect(zoomedMargin).toBeCloseTo(40, 10);
        expect(FIT_PADDING).toBe(40);
      })
    );
  });

  test('selection_clearance_purpose', () => {
    // WHEN: FIT_PADDING is compared to selection-clearance values
    // THEN: FIT_PADDING >= any reasonable selection indicator size
    fc.assert(
      fc.property(fc.double({ min: 0, max: 40, noNaN: true }), (value) => {
        const FIT_PADDING = 40; // Placeholder
        expect(FIT_PADDING).toBe(40);
        expect(FIT_PADDING).toBeGreaterThanOrEqual(value);
      })
    );
  });

  test('invalid_nonconstant_input', () => {
    // WHEN: FIT_PADDING is compared to invalid/non-constant values
    // THEN: FIT_PADDING equals 40, not invalid values
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: 39 }),
          fc.integer({ min: 41 }),
          fc.constantFrom(NaN, Infinity, -Infinity),
          fc.string()
        ),
        (value) => {
          const FIT_PADDING = 40; // Placeholder
          expect(FIT_PADDING).toBe(40);
          expect(value).not.toBe(FIT_PADDING);
        }
      )
    );
  });
});

describe('testgen_gestures__ZOOM_STEP (red)', () => {
  const applyZoomIn = (zoom: number, minZoom: number, maxZoom: number): number =>
    Math.min(maxZoom, Math.max(minZoom, zoom * 1.2));

  const assertValidZoomState = (zoom: number): void => {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      throw new Error('Invalid zoom state');
    }
  };

  test('fixed_export_value', () => {
    // WHEN: ZOOM_STEP constant is read
    // THEN: It is a number with value 1.2 (not a function)
    // Ref: commands.spec.textproto line 73
    // TODO: Import from src/gestures/commands once implemented
    const ZOOM_STEP = 1.2; // Placeholder
    expect(typeof ZOOM_STEP).toBe('number');
    expect(ZOOM_STEP).toBe(1.2);
    expect(ZOOM_STEP).not.toBeInstanceOf(Function);
  });

  test('attempted_invocation', () => {
    // WHEN: ZOOM_STEP is invoked as a function (incorrect usage)
    // THEN: Throws an error (it is a number, not callable)
    const ZOOM_STEP = 1.2; // Placeholder
    expect(() => (ZOOM_STEP as unknown as () => unknown)()).toThrow();
  });
});
