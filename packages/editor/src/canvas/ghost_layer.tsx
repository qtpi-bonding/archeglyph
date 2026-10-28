// SPDX-License-Identifier: MPL-2.0

import { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Delta, Diagram } from '@archeglyph/proto/gen/content_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { scenePipeline, PipelineError } from '@archeglyph/core/pipeline';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { injectDiagram, markupKey } from './diagram_layer';
import { touchedKeys } from '../pending/edit_targets';
import { Component, createEffect, createMemo, createResource, JSX, Show } from 'solid-js';
import { Result } from '@archeglyph/proto/util/result';

export interface GhostLayerProps {
  delta: Delta | undefined;
  diagram: Diagram;
  stylesheet: Stylesheet;
  themes: ReadonlyMap<string, Theme>;
  layoutEngine: LayoutEngine;
  /** The proposal the panel has open. Its parts are drawn solid. */
  selectedId?: string;
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
  // With a proposal open, only that one is applied: merging them all piles
  // one proposal's moves on top of another's, and a swap lands on parts the
  // reader is trying to compare it with.
  const source = createMemo((): GhostSource => {
    const open = props.stylesheet.pendingEdits.find((edit) => edit.id === props.selectedId);
    return {
      diagram: props.diagram,
      stylesheet: open === undefined
        ? applyAllPendingEdits(props.stylesheet)
        : applyStyleEditToStylesheet(props.stylesheet, open),
      themes: props.themes,
    };
  });

  const [svg] = createResource<string, GhostSource>(
    source,
    async (input: GhostSource): Promise<string> => {
      const layoutResult: Result<LaidOutDiagram, PipelineError> = await scenePipeline(
        input.diagram,
        input.stylesheet,
        input.themes,
        props.layoutEngine,
        props.delta,
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
    // Read after injecting, and tracking the selection, so a re-render keeps
    // the emphasis and a new selection needs no re-render.
    const selected = props.stylesheet.pendingEdits.find((edit) => edit.id === props.selectedId);
    if (selected !== undefined) {
      emphasizeProposal(host, touchedKeys(selected), true);
    } else {
      const everything: Set<string> = new Set();
      for (const edit of props.stylesheet.pendingEdits) {
        for (const key of touchedKeys(edit)) { everything.add(key); }
      }
      emphasizeProposal(host, everything, false);
    }
  });

  return <g ref={host} data-ghost="true" />;
};

export const GHOST_OPACITY: string = '0.3';

/**
 * Draw only the parts in `touched`, solid when a proposal is open and faint
 * otherwise, and hide every other part. The real diagram already shows the
 * unchanged parts, and a second copy of one only adds clutter wherever the
 * ghost's layout has shifted off the real one, such as a group resized to fit
 * a moved child. The ghost's markup is one flat <g> per element, so each can
 * take its own opacity; a wrapper's opacity would cap the solid parts at the
 * faint one.
 */
export function emphasizeProposal(host: SVGGElement, touched: ReadonlySet<string>, solid: boolean): void {
  for (const child of Array.from(host.children)) {
    if (child.tagName !== 'g') { continue; }
    const key: string | undefined = markupKey(child);
    const shown: boolean = key !== undefined && touched.has(key);
    child.setAttribute('opacity', !shown ? '0' : solid ? '1' : GHOST_OPACITY);
  }
}

/** The part of the ghost under a pointer event's target, as a proposal target key. */
export function ghostPartKey(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) { return undefined; }
  const part: Element | null = target.closest('[data-ghost] > g');
  return part === null ? undefined : markupKey(part);
}
