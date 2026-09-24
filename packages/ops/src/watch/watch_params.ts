// SPDX-License-Identifier: MPL-2.0

import { z } from 'zod';

export class WatchParams {
  diagram!: string;
  style?: string;
  theme?: string;
  out?: string;
}

export const watchParamsSchema: z.ZodType<WatchParams> = z.object({
  diagram: z.string().describe('Path to the .arch diagram file to watch and re-render on changes.'),
  style: z.string().optional().describe('Path to a .style stylesheet; uses the diagram default if omitted.'),
  theme: z.string().optional().describe('Path to a .theme.json file; uses the bundled light theme if omitted.'),
  out: z.string().optional().describe('Output SVG path; defaults to the diagram path with a .svg extension.'),
});
