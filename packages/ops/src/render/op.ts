// SPDX-License-Identifier: AGPL-3.0-or-later

import { access, readFile, writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join, resolve } from 'node:path';
import { getBundledTheme } from '@archeglyph/themes';
import type { Theme } from '@archeglyph/proto/gen/theme_pb';
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import type { Operation, OpContext } from '../op';
import { loadDiagram, loadStylesheet, loadTheme } from '@archeglyph/core/loaders';
import { renderPipeline } from '@archeglyph/core/pipeline';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createNodeElk } from '@archeglyph/core/layout/elk_host_node';
import { type RenderParams, renderParamsSchema } from './render_params';
import { RenderOutput } from './render_output';
import { RenderOpError } from './render_op_error';
import { deriveDefaultStylePath } from '../style_path';

export function deriveOutPath(diagramPath: string): string {
  const ext = extname(diagramPath);
  const base = ext
    ? basename(diagramPath, ext) + '.svg'
    : basename(diagramPath) + '.svg';
  const dir = dirname(diagramPath);
  return dir === '.' ? base : join(dir, base);
}

export const renderOp: Operation<RenderParams, RenderOutput> = {
  name: 'render',
  description: 'Render a diagram file to SVG',
  params: renderParamsSchema as unknown as Operation<RenderParams, RenderOutput>['params'],
  format: (o) => `wrote ${o.bytesWritten} bytes to ${o.outPath}`,
  async execute(params: RenderParams, ctx: OpContext): Promise<RenderOutput> {
    const diagramText = await readFile(resolve(ctx.projectRoot, params.diagram), 'utf8');
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: 'load', cause: diagramResult.error });
    }

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
        throw Object.assign(new RenderOpError(), { stage: 'load', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }

    let theme: Theme;
    if (params.theme !== undefined) {
      const themeText = await readFile(resolve(ctx.projectRoot, params.theme), 'utf8');
      const themeResult = await loadTheme(themeText);
      if (themeResult.kind === 'err') {
        throw Object.assign(new RenderOpError(), { stage: 'load', cause: themeResult.error });
      }
      theme = themeResult.value;
    } else {
      ctx.logger.info('no --theme provided; using built-in placeholder');
      theme = getBundledTheme('light');
    }

    const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createNodeElk()));
    const pipelineResult = await renderPipeline(diagramResult.value, stylesheet, theme, layoutEngine);
    if (pipelineResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: pipelineResult.error.stage, cause: pipelineResult.error });
    }
    const svg = pipelineResult.value;

    const outPath = resolve(ctx.projectRoot, params.out ?? deriveOutPath(params.diagram));
    await writeFile(outPath, svg, 'utf8');
    const bytesWritten = Buffer.byteLength(svg, 'utf8');

    return Object.assign(new RenderOutput(), { svg, outPath, bytesWritten });
  },
};
