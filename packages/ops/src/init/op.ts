// SPDX-License-Identifier: MPL-2.0

import { access, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, EdgeSchema, GraphSchema, LocalizationSchema, ElementSchema } from '@archeglyph/proto/gen/content_pb';
import { CONTENT_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { toJson } from '@archeglyph/proto/util/json';
import type { Operation, OpContext } from '../op';
import type { InitParams } from './init_params';
import { initParamsSchema } from './init_params';
import { InitOutput } from './init_output';
import { InitOpError } from './init_op_error';
import { init } from '@archeglyph/proto/util/init';

export const initOp: Operation<InitParams, InitOutput> = {
  name: 'init',
  description: 'Scaffold a new diagram file',
  params: initParamsSchema as unknown as Operation<InitParams, InitOutput>['params'],
  format: (o) => `wrote ${o.path}`,
  exitCode: () => 0,
  async execute(params: InitParams, ctx: OpContext): Promise<InitOutput> {
    const path = resolve(ctx.projectRoot, `${params.name}.diag.json`);

    let exists: boolean;
    try {
      await access(path);
      exists = true;
    } catch {
      exists = false;
    }
    if (exists) {
      throw init(new InitOpError(), { stage: 'exists', cause: undefined });
    }

    const en = (source: string) => [create(LocalizationSchema, { locale: 'en', source })];
    const msg = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: params.name,
      title: en(params.name),
      graph: create(GraphSchema, {
        elements: {
          first: create(ElementSchema, { label: en('first') }),
          second: create(ElementSchema, { label: en('second') }),
        },
        edges: {
          first__second: create(EdgeSchema, { source: 'first', target: 'second' }),
        },
      }),
      metadata: { generator: 'archeglyph init', canonicalLocale: 'en' },
    });
    const json = toJson(DiagramSchema, msg);

    try {
      await writeFile(path, json, 'utf8');
    } catch (e) {
      throw init(new InitOpError(), { stage: 'write', cause: e });
    }

    return init(new InitOutput(), { path });
  },
};
