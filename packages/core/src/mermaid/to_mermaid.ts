// SPDX-License-Identifier: MPL-2.0

import { Err, Ok, Result } from '@archeglyph/proto/util/result';
import type { FilteredDiagram } from '../resolver/filtered_diagram';
import type { FilteredEdge } from '../resolver/filtered_edge';
import type { FilteredGroup } from '../resolver/filtered_group';
import type { FilteredNode } from '../resolver/filtered_node';
import { escapeLabel, labelOf } from './mermaid_text';

export type MermaidDirection = 'TB' | 'BT' | 'LR' | 'RL';

// An open container (`box`) is a subgraph; everything else, including a
// closed block, is one node.
function isOpen(group: FilteredGroup): boolean {
  return group.viewRole === 'box';
}

function byDefaultOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Opaque identifiers (`n0`, `n1`, ...) keep element ids, which may hold `:`,
// `/`, `#` or control characters, out of Mermaid's identifier syntax.
export function toMermaid(diagram: FilteredDiagram, direction: MermaidDirection): Result<string, string> {
  const ids = [...Object.keys(diagram.nodes), ...Object.keys(diagram.groups)].sort();
  const opaque = new Map<string, string>();
  ids.forEach((id, k) => opaque.set(id, `n${k}`));

  const edges = Object.values(diagram.edges);
  for (const e of edges) {
    for (const end of [e.source, e.target]) {
      if (!opaque.has(end)) {
        return Err(`edge '${e.id}' has an endpoint '${end}' that is not in the diagram`);
      }
    }
  }

  const children = new Map<string, string[]>();
  const roots: string[] = [];
  const place = (id: string, parent: string | undefined): void => {
    if (parent === undefined || parent === '' || !diagram.groups[parent]) {
      roots.push(id);
      return;
    }
    const list = children.get(parent);
    if (list === undefined) children.set(parent, [id]);
    else list.push(id);
  };
  for (const n of Object.values(diagram.nodes) as FilteredNode[]) place(n.id, n.parentGroup);
  for (const g of Object.values(diagram.groups) as FilteredGroup[]) place(g.id, g.parentGroup);

  const lines: string[] = [`flowchart ${direction}`];
  const emit = (id: string, depth: number): void => {
    const pad = '  '.repeat(depth);
    const name = opaque.get(id)!;
    const group = diagram.groups[id];
    if (group === undefined) {
      const text = escapeLabel(labelOf(diagram.nodes[id].label, id));
      lines.push(`${pad}${name}["${text}"]`);
    } else if (isOpen(group)) {
      lines.push(`${pad}subgraph ${name}["${escapeLabel(labelOf(group.label, id))}"]`);
      for (const child of (children.get(id) ?? []).sort(byDefaultOrder)) emit(child, depth + 1);
      lines.push(`${pad}end`);
    } else {
      const base = escapeLabel(labelOf(group.label, id));
      const text = group.hiddenDescendantCount > 0 ? `${base} (+${group.hiddenDescendantCount})` : base;
      lines.push(`${pad}${name}[["${text}"]]`);
    }
  };
  for (const id of roots.sort(byDefaultOrder)) emit(id, 1);

  const ordered = edges.sort((a: FilteredEdge, b: FilteredEdge) =>
    a.ordinal !== b.ordinal ? a.ordinal - b.ordinal : byDefaultOrder(a.id, b.id),
  );
  for (const e of ordered) {
    const text = labelOf(e.label, '');
    const arrow = text === '' ? '-->' : `-->|"${escapeLabel(text)}"|`;
    lines.push(`  ${opaque.get(e.source)!} ${arrow} ${opaque.get(e.target)!}`);
  }
  return Ok(lines.join('\n') + '\n');
}
