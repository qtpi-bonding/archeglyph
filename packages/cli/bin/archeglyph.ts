#!/usr/bin/env bun
// SPDX-License-Identifier: AGPL-3.0-or-later

import { run } from '../src/main';

await run(process.argv.slice(2));
