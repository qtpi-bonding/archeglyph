// SPDX-License-Identifier: MPL-2.0

import type { InspectorModel, SectionId } from './model';

/**
 * Exactly the sections the inspector can render today.
 *
 * Order here is NOT display order -- the model owns that. This is a
 * membership set that happens to be written as an array so it can be
 * iterated and asserted against.
 *
 * Typed as Array<SectionId> rather than string, so a typo is a compile
 * error instead of a section that silently never matches.
 */
export const SECTION_IDS: Array<SectionId> = ['layout', 'shape', 'line', 'typography', 'group', 'annotation'];

/**
 * Return the sections this pillar can render, preserving the model's order.
 */
export function renderableSections(model: InspectorModel): Array<SectionId> {
  return model.sections.filter((section) => SECTION_IDS.includes(section));
}
