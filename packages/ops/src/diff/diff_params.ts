// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class DiffParams {
  base!: string;
  target!: string;
  out?: string;
  includeUnchanged?: boolean;
}

export const diffParamsSchema: z.ZodType<DiffParams> = z.object({
  base: z.string().describe('Path to the diagram file to compare FROM.'),
  target: z.string().describe('Path to the diagram file to compare TO.'),
  out: z.string().optional().describe('Path to write the Delta JSON to; prints the summary only if omitted.'),
  includeUnchanged: z.boolean().optional().describe('Emit an UNCHANGED entry for every element that did not change, rather than omitting it.'),
});
