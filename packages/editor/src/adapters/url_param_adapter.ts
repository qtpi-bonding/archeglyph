// SPDX-License-Identifier: AGPL-3.0-or-later

import { Diagram, DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson, toJson } from '@archeglyph/proto/util/json';
import { HostAdapter } from './host_adapter';
import { LoadResult } from './host_adapter';

function buildRemoteUrl(params: URLSearchParams): string | null {
  const fetchParam: string | null = params.get('fetch');
  if (fetchParam !== null) {
    return fetchParam;
  } else {
    const gh: string | null = params.get('gh');
    if (gh !== null) {
      const path: string = params.get('path') ?? '';
      const ref: string = params.get('ref') ?? 'main';
      return `https://raw.githubusercontent.com/${gh}/${ref}/${path}`;
    } else {
      return params.get('gist');
    }
  }
}

export class UrlParamAdapter implements HostAdapter {
  private readonly inlineDiagramB64: string | null;
  private readonly inlineStyleB64: string | null;
  private readonly remoteUrl: string | null;
  private loadedDiagram: Diagram | null;

  constructor(
    inlineDiagramB64: string | null,
    inlineStyleB64: string | null,
    remoteUrl: string | null,
  ) {
    this.inlineDiagramB64 = inlineDiagramB64;
    this.inlineStyleB64 = inlineStyleB64;
    this.remoteUrl = remoteUrl;
    this.loadedDiagram = null;
  }

  canSave(): boolean {
    return this.inlineDiagramB64 !== null;
  }

  async load(): Promise<LoadResult> {
    const b64: string | null = this.inlineDiagramB64;
    if (b64 !== null) {
      const diagJson: string = atob(b64);
      const diagram: Diagram = fromJson(DiagramSchema, diagJson);
      this.loadedDiagram = diagram;
      const stylesheetB64: string | null = this.inlineStyleB64;
      if (stylesheetB64 !== null) {
        const stylesheetJson: string = atob(stylesheetB64);
        const stylesheet: Stylesheet = fromJson(StylesheetSchema, stylesheetJson);
        return Object.assign(new LoadResult(), { diagram, stylesheet });
      } else {
        return Object.assign(new LoadResult(), { diagram });
      }
    } else {
      const url: string = this.remoteUrl ?? '';
      const response: Response = await fetch(url);
      const diagJson: string = await response.text();
      const diagram: Diagram = fromJson(DiagramSchema, diagJson);
      this.loadedDiagram = diagram;
      return Object.assign(new LoadResult(), { diagram });
    }
  }

  async save(stylesheet: Stylesheet): Promise<void> {
    const diagram: Diagram | null = this.loadedDiagram;
    if (diagram !== null) {
      const diagJson: string = toJson(DiagramSchema, diagram);
      const stylesheetJson: string = toJson(StylesheetSchema, stylesheet);
      const diagB64: string = btoa(diagJson);
      const styleB64: string = btoa(stylesheetJson);
      const url: URL = new URL(window.location.href);
      url.searchParams.set('d', diagB64);
      url.searchParams.set('s', styleB64);
      history.replaceState(null, '', url.toString());
    }
  }
}

export { buildRemoteUrl };
