// SPDX-License-Identifier: AGPL-3.0-or-later

import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from './seed_bindings';

// Tests for the style resolver pillar: visibility_filter, style_cascade,
// token_resolver, and the request/result types around them.
//
// Expectations are derived from, in order:
//   1. docs/design.md §5.1 "Resolver" (visibility pre-pass + cascade order),
//      §2.8/§2.9 (presentation-only, file-determined), §4 (theme/tokens).
//   2. proto/style.proto + proto/theme.proto field comments.
//   3. .archegraph/specs/resolver/*.spec.textproto.
//
// Implementation files (impl.ts) were read ONLY for signatures, import
// paths, and field names (camelCase, oneof shapes, etc) — never to derive
// what a test should expect. Where a test fails, it is left failing; see
// the final chat report for the design.md/proto line it is grounded in,
// what actually happened, and the implementation file:line responsible.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationAnchorSchema,
  AnnotationEntrySchema,
  ColorSchema,
  FillSchema,
  Glyph1DSchema,
  Glyph2DSchema,
  GlowSchema,
  GroupLayoutSchema,
  GroupRenderMode,
  GroupStyleEntrySchema,
  type NodeStyleEntry,
  NodeLayoutSchema,
  NodeStyleEntrySchema,
  NodeVisibility,
  RefKind,
  ShapeType,
  StrokeSchema,
  StylesheetSchema,
  TypographySchema,
} from '@archeglyph/proto/gen/style_pb';
import {
  FontSpecSchema,
  NodeComponentSchema,
  type Theme,
  ThemeSchema,
  TokensSchema,
} from '@archeglyph/proto/gen/theme_pb';
import { resolvePipeline } from '../pipeline';
import { CascadeRequest } from './cascade_request';
import { FilterRequest } from './filter_request';
import { ResolveTokensRequest } from './resolve_tokens_request';
import { StyleCascadeImpl } from './style_cascade';
import { TokenResolverImpl } from './token_resolver';
import { VisibilityFilterImpl } from './visibility_filter';

const filterImpl = new VisibilityFilterImpl();
const cascadeImpl = new StyleCascadeImpl();
const tokenImpl = new TokenResolverImpl();

function filterReq(diagram: unknown, stylesheet?: unknown): FilterRequest {
  return Object.assign(new FilterRequest(), { diagram, stylesheet });
}

// ============================================================================
// visibility_filter
//
// Grounded in design.md §5.1 "Visibility / render-mode pre-pass":
//   - Nodes: HIDDEN -> node and all its incident edges skipped.
//   - Edges: no separate visibility; an edge renders iff both endpoints
//     visible.
//   - Groups: BOUNDED (default) -> kept as-is; EXPANDED -> group omitted,
//     children re-parented; CONTRACTED -> single super-node, descendants
//     omitted, cross-boundary edges terminate at the super-node.
// Also .archegraph/specs/resolver/visibility_filter.spec.textproto, which
// restates the same four transformations.
// ============================================================================

describe('visibility_filter', () => {
  test('no stylesheet is a no-op pass-through (design.md: "absent stylesheet means no visibility decisions to apply")', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: { a: { label: [], tags: {} }, b: { label: [], tags: {} } },
        edges: { ab: { source: 'a', target: 'b', label: [], ordinal: 0, tags: {} } },
        groups: {},
      },
    });
    const result = filterImpl.filter(filterReq(diagram, undefined));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.keys(result.value.nodes).sort()).toEqual(['a', 'b']);
      expect(Object.keys(result.value.edges)).toEqual(['ab']);
      expect(result.value.groups).toEqual({});
      expect(result.value.annotations).toEqual({});
    }
  });

  test('HIDDEN node vanishes along with its incident edges (proto: "vanish; edges incident to this node also disappear")', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: {
          a: { label: [], tags: {} },
          b: { label: [], tags: {} },
          c: { label: [], tags: {} },
        },
        edges: {
          ab: { source: 'a', target: 'b', label: [], ordinal: 0, tags: {} },
          bc: { source: 'b', target: 'c', label: [], ordinal: 0, tags: {} },
        },
        groups: {},
      },
    });
    const stylesheet = create(StylesheetSchema, {
      nodes: { b: create(NodeStyleEntrySchema, { visibility: NodeVisibility.HIDDEN }) },
    });
    const result = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.keys(result.value.nodes)).toEqual(['a', 'c']);
      // Both edges are incident to the hidden node b, so both must be dropped
      // — there is no "direct edge A->C pretending B doesn't exist" per §2.8.
      expect(result.value.edges).toEqual({});
    }
  });

  test('unset visibility (UNSPECIFIED) renders normally (proto: "NODE_VISIBILITY_UNSPECIFIED = 0; // visible (default)")', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: { a: { label: [], tags: {} } },
        edges: {},
        groups: {},
      },
    });
    const stylesheet = create(StylesheetSchema, {
      nodes: { a: create(NodeStyleEntrySchema, { visibility: NodeVisibility.UNSPECIFIED }) },
    });
    const result = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.keys(result.value.nodes)).toEqual(['a']);
    }
  });

  test('EXPANDED group: group entry omitted, children re-parented up (design.md: "boundary not rendered ... group\'s spatial extent absorbed")', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: { a: { label: [], tags: {}, parentGroup: 'g1' } },
        edges: {},
        groups: { g1: { label: [], tags: {} } }, // top-level, no parent
      },
    });
    const stylesheet = create(StylesheetSchema, {
      groups: {
        g1: create(GroupStyleEntrySchema, {
          layout: create(GroupLayoutSchema, { renderMode: GroupRenderMode.EXPANDED }),
        }),
      },
    });
    const result = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.groups).toEqual({});
      expect(Object.keys(result.value.nodes)).toHaveLength(1);
      // Lifted up through the EXPANDED group to its (nonexistent) parent —
      // i.e. becomes top-level.
      expect(Object.values(result.value.nodes)[0].parentGroup).toBeUndefined();
    }
  });

  test('CONTRACTED group: kept as a super-node, descendants omitted, incident edges re-point to it (design.md: "single super-node; children hidden; cross-boundary edges terminate at the super-node")', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: {
          outside: { label: [], tags: {} },
          inner1: { label: [], tags: {}, parentGroup: 'g1' },
          inner2: { label: [], tags: {}, parentGroup: 'g1' },
        },
        edges: {
          e1: { source: 'outside', target: 'inner1', label: [], ordinal: 0, tags: {} },
          e2: { source: 'inner1', target: 'inner2', label: [], ordinal: 0, tags: {} },
        },
        groups: { g1: { label: [], tags: {} } },
      },
    });
    const stylesheet = create(StylesheetSchema, {
      groups: {
        g1: create(GroupStyleEntrySchema, {
          layout: create(GroupLayoutSchema, { renderMode: GroupRenderMode.CONTRACTED }),
        }),
      },
    });
    const result = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.keys(result.value.nodes)).toEqual(['outside']);
      expect(Object.keys(result.value.groups)).toHaveLength(1);
      const g = Object.values(result.value.groups)[0];
      expect(g.id).toBe('g1');
      expect(g.isSuperNode).toBe(true);
      expect(g.hiddenDescendantCount).toBe(2);
      // e1 (outside -> inner1) re-points its target to the super-node.
      // e2 (inner1 -> inner2) is now fully internal to the contracted group
      // and per "children hidden" should not appear as a visible edge
      // between two hidden nodes collapsed onto the SAME super-node id.
      const e1 = result.value.edges['e1'];
      expect(e1?.target).toBe('g1');
      const e2 = result.value.edges['e2'];
      expect(e2).toBeUndefined();
    }
  });

  test('nested groups: node inside a CONTRACTED inner group nested in a BOUNDED outer group is absorbed by the inner (immediate) contraction, outer stays intact', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: {
          leaf: { label: [], tags: {}, parentGroup: 'inner' },
        },
        edges: {},
        groups: {
          outer: { label: [], tags: {} },
          inner: { label: [], tags: {}, parentGroup: 'outer' },
        },
      },
    });
    const stylesheet = create(StylesheetSchema, {
      groups: {
        inner: create(GroupStyleEntrySchema, {
          layout: create(GroupLayoutSchema, { renderMode: GroupRenderMode.CONTRACTED }),
        }),
        // outer left BOUNDED (default) — should stay as a normal group.
      },
    });
    const result = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.nodes).toEqual({}); // leaf absorbed
      const groupIds = Object.keys(result.value.groups).sort();
      expect(groupIds).toEqual(['inner', 'outer']);
      const outer = result.value.groups['outer'];
      expect(outer?.isSuperNode).toBe(false);
      const inner = result.value.groups['inner'];
      expect(inner?.isSuperNode).toBe(true);
      expect(inner?.parentGroup).toBe('outer');
    }
  });

  test('unknown parent_group reference is an error, not a silent drop', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: { a: { label: [], tags: {}, parentGroup: 'ghost' } },
        edges: {},
        groups: {},
      },
    });
    const result = filterImpl.filter(filterReq(diagram, undefined));
    expect(result.kind).toBe('err');
  });

  test('annotations pass through verbatim from the stylesheet regardless of node/group visibility (proto: "No visibility field on AnnotationEntry")', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: { nodes: {}, edges: {}, groups: {} },
    });
    const stylesheet = create(StylesheetSchema, {
      annotations: {
        note1: create(AnnotationEntrySchema, { content: [] }),
      },
    });
    const result = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.keys(result.value.annotations)).toEqual(['note1']);
    }
  });
});

// ============================================================================
// style_cascade
//
// Grounded in design.md §5.1 "Cascade (for visible elements)":
//   1. Theme name-bound component — if the style entry has component: "X",
//      find the theme component named "X" and layer its glyphs on top.
//      **"If component is unset, no theme component applies — the element
//      starts unstyled."**
//   2. Per-element override — layer shape/connection/typography/callout
//      fields on top. "Wins over the bound theme component for the same
//      field."
//   Cascade is per-field: different fields compose, same field -> later
//   (more specific) layer wins.
// ============================================================================

describe('style_cascade', () => {
  test('per-element override wins over theme component for the SAME field (design.md: "Wins over the bound theme component for the same field")', () => {
    const filtered = filterImpl.filter(
      filterReq(
        create(DiagramSchema, { id: 'd1', graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} } }),
        undefined,
      ),
    );
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    const stylesheet = create(StylesheetSchema, {
      nodes: {
        a: create(NodeStyleEntrySchema, {
          component: 'themed',
          shape: create(Glyph2DSchema, {
            fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#OVERRIDE' }) } }),
          }),
        }),
      },
    });
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, {}),
      nodeComponents: [
        create(NodeComponentSchema, {
          name: 'themed',
          shape: create(Glyph2DSchema, {
            fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#THEME' }) } }),
            glow: create(GlowSchema, { radius: 4 }),
          }),
        }),
      ],
    });

    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet, theme }),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      const node = Object.values(result.value.nodes)[0];
      // Same field (fill.color) — override wins.
      expect(node.shape.fill?.paint.case).toBe('color');
      expect(node.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '#OVERRIDE' }));
      // Different field (glow) only set by the theme layer — must still
      // come through (field-level composition, design.md: "different
      // fields compose").
      expect(node.shape.glow?.radius).toBe(4);
    }
  });

  test('element with an unset component starts unstyled, even if the theme happens to define components (design.md: "If component is unset, no theme component applies — the element starts unstyled")', () => {
    const filtered = filterImpl.filter(
      filterReq(
        create(DiagramSchema, { id: 'd1', graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} } }),
        undefined,
      ),
    );
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    // No stylesheet entry at all for node 'a' -> component is unset by
    // construction. The theme defines an UNRELATED component under a name
    // ('glyph') that a correct implementation must never reach for merely
    // because component was left unset.
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, {}),
      nodeComponents: [
        create(NodeComponentSchema, {
          name: 'glyph',
          shape: create(Glyph2DSchema, {
            fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#SHOULD_NOT_APPLY' }) } }),
          }),
        }),
      ],
    });

    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet: undefined, theme }),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      const node = Object.values(result.value.nodes)[0];
      expect(node.shape.fill).toBeUndefined();
    }
  });

  test('component naming a theme component that does not exist is an error (design.md cascade step 1: component must match a theme component by name)', () => {
    const filtered = filterImpl.filter(
      filterReq(
        create(DiagramSchema, { id: 'd1', graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} } }),
        undefined,
      ),
    );
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    const stylesheet = create(StylesheetSchema, {
      nodes: { a: create(NodeStyleEntrySchema, { component: 'does_not_exist' }) },
    });
    const theme = create(ThemeSchema, { name: 't', tokens: create(TokensSchema, {}) });

    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet, theme }),
    );
    expect(result.kind).toBe('err');
  });

  test('absent theme: cascade starts from per-element override layer only, no error (spec: "absent theme -> cascade starts from per-element override layer (or empty)")', () => {
    const filtered = filterImpl.filter(
      filterReq(
        create(DiagramSchema, { id: 'd1', graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} } }),
        undefined,
      ),
    );
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    const stylesheet = create(StylesheetSchema, {
      nodes: {
        a: create(NodeStyleEntrySchema, {
          shape: create(Glyph2DSchema, { shapeKind: { case: 'standard', value: ShapeType.SHAPE_ELLIPSE } }),
        }),
      },
    });

    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet, theme: undefined }),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      const node = Object.values(result.value.nodes)[0];
      expect(node.shape.shapeKind.case).toBe('standard');
      expect(node.shape.shapeKind.value).toBe(ShapeType.SHAPE_ELLIPSE);
    }
  });

  test('empty stylesheet and empty theme: element resolves to a defined-but-empty glyph, no crash', () => {
    const filtered = filterImpl.filter(
      filterReq(
        create(DiagramSchema, { id: 'd1', graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} } }),
        undefined,
      ),
    );
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    const emptyStylesheet = create(StylesheetSchema, {});
    const emptyTheme = create(ThemeSchema, { name: 'empty', tokens: create(TokensSchema, {}) });

    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet: emptyStylesheet, theme: emptyTheme }),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.keys(result.value.nodes)).toHaveLength(1);
      expect(Object.values(result.value.nodes)[0].shape.shapeKind.case).toBeUndefined();
    }
  });

  test('annotation without an anchor gets no callout, even if the stylesheet entry sets one (resolved_annotation spec: "Callout glyph is only populated when the annotation is anchored ... free annotations get a default-constructed callout that the renderer treats as no callout")', () => {
    const diagram = create(DiagramSchema, { id: 'd1', graph: { nodes: {}, edges: {}, groups: {} } });
    const stylesheet = create(StylesheetSchema, {
      annotations: {
        note1: create(AnnotationEntrySchema, {
          content: [],
          // No anchor set.
          callout: create(Glyph1DSchema, {
            stroke: create(StrokeSchema, { width: 3 }),
          }),
        }),
      },
    });
    const filtered = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    const theme = create(ThemeSchema, { name: 't', tokens: create(TokensSchema, {}) });
    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet, theme }),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      const ann = Object.values(result.value.annotations)[0];
      expect(ann.callout.stroke).toBeUndefined();
    }
  });

  test('annotation WITH an anchor gets its callout cascaded from the stylesheet override', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: { nodes: { target: { label: [], tags: {} } }, edges: {}, groups: {} },
    });
    const stylesheet = create(StylesheetSchema, {
      annotations: {
        note1: create(AnnotationEntrySchema, {
          content: [],
          anchor: create(AnnotationAnchorSchema, { refId: 'target', refKind: RefKind.NODE }),
          callout: create(Glyph1DSchema, { stroke: create(StrokeSchema, { width: 3 }) }),
        }),
      },
    });
    const filtered = filterImpl.filter(filterReq(diagram, stylesheet));
    expect(filtered.kind).toBe('ok');
    if (filtered.kind !== 'ok') return;

    const theme = create(ThemeSchema, { name: 't', tokens: create(TokensSchema, {}) });
    const result = cascadeImpl.cascade(
      Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet, theme }),
    );
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      const ann = Object.values(result.value.annotations)[0];
      expect(ann.callout.stroke?.width).toBe(3);
    }
  });
});

// ============================================================================
// token_resolver
//
// Grounded in design.md §5.1 step 3 ("resolve $colors.primary, $fonts.heading,
// etc. against theme.tokens"), §4 ("Tokens are by category ... $colors.primary,
// $fonts.heading"), and resolver spec line: "missing-token errors" listed as
// a thing the resolver test surface must cover (design.md line ~1745).
// Also .archegraph/specs/resolver/token_resolver.spec.textproto: "Refs that
// don't resolve are left as-is — renderer fallback handles them."
// ============================================================================

// Helper: run filter -> cascade to get a real ResolvedDiagram to feed into
// TokenResolver, so token tests exercise the actual glyph shapes the cascade
// produces rather than hand-built stand-ins.
function cascadeOneNode(nodeEntry: NodeStyleEntry | undefined, theme: Theme) {
  const diagram = create(DiagramSchema, {
    id: 'd1',
    graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} },
  });
  const stylesheet = nodeEntry !== undefined ? create(StylesheetSchema, { nodes: { a: nodeEntry } }) : undefined;
  const filtered = filterImpl.filter(filterReq(diagram, stylesheet));
  if (filtered.kind !== 'ok') throw new Error('filter failed in test helper');
  const cascaded = cascadeImpl.cascade(
    Object.assign(new CascadeRequest(), { filtered: filtered.value, stylesheet, theme }),
  );
  if (cascaded.kind !== 'ok') throw new Error('cascade failed in test helper');
  return cascaded.value;
}

describe('token_resolver', () => {
  test('resolves a $colors.<name> ref against theme.tokens.colors', () => {
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, { colors: { primary: '#123456' } }),
    });
    const nodeEntry = create(NodeStyleEntrySchema, {
      shape: create(Glyph2DSchema, {
        fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '$colors.primary' }) } }),
      }),
    });
    const resolved = cascadeOneNode(nodeEntry, theme);
    const tokenResult = tokenImpl.resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved, tokens: theme.tokens }),
    );
    expect(tokenResult.kind).toBe('ok');
    if (tokenResult.kind === 'ok') {
      const node = Object.values(tokenResult.value.nodes)[0];
      expect(node.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '#123456' }));
    }
  });

  test('unresolvable token ref ($colors.nope) is left as-is for renderer fallback (spec: "Refs that don\'t resolve are left as-is")', () => {
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, { colors: { primary: '#123456' } }),
    });
    const nodeEntry = create(NodeStyleEntrySchema, {
      shape: create(Glyph2DSchema, {
        fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '$colors.nope' }) } }),
      }),
    });
    const resolved = cascadeOneNode(nodeEntry, theme);
    const tokenResult = tokenImpl.resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved, tokens: theme.tokens }),
    );
    expect(tokenResult.kind).toBe('ok');
    if (tokenResult.kind === 'ok') {
      const node = Object.values(tokenResult.value.nodes)[0];
      expect(node.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '$colors.nope' }));
    }
  });

  test('a token whose own value looks like another token ref is substituted literally, not re-resolved (proto: Tokens.colors "Values are literal hex/rgb" — a token is not itself a ref)', () => {
    // colors.primary's *value* happens to be the string "$colors.brand".
    // Tokens.colors values are documented as literal hex/rgb, so this is an
    // authoring error upstream, not a chase-through-chain feature. We assert
    // the single-pass, non-recursive substitution the spec describes
    // ("substitute the concrete value") and flag this as a deliberate probe
    // of resolver behavior at a schema boundary, not a claim that chained
    // tokens are a documented feature.
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, { colors: { primary: '$colors.brand', brand: '#ABCDEF' } }),
    });
    const nodeEntry = create(NodeStyleEntrySchema, {
      shape: create(Glyph2DSchema, {
        fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '$colors.primary' }) } }),
      }),
    });
    const resolved = cascadeOneNode(nodeEntry, theme);
    const tokenResult = tokenImpl.resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved, tokens: theme.tokens }),
    );
    expect(tokenResult.kind).toBe('ok');
    if (tokenResult.kind === 'ok') {
      const node = Object.values(tokenResult.value.nodes)[0];
      // Single substitution pass: value becomes the literal string
      // "$colors.brand", NOT further resolved to "#ABCDEF".
      expect(node.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '$colors.brand' }));
    }
  });

  test('$fonts.<name> is a documented token namespace (design.md §4: "token references are namespaced ($colors.primary, $fonts.heading)") and should resolve like any other category', () => {
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, {
        fonts: { heading: create(FontSpecSchema, { family: 'Georgia' }) },
      }),
    });
    const nodeEntry = create(NodeStyleEntrySchema, {
      typography: create(TypographySchema, { font: '$fonts.heading' }),
    });
    const resolved = cascadeOneNode(nodeEntry, theme);
    const tokenResult = tokenImpl.resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved, tokens: theme.tokens }),
    );
    expect(tokenResult.kind).toBe('ok');
    if (tokenResult.kind === 'ok') {
      const node = Object.values(tokenResult.value.nodes)[0];
      // The concrete value for a font token is its family name.
      expect(node.typography.font).toBe('Georgia');
    }
  });

  test('absent tokens table: refs left as-is for renderer fallback (spec: "Absent tokens -> any $token refs are left as-is for renderer fallback to handle")', () => {
    const theme = create(ThemeSchema, { name: 't', tokens: create(TokensSchema, {}) });
    const nodeEntry = create(NodeStyleEntrySchema, {
      shape: create(Glyph2DSchema, {
        fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '$colors.primary' }) } }),
      }),
    });
    const resolved = cascadeOneNode(nodeEntry, theme);
    const tokenResult = tokenImpl.resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved, tokens: undefined }),
    );
    expect(tokenResult.kind).toBe('ok');
    if (tokenResult.kind === 'ok') {
      const node = Object.values(tokenResult.value.nodes)[0];
      expect(node.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '$colors.primary' }));
    }
  });

  test('a literal color value (not a token ref) passes through unchanged', () => {
    const theme = create(ThemeSchema, { name: 't', tokens: create(TokensSchema, { colors: { primary: '#123456' } }) });
    const nodeEntry = create(NodeStyleEntrySchema, {
      shape: create(Glyph2DSchema, {
        fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#3B82F6' }) } }),
      }),
    });
    const resolved = cascadeOneNode(nodeEntry, theme);
    const tokenResult = tokenImpl.resolveTokens(
      Object.assign(new ResolveTokensRequest(), { resolved, tokens: theme.tokens }),
    );
    expect(tokenResult.kind).toBe('ok');
    if (tokenResult.kind === 'ok') {
      const node = Object.values(tokenResult.value.nodes)[0];
      expect(node.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '#3B82F6' }));
    }
  });
});

// ============================================================================
// End-to-end via resolvePipeline (filter -> cascade -> tokens).
// design.md §5.1 covers the whole chain; these exercise it together the way
// the layout pillar actually consumes it (resolve_pipeline.ts).
// ============================================================================

describe('resolvePipeline end-to-end', () => {
  test('hidden node + contracted group + component/override precedence + token resolution all compose correctly', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: {
        nodes: {
          visible: { label: [], tags: {} },
          hidden: { label: [], tags: {} },
          contained: { label: [], tags: {}, parentGroup: 'g1' },
        },
        edges: {
          toHidden: { source: 'visible', target: 'hidden', label: [], ordinal: 0, tags: {} },
          toGroup: { source: 'visible', target: 'contained', label: [], ordinal: 0, tags: {} },
        },
        groups: { g1: { label: [], tags: {} } },
      },
    });
    const stylesheet = create(StylesheetSchema, {
      nodes: {
        hidden: create(NodeStyleEntrySchema, { visibility: NodeVisibility.HIDDEN }),
        visible: create(NodeStyleEntrySchema, {
          component: 'box',
          shape: create(Glyph2DSchema, {
            fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '$colors.primary' }) } }),
          }),
        }),
      },
      groups: {
        g1: create(GroupStyleEntrySchema, { layout: create(GroupLayoutSchema, { renderMode: GroupRenderMode.CONTRACTED }) }),
      },
    });
    const theme = create(ThemeSchema, {
      name: 't',
      tokens: create(TokensSchema, { colors: { primary: '#00FF00' } }),
      nodeComponents: [
        create(NodeComponentSchema, {
          name: 'box',
          shape: create(Glyph2DSchema, {
            fill: create(FillSchema, { paint: { case: 'color', value: create(ColorSchema, { value: '#THEME_DEFAULT' }) } }),
            stroke: create(StrokeSchema, { width: 1 }),
          }),
        }),
      ],
    });

    const result = resolvePipeline(diagram, stylesheet, theme);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;

    // hidden node gone, its edge gone.
    expect(Object.keys(result.value.nodes).sort()).toEqual(['visible']);
    expect(result.value.edges['toHidden']).toBeUndefined();
    // contained node absorbed into contracted super-node; edge re-points to g1.
    const toGroup = result.value.edges['toGroup'];
    expect(toGroup?.target).toBe('g1');
    expect(Object.values(result.value.groups)[0].isSuperNode).toBe(true);

    // per-element override (fill=$colors.primary) wins over theme
    // component's fill for the same field, and different field (stroke)
    // from the theme still comes through.
    const visible = result.value.nodes['visible'];
    expect(visible?.shape.fill?.paint.value).toEqual(create(ColorSchema, { value: '#00FF00' }));
    expect(visible?.shape.stroke?.width).toBe(1);
  });

  test('empty theme + stylesheet with only layout hints: resolves without error, layout hints pass through verbatim', () => {
    const diagram = create(DiagramSchema, {
      id: 'd1',
      graph: { nodes: { a: { label: [], tags: {} } }, edges: {}, groups: {} },
    });
    const stylesheet = create(StylesheetSchema, {
      nodes: { a: create(NodeStyleEntrySchema, { layout: create(NodeLayoutSchema, { rotation: 45 }) }) },
    });
    const theme = create(ThemeSchema, { name: 'empty', tokens: create(TokensSchema, {}) });

    const result = resolvePipeline(diagram, stylesheet, theme);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(Object.values(result.value.nodes)[0].layout?.rotation).toBe(45);
    }
  });
});

// ---------------------------------------------------------------------------
// Seeding. The contract has two halves and both must hold, so both are pinned:
// the resolver assumes no binding of its own, AND a diagram authored without a
// style file still renders, because something wrote real bindings into the
// stylesheet first. Losing either half is a regression -- the first back to
// magic in the engine, the second to an invisible diagram.
// ---------------------------------------------------------------------------
describe('seedComponentBindings', () => {
  const graphOf = () => create(DiagramSchema, {
    schemaVersion: 1,
    id: 'd',
    graph: {
      nodes: { n1: {} },
      edges: {},
      groups: { g1: {} },
    },
  });

  test('writes the theme default as an ordinary stylesheet entry', () => {
    const seeded = seedComponentBindings(
      graphOf(),
      create(StylesheetSchema, { schemaVersion: 1 }),
      blueprintTheme(),
    );
    expect(seeded.nodes.n1?.component).toBe('glyph');
    expect(seeded.groups.g1?.component).toBe('glyph');
  });

  test('never overwrites a binding the user already chose', () => {
    const authored = create(StylesheetSchema, {
      schemaVersion: 1,
      nodes: { n1: create(NodeStyleEntrySchema, { component: 'mine' }) },
    });
    expect(seedComponentBindings(graphOf(), authored, blueprintTheme()).nodes.n1?.component)
      .toBe('mine');
  });

  test('is idempotent', () => {
    const once = seedComponentBindings(graphOf(), create(StylesheetSchema, { schemaVersion: 1 }), blueprintTheme());
    const twice = seedComponentBindings(graphOf(), once, blueprintTheme());
    expect(twice.nodes.n1?.component).toBe(once.nodes.n1?.component);
    expect(Object.keys(twice.nodes)).toEqual(Object.keys(once.nodes));
  });

  test('a theme that declares no default seeds nothing', () => {
    // The name "glyph" is not privileged anywhere. A theme can define a
    // component called glyph for a specific purpose without it capturing every
    // unbound element -- which is exactly what the old hardcoded default did.
    const noDefault = create(ThemeSchema, {
      schemaVersion: 1,
      name: 'no-default',
      nodeComponents: [create(NodeComponentSchema, { name: 'glyph' })],
    });
    const seeded = seedComponentBindings(graphOf(), create(StylesheetSchema, { schemaVersion: 1 }), noDefault);
    expect(seeded.nodes.n1?.component).toBeUndefined();
  });
});
