#!/usr/bin/env bun
// SPDX-License-Identifier: MPL-2.0

import { run } from '../src/main';

await run(process.argv.slice(2));
