// SPDX-License-Identifier: AGPL-3.0-or-later

import { HostAdapter, LoadResult } from './host_adapter';
import { type Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { type Diagram } from '@archeglyph/proto/gen/content_pb';
import { type Result } from '@archeglyph/proto/util/result';
import { loadDiagram, loadStylesheet, type LoadError } from '@archeglyph/core/loaders';
import { toJson } from '@archeglyph/proto/util/json';

export class BrowserFsAdapter implements HostAdapter {
  private diagHandle: FileSystemFileHandle | null = null;
  private styleHandle: FileSystemFileHandle | null = null;

  canSave(): boolean {
    return true;
  }

  async load(): Promise<LoadResult> {
    if ('showOpenFilePicker' in window) {
      return this.loadViaFsa();
    } else {
      return this.loadViaInput();
    }
  }

  async save(stylesheet: Stylesheet): Promise<void> {
    const text: string = toJson(StylesheetSchema, stylesheet);
    if ('showSaveFilePicker' in window) {
      await this.saveViaFsa(text);
    } else {
      this.saveViaDownload(text);
    }
  }

  private async loadViaFsa(): Promise<LoadResult> {
    const handles: FileSystemFileHandle[] = await window.showOpenFilePicker({
      multiple: true,
      types: [{ description: 'Diagram files', accept: { 'application/json': ['.json'] } }],
    });
    const diagHandle: FileSystemFileHandle | null = handles.find(
      (h: FileSystemFileHandle): boolean => h.name.endsWith('.diag.json'),
    ) ?? null;
    const styleHandle: FileSystemFileHandle | null = handles.find(
      (h: FileSystemFileHandle): boolean => h.name.endsWith('.style.json'),
    ) ?? null;
    if (diagHandle !== null) {
      this.diagHandle = diagHandle;
      this.styleHandle = styleHandle;
      const diagFile: File = await diagHandle.getFile();
      const diagText: string = await diagFile.text();
      const diagResult: Result<Diagram, LoadError> = await loadDiagram(diagText);
      if (diagResult.kind !== 'err') {
        const stylesheet: Stylesheet | undefined = await this.loadOptionalHandle(styleHandle);
        return Object.assign(new LoadResult(), { diagram: diagResult.value, stylesheet });
      } else {
        throw new Error(diagResult.error.message);
      }
    } else {
      throw new Error('No .diag.json file selected');
    }
  }

  private async loadOptionalHandle(
    handle: FileSystemFileHandle | null,
  ): Promise<Stylesheet | undefined> {
    if (handle !== null) {
      const file: File = await handle.getFile();
      const text: string = await file.text();
      const result: Result<Stylesheet, LoadError> = await loadStylesheet(text);
      if (result.kind !== 'err') {
        return result.value;
      } else {
        throw new Error(result.error.message);
      }
    } else {
      return undefined;
    }
  }

  private async loadViaInput(): Promise<LoadResult> {
    const files: File[] = await pickFilesViaInput();
    const diagFile: File | null = files.find(
      (f: File): boolean => f.name.endsWith('.diag.json'),
    ) ?? null;
    const styleFile: File | null = files.find(
      (f: File): boolean => f.name.endsWith('.style.json'),
    ) ?? null;
    if (diagFile !== null) {
      const diagText: string = await diagFile.text();
      const diagResult: Result<Diagram, LoadError> = await loadDiagram(diagText);
      if (diagResult.kind !== 'err') {
        const stylesheet: Stylesheet | undefined = await loadOptionalFile(styleFile);
        return Object.assign(new LoadResult(), { diagram: diagResult.value, stylesheet });
      } else {
        throw new Error(diagResult.error.message);
      }
    } else {
      throw new Error('No .diag.json file selected');
    }
  }

  private async saveViaFsa(text: string): Promise<void> {
    const handle: FileSystemFileHandle = this.styleHandle !== null
      ? this.styleHandle
      : await window.showSaveFilePicker({
          suggestedName: this.computeStyleName(),
          types: [{ description: 'Style files', accept: { 'application/json': ['.json'] } }],
        });
    this.styleHandle = handle;
    const writable: FileSystemWritableFileStream = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  private saveViaDownload(text: string): void {
    const blob: Blob = new Blob([text], { type: 'application/json' });
    const url: string = URL.createObjectURL(blob);
    const anchor: HTMLAnchorElement = document.createElement('a');
    anchor.href = url;
    anchor.download = this.computeStyleName();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private computeStyleName(): string {
    const diagName: string = this.diagHandle !== null ? this.diagHandle.name : 'diagram.diag.json';
    const suffix: string = '.diag.json';
    const baseName: string = diagName.endsWith(suffix)
      ? diagName.slice(0, diagName.length - suffix.length)
      : diagName;
    return `${baseName}.style.json`;
  }
}

async function loadOptionalFile(file: File | null): Promise<Stylesheet | undefined> {
  if (file !== null) {
    const text: string = await file.text();
    const result: Result<Stylesheet, LoadError> = await loadStylesheet(text);
    if (result.kind !== 'err') {
      return result.value;
    } else {
      throw new Error(result.error.message);
    }
  } else {
    return undefined;
  }
}

function pickFilesViaInput(): Promise<File[]> {
  return new Promise<File[]>((resolve: (files: File[]) => void) => {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json';
    input.onchange = (_ev: Event): void => {
      const rawFiles: FileList | null = input.files;
      resolve(rawFiles !== null ? Array.from(rawFiles) : []);
    };
    input.click();
  });
}
