// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, describe, expect, test } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!(globalThis as { document?: unknown }).document) {
  GlobalRegistrator.register();
}

const { FilePickerDiagramSource } = await import('./file_picker_diagram_source');

const DIAGRAM = JSON.stringify({
  schemaVersion: 1,
  id: 'sample',
  graph: { nodes: { a: { label: [{ locale: 'en', source: 'A' }] } }, edges: {} },
});

function stubPicker(name: string, text: string): void {
  (window as unknown as Record<string, unknown>).showOpenFilePicker = async (): Promise<unknown[]> => [
    { getFile: async (): Promise<unknown> => ({ name, text: async (): Promise<string> => text }) },
  ];
}

afterEach((): void => {
  delete (window as unknown as Record<string, unknown>).showOpenFilePicker;
});

describe('FilePickerDiagramSource', () => {
  test('loads the chosen file and remembers its name', async () => {
    stubPicker('checkout.diag.json', DIAGRAM);
    const source = new FilePickerDiagramSource();

    const result = await source.load();

    expect(result.kind).toBe('ok');
    expect(source.fileName()).toBe('checkout.diag.json');
  });

  test('a file that is not a diagram is an error naming the file', async () => {
    stubPicker('notes.json', '{"nope": true}');
    const source = new FilePickerDiagramSource();

    const result = await source.load();

    expect(result.kind).toBe('err');
    expect(result.kind === 'err' && result.error.message).toContain('notes.json');
    expect(source.fileName()).toBeUndefined();
  });

  test('a cancelled pick is an error, not a throw', async () => {
    (window as unknown as Record<string, unknown>).showOpenFilePicker =
      async (): Promise<unknown[]> => [];

    const result = await new FilePickerDiagramSource().load();

    expect(result.kind).toBe('err');
  });
});
