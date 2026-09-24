// SPDX-License-Identifier: MPL-2.0
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

  test('a group renders its own container section, in model order', () => {
    const model = inspectorModel(refs('group', 'g1'))!;
    expect(renderableSections(model)).toEqual(['layout', 'group', 'shape', 'typography']);
  });

  test('an edge renders line and typography', () => {
    const model = inspectorModel(refs('edge', 'e1'))!;
    expect(renderableSections(model)).toEqual(['line', 'typography']);
  });

  test('an annotation renders its own section, in model order', () => {
    const model = inspectorModel(refs('annotation', 'a1'))!;
    expect(renderableSections(model)).toEqual(['layout', 'annotation', 'shape', 'line', 'typography']);
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

  test('the registry is exactly the set with components behind it', () => {
    // A section id here with no branch in inspector.tsx renders nothing and
    // cannot commit, which looks like a broken panel rather than a missing
    // feature. Every id below has a component; add to both or neither.
    expect([...SECTION_IDS].sort())
      .toEqual(['annotation', 'group', 'layout', 'line', 'shape', 'typography']);
  });
});
