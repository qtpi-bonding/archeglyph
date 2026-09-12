// SPDX-License-Identifier: AGPL-3.0-or-later

import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Theme } from '@archeglyph/proto/gen/theme_pb';
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { findBundledTheme, getBundledTheme } from '@archeglyph/themes';
import type { Operation, OpContext } from '../op';
import { loadDiagram, loadStylesheet, loadTheme } from '@archeglyph/core/loaders';
import { ValidatorImpl } from '@archeglyph/core/validator/validator';
import { ValidateRequest } from '@archeglyph/core/validator/validate_request';
import { resolvePipeline } from '@archeglyph/core/pipeline';
import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';
import { create } from '@bufbuild/protobuf';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { type ValidateParams, validateParamsSchema } from './validate_params';
import { ValidateOutput } from './validate_output';
import { ValidateOpError } from './validate_op_error';
import { deriveDefaultStylePath } from '../style_path';

export const validateOp: Operation<ValidateParams, ValidateOutput> = {
  name: 'validate',
  description: 'Validate a diagram file for structural correctness',
  params: validateParamsSchema as unknown as Operation<ValidateParams, ValidateOutput>['params'],
  format: (o) => o.passed ? 'diagram is valid' : `${o.violations.length} violation(s) found`,
  exitCode: (o) => o.passed ? 0 : 1,
  async execute(params: ValidateParams, ctx: OpContext): Promise<ValidateOutput> {
    const stagesRun: string[] = [];

    const diagramText = await readFile(resolve(ctx.projectRoot, params.diagram), 'utf8');
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === 'err') {
      throw Object.assign(new ValidateOpError(), { stage: 'load', cause: diagramResult.error });
    }
    stagesRun.push('load');

    const validateResult = new ValidatorImpl().validate(
      Object.assign(new ValidateRequest(), { diagram: diagramResult.value }),
    );
    if (validateResult.kind === 'err') {
      throw Object.assign(new ValidateOpError(), { stage: 'validate', cause: validateResult.error });
    }
    stagesRun.push('validate');

    const stylePath = params.style !== undefined
      ? resolve(ctx.projectRoot, params.style)
      : deriveDefaultStylePath(resolve(ctx.projectRoot, params.diagram));
    let styleExists = params.style !== undefined;
    if (!styleExists) {
      styleExists = await access(stylePath).then(() => true, () => false);
    }

    let stylesheet: Stylesheet | undefined;
    if (styleExists) {
      const styleText = await readFile(stylePath, 'utf8');
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === 'err') {
        throw Object.assign(new ValidateOpError(), { stage: 'load', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }

    let theme: Theme;
    if (params.theme === undefined) {
      theme = getBundledTheme('dark');
    } else {
      const bundledTheme = findBundledTheme(params.theme);
      if (bundledTheme !== null) {
        theme = bundledTheme;
      } else {
        const themeText = await readFile(resolve(ctx.projectRoot, params.theme), 'utf8');
        const themeResult = await loadTheme(themeText);
        if (themeResult.kind === 'err') {
          throw Object.assign(new ValidateOpError(), { stage: 'load', cause: themeResult.error });
        }
        theme = themeResult.value;
      }
    }

    // Fill any missing component bindings from the theme's declared defaults,
    // so a diagram with no style file renders the same here as it does in the
    // editor. The resolver itself assumes nothing.
    const seeded = seedComponentBindings(diagramResult.value, stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 }), theme);
    const resolveResult = await resolvePipeline(diagramResult.value, seeded, theme);
    if (resolveResult.kind === 'err') {
      throw Object.assign(new ValidateOpError(), { stage: resolveResult.error.stage, cause: resolveResult.error });
    }
    stagesRun.push('resolve');

    const violations = validateResult.value.violations;
    const passed = violations.length === 0;
    return Object.assign(new ValidateOutput(), { violations, passed, stagesRun });
  },
};
