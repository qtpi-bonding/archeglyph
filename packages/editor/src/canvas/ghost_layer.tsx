// SPDX-License-Identifier: AGPL-3.0-or-later

import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { layoutPipeline, PipelineError } from '@archeglyph/core/pipeline';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { injectDiagram } from './diagram_layer';
import { Component, createEffect, createMemo, createResource, JSX, Show } from 'solid-js';
import { Result } from '@archeglyph/proto/util/result';

export interface GhostLayerProps {
  diagram: Diagram;
  stylesheet: Stylesheet;
  themes: ReadonlyMap<string, Theme>;
  layoutEngine: LayoutEngine;
}

type GhostSource = {
  diagram: Diagram;
  stylesheet: Stylesheet;
  themes: ReadonlyMap<string, Theme>;
};

interface GhostRenderProps {
  props: GhostLayerProps;
}

/**
 * Fold every pending style edit over a stylesheet in list order.
 *
 * Each application returns a new stylesheet, so the input stylesheet is never
 * mutated.
 */
export function applyAllPendingEdits(stylesheet: Stylesheet): Stylesheet {
  let result: Stylesheet = stylesheet;
  for (const edit of stylesheet.pendingEdits) {
    result = applyStyleEditToStylesheet(result, edit);
  }
  return result;
}

/**
 * Render the pending stylesheet below the saved diagram as an advisory ghost.
 * An empty pending-edit list deliberately disables the resource entirely, and
 * failures in either asynchronous layout or rendering produce no layer.
 */
export const GhostLayer: Component<GhostLayerProps> = (props: GhostLayerProps): JSX.Element => {
  return (
    <Show when={props.stylesheet.pendingEdits.length > 0}>
      <GhostRender props={props} />
    </Show>
  );
};

const GhostRender: Component<GhostRenderProps> = ({ props }: GhostRenderProps): JSX.Element => {
  const source = createMemo((): GhostSource => ({
    diagram: props.diagram,
    stylesheet: applyAllPendingEdits(props.stylesheet),
    themes: props.themes,
  }));

  const [svg] = createResource<string, GhostSource>(
    source,
    async (input: GhostSource): Promise<string> => {
      const layoutResult: Result<LaidOutDiagram, PipelineError> = await layoutPipeline(
        input.diagram,
        input.stylesheet,
        input.themes,
        props.layoutEngine,
      );
      if (layoutResult.kind === 'err') {
        return '';
      }

      const renderResult = new SvgRendererImpl().render(layoutResult.value);
      if (renderResult.kind === 'err') {
        return '';
      }
      return renderResult.value;
    },
  );

  let host!: SVGGElement;
  createEffect((): void => {
    // The renderer's root <svg> would nest a viewport here, rescaling the
    // ghost against its own viewBox so it stops registering with the diagram.
    injectDiagram(host, svg() ?? '');
  });

  return <g ref={host} opacity="0.3" />;
};
