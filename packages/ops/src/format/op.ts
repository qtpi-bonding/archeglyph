// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Operation, OpContext } from '../op';
import { loadDiagram, loadStylesheet, loadTheme } from '@archeglyph/core/loaders';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { ThemeSchema } from '@archeglyph/proto/gen/theme_pb';
import { toJson } from '@archeglyph/proto/util/json';
import { type FormatParams, formatParamsSchema } from './format_params';
import { FormatOutput } from './format_output';
import { FormatOpError } from './format_op_error';

export const formatOp: Operation<FormatParams, FormatOutput> = {
  name: 'format',
  description: 'Pretty-print a diagram, stylesheet, or theme file as canonical JSON',
  params: formatParamsSchema as unknown as Operation<FormatParams, FormatOutput>['params'],
  format: (o) => o.json,
  exitCode: (_o) => 0,
  async execute(params: FormatParams, ctx: OpContext): Promise<FormatOutput> {
    const absPath = resolve(ctx.projectRoot, params.file);
    const text = await readFile(absPath, 'utf8').catch((err) => {
      throw Object.assign(new FormatOpError(), { stage: 'dispatch', cause: err });
    });

    let json: string;
    if (params.file.endsWith('.diag.json')) {
      const result = await loadDiagram(text);
      if (result.kind === 'err') {
        throw Object.assign(new FormatOpError(), { stage: 'parse', cause: result.error });
      }
      json = toJson(DiagramSchema, result.value);
    } else if (params.file.endsWith('.style.json')) {
      const result = await loadStylesheet(text);
      if (result.kind === 'err') {
        throw Object.assign(new FormatOpError(), { stage: 'parse', cause: result.error });
      }
      json = toJson(StylesheetSchema, result.value);
    } else if (params.file.endsWith('.theme.json')) {
      const result = await loadTheme(text);
      if (result.kind === 'err') {
        throw Object.assign(new FormatOpError(), { stage: 'parse', cause: result.error });
      }
      json = toJson(ThemeSchema, result.value);
    } else {
      throw Object.assign(new FormatOpError(), {
        stage: 'dispatch',
        cause: new Error(`unrecognised extension: ${params.file}`),
      });
    }

    return Object.assign(new FormatOutput(), { json });
  },
};
