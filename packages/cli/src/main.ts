// SPDX-License-Identifier: AGPL-3.0-or-later

import { ZodError } from 'zod';
import { REGISTRY, formatRootHelp, formatOpHelp, parseArgv, createOpContext, dispatchCli } from '@archeglyph/ops';
import { runMcpServer } from './mcp_server';

function formatZodError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map(issue => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');
  }
  return err instanceof Error ? err.message : String(err);
}

export async function run(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h' || argv[0] === 'help') {
    process.stdout.write(formatRootHelp(REGISTRY));
    process.exit(0);
  }

  if (argv[0] === '--version' || argv[0] === '-V') {
    process.stdout.write('0.0.0\n');
    process.exit(0);
  }

  const subcommand = argv[0];
  const rest = argv.slice(1);

  if (subcommand === 'mcp') {
    const ctx = createOpContext();
    await runMcpServer(ctx);
    process.exit(0);
  }

  const op = REGISTRY.find(o => o.name === subcommand);
  if (op === undefined) {
    process.stderr.write(`unknown subcommand: ${subcommand}\n\n`);
    process.stderr.write(formatRootHelp(REGISTRY));
    process.exit(1);
  }

  if (rest.includes('--help') || rest.includes('-h')) {
    process.stdout.write(formatOpHelp(op));
    process.exit(0);
  }

  let params: unknown;
  try {
    params = parseArgv(op.params, rest);
  } catch (err) {
    process.stderr.write(`error parsing arguments for '${subcommand}':\n`);
    process.stderr.write(formatZodError(err) + '\n\n');
    process.stderr.write(formatOpHelp(op));
    process.exit(2);
  }

  const ctx = createOpContext();
  try {
    const code = await dispatchCli(op, params, ctx);
    process.exit(code);
  } catch (err: unknown) {
    ctx.logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
