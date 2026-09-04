// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class InitParams {
  name!: string;
}

const rawInitParamsSchema = z.object({
  name: z.string().default('diagram'),
});

export const initParamsSchema: z.ZodType<InitParams, z.ZodTypeDef, z.input<typeof rawInitParamsSchema>> = rawInitParamsSchema;
