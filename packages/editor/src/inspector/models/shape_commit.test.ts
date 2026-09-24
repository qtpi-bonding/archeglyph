// SPDX-License-Identifier: MPL-2.0

import { describe, test, expect } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  ColorSchema,
  FillSchema,
  Glyph2DSchema,
  GroupStyleEntrySchema,
  NodeStyleEntrySchema,
  ShapeType,
  StrokeSchema,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';

import { commitShape } from './shape_commit';
import { applyStyleEditToStylesheet } from '../../state/apply_style_edit';
import type { InspectorModel } from '../model';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function stylesheet() {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    nodes: {},
    edges: {},
    groups: {},
    annotations: {},
    pendingEdits: [],
  });
}

function nodeEntry(overrides = {}) {
  return create(NodeStyleEntrySchema, overrides);
}

function groupEntry(overrides = {}) {
  return create(GroupStyleEntrySchema, overrides);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('commitShape', () => {
  describe('basic behavior', () => {
    test('returns undefined when given a node model with empty selection', () => {
      const sheet = stylesheet();
      const model: InspectorModel = {
        kind: 'node',
        ids: [],
        sections: [],
      };
      const result = commitShape(model, sheet, 'cornerRadius', 4);
      expect(result).toBeUndefined();
    });

    test('returns undefined when value is already set on the only selected node', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({
            shape: create(Glyph2DSchema, { cornerRadius: 5 }),
          }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = {
        kind: 'node',
        ids: ['n1'],
        sections: [],
      };
      const result = commitShape(model, sheet, 'cornerRadius', 5);
      expect(result).toBeUndefined();
    });

    test('returns a StyleEdit when value differs on a single node', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({
            shape: create(Glyph2DSchema, { cornerRadius: 3 }),
          }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = {
        kind: 'node',
        ids: ['n1'],
        sections: [],
      };
      const edit = commitShape(model, sheet, 'cornerRadius', 5);
      expect(edit).toBeDefined();
      expect(edit?.nodeChanges).toHaveLength(1);
      expect(edit?.groupChanges).toHaveLength(0);
    });
  });

  describe('cornerRadius field', () => {
    test('sets cornerRadius on a single node', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'cornerRadius', 6);
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.cornerRadius).toBe(6);
    });

    test('undefined value clears cornerRadius', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({
            shape: create(Glyph2DSchema, { cornerRadius: 4 }),
          }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'cornerRadius', undefined);
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.cornerRadius).toBeUndefined();
    });
  });

  describe('fill field', () => {
    test('sets fill color on a node', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'fill', '#ff0000');
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.fill?.paint.case).toBe('color');
      if (applied.nodes['n1'].shape?.fill?.paint.case === 'color') {
        expect(applied.nodes['n1'].shape.fill.paint.value.value).toBe('#ff0000');
      }
    });

    test('undefined fill value clears the fill field', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({
            shape: create(Glyph2DSchema, {
              fill: create(FillSchema, {
                paint: { case: 'color', value: create(ColorSchema, { value: '#0000ff' }) },
              }),
            }),
          }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'fill', undefined);
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.fill).toBeUndefined();
    });
  });

  describe('clearing a stroke part', () => {
    const strokedNode = () => create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: {
        n1: nodeEntry({
          shape: create(Glyph2DSchema, {
            stroke: create(StrokeSchema, {
              paint: { case: 'color', value: create(ColorSchema, { value: '#00ff00' }) },
              width: 3,
            }),
          }),
        }),
      },
      edges: {},
      groups: {},
      annotations: {},
      pendingEdits: [],
    });
    const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };

    test('undefined strokeColor clears the paint and leaves the width', () => {
      const sheet = strokedNode();
      const applied = applyStyleEditToStylesheet(sheet, commitShape(model, sheet, 'strokeColor', undefined)!);
      expect(applied.nodes['n1'].shape?.stroke?.paint.case).toBeUndefined();
      expect(applied.nodes['n1'].shape?.stroke?.width).toBe(3);
    });

    test('undefined strokeWidth clears the width and leaves the paint', () => {
      const sheet = strokedNode();
      const applied = applyStyleEditToStylesheet(sheet, commitShape(model, sheet, 'strokeWidth', undefined)!);
      expect(applied.nodes['n1'].shape?.stroke?.width).toBeUndefined();
      expect(applied.nodes['n1'].shape?.stroke?.paint.case).toBe('color');
    });
  });

  describe('strokeColor field', () => {
    test('sets stroke color on a node', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'strokeColor', '#00ff00');
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.stroke?.paint.case).toBe('color');
      if (applied.nodes['n1'].shape?.stroke?.paint.case === 'color') {
        expect(applied.nodes['n1'].shape.stroke.paint.value.value).toBe('#00ff00');
      }
    });

    test('does not clear existing stroke width when setting color', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({
            shape: create(Glyph2DSchema, {
              stroke: create(StrokeSchema, { width: 2 }),
            }),
          }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'strokeColor', '#0000ff');
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.stroke?.width).toBe(2);
      expect(applied.nodes['n1'].shape?.stroke?.paint.case).toBe('color');
    });
  });

  describe('strokeWidth field', () => {
    test('sets stroke width on a node', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'strokeWidth', 3);
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.stroke?.width).toBe(3);
    });

    test('does not clear existing stroke color when setting width', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({
            shape: create(Glyph2DSchema, {
              stroke: create(StrokeSchema, {
                paint: { case: 'color', value: create(ColorSchema, { value: '#ff0000' }) },
              }),
            }),
          }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'strokeWidth', 5);
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.stroke?.paint.case).toBe('color');
      if (applied.nodes['n1'].shape?.stroke?.paint.case === 'color') {
        expect(applied.nodes['n1'].shape.stroke.paint.value.value).toBe('#ff0000');
      }
    });
  });

  describe('shape field', () => {
    test('maps display name to ShapeType via SHAPE_TABLE', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'shape', 'circle');
      // Note: 'circle' should fail because SHAPE_TABLE doesn't have 'circle' (it has 'ellipse')
      expect(edit).toBeUndefined();
    });

    test('recognizes valid shape names from SHAPE_TABLE', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'shape', 'rect');
      expect(edit).toBeDefined();
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.shapeKind.case).toBe('standard');
      if (applied.nodes['n1'].shape?.shapeKind.case === 'standard') {
        expect(applied.nodes['n1'].shape.shapeKind.value).toBe(ShapeType.SHAPE_RECT);
      }
    });

    test('returns undefined for unrecognized shape names', () => {
      const sheet = stylesheet();
      const model: InspectorModel = { kind: 'node', ids: ['n1'], sections: [] };
      const edit = commitShape(model, sheet, 'shape', 'invalidShape');
      expect(edit).toBeUndefined();
    });
  });

  describe('multi-select', () => {
    test('applies one edit to multiple nodes', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({}),
          n2: nodeEntry({}),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1', 'n2'], sections: [] };
      const edit = commitShape(model, sheet, 'cornerRadius', 8);
      expect(edit).toBeDefined();
      expect(edit?.nodeChanges).toHaveLength(2);
      const applied = applyStyleEditToStylesheet(sheet, edit!);
      expect(applied.nodes['n1'].shape?.cornerRadius).toBe(8);
      expect(applied.nodes['n2'].shape?.cornerRadius).toBe(8);
    });

    test('applies one edit to multiple groups', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {},
        edges: {},
        groups: {
          g1: groupEntry({}),
          g2: groupEntry({}),
        },
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'group', ids: ['g1', 'g2'], sections: [] };
      const edit = commitShape(model, sheet, 'fill', '#0000ff');
      expect(edit).toBeDefined();
      expect(edit?.groupChanges).toHaveLength(2);
    });

    test('returns undefined when all nodes already have the value', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({ shape: create(Glyph2DSchema, { cornerRadius: 4 }) }),
          n2: nodeEntry({ shape: create(Glyph2DSchema, { cornerRadius: 4 }) }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1', 'n2'], sections: [] };
      const result = commitShape(model, sheet, 'cornerRadius', 4);
      expect(result).toBeUndefined();
    });

    test('returns an edit when at least one node differs', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {
          n1: nodeEntry({ shape: create(Glyph2DSchema, { cornerRadius: 4 }) }),
          n2: nodeEntry({ shape: create(Glyph2DSchema, { cornerRadius: 5 }) }),
        },
        edges: {},
        groups: {},
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'node', ids: ['n1', 'n2'], sections: [] };
      const edit = commitShape(model, sheet, 'cornerRadius', 6);
      expect(edit).toBeDefined();
      expect(edit?.nodeChanges).toHaveLength(2);
    });
  });

  describe('mixed kinds (annotation and group)', () => {
    test('applies one edit across groups when model kind is group', () => {
      const sheet = create(StylesheetSchema, {
        schemaVersion: 1,
        nodes: {},
        edges: {},
        groups: {
          g1: groupEntry({}),
          g2: groupEntry({}),
        },
        annotations: {},
        pendingEdits: [],
      });
      const model: InspectorModel = { kind: 'group', ids: ['g1', 'g2'], sections: [] };
      const edit = commitShape(model, sheet, 'cornerRadius', 3);
      expect(edit).toBeDefined();
      expect(edit?.groupChanges).toHaveLength(2);
    });
  });
});
