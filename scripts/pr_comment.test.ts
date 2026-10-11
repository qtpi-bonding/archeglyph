// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import {
  buildBody,
  compareUrl,
  describe as describeSummary,
  editorUrl,
  MARKER,
  selectDiagrams,
  summarizeDelta,
  type Context,
  type DeltaSummary,
  type Entry,
} from './pr_comment';

const ctx: Context = {
  repo: 'o/r',
  sha: 'headsha1234567',
  baseSha: 'basesha7654321',
  pr: '7',
  editor: 'https://ed.example/',
};

const tracked = [
  'examples/a.diag.json',
  'examples/b.diag.json',
  'docs/c.diag.json',
  'examples/a.style.json',
  'README.md',
];

describe('selectDiagrams', () => {
  test('a changed diagram is picked on its own', () => {
    expect(selectDiagrams(['examples/a.diag.json'], tracked)).toEqual(['examples/a.diag.json']);
  });

  test('a changed stylesheet picks the diagram it styles, which the old filter missed', () => {
    expect(selectDiagrams(['examples/a.style.json'], tracked)).toEqual(['examples/a.diag.json']);
  });

  test('a stylesheet with no diagram beside it picks nothing', () => {
    expect(selectDiagrams(['examples/z.style.json'], tracked)).toEqual([]);
  });

  test('a theme change re-checks every diagram', () => {
    expect(selectDiagrams(['themes/x.theme.json'], tracked)).toEqual([
      'docs/c.diag.json', 'examples/a.diag.json', 'examples/b.diag.json',
    ]);
  });

  test.each(['packages/core/src/layout/x.ts', 'packages/themes/src/index.ts', 'proto/style.proto', 'scripts/pr_diagrams.ts'])(
    'a change to the renderer (%s) re-checks every diagram',
    (path) => {
      expect(selectDiagrams([path], tracked)).toHaveLength(3);
    },
  );

  test('an unrelated change picks nothing', () => {
    expect(selectDiagrams(['README.md', 'packages/editor/src/x.ts'], tracked)).toEqual([]);
  });

  test('a deleted diagram, which is no longer tracked, is not picked', () => {
    expect(selectDiagrams(['examples/gone.diag.json'], tracked)).toEqual([]);
  });

  test('the same diagram changed twice over is listed once', () => {
    expect(selectDiagrams(['examples/a.diag.json', 'examples/a.style.json'], tracked)).toEqual(['examples/a.diag.json']);
  });
});

describe('summarizeDelta', () => {
  const delta = {
    elementDeltas: [
      { elementId: 'new', changeType: 'ADDED', after: { label: [{ source: 'New thing' }] } },
      { elementId: 'gone', changeType: 'DELETED', before: { label: [{ source: 'gone' }] } },
      { elementId: 'edit', changeType: 'MODIFIED', before: {}, after: { label: [{ source: 'Edited' }] } },
      { elementId: 'same', changeType: 'UNCHANGED' },
    ],
    edgeDeltas: [
      { edgeId: 'e1', changeType: 'ADDED', after: { source: 'a', target: 'b' } },
      { edgeId: 'e2', changeType: 'DELETED', before: { source: 'c', target: 'd' } },
    ],
  };
  const summary = summarizeDelta(delta);

  test('counts each kind of change and ignores the unchanged', () => {
    expect(summary.elements).toEqual({ added: 1, removed: 1, changed: 1 });
    expect(summary.edges).toEqual({ added: 1, removed: 1, changed: 0 });
    expect(summary.changes).toHaveLength(5);
  });

  test('names an element by its label and id, or by id alone when they agree', () => {
    const names = summary.changes.map((c) => c.what);
    expect(names).toContain('New thing (new)');
    expect(names).toContain('gone');
    expect(names).toContain('Edited (edit)');
  });

  test('names an edge by its endpoints', () => {
    const names = summary.changes.map((c) => c.what);
    expect(names).toContain('edge a → b');
    expect(names).toContain('edge c → d');
  });

  test('an empty delta says nothing structural changed', () => {
    expect(describeSummary(summarizeDelta({}))).toBe('no structural change (layout or style only)');
  });

  test('the one-line description gives signs and counts', () => {
    expect(describeSummary(summary)).toBe('+1 −1 ~1 elements, +1 −1 edges');
  });
});

describe('links', () => {
  test('the editor link is pinned to the head commit and carries the review', () => {
    const url = editorUrl(ctx, 'examples/a.diag.json');
    expect(url).toContain('ref=headsha1234567');
    expect(url).toContain('pr=o/r/7');
  });

  test('the compare link names the base commit as well as the head', () => {
    const url = compareUrl(ctx, 'examples/a.diag.json');
    expect(url).toContain('ref=headsha1234567');
    expect(url).toContain('base_gh=o/r');
    expect(url).toContain('base_path=examples/a.diag.json');
    expect(url).toContain('base_ref=basesha7654321');
  });
});

const summary: DeltaSummary = {
  elements: { added: 1, removed: 0, changed: 0 },
  edges: { added: 0, removed: 0, changed: 0 },
  changes: [{ kind: 'added', what: 'cache' }],
};

const changed: Entry = {
  diagram: 'examples/a.diag.json',
  svg: 'examples/a.svg',
  status: 'current',
  base: { hasSvg: true, svgChanged: true, summary },
};

describe('buildBody', () => {
  test('starts with the marker the workflow finds its own comment by', () => {
    expect(buildBody(ctx, [changed]).startsWith(MARKER)).toBe(true);
  });

  test('a changed diagram shows before and after side by side, each pinned to its commit', () => {
    const body = buildBody(ctx, [changed]);
    expect(body).toContain('| Before | After |');
    expect(body).toContain('raw.githubusercontent.com/o/r/basesha7654321/examples/a.svg');
    expect(body).toContain('raw.githubusercontent.com/o/r/headsha1234567/examples/a.svg');
    expect(body).toContain('+1 elements');
    expect(body).toContain('- + cache');
    expect(body).toContain('Compare with the base in the editor');
  });

  test('a new diagram shows only the after picture and no compare link', () => {
    const body = buildBody(ctx, [{ diagram: 'x.diag.json', svg: 'x.svg', status: 'current' }]);
    expect(body).toContain('New diagram.');
    expect(body).not.toContain('Before');
    expect(body).not.toContain('Compare with the base');
  });

  test('a diagram whose base had no committed svg shows only the after picture', () => {
    const body = buildBody(ctx, [{ ...changed, base: { hasSvg: false, svgChanged: true, summary } }]);
    expect(body).not.toContain('| Before | After |');
    expect(body).toContain('headsha1234567/examples/a.svg');
  });

  test('a diagram that did not change at all collapses to one line with no pictures', () => {
    const none: DeltaSummary = { elements: { added: 0, removed: 0, changed: 0 }, edges: { added: 0, removed: 0, changed: 0 }, changes: [] };
    const body = buildBody(ctx, [{ ...changed, base: { hasSvg: true, svgChanged: false, summary: none } }]);
    expect(body).toContain('Unchanged.');
    expect(body).not.toContain('<img');
    expect(body).toContain('Open in the editor');
  });

  test('an unchanged picture still shows when the svg is stale, so the warning has something to point at', () => {
    const none: DeltaSummary = { elements: { added: 0, removed: 0, changed: 0 }, edges: { added: 0, removed: 0, changed: 0 }, changes: [] };
    const body = buildBody(ctx, [{ ...changed, status: 'stale', base: { hasSvg: true, svgChanged: false, summary: none } }]);
    expect(body).not.toContain('Unchanged.');
    expect(body).toContain('no longer matches its source');
  });

  test('a style-only change says so and lists nothing', () => {
    const none: DeltaSummary = { elements: { added: 0, removed: 0, changed: 0 }, edges: { added: 0, removed: 0, changed: 0 }, changes: [] };
    const body = buildBody(ctx, [{ ...changed, base: { hasSvg: true, svgChanged: true, summary: none } }]);
    expect(body).toContain('no structural change');
    expect(body).not.toContain('What changed');
  });

  test('a stale svg is called out and still shown', () => {
    const body = buildBody(ctx, [{ ...changed, status: 'stale' }]);
    expect(body).toContain('no longer matches its source');
    expect(body).toContain('examples/a.svg');
    expect(body).toContain('bun run archeglyph render --diagram examples/a.diag.json');
  });

  test('a missing svg shows no picture and says how to make one', () => {
    const body = buildBody(ctx, [{ ...changed, status: 'missing' }]);
    expect(body).toContain('is committed, so there is nothing to show');
    expect(body).not.toContain('<img');
  });

  test('a long list of changes is cut off with a count of the rest', () => {
    const many: DeltaSummary = {
      ...summary,
      changes: Array.from({ length: 25 }, (_, i) => ({ kind: 'added' as const, what: `n${String(i)}` })),
    };
    const body = buildBody(ctx, [{ ...changed, base: { hasSvg: true, svgChanged: true, summary: many } }]);
    expect(body).toContain('n19');
    expect(body).not.toContain('n20');
    expect(body).toContain('…and 5 more');
  });

  test('every diagram in the pull request gets a section', () => {
    const body = buildBody(ctx, [changed, { ...changed, diagram: 'examples/b.diag.json', svg: 'examples/b.svg' }]);
    expect(body).toContain('**`examples/a.diag.json`**');
    expect(body).toContain('**`examples/b.diag.json`**');
  });
});
