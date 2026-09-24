// SPDX-License-Identifier: MPL-2.0

export class DiffCounts {
  added!: number;
  deleted!: number;
  modified!: number;
}

export class DiffOutput {
  baseRef!: string;
  targetRef!: string;
  nodes!: DiffCounts;
  edges!: DiffCounts;
  groups!: DiffCounts;
  changed!: boolean;
  outPath?: string;
}
