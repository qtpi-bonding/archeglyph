// SPDX-License-Identifier: MPL-2.0

import { z } from 'zod';

export class RenderParams {
  diagram!: string;
  style?: string;
  theme?: string;
  delta?: string;
  out?: string;
}

export const renderParamsSchema: z.ZodType<RenderParams> = z.object({
  diagram: z.string().describe('Path to the .arch diagram file to render.'),
  style: z.string().optional().describe('Path to a .style stylesheet; uses the diagram default if omitted.'),
  theme: z.string().optional().describe('Rebind one theme name: <name>=<theme>, or a bare <theme> to rebind `default`. The theme is a bundled name (light, dark, blueprint) or a path. Without this, the stylesheet\'s own bindings are used.'),
  delta: z.string().optional().describe('Path to a Delta JSON file from `archeglyph diff`. Draws the union of the diagram and what the Delta says was deleted, coloured by change type.'),
  out: z.string().optional().describe('Output SVG path; defaults to the diagram path with a .svg extension.'),
});
