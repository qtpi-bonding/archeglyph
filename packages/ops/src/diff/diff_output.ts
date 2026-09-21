// SPDX-License-Identifier: AGPL-3.0-or-later

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
