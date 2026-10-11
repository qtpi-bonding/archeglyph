// SPDX-License-Identifier: MPL-2.0

// Hand-maintained since the element-model port.

import { Edge, Element, ElementRole } from '@archeglyph/proto/gen/content_pb';
import { GroupRenderMode, RefKind } from '@archeglyph/proto/gen/style_pb';
import { Ok, Result } from '@archeglyph/proto/util/result';
import { ValidateError } from '../validate_error';
import { ValidateRequest } from '../validate_request';
import { ValidateResponse } from '../validate_response';
import { hasControlCharacter } from '../control_character';
import { Violation, ViolationKind, VIOLATION_KIND_ORDER } from '../violation';
import { Validator } from './';
import { init } from '@archeglyph/proto/util/init';

export class ValidatorImpl implements Validator {
  validate(request: ValidateRequest): Result<ValidateResponse, ValidateError> {
    const graph = request.diagram.graph;
    const elementsMap: { [k: string]: Element } = graph !== undefined ? graph.elements : {};
    const edgesMap: { [k: string]: Edge } = graph !== undefined ? graph.edges : {};

    const sortedKeys = (obj: { [k: string]: unknown }): string[] => Object.keys(obj).sort();
    const normParent = (raw: string | undefined): string | undefined => {
      if (raw === undefined || raw === '') {
        return undefined;
      } else {
        return raw;
      }
    };

    const violations: Violation[] = [];

    // Check 0: ids can be written into an SVG attribute.
    const idKinds: Array<[string, { [k: string]: unknown }]> = [['element', elementsMap], ['edge', edgesMap]];
    for (const [label, ids] of idKinds) {
      for (const id of sortedKeys(ids)) {
        if (hasControlCharacter(id)) {
          violations.push(init(new Violation(), {
            kind: ViolationKind.ID_CONTROL_CHARACTER,
            location: id,
            message: `${label} id ${JSON.stringify(id)} contains a control character, which an SVG attribute cannot carry`,
          }));
        }
      }
    }

    // Check 1: Edge source/target reference existing entity elements.
    const sortedEdgeIds = sortedKeys(edgesMap);
    for (const id of sortedEdgeIds) {
      const edge = edgesMap[id];
      const source = elementsMap[edge.source];
      if (source === undefined) {
        violations.push(init(new Violation(), {
          kind: ViolationKind.EDGE_SOURCE_MISSING,
          location: id,
          message: `edge '${id}' source '${edge.source}' does not reference an existing entity element`,
        }));
      } else if (source.role === ElementRole.GROUPING) {
        violations.push(init(new Violation(), {
          kind: ViolationKind.EDGE_ENDPOINT_NOT_ENTITY,
          location: id,
          message: `edge '${id}' source '${edge.source}' is a grouping element`,
        }));
      }
      const target = elementsMap[edge.target];
      if (target === undefined) {
        violations.push(init(new Violation(), {
          kind: ViolationKind.EDGE_TARGET_MISSING,
          location: id,
          message: `edge '${id}' target '${edge.target}' does not reference an existing entity element`,
        }));
      } else if (target.role === ElementRole.GROUPING) {
        violations.push(init(new Violation(), {
          kind: ViolationKind.EDGE_ENDPOINT_NOT_ENTITY,
          location: id,
          message: `edge '${id}' target '${edge.target}' is a grouping element`,
        }));
      }
    }

    // Check 2: Element.parent references existing element.
    const sortedElementIds = sortedKeys(elementsMap);
    for (const id of sortedElementIds) {
      const element = elementsMap[id];
      const p = normParent(element.parent);
      if (p !== undefined && elementsMap[p] === undefined) {
        violations.push(init(new Violation(), {
          kind: ViolationKind.ELEMENT_PARENT_MISSING,
          location: id,
          message: `element '${id}' parent '${p}' does not reference an existing element`,
        }));
      } else {
        // valid or top-level.
      }
    }

    // Check 3: parent chain is acyclic over all elements.
    type Color = 'white' | 'gray' | 'black';
    const colors = new Map<string, Color>();
    for (const id of sortedElementIds) {
      colors.set(id, 'white');
    }

    const dfs = (id: string, stack: string[]): void => {
      colors.set(id, 'gray');
      stack.push(id);
      const element = elementsMap[id];
      const parentId = normParent(element.parent);
      if (parentId !== undefined && elementsMap[parentId] !== undefined) {
        const parentColor = colors.get(parentId);
        if (parentColor === 'gray') {
          const cycleStart = stack.indexOf(parentId);
          const cyclePath = stack.slice(cycleStart);
          cyclePath.push(parentId);
          const location = cyclePath.join(', ');
          violations.push(init(new Violation(), {
            kind: ViolationKind.ELEMENT_CYCLE,
            location,
            message: `element cycle detected: ${location}`,
          }));
        } else if (parentColor === 'white') {
          dfs(parentId, stack);
        } else {
          // black — already fully processed, no cycle through this parent.
        }
      } else {
        // no parent or parent already reported missing — skip.
      }
      stack.pop();
      colors.set(id, 'black');
    };

    for (const id of sortedElementIds) {
      if (colors.get(id) === 'white') {
        dfs(id, []);
      } else {
        // already visited.
      }
    }


    // The cascade looks style up from the graph, so a key naming no element
    // is never visited and styles nothing.
    const stylesheet = request.stylesheet;
    if (stylesheet !== undefined) {
      const checkStyleTargets = (
        entries: { [k: string]: unknown },
        targets: { [k: string]: unknown },
        kindLabel: string,
      ): void => {
        for (const key of sortedKeys(entries)) {
          if (targets[key] === undefined) {
            violations.push(init(new Violation(), {
              kind: ViolationKind.STYLE_TARGET_MISSING,
              location: key,
              message: `stylesheet styles ${kindLabel} '${key}', which the graph does not define`,
            }));
          }
        }
      };
      checkStyleTargets(stylesheet.elements, elementsMap, 'element');

      // Bundles are edges the resolver derives when it merges remapped edges;
      // they have no entry of their own, so a key naming one is reported as
      // that rather than as a plain missing edge.
      const authoredEdgeStyles: { [k: string]: unknown } = {};
      for (const key of sortedKeys(stylesheet.edges)) {
        if (key.startsWith('bundle:') && edgesMap[key] === undefined) {
          violations.push(init(new Violation(), {
            kind: ViolationKind.STYLE_TARGET_IS_BUNDLE,
            location: key,
            message: `stylesheet styles derived bundle '${key}', which cannot be styled`,
          }));
        } else {
          authoredEdgeStyles[key] = stylesheet.edges[key];
        }
      }
      checkStyleTargets(authoredEdgeStyles, edgesMap, 'edge');

      for (const key of sortedKeys(stylesheet.elements)) {
        const entry = stylesheet.elements[key];
        const element = elementsMap[key];
        if (entry !== undefined && element !== undefined &&
            entry.renderMode === GroupRenderMode.DISSOLVED &&
            element.role !== ElementRole.GROUPING) {
          violations.push(init(new Violation(), {
            kind: ViolationKind.RENDER_MODE_DISSOLVED_ON_ENTITY,
            location: key,
            message: `element '${key}' has dissolved render mode but is not grouping`,
          }));
        }
      }
      if (stylesheet.openDepth !== undefined && stylesheet.openDepth < 1) {
        violations.push(init(new Violation(), {
          kind: ViolationKind.OPEN_DEPTH_TOO_SMALL,
          location: 'openDepth',
          message: `stylesheet openDepth must be at least 1`,
        }));
      }

      // An annotation key is its own id; only the anchor is a graph reference.
      for (const key of sortedKeys(stylesheet.annotations)) {
        const anchor = stylesheet.annotations[key].anchor;
        if (anchor === undefined) {
          continue;
        }
        const targets = anchor.refKind === RefKind.ELEMENT ? elementsMap
          : anchor.refKind === RefKind.EDGE ? edgesMap
          : undefined;
        if (targets === undefined || targets[anchor.refId] === undefined) {
          violations.push(init(new Violation(), {
            kind: ViolationKind.ANNOTATION_ANCHOR_MISSING,
            location: key,
            message: `annotation '${key}' anchors to '${anchor.refId}', which the graph does not define`,
          }));
        }
      }
    }

    violations.sort((a: Violation, b: Violation): number => {
      const kindDiff = VIOLATION_KIND_ORDER[a.kind] - VIOLATION_KIND_ORDER[b.kind];
      if (kindDiff !== 0) {
        return kindDiff;
      } else {
        return a.location < b.location ? -1 : a.location > b.location ? 1 : 0;
      }
    });

    return Ok(init(new ValidateResponse(), { violations }));
  }
}
