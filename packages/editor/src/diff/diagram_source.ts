// SPDX-License-Identifier: MPL-2.0

import { AdapterError } from '../adapters/host_adapter';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Result } from '@archeglyph/proto/util/result';

export interface DiagramSource {
  load(): Promise<Result<Diagram, AdapterError>>;
}
