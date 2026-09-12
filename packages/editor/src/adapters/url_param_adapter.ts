// SPDX-License-Identifier: AGPL-3.0-or-later

import { Diagram, DiagramSchema } from '@archeglyph/proto/gen/content_pb';
import { Stylesheet, StylesheetSchema } from '@archeglyph/proto/gen/style_pb';
import { fromJson, toJson } from '@archeglyph/proto/util/json';
import { Err, Ok, Result } from '@archeglyph/proto/util/result';
import { AdapterError, FileStamp, HostAdapter, LoadResult } from './host_adapter';
import { hashStylesheet } from '../state/stylesheet_hash';

function toAdapterError(e: unknown): AdapterError {
  return Object.assign(new AdapterError(), { message: e instanceof Error ? e.message : String(e) });
}

function buildRemoteUrl(params: URLSearchParams): string | null {
  const fetchParam: string | null = params.get('fetch');
  if (fetchParam !== null) {
    return fetchParam;
  } else {
    const gh: string | null = params.get('gh');
    if (gh !== null) {
      const path: string = params.get('path') ?? '';
      // `main` is a FLOATING ref: the link shows whatever that branch holds
      // when it is opened, which is rarely what the person who shared it saw.
      // Kept only so existing links resolve; anything generating a link should
      // use buildGitHubUrl, which requires a ref.
      const ref: string = params.get('ref') ?? 'main';
      return `https://raw.githubusercontent.com/${gh}/${ref}/${path}`;
    } else {
      return params.get('gist');
    }
  }
}

/**
 * The stylesheet that sits beside a diagram, by the project's file convention:
 * `<base>.diag.json` is styled by `<base>.style.json`. Mirrors
 * BrowserFsAdapter.computeStyleName so a link and a local open agree.
 *
 * Returns null when the URL does not follow the convention, in which case the
 * diagram loads unstyled rather than the whole load failing.
 */
function siblingStyleUrl(diagramUrl: string): string | null {
  const suffix: string = '.diag.json';
  if (!diagramUrl.endsWith(suffix)) {
    return null;
  }
  return `${diagramUrl.slice(0, -suffix.length)}.style.json`;
}

/**
 * A link to a diagram in a GitHub repository.
 *
 * `ref` is required and should be a commit SHA. A branch name produces a link
 * whose contents change underneath the person you sent it to -- on a pull
 * request that means reviewers see the base branch rather than the change they
 * were asked to look at, and once the branch moves on, something else again.
 * The parameter is mandatory here so that CI cannot omit it by accident.
 */
export function buildGitHubUrl(
  base: string,
  source: { repo: string; path: string; ref: string; pr?: string },
): string {
  const params: URLSearchParams = new URLSearchParams();
  params.set('gh', source.repo);
  params.set('path', source.path);
  params.set('ref', source.ref);
  if (source.pr !== undefined) {
    params.set('pr', source.pr);
  }
  return `${base}?${params.toString()}`;
}

/** The stylesheet at `url`, or null when there is not one to be had. */
async function fetchStylesheet(url: string): Promise<Stylesheet | null> {
  try {
    const response: Response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return fromJson(StylesheetSchema, await response.text());
  } catch {
    return null;
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

  async load(): Promise<Result<LoadResult, AdapterError>> {
    try {
      const b64: string | null = this.inlineDiagramB64;
      if (b64 !== null) {
        const diagJson: string = atob(b64);
        const diagram: Diagram = fromJson(DiagramSchema, diagJson);
        this.loadedDiagram = diagram;
        const stylesheetB64: string | null = this.inlineStyleB64;
        if (stylesheetB64 !== null) {
          const stylesheetJson: string = atob(stylesheetB64);
          const stylesheet: Stylesheet = fromJson(StylesheetSchema, stylesheetJson);
          const baseHash: string = await hashStylesheet(stylesheet);
          return Ok(Object.assign(new LoadResult(), { diagram, stylesheet, baseHash }));
        } else {
          return Ok(Object.assign(new LoadResult(), { diagram, baseHash: '' }));
        }
      } else {
        const url: string = this.remoteUrl ?? '';
        const response: Response = await fetch(url);
        if (!response.ok) {
          return Err(Object.assign(new AdapterError(), {
            kind: 'io',
            message: `Could not fetch ${url} (${response.status})`,
          }));
        }
        const diagJson: string = await response.text();
        const diagram: Diagram = fromJson(DiagramSchema, diagJson);
        this.loadedDiagram = diagram;

        // Also fetch the stylesheet beside it. This is what makes a hosted
        // link worth opening: the diagram is regenerated from code on every
        // commit, the stylesheet is hand-authored and keyed by element id, so
        // the styling survives. Fetching only the diagram would show an
        // auto-generated shape with none of the work someone put into it.
        //
        // A missing stylesheet is normal, not an error -- plenty of diagrams
        // have none -- so a failure here leaves the diagram loaded and unstyled.
        const styleUrl: string | null = siblingStyleUrl(url);
        if (styleUrl !== null) {
          const stylesheet: Stylesheet | null = await fetchStylesheet(styleUrl);
          if (stylesheet !== null) {
            return Ok(Object.assign(new LoadResult(), {
              diagram,
              stylesheet,
              baseHash: await hashStylesheet(stylesheet),
            }));
          }
        }
        return Ok(Object.assign(new LoadResult(), { diagram, baseHash: '' }));
      }
    } catch (e: unknown) {
      return Err(toAdapterError(e));
    }
  }

  async save(stylesheet: Stylesheet, _expectedBaseHash?: string): Promise<Result<void, AdapterError>> {
    try {
      // Remote diagrams are deliberately read-only.  `loadedDiagram` is also
      // populated for remote loads, so checking it alone would accidentally
      // allow a caller to mutate the URL despite canSave() being false.
      if (!this.canSave()) {
        return Ok(undefined);
      }
      if (_expectedBaseHash !== undefined && this.inlineStyleB64 === null) {
        return Err(Object.assign(new AdapterError(), {
          kind: 'unsupported',
          message: 'The current host cannot verify the file before saving',
        }));
      }
      if (_expectedBaseHash !== undefined && this.inlineStyleB64 !== null) {
        const current: Stylesheet = fromJson(StylesheetSchema, atob(this.inlineStyleB64));
        const actualHash: string = await hashStylesheet(current);
        if (actualHash !== _expectedBaseHash) {
          return Err(Object.assign(new AdapterError(), {
            kind: 'stale',
            message: 'The stylesheet changed externally',
          }));
        }
      }
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
      return Ok(undefined);
    } catch (e: unknown) {
      return Err(toAdapterError(e));
    }
  }

  async stat(): Promise<Result<FileStamp, AdapterError>> {
    return Err(Object.assign(new AdapterError(), {
      kind: 'unsupported',
      message: 'The URL host has no file to stat',
    }));
  }
}

export { buildRemoteUrl };
