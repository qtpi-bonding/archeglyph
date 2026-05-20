// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from '@bufbuild/protobuf';
import { ThemeSchema, TokensSchema, FontSpecSchema, type Theme } from '@archeglyph/proto/gen/theme_pb';

export function darkTheme(): Theme {
  return create(ThemeSchema, {
    name: 'dark',
    tokens: create(TokensSchema, {
      colors: {
        background: '#1a1a2e',
        foreground: '#d4d4d8',
        muted: '#71717a',
        primary: '#7c9cce',
        accent: '#a78bdb',
        success: '#76a677',
        warning: '#c9a84c',
        danger: '#c97a7a',
      },
      fonts: {
        body: create(FontSpecSchema, {
          family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }),
        mono: create(FontSpecSchema, {
          family: "ui-monospace, Menlo, Monaco, 'Cascadia Code', 'Courier New', Consolas, monospace",
        }),
      },
      sizes: {
        stroke_thin: 1,
        stroke_normal: 2,
        font_small: 12,
        font_normal: 14,
        font_large: 18,
      },
      spacings: {
        node_padding: 12,
        label_offset: 6,
        node_spacing: 40,
      },
      dashes: {
        dashed: '5,5',
        dotted: '2,3',
      },
      shapePaths: {},
    }),
    nodeComponents: [],
    edgeComponents: [],
    groupComponents: [],
    annotationComponents: [],
  });
}
export function getBundledTheme(name: string): Theme {
  throw new Error('not implemented');
}
export function lightTheme(): Theme {
  throw new Error('not implemented');
}
