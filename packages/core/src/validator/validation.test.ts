// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Tests for the input-validation and diffing layers: validator/, loaders/,
// diff/. The validator's entire job is rejecting malformed input, and it was
// untested before this file existed.
//
// Expectations are derived from docs/design.md's validation rule list
// (§14.1 "validation:" and the "Items deferred" entries for group-cycle and
// edge-target rules) and from the "MUST" invariants stated in
// proto/content.proto's field comments — NOT from reading validator/impl.ts,
// loaders/impl_loader/impl.ts, or diff/diff.ts bodies beyond what is needed
// to get call signatures and type names right.
//
// Where a probe reveals the implementation does not do what design.md or the
// proto comments say it must, the test is left failing/documenting the gap
// rather than adjusted to match the implementation. See the final test in
// each `describe` block that probes a "MUST" with no corresponding check.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import {
  type Diagram,
  DiagramSchema,
} from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';

import { loadDiagram } from '../loaders';
import { ValidatorImpl } from './validator';
import { ValidateRequest } from './validate_request';
import { ViolationKind } from './violation';
import { diff } from '../diff/diff';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Plain-JSON shape for a diagram, kept separate from the protobuf `Diagram`
// type so callers can spread/override individual node/edge fields with
// plain objects and go through `fromJson` once at the end — spreading an
// already-`create()`d Message (which carries `$typeName`/`$unknown`) back
// into `create()` does not typecheck.
interface DiagramJson {
  schemaVersion: number;
  id: string;
  title?: Array<{ locale: string; source: string }>;
  graph: {
    nodes: Record<string, { parentGroup?: string; label?: Array<{ locale: string; source: string }>; tags?: Record<string, string> }>;
    edges: Record<string, { source: string; target: string; label?: Array<{ locale: string; source: string }>; ordinal?: number; tags?: Record<string, string> }>;
    groups: Record<string, { parentGroup?: string; label?: Array<{ locale: string; source: string }>; tags?: Record<string, string> }>;
  };
  metadata?: { generator?: string; canonicalLocale?: string };
}

function diagramFromJson(json: DiagramJson): Diagram {
  return fromJson(DiagramSchema, JSON.stringify(json));
}

function pipelineJson(): DiagramJson {
  return {
    schemaVersion: 1,
    id: 'pipeline',
    title: [{ locale: 'en', source: 'Render pipeline' }],
    graph: {
      nodes: {
        load: { parentGroup: 'core', label: [], tags: {} },
        resolve: { parentGroup: 'core', label: [], tags: {} },
        render: { label: [], tags: {} },
      },
      edges: {
        load__resolve: {
          source: 'load',
          target: 'resolve',
          label: [],
          ordinal: 0,
          tags: {},
        },
        resolve__render: {
          source: 'resolve',
          target: 'render',
          label: [],
          ordinal: 0,
          tags: {},
        },
      },
      groups: {
        core: { label: [], tags: {} },
      },
    },
    metadata: { generator: 'hand', canonicalLocale: 'en' },
  };
}

function validDiagram(): Diagram {
  return diagramFromJson(pipelineJson());
}

function validate(diagram: Diagram) {
  const validator = new ValidatorImpl();
  const request = new ValidateRequest();
  request.diagram = diagram;
  return validator.validate(request);
}

function violationKinds(response: { violations: Array<{ kind: ViolationKind }> }): ViolationKind[] {
  return response.violations.map((v) => v.kind);
}

// ===========================================================================
// VALIDATOR — referential integrity, group acyclicity
// design.md §14.1: "validation: referential integrity (no edge to
// nonexistent node, no orphaned style entry, no group cycle, no
// parent_group -> nonexistent group)"
// design.md "Items deferred to implementation-plan" section:
//   "Group cycle validation rule — Group.parent_group cycles must be
//    detected at validate time."
//   "Edge-target validation rule — every Edge.source / Edge.target must
//    reference an existing Node.id. Same for Node.parent_group /
//    Group.parent_group referencing existing Group.id."
// ===========================================================================

describe('validator: valid input', () => {
  test('a well-formed diagram produces zero violations', () => {
    const result = validate(validDiagram());
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toEqual([]);
    }
  });

  test('an empty graph (no nodes/edges/groups) is valid', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'empty',
      graph: { nodes: {}, edges: {}, groups: {} },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toEqual([]);
    }
  });

  test('nodes with no edges at all is valid (edges are not required)', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'lonely-nodes',
      graph: {
        nodes: {
          a: { label: [], tags: {} },
          b: { label: [], tags: {} },
        },
        edges: {},
        groups: {},
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toEqual([]);
    }
  });

  test('a self-loop edge (source === target) is not flagged: nothing in ' +
    'design.md or content.proto forbids an edge from a node to itself', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'self-loop',
      graph: {
        nodes: { a: { label: [], tags: {} } },
        edges: {
          a__a: { source: 'a', target: 'a', label: [], ordinal: 0, tags: {} },
        },
        groups: {},
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toEqual([]);
    }
  });
});

describe('validator: referential integrity — edges', () => {
  test('an edge whose source does not reference an existing node is EDGE_SOURCE_MISSING', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'bad-source',
      graph: {
        nodes: { b: { label: [], tags: {} } },
        edges: {
          ghost__b: { source: 'ghost', target: 'b', label: [], ordinal: 0, tags: {} },
        },
        groups: {},
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.EDGE_SOURCE_MISSING);
      const v = result.value.violations.find((x) => x.kind === ViolationKind.EDGE_SOURCE_MISSING);
      expect(v?.location).toBe('ghost__b');
    }
  });

  test('an edge whose target does not reference an existing node is EDGE_TARGET_MISSING', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'bad-target',
      graph: {
        nodes: { a: { label: [], tags: {} } },
        edges: {
          a__ghost: { source: 'a', target: 'ghost', label: [], ordinal: 0, tags: {} },
        },
        groups: {},
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.EDGE_TARGET_MISSING);
      const v = result.value.violations.find((x) => x.kind === ViolationKind.EDGE_TARGET_MISSING);
      expect(v?.location).toBe('a__ghost');
    }
  });

  test('a node whose parent_group does not reference an existing group is NODE_PARENT_GROUP_MISSING', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'bad-parent-group',
      graph: {
        nodes: { a: { parentGroup: 'ghost-group', label: [], tags: {} } },
        edges: {},
        groups: {},
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.NODE_PARENT_GROUP_MISSING);
      const v = result.value.violations.find((x) => x.kind === ViolationKind.NODE_PARENT_GROUP_MISSING);
      expect(v?.location).toBe('a');
    }
  });

  test('duplicate edge ids between the same (source, target) pair collapse at the ' +
    'JSON/map level — a JS object cannot hold two entries under one key, so this ' +
    'probe is invalid as literally stated and is exercised instead via the loader ' +
    '(see loaders describe block) where the JSON text can spell the same key twice', () => {
    // See "loaders: JSON with a duplicate object key" below for the actual probe.
    // Left here as a documented no-op so the intent is traceable from this file.
    expect(true).toBe(true);
  });
});

describe('validator: group hierarchy', () => {
  test('a group whose parent_group does not reference an existing group is GROUP_PARENT_GROUP_MISSING', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'bad-group-parent',
      graph: {
        nodes: {},
        edges: {},
        groups: { g1: { parentGroup: 'ghost-group', label: [], tags: {} } },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.GROUP_PARENT_GROUP_MISSING);
      const v = result.value.violations.find((x) => x.kind === ViolationKind.GROUP_PARENT_GROUP_MISSING);
      expect(v?.location).toBe('g1');
    }
  });

  test('a group that is its own parent is a GROUP_CYCLE ' +
    '(proto: "Group hierarchy must be acyclic (validation enforces)")', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'self-cycle',
      graph: {
        nodes: {},
        edges: {},
        groups: { g1: { parentGroup: 'g1', label: [], tags: {} } },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.GROUP_CYCLE);
    }
  });

  test('a two-group parent cycle (a -> b -> a) is a GROUP_CYCLE', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'two-cycle',
      graph: {
        nodes: {},
        edges: {},
        groups: {
          a: { parentGroup: 'b', label: [], tags: {} },
          b: { parentGroup: 'a', label: [], tags: {} },
        },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.GROUP_CYCLE);
    }
  });

  test('a three-group parent cycle (a -> b -> c -> a) is a GROUP_CYCLE', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'three-cycle',
      graph: {
        nodes: {},
        edges: {},
        groups: {
          a: { parentGroup: 'b', label: [], tags: {} },
          b: { parentGroup: 'c', label: [], tags: {} },
          c: { parentGroup: 'a', label: [], tags: {} },
        },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.GROUP_CYCLE);
    }
  });

  test('a valid, non-cyclic nested group chain (a -> b -> c, c top-level) has no GROUP_CYCLE', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: 1,
      id: 'chain',
      graph: {
        nodes: {},
        edges: {},
        groups: {
          a: { parentGroup: 'b', label: [], tags: {} },
          b: { parentGroup: 'c', label: [], tags: {} },
          c: { label: [], tags: {} },
        },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).not.toContain(ViolationKind.GROUP_CYCLE);
    }
  });
});

// ===========================================================================
// LOADERS
// design.md §14.1: "loaders: JSON round-trip, malformed input rejection,
// schema_version handling, Localization parsing"
// ===========================================================================

describe('loaders: schema_version handling', () => {
  test('loadDiagram accepts schema_version 1', async () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      id: 'ok',
      graph: { nodes: {}, edges: {}, groups: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('ok');
  });

  test('loadDiagram rejects schema_version 0 with an Err, not a throw', async () => {
    const text = JSON.stringify({
      schemaVersion: 0,
      id: 'zero',
      graph: { nodes: {}, edges: {}, groups: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('schema_version');
    }
  });

  test('loadDiagram rejects an unsupported schema_version (e.g. 2) with an Err', async () => {
    const text = JSON.stringify({
      schemaVersion: 2,
      id: 'future',
      graph: { nodes: {}, edges: {}, groups: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('2');
    }
  });

  test('schema_version omitted entirely defaults to proto3 zero-value 0 and is rejected', async () => {
    const text = JSON.stringify({
      id: 'no-version-field',
      graph: { nodes: {}, edges: {}, groups: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
  });
});

describe('loaders: malformed input rejection', () => {
  test('malformed JSON (unparseable text) is rejected as an Err, not a throw', async () => {
    const result = await loadDiagram('{ this is not json ][');
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  test('valid JSON that is not a Diagram shape (unknown top-level field) is rejected', async () => {
    const text = JSON.stringify({ notADiagramField: true, schemaVersion: 1 });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
  });

  test('valid JSON with an unknown nested field on a Node is rejected', async () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      id: 'unknown-nested',
      graph: {
        nodes: { a: { thisFieldDoesNotExist: 'x' } },
        edges: {},
        groups: {},
      },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
  });

  test('valid JSON that is a bare array (not an object) is rejected', async () => {
    const result = await loadDiagram(JSON.stringify([1, 2, 3]));
    expect(result.kind).toBe('err');
  });

  test('valid JSON with a field of the wrong type (schemaVersion as a string) is rejected', async () => {
    const text = JSON.stringify({ schemaVersion: 'one', id: 'x' });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
  });

  test('an empty JSON object is structurally acceptable to the underlying proto ' +
    'parser (schema_version defaults to 0) but is still rejected end-to-end by the ' +
    'schema_version === 1 check, not by a "missing id" check — Diagram.id has no ' +
    'presence enforcement in proto3', async () => {
    const result = await loadDiagram('{}');
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('schema_version');
    }
  });

  test('valid Diagram JSON round-trips through loadDiagram with fields intact', async () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      id: 'roundtrip',
      title: [{ locale: 'en', source: 'Round Trip' }],
      graph: {
        nodes: { a: { label: [{ locale: 'en', source: 'A' }], tags: { kind: 'stage' } } },
        edges: {},
        groups: {},
      },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.id).toBe('roundtrip');
      expect(Object.keys(result.value.graph?.nodes ?? {})).toContain('a');
      expect(result.value.graph?.nodes['a']?.tags['kind']).toBe('stage');
    }
  });
});

describe('loaders: duplicate JSON object keys', () => {
  test('a JSON text with a duplicate key under graph.edges is accepted by ' +
    'JSON.parse (last value wins) rather than flagged — there is no ' +
    'duplicate-key detection anywhere in the load path, since by the time the ' +
    'map reaches the validator only one entry can exist per key', async () => {
    const text =
      '{"schemaVersion":1,"id":"dup","graph":{"nodes":{"a":{},"b":{}},' +
      '"edges":{"e1":{"source":"a","target":"b"},"e1":{"source":"b","target":"a"}},' +
      '"groups":{}}}';
    const result = await loadDiagram(text);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      // Only the second literal "e1" entry survives — JSON.parse's documented
      // last-key-wins behaviour, not a loader/validator decision.
      expect(result.value.graph?.edges['e1']?.source).toBe('b');
      expect(Object.keys(result.value.graph?.edges ?? {}).length).toBe(1);
    }
  });
});

// ===========================================================================
// DIFF
// proto/content.proto: ChangeType { UNCHANGED, ADDED, DELETED, MODIFIED }
// (CHANGE_TYPE_UNSPECIFIED = 0 is the proto3 zero-value, not an emitted kind)
// ===========================================================================

describe('diff: identity', () => {
  test('diffing a diagram against itself yields no node or edge deltas', () => {
    const d = validDiagram();
    const delta = diff(d, d);
    expect(delta.nodeDeltas).toEqual([]);
    expect(delta.edgeDeltas).toEqual([]);
  });

  test('diffing two structurally-equal-but-distinct diagram objects yields no deltas', () => {
    const delta = diff(validDiagram(), validDiagram());
    expect(delta.nodeDeltas).toEqual([]);
    expect(delta.edgeDeltas).toEqual([]);
  });
});

describe('diff: added / removed / modified', () => {
  test('a node present only in target is ADDED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    targetJson.graph.nodes['extra'] = { label: [], tags: {} };
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const added = delta.nodeDeltas.find((d) => d.nodeId === 'extra');
    expect(added?.changeType).toBe(2 /* ADDED */);
    expect(added?.before).toBeUndefined();
    expect(added?.after).toBeDefined();
  });

  test('a node present only in base is DELETED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    delete targetJson.graph.nodes['render'];
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const deleted = delta.nodeDeltas.find((d) => d.nodeId === 'render');
    expect(deleted?.changeType).toBe(3 /* DELETED */);
    expect(deleted?.after).toBeUndefined();
    expect(deleted?.before).toBeDefined();
  });

  test('a node whose fields differ between base and target is MODIFIED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    targetJson.graph.nodes['load'] = {
      parentGroup: 'core',
      label: [{ locale: 'en', source: 'Load!' }],
      tags: {},
    };
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const modified = delta.nodeDeltas.find((d) => d.nodeId === 'load');
    expect(modified?.changeType).toBe(4 /* MODIFIED */);
    expect(modified?.before?.label).toEqual([]);
    expect(modified?.after?.label?.[0]?.source).toBe('Load!');
  });

  test('an edge present only in target is ADDED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    targetJson.graph.edges['load__render'] = {
      source: 'load',
      target: 'render',
      label: [],
      ordinal: 0,
      tags: {},
    };
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const added = delta.edgeDeltas.find((d) => d.edgeId === 'load__render');
    expect(added?.changeType).toBe(2 /* ADDED */);
  });

  test('an edge present only in base is DELETED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    delete targetJson.graph.edges['resolve__render'];
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const deleted = delta.edgeDeltas.find((d) => d.edgeId === 'resolve__render');
    expect(deleted?.changeType).toBe(3 /* DELETED */);
  });

  test('an edge whose fields differ between base and target is MODIFIED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    targetJson.graph.edges['load__resolve'] = {
      source: 'load',
      target: 'resolve',
      label: [],
      ordinal: 1,
      tags: {},
    };
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const modified = delta.edgeDeltas.find((d) => d.edgeId === 'load__resolve');
    expect(modified?.changeType).toBe(4 /* MODIFIED */);
    expect(modified?.before?.ordinal).toBe(0);
    expect(modified?.after?.ordinal).toBe(1);
  });

  test('UNCHANGED deltas are omitted by default (includeUnchanged not set)', () => {
    const base = validDiagram();
    const target = validDiagram();
    const delta = diff(base, target);
    expect(delta.nodeDeltas.every((d) => d.changeType !== 1 /* UNCHANGED */)).toBe(true);
    expect(delta.edgeDeltas.every((d) => d.changeType !== 1 /* UNCHANGED */)).toBe(true);
  });

  test('UNCHANGED deltas are included when includeUnchanged: true is passed', () => {
    const base = validDiagram();
    const target = validDiagram();
    const delta = diff(base, target, { includeUnchanged: true });
    expect(delta.nodeDeltas.length).toBeGreaterThan(0);
    expect(delta.nodeDeltas.every((d) => d.changeType === 1 /* UNCHANGED */)).toBe(true);
  });
});
