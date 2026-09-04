// SPDX-License-Identifier: AGPL-3.0-or-later

export interface Vec2 {
  x: number;
  y: number;
}

export class ViewportState {
  panX!: number;
  panY!: number;
  zoom!: number;

  toCanvas(screenPt: Vec2): Vec2 {
    return { x: (screenPt.x - this.panX) / this.zoom, y: (screenPt.y - this.panY) / this.zoom };
  }

  toScreen(canvasPt: Vec2): Vec2 {
    return { x: canvasPt.x * this.zoom + this.panX, y: canvasPt.y * this.zoom + this.panY };
  }
}
