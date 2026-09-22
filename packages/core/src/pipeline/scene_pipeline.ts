// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { type Delta, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { type Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { type Theme } from '@archeglyph/proto/gen/theme_pb';
import { Err, Ok, type Result } from '@archeglyph/proto/util/result';
import { type LayoutEngine } from '../layout/layout_engine';
import { LayoutRequest } from '../layout/layout_request';
import { type LaidOutDiagram } from '../layout/laid_out_diagram';
import { type DeltaOverlay } from '../delta/delta_overlay';
import { applyDiffPalette } from '../delta/diff_palette';
import { mergeDelta } from '../delta/merge_delta';
import { seedComponentBindings } from '../resolver/seed_bindings';
import { PipelineError } from './pipeline_error';
import { resolvePipeline } from './resolve_pipeline';
import { init } from '@archeglyph/proto/util/init';

// Everything a scene needs before it is drawn. Shared so the SVG renderer and
// the editor canvas lay out the same diagram from the same delta.
export async function scenePipeline(diagram: Diagram, stylesheet: Stylesheet | undefined, themes: ReadonlyMap<string, Theme>, layoutEngine: LayoutEngine, delta?: Delta): Promise<Result<LaidOutDiagram, PipelineError>> {
  // Seeding must run on the union: a restored element is absent from the
  // caller's diagram, so seeding there would leave it with no component.
  let target: Diagram = diagram;
  let sheet: Stylesheet | undefined = stylesheet;
  let overlay: DeltaOverlay | undefined;
  if (delta !== undefined) {
    overlay = mergeDelta(diagram, delta);
    target = overlay.diagram;
    sheet = seedComponentBindings(
      overlay.diagram,
      stylesheet ?? create(StylesheetSchema, { schemaVersion: 1 }),
      themes.get('default'),
    );
  }

  const layoutResult = await layoutPipeline(target, sheet, themes, layoutEngine);
  if (layoutResult.kind === 'err') {
    return Err(layoutResult.error);
  }

  // After layout: colours are token references until resolvePipeline's last
  // stage, and the treatment changes no geometry.
  return Ok(overlay === undefined
    ? layoutResult.value
    : applyDiffPalette(layoutResult.value, overlay, themes.get('default')?.tokens));
}

export async function layoutPipeline(diagram: Diagram, stylesheet: Stylesheet | undefined, themes: ReadonlyMap<string, Theme>, layoutEngine: LayoutEngine): Promise<Result<LaidOutDiagram, PipelineError>> {
  const resolveResult = resolvePipeline(diagram, stylesheet, themes);
  if (resolveResult.kind === 'err') {
    return Err(resolveResult.error);
  }

  const layoutResult = await layoutEngine.layout(
    init(new LayoutRequest(), { diagram: resolveResult.value })
  );
  if (layoutResult.kind === 'err') {
    return Err(init(new PipelineError(), { stage: 'layout', detail: layoutResult.error.message }));
  }

  return Ok(layoutResult.value);
}
