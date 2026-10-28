// SPDX-License-Identifier: MPL-2.0

import { z } from 'zod';

export class OpenParams {
  diagram!: string;
  style?: string;
  id!: string[];
  depth!: number;
  hops?: number;
  kind?: string[];
}

const rawOpenParamsSchema = z.object({
  diagram: z.string().describe('The diagram to choose a view of'),
  style: z.string().optional().describe('The stylesheet to write; default: the one beside the diagram'),
  id: z.array(z.string()).min(1).describe('An element to look at; repeat the flag to pick several'),
  depth: z.number().int().min(0).default(1).describe(
    'How many levels of each pick to open: 0 leaves it one closed block, 1 opens it with its contents as blocks, 2 opens those too',
  ),
  hops: z.number().int().min(0).optional().describe(
    'Show only the picks and what is within this many edges of them, as drawn; 0 is the picks alone. Default: show everything',
  ),
  kind: z.array(z.string()).optional().describe(
    'Draw only edges of this kind; repeat the flag for several. Other edges are left out, and --hops follows only these. Default: every kind',
  ),
});

export const openParamsSchema: z.ZodType<OpenParams, z.ZodTypeDef, z.input<typeof rawOpenParamsSchema>> = rawOpenParamsSchema;
