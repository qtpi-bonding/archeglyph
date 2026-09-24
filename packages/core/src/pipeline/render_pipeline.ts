// SPDX-License-Identifier: MPL-2.0

import { type Delta, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { type Theme } from '@archeglyph/proto/gen/theme_pb';
import { Err, Ok, type Result } from '@archeglyph/proto/util/result';
import { type LayoutEngine } from '../layout/layout_engine';
import { SvgRendererImpl } from '../renderer/svg_renderer';
import { PipelineError } from './pipeline_error';
import { scenePipeline } from './scene_pipeline';
import { init } from '@archeglyph/proto/util/init';

export async function renderPipeline(diagram: Diagram, stylesheet: Stylesheet | undefined, themes: ReadonlyMap<string, Theme>, layoutEngine: LayoutEngine, delta?: Delta): Promise<Result<string, PipelineError>> {
  const sceneResult = await scenePipeline(diagram, stylesheet, themes, layoutEngine, delta);
  if (sceneResult.kind === 'err') {
    return Err(sceneResult.error);
  }

  const renderResult = new SvgRendererImpl().render(sceneResult.value);
  if (renderResult.kind === 'err') {
    return Err(init(new PipelineError(), { stage: 'render', detail: renderResult.error.message }));
  }

  return Ok(renderResult.value);
}
