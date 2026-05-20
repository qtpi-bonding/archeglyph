// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class FormatParams {
  file!: string;
}

export const formatParamsSchema: z.ZodType<FormatParams> = z.object({
  file: z.string().describe('Path to the file to format (.diag.json, .style.json, or .theme.json).'),
});
