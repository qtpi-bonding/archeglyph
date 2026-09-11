// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Diagram } from '@archeglyph/proto/gen/content_pb';
import { type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { type Theme } from '@archeglyph/proto/gen/theme_pb';
import { Err, Ok, type Result } from '@archeglyph/proto/util/result';
import { type LayoutEngine } from '../layout/layout_engine';
import { LayoutRequest } from '../layout/layout_request';
import { type LaidOutDiagram } from '../layout/laid_out_diagram';
import { SvgRendererImpl } from '../renderer/svg_renderer';
import { PipelineError } from './pipeline_error';
import { resolvePipeline } from './resolve_pipeline';

export async function renderPipeline(diagram: Diagram, stylesheet: Stylesheet | undefined, theme: Theme, layoutEngine: LayoutEngine): Promise<Result<string, PipelineError>> {
  const layoutResult = await layoutPipeline(diagram, stylesheet, theme, layoutEngine);
  if (layoutResult.kind === 'err') {
    return Err(layoutResult.error);
  }

  const renderResult = new SvgRendererImpl().render(layoutResult.value);
  if (renderResult.kind === 'err') {
    return Err(Object.assign(new PipelineError(), { stage: 'render' }));
  }

  return Ok(renderResult.value);
}

export async function layoutPipeline(diagram: Diagram, stylesheet: Stylesheet | undefined, theme: Theme, layoutEngine: LayoutEngine): Promise<Result<LaidOutDiagram, PipelineError>> {
  const resolveResult = resolvePipeline(diagram, stylesheet, theme);
  if (resolveResult.kind === 'err') {
    return Err(resolveResult.error);
  }

  const layoutResult = await layoutEngine.layout(
    Object.assign(new LayoutRequest(), { diagram: resolveResult.value })
  );
  if (layoutResult.kind === 'err') {
    return Err(Object.assign(new PipelineError(), { stage: 'layout' }));
  }

  return Ok(layoutResult.value);
}
