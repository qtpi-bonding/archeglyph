// SPDX-License-Identifier: MPL-2.0
//
// Spec (elements-and-containers, "Style"): a container whose effective mode is
// CLOSED is drawn as a BLOCK -- glyph from entry.shape, geometry from
// entry.layout (ElementLayout). An OPEN container is drawn as a BOX -- glyph
// from entry.box, geometry from entry.boxLayout. The two sizes are independent;
// rotation applies to the block only; padding and labelPosition to the box only.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import {
  BoxLayoutSchema,
  ColorSchema,
  ElementLayoutSchema,
  ElementStyleEntrySchema,
  FillSchema,
  Glyph2DSchema,
  GroupLabelPosition,
  GroupRenderMode,
  StylesheetSchema,
  Vec2Schema,
} from '@archeglyph/proto/gen/style_pb';
import { resolvePipeline } from '../pipeline';
import { type ResolvedGroup } from './resolved_group';

const RED = '#ff0000';
const BLUE = '#0000ff';

const glyph = (color: string) => create(Glyph2DSchema, {
  fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: color }) } }),
});
const vec = (x: number, y: number) => create(Vec2Schema, { x, y });

const diagram = create(DiagramSchema, {
  schemaVersion: 2,
  id: 'd',
  graph: {
    elements: {
      g: { label: [], tags: {} },
      c: { label: [], parent: 'g', tags: {} },
    },
    edges: {},
  },
});

interface Opts {
  mode: GroupRenderMode;
  layout?: { position?: [number, number]; size?: [number, number]; rotation?: number };
  boxLayout?: { position?: [number, number]; size?: [number, number]; padding?: number; labelPosition?: GroupLabelPosition };
}

function resolveG(o: Opts): ResolvedGroup {
  const entry = create(ElementStyleEntrySchema, {
    renderMode: o.mode,
    shape: glyph(RED),
    box: glyph(BLUE),
    layout: create(ElementLayoutSchema, {
      ...(o.layout?.position === undefined ? {} : { position: vec(...o.layout.position) }),
      ...(o.layout?.size === undefined ? {} : { size: vec(...o.layout.size) }),
      ...(o.layout?.rotation === undefined ? {} : { rotation: o.layout.rotation }),
    }),
    boxLayout: create(BoxLayoutSchema, {
      ...(o.boxLayout?.position === undefined ? {} : { position: vec(...o.boxLayout.position) }),
      ...(o.boxLayout?.size === undefined ? {} : { size: vec(...o.boxLayout.size) }),
      ...(o.boxLayout?.padding === undefined ? {} : { padding: o.boxLayout.padding }),
      ...(o.boxLayout?.labelPosition === undefined ? {} : { labelPosition: o.boxLayout.labelPosition }),
    }),
  });
  const sheet = create(StylesheetSchema, { schemaVersion: 2, elements: { g: entry } });
  const r = resolvePipeline(diagram, sheet, new Map());
  if (r.kind !== 'ok') {
    throw new Error(`resolve failed: ${r.error.detail}`);
  }
  const g = r.value.groups['g'];
  if (g === undefined) {
    throw new Error('g is not in resolved groups');
  }
  return g;
}

const fillOf = (g: ResolvedGroup): string | undefined => {
  const paint = g.shape.fill?.paint;
  return paint?.case === 'color' ? paint.value.value : undefined;
};
const sizeOf = (g: ResolvedGroup): [number | undefined, number | undefined] => [g.layout?.size?.x, g.layout?.size?.y];
const posOf = (g: ResolvedGroup): [number | undefined, number | undefined] => [g.layout?.position?.x, g.layout?.position?.y];

const SIZES = {
  layout: { size: [111, 77] as [number, number], position: [10, 20] as [number, number] },
  boxLayout: { size: [500, 400] as [number, number], position: [900, 800] as [number, number] },
};

describe('a CLOSED container is drawn as a block', () => {
  const g = resolveG({ mode: GroupRenderMode.CLOSED, ...SIZES });

  test('it is a super-node block', () => {
    expect(g.isSuperNode).toBe(true);
    expect(g.viewRole).toBe('block');
  });
  test('its glyph is entry.shape, not entry.box', () => {
    expect(fillOf(g)).toBe(RED);
  });
  test('its size comes from layout, not boxLayout', () => {
    expect(sizeOf(g)).toEqual([111, 77]);
  });
  test('its position comes from layout, not boxLayout', () => {
    expect(posOf(g)).toEqual([10, 20]);
  });
});

describe('an OPEN container is drawn as a box', () => {
  const g = resolveG({ mode: GroupRenderMode.OPEN, ...SIZES });

  test('it is a box', () => {
    expect(g.isSuperNode).toBe(false);
    expect(g.viewRole).toBe('box');
  });
  test('its glyph is entry.box, not entry.shape', () => {
    expect(fillOf(g)).toBe(BLUE);
  });
  test('its size and position come from boxLayout, not layout', () => {
    expect(sizeOf(g)).toEqual([500, 400]);
    expect(posOf(g)).toEqual([900, 800]);
  });
});

describe('the two sizes are independent', () => {
  test('resizing the box never changes the closed block size', () => {
    const before = resolveG({ mode: GroupRenderMode.CLOSED, ...SIZES });
    const after = resolveG({
      mode: GroupRenderMode.CLOSED,
      layout: SIZES.layout,
      boxLayout: { size: [1234, 999] },
    });
    expect(sizeOf(after)).toEqual(sizeOf(before));
    expect(sizeOf(after)).toEqual([111, 77]);
  });
  test('resizing the block never changes the open box size', () => {
    const after = resolveG({
      mode: GroupRenderMode.OPEN,
      layout: { size: [1, 2] },
      boxLayout: SIZES.boxLayout,
    });
    expect(sizeOf(after)).toEqual([500, 400]);
  });
  test('a closed container with only a boxLayout size has no block size', () => {
    const g = resolveG({ mode: GroupRenderMode.CLOSED, boxLayout: { size: [500, 400] } });
    expect(sizeOf(g)).toEqual([undefined, undefined]);
  });
});

describe('rotation, padding and label position belong to one form each', () => {
  // BoxLayout has no rotation field, so the block form carries the
  // ElementLayout rotation on the resolved group itself.
  const rotationOf = (g: ResolvedGroup): number | undefined => g.rotation;

  test('rotation applies to the closed block', () => {
    const g = resolveG({ mode: GroupRenderMode.CLOSED, layout: { size: [111, 77], rotation: 30 } });
    expect(rotationOf(g)).toBe(30);
  });
  test('rotation does not apply to the open box', () => {
    const g = resolveG({ mode: GroupRenderMode.OPEN, layout: { rotation: 30 }, boxLayout: { size: [500, 400] } });
    expect(rotationOf(g) ?? 0).toBe(0);
  });
  test('padding and labelPosition apply to the open box', () => {
    const g = resolveG({
      mode: GroupRenderMode.OPEN,
      boxLayout: { padding: 33, labelPosition: GroupLabelPosition.GROUP_LABEL_BOTTOM_LEFT },
    });
    expect(g.layout?.padding).toBe(33);
    expect(g.layout?.labelPosition).toBe(GroupLabelPosition.GROUP_LABEL_BOTTOM_LEFT);
  });
  test('padding and labelPosition do not apply to the closed block', () => {
    const g = resolveG({
      mode: GroupRenderMode.CLOSED,
      layout: { size: [111, 77] },
      boxLayout: { padding: 33, labelPosition: GroupLabelPosition.GROUP_LABEL_BOTTOM_LEFT },
    });
    expect(g.layout?.padding ?? 0).toBe(0);
    expect(g.layout?.labelPosition ?? 0).toBe(0);
  });
});
