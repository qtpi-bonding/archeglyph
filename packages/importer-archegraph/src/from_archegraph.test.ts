// SPDX-License-Identifier: MPL-2.0

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { EdgeKind, EdgeRole, NodeKind } from '@archeglyph/proto/gen/archegraph/common_pb';
import {
  ArcheviewSchema,
  ViewEdgeSchema,
  ViewNodeSchema,
} from '@archeglyph/proto/gen/archegraph/view_pb';
import { DiagramSchema, ElementRole } from '@archeglyph/proto/gen/content_pb';
import { toJson } from '@bufbuild/protobuf';
import { CONTENT_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';
import { fromArchegraph } from './from_archegraph';

describe('fromArchegraph kind tags', () => {
  const view = create(ArcheviewSchema, {
    nodes: {
      'a#': create(ViewNodeSchema, { displayName: 'A', kind: NodeKind.STRUCT, kindLabel: 'Trait' }),
      'b#': create(ViewNodeSchema, { displayName: 'B', kind: NodeKind.METHOD, kindLabel: 'Method' }),
    },
    edges: {
      e1: create(ViewEdgeSchema, { source: 'a#', target: 'b#', kind: EdgeKind.INVOCATION }),
    },
  });

  // seed_bindings derives each element's theme component from tags['kind'];
  // a namespaced tag leaves every imported element on the default component.
  test('nodes carry the NodeKind under tags.kind', () => {
    const nodes = fromArchegraph(view).graph?.elements ?? {};
    expect(nodes['a#'].tags['kind']).toBe('struct');
    expect(nodes['b#'].tags['kind']).toBe('method');
  });

  test('the language-specific label survives as its own tag', () => {
    const nodes = fromArchegraph(view).graph?.elements ?? {};
    expect(nodes['a#'].tags['archegraph.kind_label']).toBe('Trait');
  });

  // The bundler in visibility_filter keys merged edges on tags.kind too.
  test('edges carry the EdgeKind under tags.kind', () => {
    const edges = fromArchegraph(view).graph?.edges ?? {};
    expect(edges['e1'].tags['kind']).toBe('invocation');
  });
});

function vnode(name: string, kind: NodeKind, label: string, extra: { isExternal?: boolean } = {}) {
  return create(ViewNodeSchema, { displayName: name, kind, kindLabel: label, ...extra });
}

function vedge(
  source: string,
  target: string,
  kind: EdgeKind,
  role: EdgeRole = EdgeRole.EDGE_ROLE_UNSPECIFIED,
) {
  return create(ViewEdgeSchema, { source, target, kind, role });
}

// The spec's worked example. Containment runs parent -> child.
function authView() {
  return create(ArcheviewSchema, {
    nodes: {
      AuthService: vnode('AuthService', NodeKind.STRUCT, 'Class'),
      login: vnode('login', NodeKind.METHOD, 'Method'),
      logout: vnode('logout', NodeKind.METHOD, 'Method'),
      TokenStore: vnode('TokenStore', NodeKind.STRUCT, 'Class'),
      Router: vnode('Router', NodeKind.STRUCT, 'Class'),
      Config: vnode('Config', NodeKind.STRUCT, 'Class'),
    },
    edges: {
      c1: vedge('AuthService', 'login', EdgeKind.CONTAINMENT),
      c2: vedge('AuthService', 'logout', EdgeKind.CONTAINMENT),
      calls: vedge('Router', 'login', EdgeKind.INVOCATION),
      dep: vedge('Config', 'AuthService', EdgeKind.DEPENDENCY, EdgeRole.TYPE_OF),
      ret: vedge('login', 'AuthService', EdgeKind.DEPENDENCY, EdgeRole.RETURN),
      inv: vedge('login', 'TokenStore', EdgeKind.INVOCATION),
    },
  });
}

function edgeBetween(d: ReturnType<typeof fromArchegraph>, s: string, t: string) {
  return Object.values(d.graph?.edges ?? {}).filter((e) => e.source === s && e.target === t);
}

describe('fromArchegraph containment and elements', () => {
  test('containment becomes parent and is not emitted as an edge', () => {
    const d = fromArchegraph(authView());
    const els = d.graph?.elements ?? {};
    expect(els['login'].parent).toBe('AuthService');
    expect(els['logout'].parent).toBe('AuthService');
    expect(els['AuthService'].parent).toBeUndefined();
    expect(els['Router'].parent).toBeUndefined();
    const edges = Object.values(d.graph?.edges ?? {});
    expect(edges.filter((e) => e.tags['kind'] === 'containment')).toEqual([]);
    expect(edges.filter((e) => e.tags['archegraph.edge_kind'] === 'containment')).toEqual([]);
    expect(Object.keys(d.graph?.edges ?? {}).sort()).toEqual(['calls', 'dep', 'inv', 'ret']);
  });

  test('non-containment edges keep their real endpoints, including edges on the container', () => {
    const edges = fromArchegraph(authView()).graph?.edges ?? {};
    const pairs = (id: string) => [edges[id].source, edges[id].target];
    expect(pairs('calls')).toEqual(['Router', 'login']);
    expect(pairs('dep')).toEqual(['Config', 'AuthService']);
    expect(pairs('ret')).toEqual(['login', 'AuthService']);
    expect(pairs('inv')).toEqual(['login', 'TokenStore']);
  });

  test('every element is an ENTITY or UNSPECIFIED, never GROUPING, with kind tags', () => {
    const els = fromArchegraph(authView()).graph?.elements ?? {};
    expect(Object.keys(els).sort()).toEqual(
      ['AuthService', 'Config', 'TokenStore', 'Router', 'login', 'logout'].sort(),
    );
    for (const el of Object.values(els)) {
      expect([ElementRole.UNSPECIFIED, ElementRole.ENTITY]).toContain(el.role);
    }
    expect(els['AuthService'].tags['kind']).toBe('struct');
    expect(els['login'].tags['kind']).toBe('method');
    expect(els['AuthService'].tags['archegraph.kind_label']).toBe('Class');
    expect(els['login'].tags['archegraph.kind_label']).toBe('Method');
  });

  test('edge tags.kind is the lowercased role when set, else the kind; kind is kept', () => {
    const edges = fromArchegraph(authView()).graph?.edges ?? {};
    expect(edges['dep'].tags['kind']).toBe('type_of');
    expect(edges['dep'].tags['archegraph.edge_kind']).toBe('dependency');
    expect(edges['ret'].tags['kind']).toBe('return');
    expect(edges['ret'].tags['archegraph.edge_kind']).toBe('dependency');
    expect(edges['calls'].tags['kind']).toBe('invocation');
    expect(edges['calls'].tags['archegraph.edge_kind']).toBe('invocation');
  });

  test('EXTENDS and USES between the same pair get different tags.kind', () => {
    const view = create(ArcheviewSchema, {
      nodes: { A: vnode('A', NodeKind.STRUCT, 'Class'), B: vnode('B', NodeKind.STRUCT, 'Class') },
      edges: {
        x: vedge('A', 'B', EdgeKind.DEPENDENCY, EdgeRole.EXTENDS),
        u: vedge('A', 'B', EdgeKind.DEPENDENCY, EdgeRole.USES),
      },
    });
    const edges = fromArchegraph(view).graph?.edges ?? {};
    expect(edges['x'].tags['kind']).toBe('extends');
    expect(edges['u'].tags['kind']).toBe('uses');
  });

  test('an excluded containment parent leaves a root tagged with the parent id', () => {
    const view = create(ArcheviewSchema, {
      nodes: {
        P: vnode('P', NodeKind.STRUCT, 'Class', { isExternal: true }),
        C: vnode('C', NodeKind.METHOD, 'Method'),
      },
      edges: { c: vedge('P', 'C', EdgeKind.CONTAINMENT) },
    });
    const d = fromArchegraph(view);
    const els = d.graph?.elements ?? {};
    expect(Object.keys(els)).toEqual(['C']);
    expect(els['C'].parent).toBeUndefined();
    expect(els['C'].tags['archegraph.parent']).toBe('P');
    expect(Object.keys(d.graph?.edges ?? {})).toEqual([]);
  });

  test('two containment parents: smallest wins, the other becomes a containment edge', () => {
    const view = create(ArcheviewSchema, {
      nodes: {
        Zed: vnode('Zed', NodeKind.STRUCT, 'Class'),
        Alpha: vnode('Alpha', NodeKind.STRUCT, 'Class'),
        Kid: vnode('Kid', NodeKind.METHOD, 'Method'),
      },
      edges: {
        cz: vedge('Zed', 'Kid', EdgeKind.CONTAINMENT),
        ca: vedge('Alpha', 'Kid', EdgeKind.CONTAINMENT),
      },
    });
    const d = fromArchegraph(view);
    expect(d.graph?.elements['Kid'].parent).toBe('Alpha');
    const edges = Object.values(d.graph?.edges ?? {});
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('Zed');
    expect(edges[0].target).toBe('Kid');
    expect(edges[0].tags['kind']).toBe('containment');
    expect(edgeBetween(d, 'Alpha', 'Kid')).toEqual([]);
  });

  test('schemaVersion is CONTENT_SCHEMA_VERSION', () => {
    expect(fromArchegraph(authView()).schemaVersion).toBe(CONTENT_SCHEMA_VERSION);
    expect(CONTENT_SCHEMA_VERSION).toBe(2);
  });

  test('importing the same view twice is identical', () => {
    const a = toJson(DiagramSchema, fromArchegraph(authView()));
    const b = toJson(DiagramSchema, fromArchegraph(authView()));
    expect(b).toEqual(a);
    expect(JSON.stringify(a)).toContain('"elements"');
  });
});
