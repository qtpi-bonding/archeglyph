// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { initOf } from '../../state/edits/entry_patch';
import {
  Arrowheads,
  ArrowheadsSchema,
  Color,
  ColorSchema,
  Glyph1D,
  Glyph1DSchema,
  Stroke,
  StrokeSchema,
} from '@archeglyph/proto/gen/style_pb';
import { ARROWHEAD_TABLE, PATTERN_TABLE } from './line_names';
import { annotationChange, edgeChange, styleEdit } from '../../state/edits/edit_builder';
import { patchAnnotationEntry, patchEdgeEntry } from '../../state/edits/entry_patch';
import type { InspectorModel } from '../model';
import type { Stylesheet, StyleEdit } from '@archeglyph/proto/gen/style_pb';

export function commitLine(
  model: InspectorModel,
  stylesheet: Stylesheet,
  field: 'strokeColor' | 'strokeWidth' | 'pattern' | 'arrowStart' | 'arrowEnd',
  value: string | number | undefined
): StyleEdit | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (model.kind === 'edge') {
    return commitLineForEdge(model, stylesheet, field, value);
  }

  if (model.kind === 'annotation') {
    return commitLineForAnnotation(model, stylesheet, field, value);
  }

  return undefined;
}

function commitLineForEdge(
  model: InspectorModel,
  stylesheet: Stylesheet,
  field: 'strokeColor' | 'strokeWidth' | 'pattern' | 'arrowStart' | 'arrowEnd',
  value: string | number
): StyleEdit | undefined {
  const edgeChanges = model.ids.map((edgeId) => {
    const existing = stylesheet.edges[edgeId];
    const existingConnection = existing?.connection;
    const existingStroke = existingConnection?.stroke;

    let newGlyph1D: Glyph1D | undefined;

    if (field === 'strokeColor') {
      if (typeof value !== 'string') {
        return undefined;
      }
      newGlyph1D = create(Glyph1DSchema, {
        ...initOf(existingConnection),
        stroke: create(StrokeSchema, {
          ...initOf(existingStroke),
          paint: { case: 'color', value: create(ColorSchema, { value }) },
        }),
      });
    } else if (field === 'strokeWidth') {
      if (typeof value !== 'number') {
        return undefined;
      }
      newGlyph1D = create(Glyph1DSchema, {
        ...initOf(existingConnection),
        stroke: create(StrokeSchema, {
          ...initOf(existingStroke),
          width: value,
        }),
      });
    } else if (field === 'pattern') {
      if (typeof value !== 'string') {
        return undefined;
      }
      const patternEntry = PATTERN_TABLE.find((entry) => entry.name === value);
      if (!patternEntry) {
        return undefined;
      }
      newGlyph1D = create(Glyph1DSchema, {
        ...initOf(existingConnection),
        stroke: create(StrokeSchema, {
          ...initOf(existingStroke),
          dashing: { case: 'pattern', value: patternEntry.value },
        }),
      });
    } else if (field === 'arrowStart' || field === 'arrowEnd') {
      if (typeof value !== 'string') {
        return undefined;
      }
      const arrowheadEntry = ARROWHEAD_TABLE.find((entry) => entry.name === value);
      if (!arrowheadEntry) {
        return undefined;
      }
      const existingArrowheads = existingConnection?.arrowheads;
      const newArrowheads = create(ArrowheadsSchema, {
        start:
          field === 'arrowStart'
            ? arrowheadEntry.value
            : existingArrowheads?.start,
        end:
          field === 'arrowEnd'
            ? arrowheadEntry.value
            : existingArrowheads?.end,
        size: existingArrowheads?.size,
      });
      newGlyph1D = create(Glyph1DSchema, {
        ...initOf(existingConnection),
        arrowheads: newArrowheads,
      });
    }

    if (newGlyph1D === undefined) {
      return undefined;
    }

    const newEntry = patchEdgeEntry(existing, { connection: newGlyph1D });
    return edgeChange(edgeId, newEntry);
  });

  if (edgeChanges.some((c) => c === undefined)) {
    return undefined;
  }

  return styleEdit({ edgeChanges: edgeChanges.filter((c) => c !== undefined) });
}

function commitLineForAnnotation(
  model: InspectorModel,
  stylesheet: Stylesheet,
  field: 'strokeColor' | 'strokeWidth' | 'pattern' | 'arrowStart' | 'arrowEnd',
  value: string | number
): StyleEdit | undefined {
  const annotationChanges = model.ids
    .map((annotationId) => {
      const existing = stylesheet.annotations[annotationId];
      if (existing === undefined) {
        return undefined;
      }

      const existingCallout = existing.callout;
      const existingStroke = existingCallout?.stroke;

      let newGlyph1D: Glyph1D | undefined;

      if (field === 'strokeColor') {
        if (typeof value !== 'string') {
          return undefined;
        }
        newGlyph1D = create(Glyph1DSchema, {
          ...existingCallout,
          stroke: create(StrokeSchema, {
            ...initOf(existingStroke),
            paint: { case: 'color', value: create(ColorSchema, { value }) },
          }),
        });
      } else if (field === 'strokeWidth') {
        if (typeof value !== 'number') {
          return undefined;
        }
        newGlyph1D = create(Glyph1DSchema, {
          ...existingCallout,
          stroke: create(StrokeSchema, {
            ...initOf(existingStroke),
            width: value,
          }),
        });
      } else if (field === 'pattern') {
        if (typeof value !== 'string') {
          return undefined;
        }
        const patternEntry = PATTERN_TABLE.find((entry) => entry.name === value);
        if (!patternEntry) {
          return undefined;
        }
        newGlyph1D = create(Glyph1DSchema, {
          ...existingCallout,
          stroke: create(StrokeSchema, {
            ...initOf(existingStroke),
            dashing: { case: 'pattern', value: patternEntry.value },
          }),
        });
      } else if (field === 'arrowStart' || field === 'arrowEnd') {
        if (typeof value !== 'string') {
          return undefined;
        }
        const arrowheadEntry = ARROWHEAD_TABLE.find((entry) => entry.name === value);
        if (!arrowheadEntry) {
          return undefined;
        }
        const existingArrowheads = existingCallout?.arrowheads;
        const newArrowheads = create(ArrowheadsSchema, {
          start:
            field === 'arrowStart'
              ? arrowheadEntry.value
              : existingArrowheads?.start,
          end:
            field === 'arrowEnd'
              ? arrowheadEntry.value
              : existingArrowheads?.end,
          size: existingArrowheads?.size,
        });
        newGlyph1D = create(Glyph1DSchema, {
          ...existingCallout,
          arrowheads: newArrowheads,
        });
      }

      if (newGlyph1D === undefined) {
        return undefined;
      }

      const newEntry = patchAnnotationEntry(existing, { callout: newGlyph1D });
      return annotationChange(annotationId, newEntry);
    })
    .filter((c) => c !== undefined);

  if (annotationChanges.length === 0) {
    return undefined;
  }

  return styleEdit({ annotationChanges });
}
