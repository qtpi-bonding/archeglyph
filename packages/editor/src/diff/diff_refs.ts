// SPDX-License-Identifier: AGPL-3.0-or-later

export function diffRefsFrom(params: URLSearchParams): DiffRefs {
  return {
    base: params.get('base_ref') ?? params.get('base_fetch') ?? '',
    target: params.get('ref') ?? params.get('fetch') ?? '',
  };
}
export interface DiffRefs {
  base: string;
  target: string;
}
