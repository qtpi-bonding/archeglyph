// SPDX-License-Identifier: MPL-2.0

import { z } from 'zod';

export class FormatParams {
  file!: string;
}

export const formatParamsSchema: z.ZodType<FormatParams> = z.object({
  file: z.string().describe('Path to the file to format (.diag.json, .style.json, or .theme.json).'),
});
