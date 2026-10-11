// SPDX-License-Identifier: MPL-2.0

import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { create } from '@bufbuild/protobuf';
import { loadDiagram, loadStylesheet } from '@archeglyph/core/loaders';
import { FilterRequest } from '@archeglyph/core/resolver/filter_request';
import { hiddenOutside, openSet } from '@archeglyph/core/resolver/focus';
import { VisibilityFilterImpl } from '@archeglyph/core/resolver/visibility_filter';
import {
  ElementStyleEntrySchema,
  GroupRenderMode,
  NodeVisibility,
  StylesheetSchema,
} from '@archeglyph/proto/gen/style_pb';
import { STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { init } from '@archeglyph/proto/util/init';
import { toJson } from '@archeglyph/proto/util/json';
import type { Operation, OpContext } from '../op';
import { deriveDefaultStylePath } from '../style_path';
import { OpenOpError } from './open_op_error';
import { OpenOutput } from './open_output';
import { type OpenParams, openParamsSchema } from './open_params';

export const openOp: Operation<OpenParams, OpenOutput> = {
  name: 'open',
  description:
    'Choose a view of a diagram: open the elements you name, to a depth, and leave the rest as closed blocks',
  params: openParamsSchema as unknown as Operation<OpenParams, OpenOutput>['params'],
  format: (o) =>
    `${o.opened} element(s) opened for ${o.picks} pick(s) at depth ${o.depth}` +
    `${o.hidden > 0 ? `, ${o.hidden} hidden` : ''} in ${o.path}`,
  exitCode: () => 0,
  async execute(params: OpenParams, ctx: OpContext): Promise<OpenOutput> {
    const diagramPath = resolve(ctx.projectRoot, params.diagram);
    const diagramText = await readFile(diagramPath, 'utf8').catch((err) => {
      throw init(new OpenOpError(), { stage: 'load_diagram', cause: err });
    });
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === 'err') {
      throw init(new OpenOpError(), { stage: 'load_diagram', cause: diagramResult.error });
    }
    const elements = diagramResult.value.graph?.elements ?? {};

    const unknown = params.id.filter((id: string): boolean => elements[id] === undefined);
    if (unknown.length > 0) {
      throw init(new OpenOpError(), {
        stage: 'unknown_id',
        cause: new Error(`no such element: ${unknown.map((id: string): string => `'${id}'`).join(', ')}`),
      });
    }

    const stylePath = params.style !== undefined
      ? resolve(ctx.projectRoot, params.style)
      : deriveDefaultStylePath(diagramPath);
    const styleExists = await access(stylePath).then(() => true, () => false);
    let stylesheet = create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION });
    if (styleExists) {
      const styleText = await readFile(stylePath, 'utf8').catch((err) => {
        throw init(new OpenOpError(), { stage: 'load_style', cause: err });
      });
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === 'err') {
        throw init(new OpenOpError(), { stage: 'load_style', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }

    // A view is the open depth, which containers are explicitly open, what is
    // hidden, and which edge kinds are drawn. Any earlier open, closed or
    // hidden is the previous view and goes; a dissolved grouping is how the
    // diagram is drawn, not a view, so it stays.
    for (const entry of Object.values(stylesheet.elements)) {
      entry.visibility = undefined;
      if (entry.renderMode !== GroupRenderMode.DISSOLVED) {
        entry.renderMode = undefined;
      }
    }
    // Everything not opened below is closed at the roots, so the rest of the
    // diagram stays on the page as blocks and its edges are lifted onto them.
    stylesheet.openDepth = 1;
    stylesheet.shownEdgeKinds = params.kind ?? [];

    // A dissolved grouping already shows what is inside it, so it needs no
    // opening and keeps the way it is drawn.
    const open = [...openSet(elements, params.id, params.depth)].filter(
      (id: string): boolean => stylesheet.elements[id]?.renderMode !== GroupRenderMode.DISSOLVED,
    );
    for (const id of open) {
      const entry = stylesheet.elements[id] ?? create(ElementStyleEntrySchema, {});
      entry.renderMode = GroupRenderMode.OPEN;
      stylesheet.elements[id] = entry;
    }

    // The neighbourhood is measured on the view just made, so it is worked out
    // after the picks are open and before anything is hidden.
    let hidden: string[] = [];
    if (params.hops !== undefined) {
      const drawn = new VisibilityFilterImpl().filter(init(new FilterRequest(), {
        diagram: diagramResult.value,
        stylesheet,
      }));
      if (drawn.kind === 'err') {
        throw init(new OpenOpError(), { stage: 'resolve', cause: drawn.error });
      }
      hidden = hiddenOutside(elements, drawn.value, params.id, params.hops);
      for (const id of hidden) {
        const entry = stylesheet.elements[id] ?? create(ElementStyleEntrySchema, {});
        entry.visibility = NodeVisibility.HIDDEN;
        stylesheet.elements[id] = entry;
      }
    }

    await writeFile(stylePath, toJson(StylesheetSchema, stylesheet), 'utf8').catch((err) => {
      throw init(new OpenOpError(), { stage: 'write', cause: err });
    });
    return init(new OpenOutput(), { opened: open.length, picks: params.id.length, depth: params.depth, hidden: hidden.length, path: stylePath });
  },
};
