// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The headline claim of the `editor-annotations` pillar, reduced to the part
// that can be checked without a browser: dragging an annotation's grip onto an
// element writes an anchor that the renderer then draws, and releasing over
// empty canvas clears it.
//
// End-to-end through the real pipeline on purpose. Each piece of this is
// individually simple; what the pillar adds is a path between the gesture and
// a painted line, and every previous bug in this editor lived in such a path
// rather than in one of its ends.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { create } from '@bufbuild/protobuf';
import {
  AnnotationEntrySchema,
  AnnotationLayoutSchema,
  StylesheetSchema,
  Vec2Schema,
  type Stylesheet,
} from '@archeglyph/proto/gen/style_pb';
import { DiagramSchema, LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { blueprintTheme } from '@archeglyph/themes';
import { seedComponentBindings } from '@archeglyph/core/resolver/seed_bindings';
import { layoutPipeline } from '@archeglyph/core/pipeline';
import { SvgRendererImpl } from '@archeglyph/core/renderer/svg_renderer';
import { LayoutEngineImpl } from '@archeglyph/core/layout/layout_engine';
import { ElkAdapterImpl } from '@archeglyph/core/layout/layout_adapter';
import { applyStyleEditToStylesheet } from '../state/apply_style_edit';
import { anchorCommit } from './anchor_machine';
import type { ElementRef } from '../ui_state/ui_state';

const require_ = createRequire(import.meta.url);
const newElk = (): unknown =>
  new (ElkConstructor as unknown as new (opts: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });

const CONTENT = {
  schemaVersion: 1,
  id: 'anchored',
  graph: { nodes: { target: { id: 'target', label: [{ locale: 'en', source: 'target' }] } } },
};

function baseStylesheet(): Stylesheet {
  return create(StylesheetSchema, {
    schemaVersion: 1,
    annotations: {
      note: create(AnnotationEntrySchema, {
        id: 'note',
        content: [create(LocalizationSchema, { source: 'note' })],
        layout: create(AnnotationLayoutSchema, {
          position: create(Vec2Schema, { x: 400, y: 400 }),
          size: create(Vec2Schema, { x: 60, y: 20 }),
        }),
      }),
    },
  });
}

async function calloutPathCount(stylesheet: Stylesheet): Promise<number> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(CONTENT));
  const theme = blueprintTheme();
  const laid = await layoutPipeline(
    diagram,
    seedComponentBindings(diagram, stylesheet, theme),
    theme,
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (laid.kind === 'err') { throw new Error(`layout failed at ${laid.error.stage}`); }
  const rendered = new SvgRendererImpl().render(laid.value);
  if (rendered.kind === 'err') { throw new Error(rendered.error.message); }
  const open = rendered.value.indexOf('<g id="annotation-note"');
  const group = rendered.value.slice(open, rendered.value.indexOf('</g>', open));
  return (group.match(/d="M [-\d.]+,[-\d.]+ L [-\d.]+,[-\d.]+"/g) ?? []).length;
}

const noteRef: ElementRef = { kind: 'annotation', id: 'note' };
const targetRef: ElementRef = { kind: 'node', id: 'target' };

describe('the anchor gesture reaches a painted callout', () => {
  test('releasing over a node anchors the callout to it', async () => {
    const before = baseStylesheet();
    expect(await calloutPathCount(before)).toBe(0);

    const edit = anchorCommit({ ref: noteRef }, before, targetRef);
    const after = applyStyleEditToStylesheet(before, edit);

    expect(after.annotations['note']?.anchor?.refId).toBe('target');
    expect(await calloutPathCount(after)).toBe(1);
  });

  test('releasing over empty canvas clears an existing anchor', async () => {
    const anchored = applyStyleEditToStylesheet(
      baseStylesheet(),
      anchorCommit({ ref: noteRef }, baseStylesheet(), targetRef),
    );
    expect(await calloutPathCount(anchored)).toBe(1);

    const cleared = applyStyleEditToStylesheet(anchored, anchorCommit({ ref: noteRef }, anchored, undefined));

    expect(cleared.annotations['note']?.anchor).toBeUndefined();
    expect(await calloutPathCount(cleared)).toBe(0);
  });

  test('releasing over another annotation does not anchor to it', async () => {
    // AnnotationAnchor has no RefKind for an annotation and calloutSections
    // has no case for one, so offering it would write a value nothing
    // downstream can read.
    const before = baseStylesheet();
    const edit = anchorCommit({ ref: noteRef }, before, { kind: 'annotation', id: 'other' });
    const after = applyStyleEditToStylesheet(before, edit);

    expect(after.annotations['note']?.anchor).toBeUndefined();
  });
});
