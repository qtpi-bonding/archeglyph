// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class InitParams {
  name!: string;
}

export const initParamsSchema: z.ZodType<InitParams> = z.object({
  name: z.string().default('diagram'),
});
