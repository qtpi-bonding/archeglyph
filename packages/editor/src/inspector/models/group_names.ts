// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  GroupLabelPosition,
  GroupRenderMode,
} from '@archeglyph/proto/gen/style_pb';

// UNSPECIFIED is deliberately absent from both tables. It is not a choice the
// user makes -- it is what the field reads as when nothing is set, and
// EnumFieldInput already renders that as its own "Default" row. Listing it
// would put two rows in the select that mean the same thing.

export const RENDER_MODE_TABLE: ReadonlyArray<{ name: string; value: GroupRenderMode }> = [
  { name: 'bounded', value: GroupRenderMode.BOUNDED },
  { name: 'expanded', value: GroupRenderMode.EXPANDED },
  { name: 'contracted', value: GroupRenderMode.CONTRACTED },
];

export const LABEL_POSITION_TABLE: ReadonlyArray<{ name: string; value: GroupLabelPosition }> = [
  { name: 'top left', value: GroupLabelPosition.GROUP_LABEL_TOP_LEFT },
  { name: 'top center', value: GroupLabelPosition.GROUP_LABEL_TOP_CENTER },
  { name: 'top right', value: GroupLabelPosition.GROUP_LABEL_TOP_RIGHT },
  { name: 'bottom left', value: GroupLabelPosition.GROUP_LABEL_BOTTOM_LEFT },
  { name: 'bottom center', value: GroupLabelPosition.GROUP_LABEL_BOTTOM_CENTER },
  { name: 'bottom right', value: GroupLabelPosition.GROUP_LABEL_BOTTOM_RIGHT },
];
