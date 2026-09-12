// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The panel is a renderer, and this repo has no DOM harness, so most of it is
// checked by hand. The exception is the one DECISION it makes: which of the
// sections its model names can actually be rendered.
//
// That matters because inspectorModel emits all six SectionIds while this
// pillar ships two. Getting the skip wrong means either a crash on a group
// selection or four inert headings, and neither is visible from a unit test
// of anything else.

import { describe, expect, test } from 'bun:test';
import type { ElementRef } from '../ui_state/ui_state';
import { inspectorModel } from './model';
import type { SectionId } from './model';
import { SECTION_IDS, renderableSections } from './inspector_sections';

const refs = (kind: ElementRef['kind'], ...ids: string[]): Array<ElementRef> =>
  ids.map((id) => ({ id, kind }));

describe('renderableSections', () => {
  test('a node renders all three of its sections', () => {
    const model = inspectorModel(refs('node', 'n1'))!;
    expect(renderableSections(model)).toEqual(['layout', 'shape', 'typography']);
  });

  test('a group drops its container section, which is not shipped', () => {
    const model = inspectorModel(refs('group', 'g1'))!;
    expect(model.sections).toContain('group');
    expect(renderableSections(model)).toEqual(['layout', 'shape', 'typography']);
  });

  test('an edge renders line and typography', () => {
    const model = inspectorModel(refs('edge', 'e1'))!;
    expect(renderableSections(model)).toEqual(['line', 'typography']);
  });

  test('an annotation drops only its own content section', () => {
    const model = inspectorModel(refs('annotation', 'a1'))!;
    expect(model.sections).toContain('annotation');
    expect(renderableSections(model)).toEqual(['layout', 'shape', 'line', 'typography']);
  });

  test('display order follows the model, not the registry', () => {
    // The model owns section order; the registry only says what exists.
    const model = inspectorModel(refs('node', 'n1'))!;
    const order = renderableSections(model);
    expect(order.indexOf('layout')).toBeLessThan(order.indexOf('typography'));
  });

  test('every id in the registry is a real SectionId', () => {
    // A typo'd key would silently never match and the section would vanish.
    const valid: Array<SectionId> = ['layout', 'shape', 'line', 'typography', 'group', 'annotation'];
    for (const id of SECTION_IDS) {
      expect(valid).toContain(id);
    }
  });

  test('the registry is exactly what this pillar ships', () => {
    // This is the line the follow-on pillar edits. If it drifts without the
    // components existing, the panel renders a section that cannot commit.
    expect([...SECTION_IDS].sort()).toEqual(['layout', 'line', 'shape', 'typography']);
  });
});
