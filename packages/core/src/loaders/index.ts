// SPDX-License-Identifier: MPL-2.0
//
// Boundary adapter (docs/style-guide.md §3.7): Result-wrapping facade over
// the throwing `Loader` interface. Pure-logic callers in core/ get
// non-throwing `Result<T, LoadError>` from here; try/catch stays
// sequestered to this file.

import { type Delta, type Diagram } from '@archeglyph/proto/gen/content_pb';
import { type Stylesheet } from '@archeglyph/proto/gen/style_pb';
import { type Theme } from '@archeglyph/proto/gen/theme_pb';
import { type Result, Ok, Err } from '@archeglyph/proto/util/result';
import { type Loader } from './loader';
import { LoadRequest } from './load_request';
import { LoaderImpl } from './impl_loader';

export interface LoadError {
  readonly message: string;
}

const loader: Loader = new LoaderImpl();

export async function loadDiagram(text: string): Promise<Result<Diagram, LoadError>> {
  try {
    const request: LoadRequest = { text };
    const diagram: Diagram = await loader.loadDiagram(request);
    return Ok(diagram);
  } catch (e) {
    return Err({ message: (e as Error).message });
  }
}

export async function loadStylesheet(text: string): Promise<Result<Stylesheet, LoadError>> {
  try {
    const request: LoadRequest = { text };
    const stylesheet: Stylesheet = await loader.loadStylesheet(request);
    return Ok(stylesheet);
  } catch (e) {
    return Err({ message: (e as Error).message });
  }
}

export async function loadDelta(text: string): Promise<Result<Delta, LoadError>> {
  try {
    const request: LoadRequest = { text };
    const delta: Delta = await loader.loadDelta(request);
    return Ok(delta);
  } catch (e) {
    return Err({ message: (e as Error).message });
  }
}

export async function loadTheme(text: string): Promise<Result<Theme, LoadError>> {
  try {
    const request: LoadRequest = { text };
    const theme: Theme = await loader.loadTheme(request);
    return Ok(theme);
  } catch (e) {
    return Err({ message: (e as Error).message });
  }
}
