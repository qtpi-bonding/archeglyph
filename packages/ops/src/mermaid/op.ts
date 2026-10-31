// SPDX-License-Identifier: MPL-2.0

import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadDiagram, loadStylesheet } from '@archeglyph/core/loaders';
import { MERMAID_WARN_CHARS, MERMAID_WARN_EDGES, toMermaid } from '@archeglyph/core/mermaid';
import { FilterRequest } from '@archeglyph/core/resolver/filter_request';
import { VisibilityFilterImpl } from '@archeglyph/core/resolver/visibility_filter';
import type { Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { init } from '@archeglyph/proto/util/init';
import type { Operation, OpContext } from '../op';
import { deriveOutPath } from '../render/op';
import { deriveDefaultStylePath } from '../style_path';
import { MermaidOpError } from './mermaid_op_error';
import { MermaidOutput } from './mermaid_output';
import { type MermaidParams, mermaidParamsSchema } from './mermaid_params';

export const mermaidOp: Operation<MermaidParams, MermaidOutput> = {
  name: 'mermaid',
  description: 'Convert a diagram, as the stylesheet views it, to Mermaid flowchart text',
  params: mermaidParamsSchema as unknown as Operation<MermaidParams, MermaidOutput>['params'],
  format: (o) => `wrote ${o.bytesWritten} bytes (${o.nodes} node(s), ${o.edges} edge(s)) to ${o.outPath}`,
  async execute(params: MermaidParams, ctx: OpContext): Promise<MermaidOutput> {
    const diagramPath = resolve(ctx.projectRoot, params.diagram);
    const diagramText = await readFile(diagramPath, 'utf8').catch((err) => {
      throw init(new MermaidOpError(), { stage: 'load', cause: err });
    });
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === 'err') {
      throw init(new MermaidOpError(), { stage: 'load', cause: diagramResult.error });
    }

    const stylePath = params.style !== undefined
      ? resolve(ctx.projectRoot, params.style)
      : deriveDefaultStylePath(diagramPath);
    const styleExists = params.style !== undefined || await access(stylePath).then(() => true, () => false);
    let stylesheet: Stylesheet | undefined;
    if (styleExists) {
      const styleText = await readFile(stylePath, 'utf8').catch((err) => {
        throw init(new MermaidOpError(), { stage: 'load', cause: err });
      });
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === 'err') {
        throw init(new MermaidOpError(), { stage: 'load', cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }

    const filtered = new VisibilityFilterImpl().filter(
      init(new FilterRequest(), { diagram: diagramResult.value, stylesheet }),
    );
    if (filtered.kind === 'err') {
      throw init(new MermaidOpError(), { stage: 'filter', cause: filtered.error });
    }

    const converted = toMermaid(filtered.value, params.direction ?? 'LR');
    if (converted.kind === 'err') {
      throw init(new MermaidOpError(), { stage: 'convert', cause: new Error(converted.error) });
    }
    const text = converted.value;

    const nodes = Object.keys(filtered.value.nodes).length + Object.keys(filtered.value.groups).length;
    const edges = Object.keys(filtered.value.edges).length;
    if (edges > MERMAID_WARN_EDGES) {
      ctx.logger.warn(`${edges} edges is more than Mermaid draws legibly (over ${MERMAID_WARN_EDGES}); narrow the view with a stylesheet or \`open\``);
    }
    if (text.length > MERMAID_WARN_CHARS) {
      ctx.logger.warn(`${text.length} characters is more than Mermaid renders by default (over ${MERMAID_WARN_CHARS}); narrow the view with a stylesheet or \`open\``);
    }

    const fence = params.fence === true;
    const body = fence ? `\`\`\`mermaid\n${text}\`\`\`\n` : text;
    const outPath = resolve(ctx.projectRoot, params.out ?? deriveOutPath(params.diagram, fence ? '.md' : '.mmd'));
    await writeFile(outPath, body, 'utf8');

    return init(new MermaidOutput(), { outPath, bytesWritten: Buffer.byteLength(body, 'utf8'), nodes, edges });
  },
};
