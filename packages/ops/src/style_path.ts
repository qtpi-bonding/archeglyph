// SPDX-License-Identifier: MPL-2.0

import { basename, dirname, join } from 'node:path';

// Convention shared by bind/render/validate: a diagram's default stylesheet
// sits alongside it, named by its stem (up to the first '.') + '.style.json'.
// e.g. "demo.diag.json" -> "demo.style.json".
export function deriveDefaultStylePath(diagramPath: string): string {
  const diagBase = basename(diagramPath);
  const dotIdx = diagBase.indexOf('.');
  const stem = dotIdx >= 0 ? diagBase.slice(0, dotIdx) : diagBase;
  return join(dirname(diagramPath), stem + '.style.json');
}
