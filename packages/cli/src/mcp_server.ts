// SPDX-License-Identifier: AGPL-3.0-or-later
import { OpContext } from '@archeglyph/ops/op';

export async function runMcpServer(ctx: OpContext): Promise<void> {
  ctx.logger.error('mcp subcommand is not yet implemented in v1');
  ctx.logger.error('this is a stub; full MCP server lands after op_render');
  process.exit(1);
}
