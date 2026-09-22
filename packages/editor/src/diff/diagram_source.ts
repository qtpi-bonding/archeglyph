// SPDX-License-Identifier: AGPL-3.0-or-later

import { AdapterError } from '../adapters/host_adapter';
import { Diagram } from '@archeglyph/proto/gen/content_pb';
import { Result } from '@archeglyph/proto/util/result';

export interface DiagramSource {
  load(): Promise<Result<Diagram, AdapterError>>;
}
