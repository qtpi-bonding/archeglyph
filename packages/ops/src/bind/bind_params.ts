// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class BindParams {
  diagram!: string;
  style?: string;
  where!: string;
  elementType!: 'node' | 'edge' | 'group';
  component!: string;
}

const rawBindParamsSchema = z.object({
  diagram: z.string(),
  style: z.string().optional(),
  where: z.string(),
  elementType: z.enum(['node', 'edge', 'group']).default('node'),
  component: z.string(),
});

export const bindParamsSchema: z.ZodType<BindParams, z.ZodTypeDef, z.input<typeof rawBindParamsSchema>> = rawBindParamsSchema;
