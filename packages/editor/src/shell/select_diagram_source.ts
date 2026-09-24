// SPDX-License-Identifier: MPL-2.0

import { buildRemoteUrl } from '../adapters/url_param_adapter';
import { DiagramSource } from '../diff/diagram_source';
import { UrlParamDiagramSource } from '../diff/url_param_diagram_source';

const BASE_SOURCE_PARAMS: ReadonlyArray<string> = ['base_d', 'base_fetch', 'base_gh', 'base_gist'];

export function selectDiagramSource(params: URLSearchParams): DiagramSource | undefined {
  if (!BASE_SOURCE_PARAMS.some((name: string): boolean => params.has(name))) {
    return undefined;
  }
  return new UrlParamDiagramSource(params.get('base_d'), buildRemoteUrl(params, 'base_'));
}
