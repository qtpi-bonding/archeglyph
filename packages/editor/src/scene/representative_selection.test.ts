// SPDX-License-Identifier: MPL-2.0
//
// A selected element that a re-layout absorbs into a closed block is no longer
// in the scene. Left alone the selection points at nothing: no outline, no
// inspector values. It resolves to the closed block that now stands for it.

import { describe, expect, test } from 'bun:test';
import { create } from '@bufbuild/protobuf';
import { DiagramSchema, ElementSchema, GraphSchema, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { Vec2Schema } from '@archeglyph/proto/gen/style_pb';
import { LaidOutDiagram } from '@archeglyph/core/layout/laid_out_diagram';
import { LaidOutGroup } from '@archeglyph/core/layout/laid_out_group';
import { LaidOutNode } from '@archeglyph/core/layout/laid_out_node';
import { init } from '@archeglyph/proto/util/init';

import type { ElementRef } from '../ui_state/ui_state';
import { buildSceneGeometry, type SceneGeometry } from './scene';
import { representativeSelection } from './representative_selection';

const vec = (x: number, y: number) => create(Vec2Schema, { x, y });

function contentDiagram(parents: Record<string, string | undefined>): Diagram {
  return create(DiagramSchema, {
    graph: create(GraphSchema, {
      elements: Object.fromEntries(
        Object.entries(parents).map(([id, parent]) => [id, create(ElementSchema, { parent })]),
      ),
    }),
  });
}

function sceneWith(groups: Array<{ id: string; closed: boolean }>, nodeIds: string[] = []): SceneGeometry {
  return buildSceneGeometry(
    init(new LaidOutDiagram(), {
      nodes: Object.fromEntries(nodeIds.map((id) => [id, init(new LaidOutNode(), {
        id, position: vec(0, 0), size: vec(10, 10),
      })])),
      groups: Object.fromEntries(groups.map(({ id, closed }) => [id, init(new LaidOutGroup(), {
        id, position: vec(0, 0), size: vec(100, 100), isSuperNode: closed, hiddenDescendantCount: closed ? 1 : 0,
      })])),
    }),
    '<svg/>',
  );
}

const leaf = (id: string): ElementRef => ({ kind: 'node', id });

describe('representativeSelection', () => {
  const diagram = contentDiagram({ top: undefined, P: 'top', c1: 'P', c2: 'P', x: 'top' });

  test('a leaf absorbed into a closed container resolves to that container', () => {
    const scene = sceneWith([{ id: 'top', closed: false }, { id: 'P', closed: true }], ['x']);

    expect(representativeSelection([leaf('c1')], scene, diagram)).toEqual([{ kind: 'group', id: 'P' }]);
  });

  test('two members of the same block collapse to one selected block', () => {
    const scene = sceneWith([{ id: 'top', closed: false }, { id: 'P', closed: true }]);

    expect(representativeSelection([leaf('c1'), leaf('c2')], scene, diagram))
      .toEqual([{ kind: 'group', id: 'P' }]);
  });

  test('the outermost closed ancestor represents a deeply nested element', () => {
    const nested = contentDiagram({ A: undefined, B: 'A', c: 'B' });
    const scene = sceneWith([{ id: 'A', closed: true }]);

    expect(representativeSelection([leaf('c')], scene, nested)).toEqual([{ kind: 'group', id: 'A' }]);
  });

  test('an element that is still in the scene is left alone', () => {
    const scene = sceneWith([{ id: 'top', closed: false }], ['x']);

    expect(representativeSelection([leaf('x')], scene, diagram)).toEqual([leaf('x')]);
  });

  test('an element with no closed ancestor is not rewritten to an open one', () => {
    // Nothing absorbed it, so there is no representative to substitute; this
    // is the existing behaviour for an element that has simply gone.
    const scene = sceneWith([{ id: 'top', closed: false }, { id: 'P', closed: false }]);

    expect(representativeSelection([leaf('c1')], scene, diagram)).toEqual([leaf('c1')]);
  });

  test('edges and annotations pass through untouched, in order', () => {
    const scene = sceneWith([{ id: 'top', closed: false }, { id: 'P', closed: true }]);
    const edge: ElementRef = { kind: 'edge', id: 'e1' };
    const note: ElementRef = { kind: 'annotation', id: 'a1' };

    expect(representativeSelection([edge, leaf('c1'), note], scene, diagram))
      .toEqual([edge, { kind: 'group', id: 'P' }, note]);
  });
});
