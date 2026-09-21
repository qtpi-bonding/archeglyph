// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { ChangeType, DeltaSchema, type Delta } from '@archeglyph/proto/gen/content_pb';
import { toJson } from '@archeglyph/proto/util/json';
import { init } from '@archeglyph/proto/util/init';
import { loadDiagram } from '@archeglyph/core/loaders';
import { diff } from '@archeglyph/core/diff';
import type { Operation, OpContext } from '../op';
import { type DiffParams, diffParamsSchema } from './diff_params';
import { DiffCounts, DiffOutput } from './diff_output';
import { DiffOpError } from './diff_op_error';

interface Changed {
  changeType: ChangeType;
}

function countBy(entries: ReadonlyArray<Changed>): DiffCounts {
  const of = (want: ChangeType): number =>
    entries.filter((entry: Changed): boolean => entry.changeType === want).length;
  return init(new DiffCounts(), {
    added: of(ChangeType.ADDED),
    deleted: of(ChangeType.DELETED),
    modified: of(ChangeType.MODIFIED),
  });
}

function line(label: string, counts: DiffCounts): string | undefined {
  const total = counts.added + counts.deleted + counts.modified;
  return total === 0
    ? undefined
    : `${label}: +${counts.added} -${counts.deleted} ~${counts.modified}`;
}

async function read(path: string, ctx: OpContext) {
  const text = await readFile(resolve(ctx.projectRoot, path), 'utf8');
  const result = await loadDiagram(text);
  if (result.kind === 'err') {
    throw init(new DiffOpError(), { stage: 'load', cause: result.error });
  }
  return result.value;
}

export const diffOp: Operation<DiffParams, DiffOutput> = {
  name: 'diff',
  description: 'Compare two diagram files and emit the change set between them',
  params: diffParamsSchema as unknown as Operation<DiffParams, DiffOutput>['params'],
  format: (o) => {
    if (!o.changed) {
      return `no changes between ${o.baseRef} and ${o.targetRef}`;
    }
    const parts = [line('nodes', o.nodes), line('edges', o.edges), line('groups', o.groups)]
      .filter((part): part is string => part !== undefined);
    const written = o.outPath === undefined ? '' : `\nwrote ${o.outPath}`;
    return `${o.baseRef} -> ${o.targetRef}\n${parts.join('\n')}${written}`;
  },
  // Always 0. A difference is the normal state of a change under review, not a
  // failure: a tool that exits non-zero on every pull request teaches people to
  // ignore it. A gate belongs behind an explicit flag, as git's own --exit-code is.
  exitCode: () => 0,
  async execute(params: DiffParams, ctx: OpContext): Promise<DiffOutput> {
    const base = await read(params.base, ctx);
    const target = await read(params.target, ctx);

    const delta: Delta = diff(base, target, { includeUnchanged: params.includeUnchanged === true });

    // Diagram.id is STABLE across revisions by definition, so both sides carry
    // the same one and it identifies neither. The paths are what the reader can
    // act on.
    delta.baseRef = params.base;
    delta.targetRef = params.target;

    let outPath: string | undefined;
    if (params.out !== undefined) {
      const absolute = resolve(ctx.projectRoot, params.out);
      await writeFile(absolute, `${toJson(DeltaSchema, delta)}\n`, 'utf8');
      // A target outside the project relativises to a stack of `..`, which is
      // harder to read than the path the user typed.
      const nearby = relative(ctx.projectRoot, absolute);
      outPath = nearby.startsWith('..') ? absolute : nearby;
    }

    const nodes = countBy(delta.nodeDeltas);
    const edges = countBy(delta.edgeDeltas);
    const groups = countBy(delta.groupDeltas);
    const changed = [nodes, edges, groups].some(
      (counts: DiffCounts): boolean => counts.added + counts.deleted + counts.modified > 0,
    );

    return init(new DiffOutput(), {
      baseRef: delta.baseRef,
      targetRef: delta.targetRef,
      nodes,
      edges,
      groups,
      changed,
      outPath,
    });
  },
};
