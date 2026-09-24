// SPDX-License-Identifier: MPL-2.0

import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Theme } from '@archeglyph/proto/gen/theme_pb';
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';
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
import { init } from '@archeglyph/proto/util/init';
import { resolveThemes } from '../themes/resolve_themes';

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
      throw init(new ValidateOpError(), { stage: 'load', cause: diagramResult.error });
    }
    stagesRun.push('load');

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
        throw init(new ValidateOpError(), { stage: 'load', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }

    // After the stylesheet load: supplied, it brings the stylesheet-to-graph
    // reference checks, which cannot run on the diagram alone.
    const validateResult = new ValidatorImpl().validate(
      init(new ValidateRequest(), { diagram: diagramResult.value, stylesheet }),
    );
    if (validateResult.kind === 'err') {
      throw init(new ValidateOpError(), { stage: 'validate', cause: validateResult.error });
    }
    stagesRun.push('validate');

    const themesResult = await resolveThemes(
      stylesheet?.themes ?? {},
      params.theme,
      ctx.projectRoot,
    );
    if (themesResult.kind === 'err') {
      throw init(new ValidateOpError(), { stage: 'load', cause: themesResult.error });
    }
    const themes = themesResult.value;

    // Fill any missing component bindings from the theme's declared defaults,
    // so a diagram with no style file renders the same here as it does in the
    // editor. The resolver itself assumes nothing.
    const seeded = seedComponentBindings(diagramResult.value, stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 }), themes.get('default'));
    const resolveResult = await resolvePipeline(diagramResult.value, seeded, themes);
    if (resolveResult.kind === 'err') {
      throw init(new ValidateOpError(), { stage: resolveResult.error.stage, cause: resolveResult.error });
    }
    stagesRun.push('resolve');

    const violations = validateResult.value.violations;
    const passed = violations.length === 0;
    return init(new ValidateOutput(), { violations, passed, stagesRun });
  },
};
