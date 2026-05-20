// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile, writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join, resolve } from 'node:path';
import { getBundledTheme } from '@archeglyph/themes';
import type { Theme } from '@archeglyph/proto/gen/theme_pb';
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import type { Operation, OpContext } from '../op';
import { loadDiagram, loadStylesheet, loadTheme } from '@archeglyph/core/loaders';
import { VisibilityFilterImpl } from '@archeglyph/core/resolver/visibility_filter';
import { StyleCascadeImpl } from '@archeglyph/core/resolver/style_cascade';
import { TokenResolverImpl } from '@archeglyph/core/resolver/token_resolver';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';
import { FilterRequest } from '@archeglyph/core/resolver/filter_request';
import { CascadeRequest } from '@archeglyph/core/resolver/cascade_request';
import { ResolveTokensRequest } from '@archeglyph/core/resolver/resolve_tokens_request';
import { LayoutRequest } from '@archeglyph/core/layout/layout_request';
import { type RenderParams, renderParamsSchema } from './render_params';
import { RenderOutput } from './render_output';
import { RenderOpError } from './render_op_error';

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

    let stylesheet: Stylesheet | undefined;
    if (params.style !== undefined) {
      const styleText = await readFile(resolve(ctx.projectRoot, params.style), 'utf8');
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

    const filterResult = new VisibilityFilterImpl().filter(
      Object.assign(new FilterRequest(), { diagram: diagramResult.value, stylesheet }),
    );
    if (filterResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: 'resolve', cause: filterResult.error });
    }

    const cascadeResult = new StyleCascadeImpl().cascade(
      Object.assign(new CascadeRequest(), { filtered: filterResult.value, stylesheet, theme }),
    );
    if (cascadeResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: 'resolve', cause: cascadeResult.error });
    }

    const resolveResult = new TokenResolverImpl().resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved: cascadeResult.value, tokens: theme.tokens }),
    );
    if (resolveResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: 'resolve', cause: resolveResult.error });
    }

    const layoutResult = await new LayoutEngineImpl().layout(
      Object.assign(new LayoutRequest(), { diagram: resolveResult.value }),
    );
    if (layoutResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: 'layout', cause: layoutResult.error });
    }

    const renderResult = new SvgRendererImpl().render(layoutResult.value);
    if (renderResult.kind === 'err') {
      throw Object.assign(new RenderOpError(), { stage: 'render', cause: renderResult.error });
    }
    const svg = renderResult.value;

    const outPath = resolve(ctx.projectRoot, params.out ?? deriveOutPath(params.diagram));
    await writeFile(outPath, svg, 'utf8');
    const bytesWritten = Buffer.byteLength(svg, 'utf8');

    return Object.assign(new RenderOutput(), { svg, outPath, bytesWritten });
  },
};
