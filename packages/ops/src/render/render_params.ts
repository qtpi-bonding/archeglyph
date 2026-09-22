// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class RenderParams {
  diagram!: string;
  style?: string;
  theme?: string;
  out?: string;
}

export const renderParamsSchema: z.ZodType<RenderParams> = z.object({
  diagram: z.string().describe('Path to the .arch diagram file to render.'),
  style: z.string().optional().describe('Path to a .style stylesheet; uses the diagram default if omitted.'),
  theme: z.string().optional().describe('Rebind one theme name: <name>=<theme>, or a bare <theme> to rebind `default`. The theme is a bundled name (light, dark, blueprint) or a path. Without this, the stylesheet\'s own bindings are used.'),
  out: z.string().optional().describe('Output SVG path; defaults to the diagram path with a .svg extension.'),
});
