// SPDX-License-Identifier: AGPL-3.0-or-later

export function parsePredicate(expr: string): BindPredicate {
  const parts = expr.split('&&').map(s => s.trim());
  const predicates = parts.map(parseClause);
  return (a0) => predicates.every(p => p(a0));
}

function parseClause(clause: string): BindPredicate {
  const tagEq = /^tags\.(\w+)\s*==\s*'([^']*)'$/.exec(clause);
  if (tagEq !== null) {
    const key = tagEq[1];
    const val = tagEq[2];
    return (a0) => a0.tags[key] === val;
  }
  const parentEq = /^parent_group\s*==\s*'([^']*)'$/.exec(clause);
  if (parentEq !== null) {
    const val = parentEq[1];
    return (a0) => a0.parent_group === val;
  }
  const idSw = /^id\s+startsWith\s+'([^']*)'$/.exec(clause);
  if (idSw !== null) {
    const prefix = idSw[1];
    return (a0) => a0.id.startsWith(prefix);
  }
  throw new Error(`parsePredicate: unrecognised clause: ${clause}`);
}

export type BindPredicate = (a0: { id: string; tags: Record<string, string>; parent_group?: string }) => boolean;
