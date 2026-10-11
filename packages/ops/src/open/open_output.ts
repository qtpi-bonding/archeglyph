// SPDX-License-Identifier: MPL-2.0

export class OpenOutput {
  /** How many containers were set open, the picks and what is above them included. */
  opened!: number;
  picks!: number;
  /** How many parts of the diagram were hidden by --hops; 0 without it. */
  hidden!: number;
  depth!: number;
  path!: string;
}
