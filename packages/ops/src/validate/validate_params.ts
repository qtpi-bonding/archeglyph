// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export class ValidateParams {
  diagram!: string;
  style?: string;
  theme?: string;
}

export const validateParamsSchema: z.ZodType<ValidateParams> = z.object({
  diagram: z.string().describe('Path to the .arch diagram file to validate.'),
  style: z.string().optional().describe('Path to a .style stylesheet; uses the diagram default if omitted.'),
  theme: z.string().optional().describe('Bundled theme name (light, dark, blueprint) or path to a .theme.json file; uses the bundled dark theme if omitted.'),
});
