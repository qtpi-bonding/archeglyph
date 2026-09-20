// SPDX-License-Identifier: AGPL-3.0-or-later

import { ZodError } from 'zod';
import { REGISTRY, formatRootHelp, formatOpHelp, parseArgv, createOpContext, dispatchCli } from '@archeglyph/ops';
import { runMcpServer } from './mcp_server';
import { init } from '@archeglyph/proto/util/init';

function formatZodError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map(issue => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');
  }
  return err instanceof Error ? err.message : String(err);
}

// `cause` on an OpError is either a thrown Error or a core Result's error value
// (e.g. LoadError = { message: string }, per @archeglyph/core/loaders) — both
// shapes carry the real text on `.message`, so check that before falling back
// to String(), which would otherwise stringify a plain object to '[object Object]'.
function messageOf(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return String((value as { message: unknown }).message);
  }
  return String(value);
}

// Op-boundary errors (<Op>OpError) are archebuild-generated definite-assignment
// classes: `init(new XOpError(), { stage, cause })` never sets `.message`,
// so `err.message` is always '' even on classes that `extends Error`. Format from
// `stage`/`cause` directly instead of trusting `.message`.
function formatOpError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'stage' in err) {
    const errObj = err as { stage: unknown; cause?: unknown };
    const stage = String(errObj.stage);
    const cause = errObj.cause;
    const causeText = messageOf(cause);
    return causeText !== undefined ? `${stage}: ${causeText}` : stage;
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
    ctx.logger.error(formatOpError(err));
    process.exit(1);
  }
}
