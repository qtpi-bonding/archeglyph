// SPDX-License-Identifier: MPL-2.0

import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { create } from '@bufbuild/protobuf';
import { loadDiagram, loadStylesheet } from '@archeglyph/core/loaders';
import {
  StylesheetSchema,
  NodeStyleEntrySchema,
  EdgeStyleEntrySchema,
  GroupStyleEntrySchema,
} from '@archeglyph/proto/gen/style_pb';
import { toJson } from '@archeglyph/proto/util/json';
import type { Operation, OpContext } from '../op';
import { type BindParams, bindParamsSchema } from './bind_params';
import { BindOutput } from './bind_output';
import { BindOpError } from './bind_op_error';
import { parsePredicate } from './predicate';
import { deriveDefaultStylePath } from '../style_path';
import { init } from '@archeglyph/proto/util/init';

export const bindOp: Operation<BindParams, BindOutput> = {
  name: 'bind',
  description: 'Bind a theme component to matching diagram elements in a stylesheet',
  params: bindParamsSchema as unknown as Operation<BindParams, BindOutput>['params'],
  format: (o) => `${o.matched} element(s) bound to '${o.component}' in ${o.path}`,
  exitCode: () => 0,
  async execute(params: BindParams, ctx: OpContext): Promise<BindOutput> {
    const diagramPath = resolve(ctx.projectRoot, params.diagram);
    const diagramText = await readFile(diagramPath, 'utf8').catch((err) => {
      throw init(new BindOpError(), { stage: 'load_diagram', cause: err });
    });
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === 'err') {
      throw init(new BindOpError(), { stage: 'load_diagram', cause: diagramResult.error });
    }
    const diagram = diagramResult.value;

    const stylePath = params.style !== undefined
      ? resolve(ctx.projectRoot, params.style)
      : deriveDefaultStylePath(diagramPath);

    let styleExists: boolean;
    try {
      await access(stylePath);
      styleExists = true;
    } catch {
      styleExists = false;
    }

    let stylesheet;
    if (styleExists) {
      const styleText = await readFile(stylePath, 'utf8').catch((err) => {
        throw init(new BindOpError(), { stage: 'load_style', cause: err });
      });
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === 'err') {
        throw init(new BindOpError(), { stage: 'load_style', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    } else {
      stylesheet = create(StylesheetSchema, { schemaVersion: 1 });
    }

    let predicate;
    try {
      predicate = parsePredicate(params.where);
    } catch (err) {
      throw init(new BindOpError(), { stage: 'parse_predicate', cause: err });
    }

    const graph = diagram.graph;
    let matched = 0;

    if (params.elementType === 'node') {
      for (const [id, node] of Object.entries(graph?.nodes ?? {})) {
        if (predicate({ id, tags: node.tags, parent_group: node.parentGroup })) {
          const entry = stylesheet.nodes[id] ?? create(NodeStyleEntrySchema, {});
          entry.component = params.component;
          stylesheet.nodes[id] = entry;
          matched++;
        }
      }
    } else if (params.elementType === 'edge') {
      for (const [id, edge] of Object.entries(graph?.edges ?? {})) {
        if (predicate({ id, tags: edge.tags, parent_group: undefined })) {
          const entry = stylesheet.edges[id] ?? create(EdgeStyleEntrySchema, {});
          entry.component = params.component;
          stylesheet.edges[id] = entry;
          matched++;
        }
      }
    } else {
      for (const [id, group] of Object.entries(graph?.groups ?? {})) {
        if (predicate({ id, tags: group.tags, parent_group: group.parentGroup })) {
          const entry = stylesheet.groups[id] ?? create(GroupStyleEntrySchema, {});
          entry.component = params.component;
          stylesheet.groups[id] = entry;
          matched++;
        }
      }
    }

    await writeFile(stylePath, toJson(StylesheetSchema, stylesheet), 'utf8').catch((err) => {
      throw init(new BindOpError(), { stage: 'write', cause: err });
    });

    return init(new BindOutput(), { matched, path: stylePath, component: params.component });
  },
};
