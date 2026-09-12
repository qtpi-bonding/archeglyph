// SPDX-License-Identifier: AGPL-3.0-or-later

import { AdapterError, FileStamp, HostAdapter, LoadResult } from './host_adapter';
import { type Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { type Diagram } from '@archeglyph/proto/gen/content_pb';
import { Err, Ok, type Result } from '@archeglyph/proto/util/result';
import { loadDiagram, loadStylesheet, type LoadError } from '@archeglyph/core/loaders';
import { toJson } from '@archeglyph/proto/util/json';
import { hashStylesheet } from '../state/stylesheet_hash';

function toAdapterError(e: unknown): AdapterError {
  return Object.assign(new AdapterError(), { message: e instanceof Error ? e.message : String(e) });
}

export class BrowserFsAdapter implements HostAdapter {
  private diagHandle: FileSystemFileHandle | null = null;
  private styleHandle: FileSystemFileHandle | null = null;

  canSave(): boolean {
    return this.styleHandle !== null || this.diagHandle !== null;
  }

  async load(): Promise<Result<LoadResult, AdapterError>> {
    try {
      const result: LoadResult = 'showOpenFilePicker' in window
        ? await this.loadViaFsa()
        : await this.loadViaInput();
      return Ok(result);
    } catch (e: unknown) {
      return Err(toAdapterError(e));
    }
  }

  async save(stylesheet: Stylesheet, expectedBaseHash?: string): Promise<Result<void, AdapterError>> {
    try {
      const text: string = toJson(StylesheetSchema, stylesheet);
      // Verify only where a save could actually clobber something. With no
      // handle the save falls through to saveViaDownload, which writes a NEW
      // file to the downloads folder and cannot overwrite whatever an agent
      // edited -- so there is no staleness hazard to guard against, and
      // refusing here would break saving outright on every browser without
      // File System Access while protecting nothing.
      if (expectedBaseHash !== undefined && this.styleHandle !== null) {
        const file: File = await this.styleHandle.getFile();
        const loaded: Result<Stylesheet, LoadError> = await loadStylesheet(await file.text());
        if (loaded.kind === 'err') {
          return Err(Object.assign(new AdapterError(), { kind: 'io', message: loaded.error.message }));
        }
        const actualHash: string = await hashStylesheet(loaded.value);
        if (actualHash !== expectedBaseHash) {
          return Err(Object.assign(new AdapterError(), { kind: 'stale', message: 'The stylesheet changed externally' }));
        }
      }
      if ('showSaveFilePicker' in window) {
        await this.saveViaFsa(text);
      } else {
        this.saveViaDownload(text);
      }
      return Ok(undefined);
    } catch (e: unknown) {
      return Err(toAdapterError(e));
    }
  }

  async stat(): Promise<Result<FileStamp, AdapterError>> {
    try {
      if (this.styleHandle === null) {
        return Err(Object.assign(new AdapterError(), { kind: 'unsupported', message: 'No file to stat' }));
      }
      const file: File = await this.styleHandle.getFile();
      return Ok({ lastModified: file.lastModified, size: file.size });
    } catch (e: unknown) {
      return Err(toAdapterError(e));
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
    if (diagHandle !== null) {
      const styleHandle: FileSystemFileHandle | null = handles.find(
        (h: FileSystemFileHandle): boolean => h.name === styleNameForDiagram(diagHandle.name),
      ) ?? null;
      const diagFile: File = await diagHandle.getFile();
      const diagText: string = await diagFile.text();
      const diagResult: Result<Diagram, LoadError> = await loadDiagram(diagText);
      if (diagResult.kind !== 'err') {
        const stylesheet: Stylesheet | undefined = await this.loadOptionalHandle(styleHandle);
        this.diagHandle = diagHandle;
        this.styleHandle = styleHandle;
        const baseHash: string = stylesheet === undefined ? '' : await hashStylesheet(stylesheet);
        const stamp: FileStamp | undefined = styleHandle === null
          ? undefined
          : await this.fileStamp(styleHandle);
        return Object.assign(new LoadResult(), { diagram: diagResult.value, stylesheet, baseHash, stamp });
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

  private async fileStamp(handle: FileSystemFileHandle): Promise<FileStamp> {
    const file: File = await handle.getFile();
    return { lastModified: file.lastModified, size: file.size };
  }

  private async loadViaInput(): Promise<LoadResult> {
    const files: File[] = await pickFilesViaInput();
    const diagFile: File | null = files.find(
      (f: File): boolean => f.name.endsWith('.diag.json'),
    ) ?? null;
    if (diagFile !== null) {
      const styleFile: File | null = files.find(
        (f: File): boolean => f.name === styleNameForDiagram(diagFile.name),
      ) ?? null;
      const diagText: string = await diagFile.text();
      const diagResult: Result<Diagram, LoadError> = await loadDiagram(diagText);
      if (diagResult.kind !== 'err') {
        const stylesheet: Stylesheet | undefined = await loadOptionalFile(styleFile);
        const baseHash: string = stylesheet === undefined ? '' : await hashStylesheet(stylesheet);
        const stamp: FileStamp | undefined = styleFile === null
          ? undefined
          : { lastModified: styleFile.lastModified, size: styleFile.size };
        return Object.assign(new LoadResult(), { diagram: diagResult.value, stylesheet, baseHash, stamp });
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
    const writable: FileSystemWritableFileStream = await handle.createWritable();
    try {
      await writable.write(text);
      await writable.close();
      this.styleHandle = handle;
    } catch (error) {
      await writable.abort();
      throw error;
    }
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

function styleNameForDiagram(diagName: string): string {
  const suffix: string = '.diag.json';
  const baseName: string = diagName.endsWith(suffix)
    ? diagName.slice(0, diagName.length - suffix.length)
    : diagName;
  return `${baseName}.style.json`;
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
