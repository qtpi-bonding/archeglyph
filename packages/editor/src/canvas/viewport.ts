// SPDX-License-Identifier: AGPL-3.0-or-later

export interface Vec2 {
  x: number;
  y: number;
}

export class ViewportState {
  panX!: number;
  panY!: number;
  zoom!: number;

  toScreen(canvasPt: Vec2): Vec2 {
    return { x: canvasPt.x * this.zoom + this.panX, y: canvasPt.y * this.zoom + this.panY };
  }
}
