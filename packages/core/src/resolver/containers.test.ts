// SPDX-License-Identifier: MPL-2.0
//
// Phase E3: effective mode, representative, hidden subtrees, open_depth,
// seeding and annotation re-anchoring, pinned black-box through the public
// filter and seed entry points on the spec's "AuthService" example.
//
// internalEdgeCount and the rewritten annotation anchor do not exist before
// the implementation; `internal()` narrows with a cast for that reason only.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, EdgeSchema, ElementRole, type Diagram } from '@archeglyph/proto/gen/content_pb';
import {
  AnnotationAnchorSchema,
  AnnotationEntrySchema,
  ElementStyleEntrySchema,
  GroupRenderMode,
  NodeVisibility,
  RefKind,
  StylesheetSchema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { NodeComponentSchema, ThemeSchema } from '@archeglyph/proto/gen/theme_pb';
import { init } from '@archeglyph/proto/util/init';
import { FilterRequest } from './filter_request';
import { type FilteredDiagram } from './filtered_diagram';
import { type FilteredGroup } from './filtered_group';
import { seedComponentBindings } from './seed_bindings';
import { VisibilityFilterImpl } from './visibility_filter';

const filterImpl = new VisibilityFilterImpl();

interface El {
  parent?: string;
  role?: ElementRole;
  kind?: string;
}

function authDiagram(overrides: Record<string, El> = {}): Diagram {
  const els: Record<string, El> = {
    auth: { role: ElementRole.GROUPING },
    AuthService: { parent: 'auth' },
    login: { parent: 'AuthService' },
    logout: { parent: 'AuthService' },
    TokenStore: { parent: 'auth' },
    Router: {},
    Config: {},
    ...overrides,
  };
  const edge = (source: string, target: string, kind: string) => ({
    source, target, label: [], ordinal: 0, tags: { kind },
  });
  return create(DiagramSchema, {
    schemaVersion: 2,
    id: 'auth-example',
    graph: {
      elements: Object.fromEntries(
        Object.entries(els).map(([id, e]) => [id, {
          label: [], parent: e.parent, role: e.role ?? ElementRole.ENTITY,
          tags: e.kind === undefined ? ({} as Record<string, string>) : { kind: e.kind },
        }]),
      ),
      edges: {
        e1: edge('Router', 'login', 'invocation'),
        e2: edge('Config', 'AuthService', 'type_of'),
        e3: edge('login', 'TokenStore', 'invocation'),
        e4: edge('login', 'AuthService', 'return'),
      },
    },
  });
}

type Style = Record<string, { mode?: GroupRenderMode; hidden?: boolean }>;

function sheet(style: Style = {}, openDepth?: number, annotations: Stylesheet['annotations'] = {}): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 2,
    openDepth,
    annotations,
    elements: Object.fromEntries(
      Object.entries(style).map(([id, s]) => [id, create(ElementStyleEntrySchema, {
        renderMode: s.mode,
        visibility: s.hidden === true ? NodeVisibility.HIDDEN : undefined,
      })]),
    ),
  });
}

function run(d: Diagram, s?: Stylesheet): FilteredDiagram {
  const r = filterImpl.filter(init(new FilterRequest(), { diagram: d, stylesheet: s }));
  if (r.kind !== 'ok') {
    throw new Error(`expected ok, got err: ${r.error.message}`);
  }
  return r.value;
}

const ids = (m: Record<string, unknown>): string[] => Object.keys(m).sort();
const internal = (g: FilteredGroup): number => (g as unknown as { internalEdgeCount: number }).internalEdgeCount;
const ends = (f: FilteredDiagram, id: string): string => `${f.edges[id].source}->${f.edges[id].target}`;

describe('A: no stylesheet, everything open', () => {
  const f = run(authDiagram());
  test('containers are open boxes, leaves are nodes', () => {
    expect(ids(f.groups)).toEqual(['AuthService', 'auth']);
    expect(ids(f.nodes)).toEqual(['Config', 'Router', 'TokenStore', 'login', 'logout']);
    for (const g of Object.values(f.groups)) {
      expect(g.viewRole).toBe('box');
      expect(g.isSuperNode).toBe(false);
    }
  });
  test('all four edges keep their endpoints and none is a bundle', () => {
    expect(ids(f.edges)).toEqual(['e1', 'e2', 'e3', 'e4']);
    expect([ends(f, 'e1'), ends(f, 'e2'), ends(f, 'e3'), ends(f, 'e4')]).toEqual([
      'Router->login', 'Config->AuthService', 'login->TokenStore', 'login->AuthService',
    ]);
  });
  test('the nesting is reported through parentGroup', () => {
    expect(f.groups['AuthService'].parentGroup).toBe('auth');
    expect(f.nodes['login'].parentGroup).toBe('AuthService');
  });
});

describe('B: open_depth 1', () => {
  const f = run(authDiagram(), sheet({}, 1));
  test('AuthService becomes a closed block, auth stays a box', () => {
    const a = f.groups['AuthService'];
    expect(a.isSuperNode).toBe(true);
    expect(a.viewRole).toBe('block');
    expect(a.hiddenDescendantCount).toBe(2);
    expect(internal(a)).toBe(1);
    expect(f.groups['auth'].viewRole).toBe('box');
    expect(f.groups['auth'].isSuperNode).toBe(false);
    expect(ids(f.groups)).toEqual(['AuthService', 'auth']);
    expect(ids(f.nodes)).toEqual(['Config', 'Router', 'TokenStore']);
  });
  test('edges are lifted to AuthService, keep their ids, and the internal one is gone', () => {
    expect(ids(f.edges)).toEqual(['e1', 'e2', 'e3']);
    expect(ends(f, 'e1')).toBe('Router->AuthService');
    expect(ends(f, 'e2')).toBe('Config->AuthService');
    expect(ends(f, 'e3')).toBe('AuthService->TokenStore');
  });
});

describe('B2: a wrapping GROUPING is transparent to depth', () => {
  const d = authDiagram({ top: { role: ElementRole.GROUPING }, auth: { role: ElementRole.GROUPING, parent: 'top' } });
  const f = run(d, sheet({}, 1));
  test('same nodes, groups and edges as B plus the extra box', () => {
    expect(ids(f.groups)).toEqual(['AuthService', 'auth', 'top']);
    expect(f.groups['top'].viewRole).toBe('box');
    expect(f.groups['AuthService'].isSuperNode).toBe(true);
    expect(f.groups['AuthService'].hiddenDescendantCount).toBe(2);
    expect(ids(f.nodes)).toEqual(['Config', 'Router', 'TokenStore']);
    expect(ids(f.edges)).toEqual(['e1', 'e2', 'e3']);
    expect(ends(f, 'e3')).toBe('AuthService->TokenStore');
  });
});

describe('C: the grouping auth is CLOSED', () => {
  const f = run(authDiagram(), sheet({ auth: { mode: GroupRenderMode.CLOSED } }));
  test('auth is the only container, as a block holding four elements', () => {
    expect(ids(f.groups)).toEqual(['auth']);
    expect(f.groups['auth'].isSuperNode).toBe(true);
    expect(f.groups['auth'].viewRole).toBe('block');
    expect(f.groups['auth'].hiddenDescendantCount).toBe(4);
    expect(internal(f.groups['auth'])).toBe(2);
    expect(ids(f.nodes)).toEqual(['Config', 'Router']);
  });
  test('boundary edges lift to auth; e3 and e4 are absorbed', () => {
    expect(ids(f.edges)).toEqual(['e1', 'e2']);
    expect(ends(f, 'e1')).toBe('Router->auth');
    expect(ends(f, 'e2')).toBe('Config->auth');
  });
});

describe('D: the grouping auth is DISSOLVED', () => {
  const f = run(authDiagram(), sheet({ auth: { mode: GroupRenderMode.DISSOLVED } }));
  test('auth draws nothing and its children are re-parented to the root', () => {
    expect(f.groups['auth']).toBeUndefined();
    expect(ids(f.groups)).toEqual(['AuthService']);
    expect(f.groups['AuthService'].parentGroup).toBeUndefined();
    expect(f.nodes['TokenStore'].parentGroup).toBeUndefined();
    expect(f.nodes['login'].parentGroup).toBe('AuthService');
  });
  test('all four edges are unchanged', () => {
    expect(ids(f.edges)).toEqual(['e1', 'e2', 'e3', 'e4']);
    expect(ends(f, 'e3')).toBe('login->TokenStore');
    expect(ends(f, 'e4')).toBe('login->AuthService');
  });
});

describe('E and F: the resolver refuses wrong pictures itself', () => {
  test('E: DISSOLVED on an ENTITY is an err naming it', () => {
    const r = filterImpl.filter(init(new FilterRequest(), {
      diagram: authDiagram(),
      stylesheet: sheet({ AuthService: { mode: GroupRenderMode.DISSOLVED } }),
    }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('AuthService');
      expect(r.error.message.toLowerCase()).toContain('dissolved');
    }
  });

  test('F: an edge whose endpoint is a GROUPING is an err naming it', () => {
    const d = authDiagram();
    d.graph!.edges['bad'] = create(EdgeSchema, {
      source: 'Router', target: 'auth', label: [], ordinal: 0, tags: {},
    });
    const r = filterImpl.filter(init(new FilterRequest(), { diagram: d }));
    expect(r.kind).toBe('err');
    if (r.kind === 'err') {
      expect(r.error.message).toContain('auth');
      expect(r.error.message.toLowerCase()).toContain('grouping');
    }
  });
});

describe('G: explicit mode wins, and nothing propagates implicitly', () => {
  test('openDepth 1 plus explicit OPEN keeps AuthService an open box', () => {
    const f = run(authDiagram(), sheet({ AuthService: { mode: GroupRenderMode.OPEN } }, 1));
    expect(f.groups['AuthService'].viewRole).toBe('box');
    expect(f.groups['AuthService'].isSuperNode).toBe(false);
    expect(ids(f.nodes)).toContain('login');
    expect(ids(f.nodes)).toContain('logout');
    expect(ends(f, 'e4')).toBe('login->AuthService');
  });

  test('an explicit OPEN under a CLOSED ancestor has no effect', () => {
    const f = run(authDiagram(), sheet({
      auth: { mode: GroupRenderMode.CLOSED },
      AuthService: { mode: GroupRenderMode.OPEN },
    }));
    expect(ids(f.groups)).toEqual(['auth']);
    expect(ids(f.nodes)).toEqual(['Config', 'Router']);
  });
});

describe('H: hiding hides the whole subtree', () => {
  const gone = ['AuthService', 'login', 'logout'];
  for (const closed of [false, true]) {
    test(`AuthService HIDDEN${closed ? ' and CLOSED' : ''} removes its subtree and every edge touching it`, () => {
      const d = authDiagram();
      d.graph!.edges['e5'] = create(EdgeSchema, {
        source: 'Router', target: 'TokenStore', label: [], ordinal: 0, tags: {},
      });
      const f = run(d, sheet({
        AuthService: { hidden: true, mode: closed ? GroupRenderMode.CLOSED : undefined },
      }));
      for (const id of gone) {
        expect(f.nodes[id]).toBeUndefined();
        expect(f.groups[id]).toBeUndefined();
      }
      expect(ids(f.edges)).toEqual(['e5']);
      const present = new Set([...ids(f.nodes), ...ids(f.groups)]);
      for (const e of Object.values(f.edges)) {
        expect(present.has(e.source)).toBe(true);
        expect(present.has(e.target)).toBe(true);
      }
    });
  }

  test('a hidden member inside a CLOSED container drops its edges instead of absorbing or lifting them', () => {
    const f = run(authDiagram(), sheet({
      AuthService: { mode: GroupRenderMode.CLOSED },
      login: { hidden: true },
    }));
    expect(ids(f.edges)).toEqual(['e2']);
    expect(ends(f, 'e2')).toBe('Config->AuthService');
    expect(internal(f.groups['AuthService'])).toBe(0);
  });
});

describe('I: seeding binds both looks from their catalogues by tags.kind', () => {
  const theme = create(ThemeSchema, {
    schemaVersion: 1,
    name: 'fixture',
    defaultNodeComponent: 'glyph',
    defaultGroupComponent: 'box',
    defaultAnnotationComponent: 'glyph',
    nodeComponents: [create(NodeComponentSchema, { name: 'glyph' }), create(NodeComponentSchema, { name: 'store' })],
    groupComponents: [create(NodeComponentSchema, { name: 'box' }), create(NodeComponentSchema, { name: 'subsystem' })],
  });
  const d = authDiagram({
    Router: { kind: 'store' },
    AuthService: { parent: 'auth', kind: 'subsystem' },
    auth: { role: ElementRole.GROUPING, kind: 'subsystem' },
    Config: { kind: 'subsystem' },
    TokenStore: { parent: 'auth', kind: 'store' },
  });
  const seeded = seedComponentBindings(d, create(StylesheetSchema, { schemaVersion: 2 }), theme);

  test('a leaf gets component from the node catalogue and no boxComponent', () => {
    expect(seeded.elements['Router']?.component).toBe('store');
    expect(seeded.elements['Router']?.boxComponent ?? '').toBe('');
  });
  test('a container gets boxComponent from the group catalogue and no component', () => {
    expect(seeded.elements['AuthService']?.boxComponent).toBe('subsystem');
    expect(seeded.elements['AuthService']?.component ?? '').toBe('');
  });
  test('a GROUPING gets boxComponent and no component', () => {
    expect(seeded.elements['auth']?.boxComponent).toBe('subsystem');
    expect(seeded.elements['auth']?.component ?? '').toBe('');
  });
  test('a leaf whose kind exists only in the group catalogue gets nothing', () => {
    expect(seeded.elements['Config']?.boxComponent ?? '').toBe('');
    expect(seeded.elements['Config']?.component ?? '').toBe('');
  });
  test('a container whose kind exists only in the node catalogue gets component, so a closed one looks like that node', () => {
    const d2 = authDiagram({ AuthService: { parent: 'auth', kind: 'store' } });
    const s2 = seedComponentBindings(d2, create(StylesheetSchema, { schemaVersion: 2 }), theme);
    expect(s2.elements['AuthService']?.component).toBe('store');
    expect(s2.elements['AuthService']?.boxComponent ?? '').toBe('');
  });
});

describe('J: annotations re-anchor to the representative', () => {
  const note = (refId: string) => ({
    note: create(AnnotationEntrySchema, {
      content: [],
      anchor: create(AnnotationAnchorSchema, { refId, refKind: RefKind.ELEMENT }),
    }),
  });

  test('anchored to an absorbed element: the anchor becomes the closed container', () => {
    const f = run(authDiagram(), sheet({ AuthService: { mode: GroupRenderMode.CLOSED } }, undefined, note('login')));
    expect(f.annotations['note'].entry.anchor?.refId).toBe('AuthService');
    expect(f.annotations['note'].entry.anchor?.refKind).toBe(RefKind.ELEMENT);
  });

  test('anchored to an element under the outermost closed ancestor: the outermost one', () => {
    const f = run(authDiagram(), sheet({ auth: { mode: GroupRenderMode.CLOSED } }, undefined, note('login')));
    expect(f.annotations['note'].entry.anchor?.refId).toBe('auth');
  });

  test('anchored to a visible element: unchanged', () => {
    const f = run(authDiagram(), sheet({ AuthService: { mode: GroupRenderMode.CLOSED } }, undefined, note('Router')));
    expect(f.annotations['note'].entry.anchor?.refId).toBe('Router');
  });
});
