// SPDX-License-Identifier: MPL-2.0

import { afterEach, describe, expect, test } from 'bun:test';
import { create, toJson } from '@bufbuild/protobuf';
import { DiagramSchema, GraphSchema, NodeSchema } from '@archeglyph/proto/gen/content_pb';

import { UrlParamDiagramSource } from './url_param_diagram_source';

const diagram = create(DiagramSchema, {
  schemaVersion: 1,
  id: 'base',
  graph: create(GraphSchema, { nodes: { a: create(NodeSchema, {}) } }),
});
const diagramJson = JSON.stringify(toJson(DiagramSchema, diagram));
const realFetch = globalThis.fetch;

function stubFetch(body: string, status: number = 200): void {
  globalThis.fetch = (async () =>
    new Response(body, { status })) as unknown as typeof fetch;
}

afterEach((): void => {
  globalThis.fetch = realFetch;
});

describe('a diff base read from URL params', () => {
  test('decodes an inline base64 diagram', async () => {
    const source = new UrlParamDiagramSource(btoa(diagramJson), null);
    const result = await source.load();

    expect(result.kind).toBe('ok');
    expect(result.kind === 'ok' && result.value.id).toBe('base');
  });

  test('prefers the inline value over a remote url', async () => {
    stubFetch('{"schemaVersion":1,"id":"remote"}');
    const source = new UrlParamDiagramSource(btoa(diagramJson), 'https://example.test/x.diag.json');

    const result = await source.load();

    expect(result.kind === 'ok' && result.value.id).toBe('base');
  });

  test('fetches and parses a remote url when there is no inline value', async () => {
    stubFetch(diagramJson);
    const source = new UrlParamDiagramSource(null, 'https://example.test/x.diag.json');

    const result = await source.load();

    expect(result.kind === 'ok' && result.value.id).toBe('base');
  });

  test('a non-2xx response is an error naming the url and status', async () => {
    stubFetch('nope', 404);
    const source = new UrlParamDiagramSource(null, 'https://example.test/missing.diag.json');

    const result = await source.load();

    expect(result.kind).toBe('err');
    expect(result.kind === 'err' && result.error.message).toContain('404');
    expect(result.kind === 'err' && result.error.message).toContain('missing.diag.json');
  });

  test('unparseable json is an error, not a throw', async () => {
    stubFetch('this is not json');
    const source = new UrlParamDiagramSource(null, 'https://example.test/x.diag.json');

    const result = await source.load();

    expect(result.kind).toBe('err');
  });

  test('no inline value and no url is an error, not an empty diagram', async () => {
    const result = await new UrlParamDiagramSource(null, null).load();

    expect(result.kind).toBe('err');
    expect(result.kind === 'err' && result.error.message).toContain('base_d');
  });
});
