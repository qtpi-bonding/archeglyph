// SPDX-License-Identifier: MPL-2.0

import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { loadDiagram, type LoadError } from '@archeglyph/core/loaders';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';
import { init } from '@archeglyph/proto/util/init';
import { AdapterError } from '../adapters/host_adapter';
import { DiagramSource } from './diagram_source';

interface PickedFile {
  name: string;
  text(): Promise<string>;
}

export class FilePickerDiagramSource implements DiagramSource {
  private picked: string | undefined;

  fileName(): string | undefined {
    return this.picked;
  }

  async load(): Promise<Result<Diagram, AdapterError>> {
    try {
      const file: PickedFile | undefined = 'showOpenFilePicker' in window
        ? await pickViaFsa()
        : await pickViaInput();
      if (file === undefined) {
        return Err(init(new AdapterError(), { kind: 'io', message: 'No file chosen' }));
      }
      const result: Result<Diagram, LoadError> = await loadDiagram(await file.text());
      if (result.kind === 'err') {
        return Err(init(new AdapterError(), {
          kind: 'io',
          message: `${file.name}: ${result.error.message}`,
        }));
      }
      this.picked = file.name;
      return Ok(result.value);
    } catch (e: unknown) {
      return Err(init(new AdapterError(), {
        kind: 'io',
        message: e instanceof Error ? e.message : String(e),
      }));
    }
  }
}

async function pickViaFsa(): Promise<PickedFile | undefined> {
  const handles: FileSystemFileHandle[] = await window.showOpenFilePicker({
    types: [{ description: 'archeglyph diagram', accept: { 'application/json': ['.json'] } }],
    multiple: false,
  });
  const handle: FileSystemFileHandle | undefined = handles[0];
  return handle === undefined ? undefined : await handle.getFile();
}

function pickViaInput(): Promise<PickedFile | undefined> {
  return new Promise<PickedFile | undefined>((resolve): void => {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', (): void => { resolve(input.files?.[0] ?? undefined); });
    input.addEventListener('cancel', (): void => { resolve(undefined); });
    input.click();
  });
}
