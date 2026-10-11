// SPDX-License-Identifier: MPL-2.0

// The parts of the pull request comment that need no git and no rendering:
// which diagrams a change touches, what a Delta says in words, and the markdown
// around them. Kept apart from pr_diagrams.ts so they can be tested.

export const MARKER = '<!-- archeglyph-diagrams -->';
export const SUFFIX = '.diag.json';
const STYLE_SUFFIX = '.style.json';
const THEME_SUFFIX = '.theme.json';

// Anything under these changes how every diagram renders, so every committed
// SVG has to be checked, not just the ones whose source moved.
const RENDER_PATHS: ReadonlyArray<string> = [
  'packages/core/',
  'packages/ops/',
  'packages/themes/',
  'packages/proto/',
  'proto/',
  'scripts/pr_diagrams.ts',
  'scripts/pr_comment.ts',
];

/**
 * The diagrams a pull request has to account for.
 *
 * A diagram's SVG goes stale when its own source changes, when its stylesheet
 * or a theme changes, or when the renderer does, so all four are followed. A
 * stylesheet is paired to its diagram by the file convention
 * (`x.style.json` styles `x.diag.json`).
 */
export function selectDiagrams(changed: ReadonlyArray<string>, tracked: ReadonlyArray<string>): string[] {
  const diagrams = tracked.filter((path: string): boolean => path.endsWith(SUFFIX));
  const everything: boolean = changed.some(
    (path: string): boolean =>
      path.endsWith(THEME_SUFFIX) || RENDER_PATHS.some((prefix: string): boolean => path.startsWith(prefix)),
  );
  if (everything) {
    return [...diagrams].sort();
  }
  const picked = new Set<string>();
  for (const path of changed) {
    if (path.endsWith(SUFFIX) && diagrams.includes(path)) {
      picked.add(path);
    } else if (path.endsWith(STYLE_SUFFIX)) {
      const sibling = `${path.slice(0, -STYLE_SUFFIX.length)}${SUFFIX}`;
      if (diagrams.includes(sibling)) {
        picked.add(sibling);
      }
    }
  }
  return [...picked].sort();
}

interface Labelled {
  label?: Array<{ source?: string }>;
}

interface ElementDeltaJson {
  elementId: string;
  changeType: string;
  before?: Labelled;
  after?: Labelled;
}

interface EdgeDeltaJson {
  edgeId: string;
  changeType: string;
  before?: { source?: string; target?: string };
  after?: { source?: string; target?: string };
}

interface DeltaJson {
  elementDeltas?: ElementDeltaJson[];
  edgeDeltas?: EdgeDeltaJson[];
}

export interface Change {
  kind: 'added' | 'removed' | 'changed';
  what: string;
}

export interface DeltaSummary {
  elements: { added: number; removed: number; changed: number };
  edges: { added: number; removed: number; changed: number };
  changes: Change[];
}

const KIND_OF: Record<string, Change['kind'] | undefined> = {
  ADDED: 'added',
  DELETED: 'removed',
  MODIFIED: 'changed',
};

function elementName(delta: ElementDeltaJson): string {
  const side = delta.after ?? delta.before;
  const label = side?.label?.[0]?.source;
  return label !== undefined && label !== delta.elementId ? `${label} (${delta.elementId})` : delta.elementId;
}

function edgeName(delta: EdgeDeltaJson): string {
  const side = delta.after ?? delta.before;
  return side?.source !== undefined && side.target !== undefined
    ? `${side.source} → ${side.target}`
    : delta.edgeId;
}

/** What a Delta says, counted and listed, without the unchanged entries. */
export function summarizeDelta(delta: DeltaJson): DeltaSummary {
  const summary: DeltaSummary = {
    elements: { added: 0, removed: 0, changed: 0 },
    edges: { added: 0, removed: 0, changed: 0 },
    changes: [],
  };
  for (const entry of delta.elementDeltas ?? []) {
    const kind = KIND_OF[entry.changeType];
    if (kind !== undefined) {
      summary.elements[kind] += 1;
      summary.changes.push({ kind, what: elementName(entry) });
    }
  }
  for (const entry of delta.edgeDeltas ?? []) {
    const kind = KIND_OF[entry.changeType];
    if (kind !== undefined) {
      summary.edges[kind] += 1;
      summary.changes.push({ kind, what: `edge ${edgeName(entry)}` });
    }
  }
  return summary;
}

function counts(label: string, c: { added: number; removed: number; changed: number }): string | undefined {
  if (c.added + c.removed + c.changed === 0) {
    return undefined;
  }
  const parts: string[] = [];
  if (c.added > 0) { parts.push(`+${String(c.added)}`); }
  if (c.removed > 0) { parts.push(`−${String(c.removed)}`); }
  if (c.changed > 0) { parts.push(`~${String(c.changed)}`); }
  return `${parts.join(' ')} ${label}`;
}

/** One line: `+2 −1 ~3 elements, +4 edges`, or why there is nothing to say. */
export function describe(summary: DeltaSummary): string {
  const parts = [counts('elements', summary.elements), counts('edges', summary.edges)]
    .filter((part): part is string => part !== undefined);
  return parts.length === 0 ? 'no structural change (layout or style only)' : parts.join(', ');
}

export type Status = 'current' | 'stale' | 'missing';

export interface Entry {
  diagram: string;
  svg: string;
  status: Status;
  /** The diagram as the base commit had it; absent for a new diagram. */
  base?: {
    /** Whether the base commit also committed the SVG beside it. */
    hasSvg: boolean;
    /** Whether the SVG now differs from the base's, byte for byte. */
    svgChanged: boolean;
    summary: DeltaSummary;
  };
}

export interface Context {
  repo: string;
  /** The head commit; every link in the comment is pinned to it. */
  sha: string;
  /** The commit the pull request branched from; pins the "before" side. */
  baseSha?: string;
  pr?: string;
  editor: string;
}

const LIST_LIMIT = 20;
const SIGN: Record<Change['kind'], string> = { added: '+', removed: '−', changed: '~' };

function rawUrl(ctx: Context, ref: string, path: string): string {
  return `https://raw.githubusercontent.com/${ctx.repo}/${ref}/${path}`;
}

/**
 * The editor, opened on this diagram as the pull request leaves it. `ref` is
 * the head SHA rather than the branch, so the link keeps showing what the
 * comment described; `pr` makes the editor read this pull request's review
 * comments too.
 */
export function editorUrl(ctx: Context, diagram: string): string {
  const query: string[] = [`gh=${ctx.repo}`, `path=${diagram}`, `ref=${ctx.sha}`];
  if (ctx.pr !== undefined) {
    query.push(`pr=${ctx.repo}/${ctx.pr}`, 'review=open');
  }
  return `${ctx.editor}?${query.join('&')}`;
}

/** The editor in diff mode: the base commit's diagram against the head's. */
export function compareUrl(ctx: Context, diagram: string): string {
  const baseSha = ctx.baseSha ?? '';
  const query: string[] = [
    `gh=${ctx.repo}`, `path=${diagram}`, `ref=${ctx.sha}`,
    `base_gh=${ctx.repo}`, `base_path=${diagram}`, `base_ref=${baseSha}`,
  ];
  if (ctx.pr !== undefined) {
    query.push(`pr=${ctx.repo}/${ctx.pr}`, 'review=open');
  }
  return `${ctx.editor}?${query.join('&')}`;
}

function changeList(summary: DeltaSummary): string[] {
  const shown = summary.changes.slice(0, LIST_LIMIT);
  const lines = shown.map((change: Change): string => `- ${SIGN[change.kind]} ${change.what}`);
  const more = summary.changes.length - shown.length;
  if (more > 0) {
    lines.push(`- …and ${String(more)} more`);
  }
  return lines;
}

function pictures(ctx: Context, entry: Entry): string[] {
  const after = `<img src="${rawUrl(ctx, ctx.sha, entry.svg)}" width="${entry.base?.hasSvg === true ? '420' : '640'}" alt="${entry.diagram} after">`;
  if (entry.base?.hasSvg !== true || ctx.baseSha === undefined) {
    return [after, ''];
  }
  const before = `<img src="${rawUrl(ctx, ctx.baseSha, entry.svg)}" width="420" alt="${entry.diagram} before">`;
  return [
    '| Before | After |',
    '| :---: | :---: |',
    `| ${before} | ${after} |`,
    '',
  ];
}

function regenerate(entry: Entry): string {
  return `Run \`bun run archeglyph render --diagram ${entry.diagram} --out ${entry.svg}\` and commit it.`;
}

/**
 * Nothing to look at: no structural change and the picture is byte-identical.
 * This is what most diagrams are when a change to the renderer or a theme has
 * them all re-checked, and a before/after of two identical pictures says nothing.
 */
function isUnchanged(entry: Entry): boolean {
  return entry.status === 'current' && entry.base !== undefined &&
    entry.base.hasSvg && !entry.base.svgChanged && entry.base.summary.changes.length === 0;
}

/** The markdown for one comment covering every entry. */
export function buildBody(ctx: Context, entries: ReadonlyArray<Entry>): string {
  const lines: string[] = [MARKER, '### Diagrams', ''];
  for (const entry of entries) {
    lines.push(`**\`${entry.diagram}\`**`, '');
    if (entry.status === 'missing') {
      lines.push(`> No \`${entry.svg}\` is committed, so there is nothing to show here.`, `> ${regenerate(entry)}`, '');
      continue;
    }
    if (entry.status === 'stale') {
      lines.push(`> \`${entry.svg}\` no longer matches its source, so the picture below is out of date.`, `> ${regenerate(entry)}`, '');
    }

    if (isUnchanged(entry)) {
      lines.push('Unchanged.', '', `[Open in the editor](${editorUrl(ctx, entry.diagram)})`, '');
      continue;
    }

    if (entry.base === undefined) {
      lines.push('New diagram.', '');
    } else {
      lines.push(`${describe(entry.base.summary)}.`, '');
    }
    lines.push(...pictures(ctx, entry));

    if (entry.base !== undefined && entry.base.summary.changes.length > 0) {
      lines.push(
        '<details><summary>What changed</summary>',
        '',
        ...changeList(entry.base.summary),
        '',
        '</details>',
        '',
      );
    }
    const links: string[] = [`[Open in the editor](${editorUrl(ctx, entry.diagram)})`];
    if (entry.base !== undefined && ctx.baseSha !== undefined) {
      links.push(`[Compare with the base in the editor](${compareUrl(ctx, entry.diagram)})`);
    }
    lines.push(links.join(' · '), '');
  }
  // Pinned to this commit, so the pictures stay what the comment described.
  lines.push(`<sub>Rendered from \`${ctx.sha.slice(0, 7)}\` by archeglyph.</sub>`);
  return lines.join('\n');
}
