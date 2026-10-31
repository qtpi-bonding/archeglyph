// SPDX-License-Identifier: MPL-2.0

import { z } from 'zod';
import type { MermaidDirection } from '@archeglyph/core/mermaid';

export class MermaidParams {
  diagram!: string;
  style?: string;
  direction?: MermaidDirection;
  fence?: boolean;
  out?: string;
}

const rawMermaidParamsSchema = z.object({
  diagram: z.string().describe('The diagram to convert'),
  style: z.string().optional().describe('The stylesheet choosing the view; default: the one beside the diagram, if any'),
  direction: z.enum(['TB', 'BT', 'LR', 'RL']).optional().describe('Flow direction of the flowchart; default LR'),
  fence: z.boolean().optional().describe('Wrap the output in a ```mermaid code fence and write a .md file'),
  out: z.string().optional().describe('Where to write the text; default: beside the diagram, as .mmd (.md with --fence)'),
});

export const mermaidParamsSchema: z.ZodType<MermaidParams, z.ZodTypeDef, z.input<typeof rawMermaidParamsSchema>> = rawMermaidParamsSchema;
