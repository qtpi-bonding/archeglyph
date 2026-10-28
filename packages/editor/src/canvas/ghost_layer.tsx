// SPDX-License-Identifier: MPL-2.0

import { StyleEdit, Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { Delta, Diagram } from '@archeglyph/proto/gen/content_pb';
import { Theme } from '@archeglyph/proto/gen/theme_pb';
import { LayoutEngine } from '@archeglyph/core/layout/layout_engine';
import { scenePipeline, PipelineError } from '@archeglyph/core/pipeline';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { injectDiagram, markupKey } from './diagram_layer';
import { touchedKeys } from '../pending/edit_targets';
import { Component, createEffect, createMemo, createResource, For, JSX } from 'solid-js';
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

interface ProposalGhostProps {
  props: GhostLayerProps;
  edit: StyleEdit;
}

/**
 * The saved stylesheet with this one proposal applied, and no other. Each
 * proposal is drawn from its own render: folding them all into one would draw a
 * part two proposals touch with both their changes, so the picture of one would
 * include something it does not do.
 */
export function ghostStylesheet(stylesheet: Stylesheet, edit: StyleEdit): Stylesheet {
  return applyStyleEditToStylesheet(stylesheet, edit);
}

/**
 * Render each pending proposal in front of the saved diagram as an advisory
 * ghost: the open one solid, the rest faint, and only the parts a proposal
 * changes. No proposals means nothing is rendered, and a failure in layout or
 * rendering produces no layer for that proposal.
 */
export const GhostLayer: Component<GhostLayerProps> = (props: GhostLayerProps): JSX.Element => {
  return (
    <For each={props.stylesheet.pendingEdits}>
      {(edit: StyleEdit): JSX.Element => <ProposalGhost props={props} edit={edit} />}
    </For>
  );
};

const ProposalGhost: Component<ProposalGhostProps> = ({ props, edit }: ProposalGhostProps): JSX.Element => {
  const source = createMemo((): GhostSource => ({
    diagram: props.diagram,
    stylesheet: ghostStylesheet(props.stylesheet, edit),
    themes: props.themes,
  }));

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
    emphasizeProposal(host, touchedKeys(edit), props.selectedId === edit.id);
  });

  return <g ref={host} data-ghost="true" data-proposal={edit.id} />;
};

export const GHOST_OPACITY: string = '0.3';

/**
 * Show only the parts in `touched`, solid or faint, and take every other part
 * out of the picture. The real diagram already shows the unchanged parts, and a
 * second copy of one only adds clutter wherever the ghost's layout has shifted
 * off the real one, such as a group resized to fit a moved child. Taken out
 * means `display: none`, so it also stops catching the pointer. The ghost's
 * markup is one flat <g> per element, so each can take its own opacity.
 */
export function emphasizeProposal(host: SVGGElement, touched: ReadonlySet<string>, solid: boolean): void {
  for (const child of Array.from(host.children)) {
    if (child.tagName !== 'g') { continue; }
    const key: string | undefined = markupKey(child);
    if (key === undefined || !touched.has(key)) {
      child.setAttribute('display', 'none');
      continue;
    }
    child.removeAttribute('display');
    child.setAttribute('opacity', solid ? '1' : GHOST_OPACITY);
  }
}

/** The part of the ghost under a pointer event's target, as a proposal target key. */
export function ghostPartKey(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) { return undefined; }
  const part: Element | null = target.closest('[data-ghost] > g');
  return part === null ? undefined : markupKey(part);
}
