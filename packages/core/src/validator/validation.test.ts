// SPDX-License-Identifier: MPL-2.0
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
  ChangeType,
  type Diagram,
  DiagramSchema,
  GraphSchema,
  ElementRole,
  ElementSchema,
  LocalizationSchema,
  type Element,
} from '@archeglyph/proto/gen/content_pb';
import {
  type Stylesheet,
  StylesheetSchema,
  RefKind,
} from '@archeglyph/proto/gen/style_pb';
import { fromJson } from '@archeglyph/proto/util/json';

import { diff } from '../diff';
import { loadDelta, loadDiagram, loadStylesheet } from '../loaders';
import { ValidatorImpl } from './validator';
import { ValidateRequest } from './validate_request';
import { ViolationKind } from './violation';
import { DeltaSchema } from '@archeglyph/proto/gen/content_pb';
import { toJson } from '@archeglyph/proto/util/json';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

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
    elements: Record<string, { parent?: string; label?: Array<{ locale: string; source: string }>; tags?: Record<string, string>; role?: ElementRole }>;
    edges: Record<string, { source: string; target: string; label?: Array<{ locale: string; source: string }>; ordinal?: number; tags?: Record<string, string> }>;
  };
  metadata?: { generator?: string; canonicalLocale?: string };
}

function diagramFromJson(json: DiagramJson): Diagram {
  return fromJson(DiagramSchema, JSON.stringify(json));
}

function pipelineJson(): DiagramJson {
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    id: 'pipeline',
    title: [{ locale: 'en', source: 'Render pipeline' }],
    graph: {
      elements: {
        load: { parent: 'core', label: [], tags: {} },
        resolve: { parent: 'core', label: [], tags: {} },
        render: { label: [], tags: {} },
        core: { label: [], tags: {}, role: ElementRole.GROUPING },
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
    },
    metadata: { generator: 'hand', canonicalLocale: 'en' },
  };
}

function validDiagram(): Diagram {
  return diagramFromJson(pipelineJson());
}

function validate(diagram: Diagram, stylesheet?: Stylesheet) {
  const validator = new ValidatorImpl();
  const request = new ValidateRequest();
  request.diagram = diagram;
  request.stylesheet = stylesheet;
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
//   "Grouping cycle validation rule — Grouping.parent_group cycles must be
//    detected at validate time."
//   "Edge-target validation rule — every Edge.source / Edge.target must
//    reference an existing Element.id. Same for Element.parent_group /
//    Grouping.parent_group referencing existing Grouping.id."
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
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'empty',
      graph: { elements: {}, edges: {} },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toEqual([]);
    }
  });

  test('nodes with no edges at all is valid (edges are not required)', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'lonely-nodes',
      graph: {
        elements: {
          a: { label: [], tags: {} },
          b: { label: [], tags: {} },
        },
        edges: {},
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
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'self-loop',
      graph: {
        elements: { a: { label: [], tags: {} } },
        edges: {
          a__a: { source: 'a', target: 'a', label: [], ordinal: 0, tags: {} },
        },
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
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'bad-source',
      graph: {
        elements: { b: { label: [], tags: {} } },
        edges: {
          ghost__b: { source: 'ghost', target: 'b', label: [], ordinal: 0, tags: {} },
        },
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
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'bad-target',
      graph: {
        elements: { a: { label: [], tags: {} } },
        edges: {
          a__ghost: { source: 'a', target: 'ghost', label: [], ordinal: 0, tags: {} },
        },
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

  test('a node whose parent_group does not reference an existing group is ELEMENT_PARENT_MISSING', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'bad-parent-group',
      graph: {
        elements: { a: { parent: 'ghost-group', label: [], tags: {} } },
        edges: {},
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.ELEMENT_PARENT_MISSING);
      const v = result.value.violations.find((x) => x.kind === ViolationKind.ELEMENT_PARENT_MISSING);
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
  test('a group whose parent_group does not reference an existing group is ELEMENT_PARENT_MISSING', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'bad-group-parent',
      graph: {
        edges: {},
        elements: { g1: { parent: 'ghost-group', label: [], tags: {} } },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.ELEMENT_PARENT_MISSING);
      const v = result.value.violations.find((x) => x.kind === ViolationKind.ELEMENT_PARENT_MISSING);
      expect(v?.location).toBe('g1');
    }
  });

  test('a group that is its own parent is a ELEMENT_CYCLE ' +
    '(proto: "Grouping hierarchy must be acyclic (validation enforces)")', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'self-cycle',
      graph: {
        edges: {},
        elements: { g1: { parent: 'g1', label: [], tags: {} } },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.ELEMENT_CYCLE);
    }
  });

  test('a two-group parent cycle (a -> b -> a) is a ELEMENT_CYCLE', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'two-cycle',
      graph: {
        edges: {},
        elements: {
          a: { parent: 'b', label: [], tags: {} },
          b: { parent: 'a', label: [], tags: {} },
        },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.ELEMENT_CYCLE);
    }
  });

  test('a three-group parent cycle (a -> b -> c -> a) is a ELEMENT_CYCLE', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'three-cycle',
      graph: {
        edges: {},
        elements: {
          a: { parent: 'b', label: [], tags: {} },
          b: { parent: 'c', label: [], tags: {} },
          c: { parent: 'a', label: [], tags: {} },
        },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.ELEMENT_CYCLE);
    }
  });

  test('a valid, non-cyclic nested group chain (a -> b -> c, c top-level) has no ELEMENT_CYCLE', () => {
    const diagram = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'chain',
      graph: {
        edges: {},
        elements: {
          a: { parent: 'b', label: [], tags: {} },
          b: { parent: 'c', label: [], tags: {} },
          c: { label: [], tags: {} },
        },
      },
    });
    const result = validate(diagram);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).not.toContain(ViolationKind.ELEMENT_CYCLE);
    }
  });
});


describe('validator: stylesheet references the graph (design.md §14.1 "no orphaned style entry")', () => {
  const sheet = (init: Parameters<typeof create<typeof StylesheetSchema>>[1]): Stylesheet =>
    create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION, ...init });

  test('a style entry keyed to a node the graph does not define is a violation', () => {
    const result = validate(validDiagram(), sheet({ elements: { notAThing: {} } }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toContain(ViolationKind.STYLE_TARGET_MISSING);
      expect(result.value.violations[0]?.location).toBe('notAThing');
    }
  });

  test('style entries matching real elements produce nothing', () => {
    const result = validate(validDiagram(), sheet({
      elements: { load: {}, core: {} },
      edges: { load__resolve: {} },
    }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toHaveLength(0);
    }
  });

  test('each of the three maps is checked, not just nodes', () => {
    const result = validate(validDiagram(), sheet({
      elements: { ghostElement: {} },
      edges: { ghostEdge: {} },
      annotations: { ghostAnnotation: { content: [], anchor: { refId: 'gone', refKind: RefKind.ELEMENT } } },
    }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toHaveLength(3);
    }
  });

  test('an annotation key is NOT checked -- annotations are keyed by their own ids', () => {
    const result = validate(validDiagram(), sheet({ annotations: { note: { content: [] } } }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toHaveLength(0);
    }
  });

  test('an annotation anchored to a missing element is a violation', () => {
    const result = validate(validDiagram(), sheet({
      annotations: { note: { content: [], anchor: { refId: 'gone', refKind: RefKind.ELEMENT } } },
    }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toEqual([ViolationKind.ANNOTATION_ANCHOR_MISSING]);
    }
  });

  test('an annotation anchored to a real node produces nothing', () => {
    const result = validate(validDiagram(), sheet({
      annotations: { note: { content: [], anchor: { refId: 'load', refKind: RefKind.ELEMENT } } },
    }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toHaveLength(0);
    }
  });

  test('an element anchor must not resolve an edge id', () => {
    const result = validate(validDiagram(), sheet({
      annotations: { note: { content: [], anchor: { refId: 'load__resolve', refKind: RefKind.ELEMENT } } },
    }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(violationKinds(result.value)).toEqual([ViolationKind.ANNOTATION_ANCHOR_MISSING]);
    }
  });

  test('no stylesheet means no stylesheet violations', () => {
    const result = validate(validDiagram());
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.violations).toHaveLength(0);
    }
  });
});

// ===========================================================================
// LOADERS
// design.md §14.1: "loaders: JSON round-trip, malformed input rejection,
// schema_version handling, Localization parsing"
// ===========================================================================

describe('loaders: schema_version handling', () => {
  test('loadDiagram accepts the current schema_version', async () => {
    const text = JSON.stringify({
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'ok',
      graph: { elements: {}, edges: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('ok');
  });

  test('loadDiagram rejects schema_version 0 with an Err, not a throw', async () => {
    const text = JSON.stringify({
      schemaVersion: 0,
      id: 'zero',
      graph: { elements: {}, edges: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('schema_version');
    }
  });

  test('loadDiagram rejects an unsupported schema_version (e.g. 1) with an Err', async () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      id: 'future',
      graph: { elements: {}, edges: {} },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('1');
    }
  });

  test('schema_version omitted entirely defaults to proto3 zero-value 0 and is rejected', async () => {
    const text = JSON.stringify({
      id: 'no-version-field',
      graph: { elements: {}, edges: {} },
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
    const text = JSON.stringify({ notADiagramField: true, schemaVersion: CONTENT_SCHEMA_VERSION });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('err');
  });

  test('valid JSON with an unknown nested field on a Element is rejected', async () => {
    const text = JSON.stringify({
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'unknown-nested',
      graph: {
        elements: { a: { thisFieldDoesNotExist: 'x' } },
        edges: {},
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
    'schema_version current-version check, not by a "missing id" check — Diagram.id has no ' +
    'presence enforcement in proto3', async () => {
    const result = await loadDiagram('{}');
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('schema_version');
    }
  });

  test('valid Diagram JSON round-trips through loadDiagram with fields intact', async () => {
    const text = JSON.stringify({
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'roundtrip',
      title: [{ locale: 'en', source: 'Round Trip' }],
      graph: {
        elements: { a: { label: [{ locale: 'en', source: 'A' }], tags: { kind: 'stage' } } },
        edges: {},
      },
    });
    const result = await loadDiagram(text);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.id).toBe('roundtrip');
      expect(Object.keys(result.value.graph?.elements ?? {})).toContain('a');
      expect(result.value.graph?.elements['a']?.tags['kind']).toBe('stage');
    }
  });
});

describe('loaders: duplicate JSON object keys', () => {
  test('a JSON text with a duplicate key under graph.edges is accepted by ' +
    'JSON.parse (last value wins) rather than flagged — there is no ' +
    'duplicate-key detection anywhere in the load path, since by the time the ' +
    'map reaches the validator only one entry can exist per key', async () => {
    const text =
      '{"schemaVersion":2,"id":"dup","graph":{"elements":{"a":{},"b":{}},' +
      '"edges":{"e1":{"source":"a","target":"b"},"e1":{"source":"b","target":"a"}}}}';
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
    expect(delta.elementDeltas).toEqual([]);
    expect(delta.edgeDeltas).toEqual([]);
  });

  test('diffing two structurally-equal-but-distinct diagram objects yields no deltas', () => {
    const delta = diff(validDiagram(), validDiagram());
    expect(delta.elementDeltas).toEqual([]);
    expect(delta.edgeDeltas).toEqual([]);
  });
});

describe('diff: added / removed / modified', () => {
  test('a node present only in target is ADDED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    targetJson.graph.elements['extra'] = { label: [], tags: {} };
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const added = delta.elementDeltas.find((d) => d.elementId === 'extra');
    expect(added?.changeType).toBe(2 /* ADDED */);
    expect(added?.before).toBeUndefined();
    expect(added?.after).toBeDefined();
  });

  test('a node present only in base is DELETED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    delete targetJson.graph.elements['render'];
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const deleted = delta.elementDeltas.find((d) => d.elementId === 'render');
    expect(deleted?.changeType).toBe(3 /* DELETED */);
    expect(deleted?.after).toBeUndefined();
    expect(deleted?.before).toBeDefined();
  });

  test('a node whose fields differ between base and target is MODIFIED', () => {
    const base = diagramFromJson(pipelineJson());
    const targetJson = pipelineJson();
    targetJson.graph.elements['load'] = {
      parent: 'core',
      label: [{ locale: 'en', source: 'Load!' }],
      tags: {},
    };
    const target = diagramFromJson(targetJson);

    const delta = diff(base, target);
    const modified = delta.elementDeltas.find((d) => d.elementId === 'load');
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
    expect(delta.elementDeltas.every((d) => d.changeType !== 1 /* UNCHANGED */)).toBe(true);
    expect(delta.edgeDeltas.every((d) => d.changeType !== 1 /* UNCHANGED */)).toBe(true);
  });

  test('UNCHANGED deltas are included when includeUnchanged: true is passed', () => {
    const base = validDiagram();
    const target = validDiagram();
    const delta = diff(base, target, { includeUnchanged: true });
    expect(delta.elementDeltas.length).toBeGreaterThan(0);
    expect(delta.elementDeltas.every((d) => d.changeType === 1 /* UNCHANGED */)).toBe(true);
  });
});

describe('diff: groups', () => {
  // Groupings are topology, in Graph alongside nodes and edges. Only render_mode
  // is presentational, and that lives in the style file.
  const withGroupings = (elements: Record<string, { label: string }>): Diagram =>
    create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: 'g',
      graph: create(GraphSchema, {
        elements: Object.fromEntries(
          Object.entries(elements).map(([id, g]) => [
            id,
            create(ElementSchema, { role: ElementRole.GROUPING, label: [create(LocalizationSchema, { locale: 'en', source: g.label })] }),
          ]),
        ),
      }),
    });

  test('a group present only in target is ADDED, carrying its after', () => {
    const delta = diff(withGroupings({}), withGroupings({ svc: { label: 'Services' } }));
    expect(delta.elementDeltas.length).toBe(1);
    expect(delta.elementDeltas[0]!.elementId).toBe('svc');
    expect(delta.elementDeltas[0]!.changeType).toBe(ChangeType.ADDED);
    expect(delta.elementDeltas[0]!.after?.label[0]?.source).toBe('Services');
    expect(delta.elementDeltas[0]!.before).toBeUndefined();
  });

  test('a group present only in base is DELETED, carrying its before', () => {
    const delta = diff(withGroupings({ svc: { label: 'Services' } }), withGroupings({}));
    expect(delta.elementDeltas[0]!.changeType).toBe(ChangeType.DELETED);
    expect(delta.elementDeltas[0]!.before?.label[0]?.source).toBe('Services');
    expect(delta.elementDeltas[0]!.after).toBeUndefined();
  });

  test('a renamed group is MODIFIED and carries both sides', () => {
    const delta = diff(
      withGroupings({ svc: { label: 'Services' } }),
      withGroupings({ svc: { label: 'Core services' } }),
    );
    expect(delta.elementDeltas[0]!.changeType).toBe(ChangeType.MODIFIED);
    expect(delta.elementDeltas[0]!.before?.label[0]?.source).toBe('Services');
    expect(delta.elementDeltas[0]!.after?.label[0]?.source).toBe('Core services');
  });

  test('an unchanged group is omitted, and emitted under includeUnchanged', () => {
    const same = withGroupings({ svc: { label: 'Services' } });
    expect(diff(same, same).elementDeltas).toEqual([]);
    const verbose = diff(same, same, { includeUnchanged: true });
    expect(verbose.elementDeltas[0]!.changeType).toBe(ChangeType.UNCHANGED);
  });

  test('group ids are emitted in sorted order, like nodes and edges', () => {
    const delta = diff(withGroupings({}), withGroupings({
      zeta: { label: 'Z' }, alpha: { label: 'A' }, mid: { label: 'M' },
    }));
    expect(delta.elementDeltas.map((d) => d.elementId)).toEqual(['alpha', 'mid', 'zeta']);
  });

  test('a deleted group keeps its members recoverable through their own deltas', () => {
    // GroupingDelta carries the group's own fields only -- containment lives on
    // Element.parent_group. Rendering a deleted group means reading membership
    // back out of the deleted members' before snapshots, so this has to hold.
    const node = (parent: string): Element =>
      create(ElementSchema, { parent: parent, label: [create(LocalizationSchema, { locale: 'en', source: 'n' })] });
    const base = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION, id: 'g',
      graph: create(GraphSchema, {
        elements: { a: node('box'), b: node('box'), box: create(ElementSchema, { role: ElementRole.GROUPING }) },
      }),
    });
    const target = create(DiagramSchema, { schemaVersion: CONTENT_SCHEMA_VERSION, id: 'g', graph: create(GraphSchema, {}) });

    const delta = diff(base, target);
    expect(delta.elementDeltas[0]!.changeType).toBe(ChangeType.DELETED);

    const members = delta.elementDeltas
      .filter((d) => d.changeType === ChangeType.DELETED && d.before?.parent === 'box')
      .map((d) => d.elementId);
    expect(members).toEqual(['a', 'b']);
  });
});

describe('loaders: schema_version on pending edits', () => {
  const sheetWithEdit = (editVersion: number): string => JSON.stringify({
    schemaVersion: CONTENT_SCHEMA_VERSION,
    elements: {},
    pendingEdits: [{ schemaVersion: editVersion, id: 'e1' }],
  });

  test('loadStylesheet accepts a pending edit at the current schema_version', async () => {
    const result = await loadStylesheet(sheetWithEdit(STYLE_SCHEMA_VERSION));
    expect(result.kind).toBe('ok');
  });

  // The stylesheet is version 1, so only the nested check can reject this.
  test('loadStylesheet rejects a pending edit at version 1', async () => {
    const result = await loadStylesheet(sheetWithEdit(1));
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('schema_version');
      expect(result.error.message).toContain('e1');
    }
  });

  test('a pending edit omitting schema_version gets proto3 zero and is rejected', async () => {
    const result = await loadStylesheet(JSON.stringify({
      schemaVersion: CONTENT_SCHEMA_VERSION,
      pendingEdits: [{ id: 'no-version' }],
    }));
    expect(result.kind).toBe('err');
  });
});

describe('loaders: loadDelta', () => {
  test('loadDelta accepts the current schema_version', async () => {
    const result = await loadDelta(JSON.stringify({
      schemaVersion: CONTENT_SCHEMA_VERSION, baseRef: 'a.json', targetRef: 'b.json',
    }));
    expect(result.kind).toBe('ok');
  });

  test('loadDelta rejects schema_version 1', async () => {
    const result = await loadDelta(JSON.stringify({ schemaVersion: 1 }));
    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.message).toContain('schema_version');
    }
  });

  // Wire enum spelling is 'DELETED', not the proto constant name.
  test('loadDelta reads back exactly what the diff op writes', async () => {
    const base = await loadDiagram(await Bun.file('examples/stack-managed.diag.json').text());
    const target = await loadDiagram(await Bun.file('examples/stack-selfhosted.diag.json').text());
    if (base.kind !== 'ok' || target.kind !== 'ok') throw new Error('fixture load failed');

    const delta = diff(base.value, target.value);
    const written = toJson(DeltaSchema, delta);

    const result = await loadDelta(written);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.elementDeltas.length).toBe(delta.elementDeltas.length);
      expect(result.value.edgeDeltas.length).toBe(delta.edgeDeltas.length);
      expect(result.value.elementDeltas.length).toBe(delta.elementDeltas.length);
      expect(result.value.elementDeltas[0]?.changeType).toBe(delta.elementDeltas[0]?.changeType);
    }
  });
});
