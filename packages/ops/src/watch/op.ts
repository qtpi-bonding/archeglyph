// SPDX-License-Identifier: MPL-2.0

import { watch } from 'node:fs';
import { resolve } from 'node:path';
import type { Operation, OpContext } from '../op';
import { type WatchParams, watchParamsSchema } from './watch_params';
import { WatchOutput } from './watch_output';
import { WatchOpError } from './watch_op_error';
import { renderOp } from '../render/op';
import { RenderParams } from '../render/render_params';
import { init } from '@archeglyph/proto/util/init';

export const watchOp: Operation<WatchParams, WatchOutput> = {
  name: 'watch',
  description: 'Watch a diagram file and re-render on changes',
  params: watchParamsSchema as unknown as Operation<WatchParams, WatchOutput>['params'],
  format: (o) => `watched ${o.path} — ${o.cyclesCompleted} render(s) completed`,
  async execute(params: WatchParams, ctx: OpContext): Promise<WatchOutput> {
    const renderParams = init(new RenderParams(), {
      diagram: params.diagram,
      style: params.style,
      theme: params.theme,
      out: params.out,
    });

    try {
      await renderOp.execute(renderParams, ctx);
    } catch (err) {
      throw init(new WatchOpError(), { stage: 'initial_render', cause: err });
    }
    let cyclesCompleted = 1;

    const watchPaths: string[] = [resolve(ctx.projectRoot, params.diagram)];
    if (params.style !== undefined) watchPaths.push(resolve(ctx.projectRoot, params.style));
    if (params.theme !== undefined) watchPaths.push(resolve(ctx.projectRoot, params.theme));

    return new Promise<WatchOutput>((done) => {
      const watchers: ReturnType<typeof watch>[] = [];
      let debounceTimer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        if (debounceTimer !== undefined) clearTimeout(debounceTimer);
        for (const watcher of watchers) watcher.close();
        done(init(new WatchOutput(), { cyclesCompleted, path: params.diagram }));
      };

      const onSettle = async () => {
        try {
          await renderOp.execute(renderParams, ctx);
          cyclesCompleted += 1;
        } catch (err) {
          ctx.logger.error(String(err));
        }
      };

      const onEvent = () => {
        if (debounceTimer !== undefined) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = undefined;
          void onSettle();
        }, 100);
      };

      process.once('SIGINT', cleanup);

      try {
        for (const p of watchPaths) {
          watchers.push(watch(p, onEvent));
        }
      } catch (err) {
        process.off('SIGINT', cleanup);
        for (const watcher of watchers) watcher.close();
        throw init(new WatchOpError(), { stage: 'setup_watch', cause: err });
      }
    });
  },
  exitCode: () => 0,
};
