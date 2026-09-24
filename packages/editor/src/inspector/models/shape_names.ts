// SPDX-License-Identifier: MPL-2.0

import { ShapeType } from '@archeglyph/proto/gen/style_pb';

export const SHAPE_TABLE: ReadonlyArray<{ name: string; value: ShapeType }> = [
  { name: 'triangle', value: ShapeType.SHAPE_TRIANGLE },
  { name: 'rect', value: ShapeType.SHAPE_RECT },
  { name: 'pentagon', value: ShapeType.SHAPE_PENTAGON },
  { name: 'hexagon', value: ShapeType.SHAPE_HEXAGON },
  { name: 'heptagon', value: ShapeType.SHAPE_HEPTAGON },
  { name: 'octagon', value: ShapeType.SHAPE_OCTAGON },
  { name: 'nonagon', value: ShapeType.SHAPE_NONAGON },
  { name: 'decagon', value: ShapeType.SHAPE_DECAGON },
  { name: 'ellipse', value: ShapeType.SHAPE_ELLIPSE },
  { name: 'cylinder', value: ShapeType.SHAPE_CYLINDER },
];
