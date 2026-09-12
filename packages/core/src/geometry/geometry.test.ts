// SPDX-License-Identifier: AGPL-3.0-or-later

// Tests for the geometry primitives: vec2, bounds, polyline, direction.
// Everything downstream (node sizing, editor scene bounds) depends on
// these being right, so this leans on algebraic properties (union is
// commutative/associative/idempotent, translation invariance, etc.) in
// addition to worked examples, per the specs in
// .archegraph/specs/geometry/*.spec.textproto.
//
// Expectations are derived from the spec `doc:` fields, not from reading
// the implementation bodies.

import { describe, expect, test } from 'bun:test';
import {
  add,
  angle,
  distance,
  dot,
  length,
  normalize,
  scale,
  sub,
  type Vec2,
} from './vec2';
import {
  boundsCentre,
  boundsContains,
  boundsFromRect,
  boundsIntersects,
  boundsProjectToEdge,
  boundsUnion,
  type Bounds,
} from './bounds';
import { distanceToPolyline, distanceToSegment } from './polyline';
import { angleBetween, isWithinCone } from './direction';

const EPS = 1e-9;

function expectVec2Close(actual: Vec2, expected: Vec2, eps = EPS) {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
}

// ---------------------------------------------------------------------------
// vec2
// ---------------------------------------------------------------------------

describe('vec2.add', () => {
  test('component-wise sum', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });

  test('zero vector is identity', () => {
    const v = { x: 5, y: -3.5 };
    expect(add(v, { x: 0, y: 0 })).toEqual(v);
  });

  test('commutative', () => {
    const a = { x: 1.5, y: -2 };
    const b = { x: -4, y: 7 };
    expect(add(a, b)).toEqual(add(b, a));
  });

  test('associative', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: -4 };
    const c = { x: -5, y: 6 };
    expectVec2Close(add(add(a, b), c), add(a, add(b, c)));
  });

  test('negative coordinates', () => {
    expect(add({ x: -1, y: -2 }, { x: -3, y: -4 })).toEqual({ x: -4, y: -6 });
  });
});

describe('vec2.sub', () => {
  test('a - b', () => {
    expect(sub({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });

  test('is the inverse of add: (a + b) - b === a', () => {
    const a = { x: 3.2, y: -1.1 };
    const b = { x: -4.4, y: 9.9 };
    expectVec2Close(sub(add(a, b), b), a);
  });

  test('a - a is the zero vector', () => {
    const a = { x: 12.5, y: -7 };
    expect(sub(a, a)).toEqual({ x: 0, y: 0 });
  });
});

describe('vec2.scale', () => {
  test('scaling by 1 is identity', () => {
    const v = { x: 3.3, y: -4.4 };
    expect(scale(v, 1)).toEqual(v);
  });

  test('scaling by 0 collapses to zero vector', () => {
    // -4 * 0 === -0 in IEEE 754, which is a float artifact, not a
    // meaningfully different geometric value, so compare numerically
    // (0 == -0) rather than with toEqual (which distinguishes them).
    const result = scale({ x: 3, y: -4 }, 0);
    expect(result.x).toBeCloseTo(0, 9);
    expect(result.y).toBeCloseTo(0, 9);
  });

  test('scaling by -1 negates both components', () => {
    expect(scale({ x: 3, y: -4 }, -1)).toEqual({ x: -3, y: 4 });
  });

  test('distributes over add: scale(a+b, s) === scale(a,s) + scale(b,s)', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 4 };
    const s = 2.5;
    expectVec2Close(scale(add(a, b), s), add(scale(a, s), scale(b, s)));
  });
});

describe('vec2.length', () => {
  test('3-4-5 triangle', () => {
    expect(length({ x: 3, y: 4 })).toBe(5);
  });

  test('zero vector has zero length', () => {
    expect(length({ x: 0, y: 0 })).toBe(0);
  });

  test('length is unaffected by sign (negative coordinates)', () => {
    expect(length({ x: -3, y: -4 })).toBe(5);
  });

  test('scaling by s scales length by |s|', () => {
    const v = { x: 3, y: 4 };
    expect(length(scale(v, -2))).toBeCloseTo(2 * length(v), 9);
  });
});

describe('vec2.distance', () => {
  test('matches length(sub(a, b))', () => {
    const a = { x: 10, y: 5 };
    const b = { x: 7, y: 1 };
    expect(distance(a, b)).toBeCloseTo(length(sub(a, b)), 9);
  });

  test('distance to self is zero', () => {
    const a = { x: -3, y: 8 };
    expect(distance(a, a)).toBe(0);
  });

  test('symmetric: distance(a,b) === distance(b,a)', () => {
    const a = { x: 1, y: 2 };
    const b = { x: -9, y: 4 };
    expect(distance(a, b)).toBeCloseTo(distance(b, a), 9);
  });

  test('coincident points (negative coordinates) have zero distance', () => {
    const a = { x: -5, y: -5 };
    expect(distance(a, { x: -5, y: -5 })).toBe(0);
  });
});

describe('vec2.normalize', () => {
  test('unit vector has length 1', () => {
    const n = normalize({ x: 3, y: 4 });
    expect(length(n)).toBeCloseTo(1, 9);
  });

  test('preserves direction (angle unchanged)', () => {
    const v = { x: 3, y: 4 };
    expect(angle(normalize(v))).toBeCloseTo(angle(v), 9);
  });

  test('zero-length input returns the zero vector (spec-mandated, not an error)', () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  test('already-unit vector is (approximately) unchanged', () => {
    const v = { x: 1, y: 0 };
    expectVec2Close(normalize(v), v);
  });
});

describe('vec2.dot', () => {
  test('worked example', () => {
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
  });

  test('commutative', () => {
    const a = { x: 5, y: -2 };
    const b = { x: -3, y: 7 };
    expect(dot(a, b)).toBe(dot(b, a));
  });

  test('perpendicular vectors have zero dot product', () => {
    expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
  });

  test('dot with self equals length squared', () => {
    const v = { x: 3, y: 4 };
    expect(dot(v, v)).toBeCloseTo(length(v) ** 2, 9);
  });

  test('zero vector dotted with anything is zero', () => {
    expect(dot({ x: 0, y: 0 }, { x: 99, y: -42 })).toBe(0);
  });
});

describe('vec2.angle', () => {
  test('positive x-axis is angle 0', () => {
    expect(angle({ x: 1, y: 0 })).toBeCloseTo(0, 9);
  });

  test('positive y-axis is +PI/2', () => {
    expect(angle({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2, 9);
  });

  test('negative x-axis is PI (upper bound of the documented range)', () => {
    expect(angle({ x: -1, y: 0 })).toBeCloseTo(Math.PI, 9);
  });

  test('negative y-axis is -PI/2', () => {
    expect(angle({ x: 0, y: -1 })).toBeCloseTo(-Math.PI / 2, 9);
  });

  test('range is (-PI, PI]: never returns -PI', () => {
    // atan2 semantics: exactly (-1, -epsilon) approaches -PI from above but
    // never reaches it exactly for a nonzero y. Sanity check the boundary.
    expect(angle({ x: -1, y: 0 })).not.toBeLessThan(-Math.PI);
  });
});

// ---------------------------------------------------------------------------
// bounds
// ---------------------------------------------------------------------------

describe('boundsFromRect', () => {
  test('normal positive size', () => {
    const b = boundsFromRect({ x: 10, y: 20 }, { x: 5, y: 8 });
    expect(b).toEqual({ minX: 10, minY: 20, maxX: 15, maxY: 28 });
  });

  test('zero size collapses to a point', () => {
    const b = boundsFromRect({ x: 3, y: 4 }, { x: 0, y: 0 });
    expect(b).toEqual({ minX: 3, minY: 4, maxX: 3, maxY: 4 });
  });

  test('negative width/height is normalized so minX<=maxX, minY<=maxY', () => {
    const b = boundsFromRect({ x: 10, y: 10 }, { x: -4, y: -6 });
    expect(b.minX).toBeLessThanOrEqual(b.maxX);
    expect(b.minY).toBeLessThanOrEqual(b.maxY);
    expect(b).toEqual({ minX: 6, minY: 4, maxX: 10, maxY: 10 });
  });

  test('negative position coordinates', () => {
    const b = boundsFromRect({ x: -10, y: -5 }, { x: 4, y: 2 });
    expect(b).toEqual({ minX: -10, minY: -5, maxX: -6, maxY: -3 });
  });
});

describe('boundsUnion', () => {
  const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  const b: Bounds = { minX: 5, minY: 5, maxX: 20, maxY: 8 };
  const c: Bounds = { minX: -5, minY: -5, maxX: 1, maxY: 1 };

  test('worked example: smallest box containing both', () => {
    expect(boundsUnion(a, b)).toEqual({ minX: 0, minY: 0, maxX: 20, maxY: 10 });
  });

  test('idempotent: union of a bounds with itself is itself', () => {
    expect(boundsUnion(a, a)).toEqual(a);
  });

  test('commutative', () => {
    expect(boundsUnion(a, b)).toEqual(boundsUnion(b, a));
  });

  test('associative', () => {
    expect(boundsUnion(boundsUnion(a, b), c)).toEqual(
      boundsUnion(a, boundsUnion(b, c)),
    );
  });

  test('a point inside a bounds stays inside after union with anything', () => {
    const p = { x: 3, y: 3 };
    expect(boundsContains(a, p)).toBe(true);
    const unioned = boundsUnion(a, { minX: 100, minY: 100, maxX: 200, maxY: 200 });
    expect(boundsContains(unioned, p)).toBe(true);
  });

  test('union with a zero-size bounds (a point) extends to include that point', () => {
    const point: Bounds = { minX: 50, minY: -3, maxX: 50, maxY: -3 };
    const u = boundsUnion(a, point);
    expect(u).toEqual({ minX: 0, minY: -3, maxX: 50, maxY: 10 });
  });
});

describe('boundsContains', () => {
  const b: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

  test('interior point', () => {
    expect(boundsContains(b, { x: 5, y: 5 })).toBe(true);
  });

  test('boundary is inclusive (min corner)', () => {
    expect(boundsContains(b, { x: 0, y: 0 })).toBe(true);
  });

  test('boundary is inclusive (max corner)', () => {
    expect(boundsContains(b, { x: 10, y: 10 })).toBe(true);
  });

  test('boundary is inclusive (edge midpoint)', () => {
    expect(boundsContains(b, { x: 5, y: 0 })).toBe(true);
  });

  test('outside point is excluded', () => {
    expect(boundsContains(b, { x: 11, y: 5 })).toBe(false);
    expect(boundsContains(b, { x: 5, y: -1 })).toBe(false);
  });

  test('a zero-size bounds (point) contains exactly that point', () => {
    const point: Bounds = { minX: 5, minY: 5, maxX: 5, maxY: 5 };
    expect(boundsContains(point, { x: 5, y: 5 })).toBe(true);
    expect(boundsContains(point, { x: 5.0001, y: 5 })).toBe(false);
  });

  test('centre of a bounds is always contained', () => {
    expect(boundsContains(b, boundsCentre(b))).toBe(true);
  });
});

describe('boundsIntersects', () => {
  test('overlapping boxes', () => {
    const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b: Bounds = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
    expect(boundsIntersects(a, b)).toBe(true);
  });

  test('touching edges count as intersecting', () => {
    const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b: Bounds = { minX: 10, minY: 0, maxX: 20, maxY: 10 };
    expect(boundsIntersects(a, b)).toBe(true);
  });

  test('touching corners count as intersecting', () => {
    const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b: Bounds = { minX: 10, minY: 10, maxX: 20, maxY: 20 };
    expect(boundsIntersects(a, b)).toBe(true);
  });

  test('disjoint boxes do not intersect', () => {
    const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b: Bounds = { minX: 20, minY: 20, maxX: 30, maxY: 30 };
    expect(boundsIntersects(a, b)).toBe(false);
  });

  test('commutative', () => {
    const a: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b: Bounds = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
    expect(boundsIntersects(a, b)).toBe(boundsIntersects(b, a));
  });

  test('a bounds always intersects itself', () => {
    const a: Bounds = { minX: -3, minY: -3, maxX: 4, maxY: 4 };
    expect(boundsIntersects(a, a)).toBe(true);
  });

  test('a zero-size bounds (point) intersects a box containing that point', () => {
    const box: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const point: Bounds = { minX: 5, minY: 5, maxX: 5, maxY: 5 };
    expect(boundsIntersects(box, point)).toBe(true);
  });
});

describe('boundsCentre', () => {
  test('worked example', () => {
    expect(boundsCentre({ minX: 0, minY: 0, maxX: 10, maxY: 20 })).toEqual({
      x: 5,
      y: 10,
    });
  });

  test('zero-size bounds centre is the point itself', () => {
    expect(boundsCentre({ minX: 3, minY: 4, maxX: 3, maxY: 4 })).toEqual({
      x: 3,
      y: 4,
    });
  });

  test('negative coordinates', () => {
    expect(boundsCentre({ minX: -10, minY: -20, maxX: 0, maxY: 0 })).toEqual({
      x: -5,
      y: -10,
    });
  });
});

describe('boundsProjectToEdge', () => {
  const b: Bounds = { minX: -10, minY: -10, maxX: 10, maxY: 10 };

  test('toward equals centre returns the centre itself (avoids divide by zero)', () => {
    const centre = boundsCentre(b);
    expect(boundsProjectToEdge(b, centre)).toEqual(centre);
  });

  test('projecting straight right lands on the right edge midpoint', () => {
    const p = boundsProjectToEdge(b, { x: 100, y: 0 });
    expectVec2Close(p, { x: 10, y: 0 });
  });

  test('projecting straight up lands on the top edge midpoint', () => {
    const p = boundsProjectToEdge(b, { x: 0, y: 100 });
    expectVec2Close(p, { x: 0, y: 10 });
  });

  test('projecting toward a diagonal corner direction lands on the boundary, not inside or outside', () => {
    const p = boundsProjectToEdge(b, { x: 100, y: 100 });
    // Square box + 45-degree direction from centre -> exact corner.
    expectVec2Close(p, { x: 10, y: 10 });
  });

  test('the returned point is always on the box boundary (touches min or max on some axis)', () => {
    const p = boundsProjectToEdge(b, { x: 3, y: 100 });
    const onVerticalEdge = p.x === b.minX || p.x === b.maxX;
    const onHorizontalEdge = p.y === b.minY || p.y === b.maxY;
    expect(onVerticalEdge || onHorizontalEdge).toBe(true);
  });

  test('zero-size bounds: any direction resolves to the single point', () => {
    const point: Bounds = { minX: 5, minY: 5, maxX: 5, maxY: 5 };
    const p = boundsProjectToEdge(point, { x: 100, y: 100 });
    expect(p).toEqual({ x: 5, y: 5 });
  });
});

// ---------------------------------------------------------------------------
// polyline
// ---------------------------------------------------------------------------

describe('distanceToSegment', () => {
  test('point directly above the segment midpoint', () => {
    const d = distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(3, 9);
  });

  test('point beyond segment end clamps to endpoint distance', () => {
    const d = distanceToSegment({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(5, 9);
  });

  test('point beyond segment start clamps to endpoint distance', () => {
    const d = distanceToSegment({ x: -5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(5, 9);
  });

  test('point on the segment has zero distance', () => {
    const d = distanceToSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(0, 9);
  });

  test('degenerate segment (a === b) returns distance(p, a)', () => {
    const p = { x: 3, y: 4 };
    const a = { x: 0, y: 0 };
    const d = distanceToSegment(p, a, a);
    expect(d).toBeCloseTo(distance(p, a), 9);
  });

  test('degenerate segment at the query point itself is zero', () => {
    const p = { x: 7, y: -2 };
    expect(distanceToSegment(p, p, p)).toBeCloseTo(0, 9);
  });

  test('symmetric under swapping segment endpoints', () => {
    const p = { x: 5, y: 3 };
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    expect(distanceToSegment(p, a, b)).toBeCloseTo(distanceToSegment(p, b, a), 9);
  });

  test('invariant under translation', () => {
    const p = { x: 5, y: 3 };
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const t = { x: -50, y: 200 };
    const d1 = distanceToSegment(p, a, b);
    const d2 = distanceToSegment(add(p, t), add(a, t), add(b, t));
    expect(d2).toBeCloseTo(d1, 9);
  });
});

describe('distanceToPolyline', () => {
  test('empty polyline returns Infinity', () => {
    expect(distanceToPolyline({ x: 0, y: 0 }, [])).toBe(Infinity);
  });

  test('single-point polyline returns Infinity (nothing to hit-test against)', () => {
    expect(distanceToPolyline({ x: 0, y: 0 }, [{ x: 5, y: 5 }])).toBe(Infinity);
  });

  test('two-point polyline matches distanceToSegment', () => {
    const p = { x: 5, y: 3 };
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
    expect(distanceToPolyline(p, points)).toBeCloseTo(
      distanceToSegment(p, points[0], points[1]),
      9,
    );
  });

  test('is the minimum over every consecutive segment pair', () => {
    // Path: (0,0) -> (10,0) -> (10,10). Point near the second segment only.
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const p = { x: 12, y: 5 };
    const expected = Math.min(
      distanceToSegment(p, points[0], points[1]),
      distanceToSegment(p, points[1], points[2]),
    );
    expect(distanceToPolyline(p, points)).toBeCloseTo(expected, 9);
  });

  test('coincident consecutive points act as a degenerate segment, not a crash', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const d = distanceToPolyline({ x: 0, y: 5 }, points);
    expect(d).toBeCloseTo(5, 9);
  });

  test('length/distance is invariant under translation of the whole polyline and point', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const p = { x: 12, y: 5 };
    const t = { x: 1000, y: -1000 };
    const d1 = distanceToPolyline(p, points);
    const d2 = distanceToPolyline(
      add(p, t),
      points.map((pt) => add(pt, t)),
    );
    expect(d2).toBeCloseTo(d1, 9);
  });

  test('point exactly on a vertex has zero distance', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(distanceToPolyline({ x: 10, y: 0 }, points)).toBeCloseTo(0, 9);
  });
});

// ---------------------------------------------------------------------------
// direction
// ---------------------------------------------------------------------------

describe('angleBetween', () => {
  test('same direction is zero angle', () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(0, 9);
  });

  test('90 degree turn (a=east, b=north) is +PI/2', () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(
      Math.PI / 2,
      9,
    );
  });

  test('90 degree turn the other way is -PI/2', () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(
      -Math.PI / 2,
      9,
    );
  });

  test('opposite direction is PI (upper bound of documented range)', () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(
      Math.PI,
      9,
    );
  });

  test('antisymmetric: angleBetween(a,b) === -angleBetween(b,a) (mod wraparound at PI)', () => {
    const a = { x: 1, y: 0 };
    const b = { x: 0, y: 1 };
    expect(angleBetween(a, b)).toBeCloseTo(-angleBetween(b, a), 9);
  });

  test('result stays within (-PI, PI]', () => {
    const a = { x: -1, y: -0.001 };
    const b = { x: -1, y: 0.001 };
    const result = angleBetween(a, b);
    expect(result).toBeLessThanOrEqual(Math.PI);
    expect(result).toBeGreaterThan(-Math.PI);
  });
});

describe('isWithinCone', () => {
  const origin = { x: 0, y: 0 };
  const east = { x: 1, y: 0 };

  test('target exactly along direction is within any positive half-angle', () => {
    expect(isWithinCone(origin, east, { x: 10, y: 0 }, 0.1)).toBe(true);
  });

  test('target just inside the half-angle boundary is within', () => {
    const halfAngle = Math.PI / 4; // 45 degrees
    // 30 degrees off east.
    const target = { x: Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) };
    expect(isWithinCone(origin, east, target, halfAngle)).toBe(true);
  });

  test('target just outside the half-angle boundary is excluded', () => {
    const halfAngle = Math.PI / 4; // 45 degrees
    // 60 degrees off east.
    const target = { x: Math.cos(Math.PI / 3), y: Math.sin(Math.PI / 3) };
    expect(isWithinCone(origin, east, target, halfAngle)).toBe(false);
  });

  test('target directly opposite the direction is excluded from a narrow cone', () => {
    expect(isWithinCone(origin, east, { x: -10, y: 0 }, Math.PI / 4)).toBe(
      false,
    );
  });

  test('a full half-circle cone (halfAngleRad = PI) includes everything', () => {
    expect(isWithinCone(origin, east, { x: -10, y: 5 }, Math.PI)).toBe(true);
  });

  test('target coincident with origin: zero-length target direction', () => {
    // target - origin = (0,0); angleBetween(east, (0,0)) is well-defined via
    // atan2(0,0) = 0, so this should behave like "same direction as origin's
    // own reference angle" rather than throwing.
    expect(() => isWithinCone(origin, east, origin, 0.1)).not.toThrow();
  });

  test('a cardinal-direction north check works as documented (ring/hex navigation use case)', () => {
    const north = { x: 0, y: 1 };
    const candidate = { x: 1, y: 8 }; // mostly north, slightly east
    expect(isWithinCone(origin, north, candidate, Math.PI / 4)).toBe(true);
  });
});
