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
  theme: z.string().optional().describe('Bundled theme name (light, dark, blueprint) or path to a .theme.json file; uses the bundled dark theme if omitted.'),
  out: z.string().optional().describe('Output SVG path; defaults to the diagram path with a .svg extension.'),
});
