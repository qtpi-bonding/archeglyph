// SPDX-License-Identifier: AGPL-3.0-or-later

import type { z, ZodObject, ZodRawShape } from 'zod';

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface OpContext {
  projectRoot: string;
  logger: Logger;
}

export interface Operation<P, O> {
  name: string;
  description: string;
  params: ZodObject<ZodRawShape> & z.ZodType<P>;
  format: (output: O) => string;
  execute: (params: P, ctx: OpContext) => Promise<O>;
  exitCode?: (output: O) => number;
}

export const consoleLogger: Logger = {
  info: (m) => process.stderr.write(`${m}\n`),
  warn: (m) => process.stderr.write(`warning: ${m}\n`),
  error: (m) => process.stderr.write(`error: ${m}\n`),
};

export function createOpContext(projectRoot?: string): OpContext {
  return {
    projectRoot: projectRoot ?? process.cwd(),
    logger: consoleLogger,
  };
}

export async function dispatchCli<P, O>(
  op: Operation<P, O>,
  params: P,
  ctx: OpContext,
): Promise<number> {
  const output = await op.execute(params, ctx);
  const text = op.format(output);
  if (text.length > 0) process.stdout.write(text + '\n');
  return op.exitCode?.(output) ?? 0;
}

export async function dispatchMcp<P, O>(
  op: Operation<P, O>,
  params: P,
  ctx: OpContext,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const output = await op.execute(params, ctx);
  const json = JSON.stringify(output, null, 2);
  return { content: [{ type: 'text', text: json }] };
}
