// SPDX-License-Identifier: MPL-2.0

import { Diagram, DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { fromJson } from '@archeglyph/proto/util/json';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';
import { init } from '@archeglyph/proto/util/init';
import { AdapterError } from '../adapters/host_adapter';
import { DiagramSource } from './diagram_source';

export class UrlParamDiagramSource implements DiagramSource {
  private readonly inlineB64: string | null;
  private readonly remoteUrl: string | null;

  constructor(inlineB64: string | null, remoteUrl: string | null) {
    this.inlineB64 = inlineB64;
    this.remoteUrl = remoteUrl;
  }

  async load(): Promise<Result<Diagram, AdapterError>> {
    try {
      const b64: string | null = this.inlineB64;
      if (b64 !== null) {
        return Ok(fromJson(DiagramSchema, atob(b64)));
      }
      const url: string | null = this.remoteUrl;
      if (url === null) {
        return Err(init(new AdapterError(), {
          kind: 'io',
          message: 'No diff base given: expected one of base_d, base_fetch, base_gh or base_gist',
        }));
      }
      const response: Response = await fetch(url);
      if (!response.ok) {
        return Err(init(new AdapterError(), {
          kind: 'io',
          message: `Could not fetch ${url} (${response.status})`,
        }));
      }
      return Ok(fromJson(DiagramSchema, await response.text()));
    } catch (e: unknown) {
      return Err(init(new AdapterError(), {
        kind: 'io',
        message: e instanceof Error ? e.message : String(e),
      }));
    }
  }
}
