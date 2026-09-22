// SPDX-License-Identifier: AGPL-3.0-or-later

import { access, readFile, writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join, resolve } from 'node:path';
import type { Theme } from '@archeglyph/proto/gen/theme_pb';
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import type { Operation, OpContext } from '../op';
import { loadDiagram, loadStylesheet, loadTheme } from '@archeglyph/core/loaders';
import { renderPipeline } from '@archeglyph/core/pipeline';
import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';
import { create } from '@bufbuild/protobuf';
import { StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { createNodeElk } from '@archeglyph/core/layout/elk_host_node';
import { type RenderParams, renderParamsSchema } from './render_params';
import { RenderOutput } from './render_output';
import { RenderOpError } from './render_op_error';
import { deriveDefaultStylePath } from '../style_path';
import { init } from '@archeglyph/proto/util/init';
import { resolveThemes } from '../themes/resolve_themes';

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
      throw init(new RenderOpError(), { stage: 'load', cause: diagramResult.error });
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
        throw init(new RenderOpError(), { stage: 'load', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }

    const themesResult = await resolveThemes(
      stylesheet?.themes ?? {},
      params.theme,
      ctx.projectRoot,
    );
    if (themesResult.kind === 'err') {
      throw init(new RenderOpError(), { stage: 'load', cause: themesResult.error });
    }
    const themes = themesResult.value;

    // Fill any missing component bindings from the theme's declared defaults,
    // so a diagram with no style file renders the same here as it does in the
    // editor. The resolver itself assumes nothing.
    const seeded = seedComponentBindings(diagramResult.value, stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 }), themes.get('default'));
    const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createNodeElk()));
    const pipelineResult = await renderPipeline(diagramResult.value, seeded, themes, layoutEngine);
    if (pipelineResult.kind === 'err') {
      throw init(new RenderOpError(), { stage: pipelineResult.error.stage, cause: pipelineResult.error });
    }
    const svg = pipelineResult.value;

    const outPath = resolve(ctx.projectRoot, params.out ?? deriveOutPath(params.diagram));
    await writeFile(outPath, svg, 'utf8');
    const bytesWritten = Buffer.byteLength(svg, 'utf8');

    return init(new RenderOutput(), { svg, outPath, bytesWritten });
  },
};
