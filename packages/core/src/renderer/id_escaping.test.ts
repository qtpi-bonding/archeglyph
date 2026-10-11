// SPDX-License-Identifier: MPL-2.0
//
// Ids come from the source (an archegraph symbol such as `Foo#<constructor>().`)
// and end up inside SVG attributes, so they have to be escaped there. Found by
// rendering archeglyph's own archegraph index, where 21 element ids contain `<`
// and `>` and made the SVG not well-formed XML.

import { describe, expect, test } from 'bun:test';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import type { ELK } from 'elkjs';
import { createRequire } from 'node:module';
import { fromJson } from '@archeglyph/proto/util/json';
import { DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { lightTheme } from '@archeglyph/themes';
import { renderPipeline } from '../pipeline';
import { LayoutEngineImpl } from '../layout/layout_engine/impl';
import { ElkAdapterImpl } from '../layout/layout_adapter/impl';

const require_ = createRequire(import.meta.url);

function newElk(): unknown {
  return new (ElkConstructor as unknown as new (opts: object) => ELK)({
    workerUrl: require_.resolve('elkjs/lib/elk-worker.min.js'),
    workerFactory: (url: string) => new Worker(url),
  });
}

async function render(json: unknown): Promise<string> {
  const diagram = fromJson(DiagramSchema, JSON.stringify(json));
  const theme = lightTheme();
  const result = await renderPipeline(
    diagram, undefined, new Map([['default', theme]]),
    new LayoutEngineImpl(new ElkAdapterImpl(newElk() as never)),
  );
  if (result.kind === 'err') {
    throw new Error(`render failed at ${result.error.stage}`);
  }
  return result.value;
}

const SPECIAL = 'Foo#<constructor>().&"x"';

const diagram = {
  schemaVersion: 2,
  id: 'ids',
  graph: {
    elements: {
      [SPECIAL]: { label: [{ locale: 'en', source: 'special' }] },
      plain: { label: [{ locale: 'en', source: 'plain' }] },
    },
    edges: { [`${SPECIAL}__plain`]: { source: SPECIAL, target: 'plain' } },
  },
};

describe('ids with XML-special characters', () => {
  test('are escaped in every attribute that carries them', async () => {
    const svg = await render(diagram);
    expect(svg).toContain('data-element-id="Foo#&lt;constructor&gt;().&amp;&quot;x&quot;"');
    expect(svg).toContain('id="node-Foo#&lt;constructor&gt;().&amp;&quot;x&quot;"');
  });

  test('leave no raw angle bracket, ampersand or quote inside an attribute value', async () => {
    const svg = await render(diagram);
    const values = [...svg.matchAll(/ (?:id|data-element-id)="([^"]*)"/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(3);
    for (const value of values) {
      expect(value).not.toMatch(/[<>"]|&(?!(?:amp|lt|gt|quot);)/);
    }
  });

  test('an id that needs no escaping is unchanged', async () => {
    const svg = await render(diagram);
    expect(svg).toContain('data-element-id="plain"');
  });
});
