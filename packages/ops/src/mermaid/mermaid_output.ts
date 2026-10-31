// SPDX-License-Identifier: MPL-2.0

export class MermaidOutput {
  outPath!: string;
  bytesWritten!: number;
  /** Nodes drawn, groups included. */
  nodes!: number;
  edges!: number;
}
