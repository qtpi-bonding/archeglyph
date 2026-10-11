// SPDX-License-Identifier: MPL-2.0

// Hand-maintained since the element-model port.

import { Delta, DeltaSchema, Diagram, DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { LoadRequest } from '../load_request';
import { Loader } from '../loader';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { Theme, ThemeSchema } from '@archeglyph/proto/gen/theme_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { CONTENT_SCHEMA_VERSION, STYLE_SCHEMA_VERSION } from '@archeglyph/proto/schema_version';

// A file written for an older schema fails the first time the parser meets a
// key that no longer exists, which says nothing about the real problem. Read
// the version first and refuse on that. proto3 JSON allows either spelling of
// the key, so both are checked. A missing or zero version is left to the
// parser and the checks after it.
function rejectOtherSchema(text: string, label: string, expected: number): void {
  const raw = JSON.parse(text) as { schemaVersion?: unknown; schema_version?: unknown } | null;
  if (raw === null || typeof raw !== 'object') {
    return;
  }
  const version = raw.schemaVersion ?? raw.schema_version;
  if (typeof version === 'number' && version !== expected && version !== 0) {
    throw new Error(`${label} schema_version ${version} is not supported; expected ${expected}`);
  }
}

export class LoaderImpl implements Loader {
  async loadDiagram(request: LoadRequest): Promise<Diagram> {
    rejectOtherSchema(request.text, 'content', CONTENT_SCHEMA_VERSION);
    const diagram = fromJson(DiagramSchema, request.text);
    if (diagram.schemaVersion !== CONTENT_SCHEMA_VERSION) {
      throw new Error(
        `loadDiagram: unsupported schema_version ${diagram.schemaVersion} (expected ${CONTENT_SCHEMA_VERSION})`,
      );
    }
    return diagram;
  }
  async loadStylesheet(request: LoadRequest): Promise<Stylesheet> {
    rejectOtherSchema(request.text, 'style', STYLE_SCHEMA_VERSION);
    const stylesheet = fromJson(StylesheetSchema, request.text);
    if (stylesheet.schemaVersion !== STYLE_SCHEMA_VERSION) {
      throw new Error(
        `loadStylesheet: unsupported schema_version ${stylesheet.schemaVersion} (expected ${STYLE_SCHEMA_VERSION})`,
      );
    }
    // StyleEdit carries its own schema_version; the parent's check above
    // does not cover it.
    for (const edit of stylesheet.pendingEdits) {
      if (edit.schemaVersion !== STYLE_SCHEMA_VERSION) {
        throw new Error(
          `loadStylesheet: pending edit '${edit.id}' has unsupported schema_version ${edit.schemaVersion} (expected ${STYLE_SCHEMA_VERSION})`,
        );
      }
    }
    return stylesheet;
  }
  async loadDelta(request: LoadRequest): Promise<Delta> {
    rejectOtherSchema(request.text, 'content', CONTENT_SCHEMA_VERSION);
    const delta = fromJson(DeltaSchema, request.text);
    if (delta.schemaVersion !== CONTENT_SCHEMA_VERSION) {
      throw new Error(
        `loadDelta: unsupported schema_version ${delta.schemaVersion} (expected ${CONTENT_SCHEMA_VERSION})`,
      );
    }
    return delta;
  }
  async loadTheme(request: LoadRequest): Promise<Theme> {
    const theme = fromJson(ThemeSchema, request.text);
    if (theme.schemaVersion !== 1) {
      throw new Error(
        `loadTheme: unsupported schema_version ${theme.schemaVersion} (expected 1)`,
      );
    }
    return theme;
  }
}
