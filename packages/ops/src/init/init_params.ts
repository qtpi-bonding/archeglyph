// SPDX-License-Identifier: MPL-2.0

import { z } from 'zod';

export class InitParams {
  name!: string;
}

const rawInitParamsSchema = z.object({
  name: z.string().default('diagram'),
});

export const initParamsSchema: z.ZodType<InitParams, z.ZodTypeDef, z.input<typeof rawInitParamsSchema>> = rawInitParamsSchema;
