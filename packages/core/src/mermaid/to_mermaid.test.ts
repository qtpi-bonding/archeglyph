// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilteredDiagram } from '../resolver/filtered_diagram';
import { FilteredEdge } from '../resolver/filtered_edge';
import { FilteredGroup } from '../resolver/filtered_group';
import { FilteredNode } from '../resolver/filtered_node';
import { toMermaid } from './to_mermaid';

const lab = (source: string) => [create(LocalizationSchema, { locale: 'en', source })];

function node(id: string, label: string | null, parentGroup?: string): FilteredNode {
  return init(new FilteredNode(), {
    id,
    parentGroup,
    tags: new Map(),
    label: label === null ? [] : lab(label),
  });
}

function group(
  id: string,
  label: string | null,
  opts: { parentGroup?: string; block?: boolean; hidden?: number } = {},
): FilteredGroup {
  return init(new FilteredGroup(), {
    id,
    parentGroup: opts.parentGroup,
    viewRole: opts.block === true ? 'block' : 'box',
    tags: new Map(),
    label: label === null ? [] : lab(label),
    isSuperNode: opts.block === true,
    hiddenDescendantCount: opts.hidden ?? 0,
  });
}

function edge(id: string, source: string, target: string, ordinal: number, label: string | null): FilteredEdge {
  return init(new FilteredEdge(), {
    id,
    source,
    target,
    ordinal,
    tags: new Map(),
    label: label === null ? [] : lab(label),
  });
}

function diagram(parts: { nodes?: FilteredNode[]; groups?: FilteredGroup[]; edges?: FilteredEdge[] }): FilteredDiagram {
  const byId = <T extends { id: string }>(items: T[] = []): Record<string, T> =>
    Object.fromEntries(items.map((i) => [i.id, i]));
  return init(new FilteredDiagram(), {
    id: 'd',
    nodes: byId(parts.nodes),
    groups: byId(parts.groups),
    edges: byId(parts.edges),
  });
}

function ok(d: FilteredDiagram, dir: 'TB' | 'BT' | 'LR' | 'RL' = 'LR'): string {
  const r = toMermaid(d, dir);
  if (r.kind !== 'ok') throw new Error(r.error);
  return r.value;
}

describe('toMermaid', () => {
  test('empty diagram', () => {
    expect(ok(diagram({}))).toBe('flowchart LR\n');
  });

  test('direction appears on the first line', () => {
    expect(ok(diagram({}), 'TB')).toBe('flowchart TB\n');
  });

  test('ids are opaque and assigned in sorted real-id order', () => {
    const b = 'file://a:b#c';
    const a = 'file://a\u001fz';
    const d = diagram({
      nodes: [node(b, 'B'), node(a, 'A')],
      edges: [edge('e1', b, a, 0, 'calls')],
    });
    const out = ok(d);
    expect(out).toBe('flowchart LR\n  n0["A"]\n  n1["B"]\n  n1 -->|"calls"| n0\n');
    expect(out).not.toContain(a);
    expect(out).not.toContain(b);
    expect(out).not.toContain('e1');
  });

  test('open container becomes a subgraph, nested containers indent deeper', () => {
    const d = diagram({
      groups: [group('g1', 'Outer'), group('g2', 'Inner', { parentGroup: 'g1' })],
      nodes: [node('x', 'X', 'g2'), node('y', 'Y', 'g1')],
    });
    expect(ok(d)).toBe(
      [
        'flowchart LR',
        '  subgraph n0["Outer"]',
        '    subgraph n1["Inner"]',
        '      n2["X"]',
        '    end',
        '    n3["Y"]',
        '  end',
        '',
      ].join('\n'),
    );
  });

  test('empty open container yields an empty subgraph', () => {
    expect(ok(diagram({ groups: [group('g', 'G')] }))).toBe('flowchart LR\n  subgraph n0["G"]\n  end\n');
  });

  test('closed block renders as a subroutine with a hidden count', () => {
    const d = diagram({ groups: [group('g', 'Name', { block: true, hidden: 4 })] });
    expect(ok(d)).toBe('flowchart LR\n  n0[["Name (+4)"]]\n');
    const z = diagram({ groups: [group('g', 'Name', { block: true, hidden: 0 })] });
    expect(ok(z)).toBe('flowchart LR\n  n0[["Name"]]\n');
  });

  test('edge labels are escaped, bundled labels survive, empty labels are plain', () => {
    const d = diagram({
      nodes: [node('a', 'A'), node('b', 'B')],
      edges: [
        edge('e1', 'a', 'b', 0, 'say "hi"'),
        edge('e2', 'a', 'b', 1, 'calls ×2'),
        edge('e3', 'a', 'b', 2, ''),
        edge('e4', 'a', 'b', 3, null),
      ],
    });
    expect(ok(d)).toBe(
      [
        'flowchart LR',
        '  n0["A"]',
        '  n1["B"]',
        '  n0 -->|"say #quot;hi#quot;"| n1',
        '  n0 -->|"calls ×2"| n1',
        '  n0 --> n1',
        '  n0 --> n1',
        '',
      ].join('\n'),
    );
  });

  test('edges to an open container point at its subgraph id', () => {
    const d = diagram({
      groups: [group('g', 'G')],
      nodes: [node('c', 'C', 'g'), node('o', 'O')],
      edges: [edge('e1', 'o', 'g', 0, null), edge('e2', 'c', 'g', 1, null)],
    });
    expect(ok(d)).toBe(
      [
        'flowchart LR',
        '  subgraph n1["G"]',
        '    n0["C"]',
        '  end',
        '  n2["O"]',
        '  n2 --> n1',
        '  n0 --> n1',
        '',
      ].join('\n'),
    );
  });

  test('self-loop and parallel author edges are kept', () => {
    const d = diagram({
      nodes: [node('a', 'A'), node('b', 'B')],
      edges: [edge('e1', 'a', 'a', 0, null), edge('e2', 'a', 'b', 1, 'x'), edge('e3', 'a', 'b', 2, 'x')],
    });
    const out = ok(d);
    expect(out).toContain('  n0 --> n0\n');
    expect(out.match(/n0 -->\|"x"\| n1/g)?.length).toBe(2);
  });

  test('edges sort by ordinal then id', () => {
    const d = diagram({
      nodes: [node('a', 'A'), node('b', 'B')],
      edges: [edge('z', 'a', 'b', 0, 'first'), edge('m', 'b', 'a', 0, 'second'), edge('a', 'a', 'b', 1, 'third')],
    });
    const lines = ok(d).split('\n').filter((l) => l.includes('-->'));
    expect(lines).toEqual(['  n1 -->|"second"| n0', '  n0 -->|"first"| n1', '  n0 -->|"third"| n1']);
  });

  test('unlabelled node prints its escaped id; empty label stays empty', () => {
    const d = diagram({ nodes: [node('a#b', null), node('c', '')] });
    expect(ok(d)).toBe('flowchart LR\n  n0["a#35;b"]\n  n1[""]\n');
  });

  test('unlabelled group prints its id', () => {
    expect(ok(diagram({ groups: [group('g<1>', null)] }))).toBe(
      'flowchart LR\n  subgraph n0["g#lt;1#gt;"]\n  end\n',
    );
  });

  test('an edge with a missing endpoint is an error naming the edge', () => {
    const d = diagram({ nodes: [node('a', 'A')], edges: [edge('edge-7', 'a', 'ghost', 0, null)] });
    const r = toMermaid(d, 'LR');
    expect(r.kind).toBe('err');
    if (r.kind === 'err') expect(r.error).toContain('edge-7');
  });

  test('is deterministic', () => {
    const build = () =>
      diagram({
        groups: [group('g', 'G')],
        nodes: [node('b', 'B', 'g'), node('a', 'A')],
        edges: [edge('e', 'a', 'b', 0, 'l')],
      });
    expect(ok(build())).toBe(ok(build()));
  });
});
