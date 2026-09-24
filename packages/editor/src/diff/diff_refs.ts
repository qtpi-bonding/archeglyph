// SPDX-License-Identifier: MPL-2.0

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
