// SPDX-License-Identifier: MPL-2.0

import { describe, it, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  EdgeStyleEntry,
  EdgeStyleEntrySchema,
  Glyph1D,
  Glyph1DSchema,
  Stroke,
  StrokeSchema,
  Color,
  ColorSchema,
  StyleEdit,
  StyleEditState,
  StrokePattern,
  Arrowheads,
  ArrowheadsSchema,
  ArrowheadVariant,
  AnnotationEntry,
  AnnotationEntrySchema,
  Stylesheet,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { commitLine } from './line_commit';
import type { InspectorModel } from '../model';

describe('commitLine', () => {
  describe('edge strokeColor', () => {
    it('returns undefined when model kind is not edge or annotation', () => {
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const stylesheet = create(StylesheetSchema, { nodes: {}, edges: {}, groups: {}, annotations: {} });

      const result = commitLine(model, stylesheet, 'strokeColor', '#FF0000');

      expect(result).toBeUndefined();
    });

    it('writes strokeColor to connection.stroke.paint.color for an edge', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: {
          e1: create(EdgeStyleEntrySchema, {
            connection: create(Glyph1DSchema, {
              stroke: create(StrokeSchema, {}),
            }),
          }),
        },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'strokeColor', '#FF0000');

      expect(result).toBeDefined();
      expect(result?.edgeChanges).toHaveLength(1);
      expect(result!.edgeChanges[0].edgeId).toBe('e1');
      expect(result!.edgeChanges[0].after?.connection?.stroke?.paint.case).toBe('color');
      expect((result!.edgeChanges[0].after?.connection?.stroke?.paint.value as { value?: string } | undefined)?.value).toBe('#FF0000');
    });

    it('returns undefined when strokeColor value is not a string', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: { e1: create(EdgeStyleEntrySchema, {}) },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'strokeColor', 123);

      expect(result).toBeUndefined();
    });
  });

  describe('edge strokeWidth', () => {
    it('writes strokeWidth to connection.stroke.width for an edge', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: {
          e1: create(EdgeStyleEntrySchema, {
            connection: create(Glyph1DSchema, {
              stroke: create(StrokeSchema, {}),
            }),
          }),
        },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'strokeWidth', 2.5);

      expect(result).toBeDefined();
      expect(result?.edgeChanges[0].after?.connection?.stroke?.width).toBe(2.5);
    });

    it('returns undefined when strokeWidth value is not a number', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: { e1: create(EdgeStyleEntrySchema, {}) },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'strokeWidth', 'invalid');

      expect(result).toBeUndefined();
    });
  });

  describe('edge pattern', () => {
    it('writes pattern to connection.stroke.dashing.pattern for an edge', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: {
          e1: create(EdgeStyleEntrySchema, {
            connection: create(Glyph1DSchema, {
              stroke: create(StrokeSchema, {}),
            }),
          }),
        },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'pattern', 'dashed');

      expect(result).toBeDefined();
      expect(result?.edgeChanges[0].after?.connection?.stroke?.dashing.case).toBe('pattern');
      expect(result?.edgeChanges[0].after?.connection?.stroke?.dashing.value).toBe(StrokePattern.DASHED);
    });

    it('returns undefined for unrecognized pattern name', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: { e1: create(EdgeStyleEntrySchema, {}) },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'pattern', 'unrecognized');

      expect(result).toBeUndefined();
    });
  });

  describe('edge arrowheads', () => {
    it('writes arrowStart and rebuilds arrowheads', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: {
          e1: create(EdgeStyleEntrySchema, {
            connection: create(Glyph1DSchema, {
              arrowheads: create(ArrowheadsSchema, {
                start: ArrowheadVariant.ARROWHEAD_NONE,
                end: ArrowheadVariant.ARROWHEAD_FILLED,
                size: 12,
              }),
            }),
          }),
        },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'arrowStart', 'open');

      expect(result).toBeDefined();
      const arrowheads = result?.edgeChanges[0].after?.connection?.arrowheads;
      expect(arrowheads?.start).toBe(ArrowheadVariant.ARROWHEAD_OPEN);
      expect(arrowheads?.end).toBe(ArrowheadVariant.ARROWHEAD_FILLED);
      expect(arrowheads?.size).toBe(12);
    });

    it('returns undefined for unrecognized arrowhead name', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: { e1: create(EdgeStyleEntrySchema, {}) },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'arrowStart', 'invalid');

      expect(result).toBeUndefined();
    });
  });

  describe('multi-select', () => {
    it('writes to all selected edges', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1', 'e2'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: {
          e1: create(EdgeStyleEntrySchema, {
            connection: create(Glyph1DSchema, { stroke: create(StrokeSchema, {}) }),
          }),
          e2: create(EdgeStyleEntrySchema, {
            connection: create(Glyph1DSchema, { stroke: create(StrokeSchema, {}) }),
          }),
        },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'strokeColor', '#00FF00');

      expect(result?.edgeChanges).toHaveLength(2);
      expect(result!.edgeChanges.map((c) => c.edgeId)).toEqual(['e1', 'e2']);
    });
  });

  describe('annotation callout', () => {
    it('creates callout when none exists and writes strokeColor', () => {
      const model: InspectorModel = { kind: 'annotation', ids: ['a1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        annotations: {
          a1: create(AnnotationEntrySchema, { content: [] }),
        },
        nodes: {},
        edges: {},
        groups: {},
      });

      const result = commitLine(model, stylesheet, 'strokeColor', '#0000FF');

      expect(result).toBeDefined();
      expect(result?.annotationChanges).toHaveLength(1);
      expect(result!.annotationChanges[0].annotationId).toBe('a1');
      expect(result!.annotationChanges[0].after?.callout?.stroke?.paint.case).toBe('color');
    });

    it('returns undefined when annotation not found in stylesheet', () => {
      const model: InspectorModel = { kind: 'annotation', ids: ['a1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        annotations: {},
        nodes: {},
        edges: {},
        groups: {},
      });

      const result = commitLine(model, stylesheet, 'strokeColor', '#0000FF');

      expect(result).toBeUndefined();
    });
  });

  describe('undefined value', () => {
    it('returns undefined when value is undefined', () => {
      const model: InspectorModel = { kind: 'edge', ids: ['e1'], sections: [] };
      const stylesheet = create(StylesheetSchema, {
        edges: { e1: create(EdgeStyleEntrySchema, {}) },
        nodes: {},
        groups: {},
        annotations: {},
      });

      const result = commitLine(model, stylesheet, 'strokeColor', undefined);

      expect(result).toBeUndefined();
    });
  });
});
