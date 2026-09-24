// SPDX-License-Identifier: MPL-2.0

import type { DescMessage, MessageShape } from '@bufbuild/protobuf';
import {
  fromJson as bufFromJson,
  toJson as bufToJson,
} from '@bufbuild/protobuf';

export function fromJson<Desc extends DescMessage>(
  schema: Desc,
  text: string,
): MessageShape<Desc> {
  return bufFromJson(schema, JSON.parse(text));
}

export function toJson<Desc extends DescMessage>(
  schema: Desc,
  message: MessageShape<Desc>,
): string {
  return JSON.stringify(bufToJson(schema, message), null, 2);
}
