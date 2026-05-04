// SPDX-License-Identifier: AGPL-3.0-or-later

import type { DescMessage, MessageShape } from "@bufbuild/protobuf";

// STUB — the JS/TS proto ecosystem ships no proto3 text-format parser
// (Go has prototext, Python has text_format, Rust has it, JS does not).
// Hand-rolling a real one is deferred; for now this exists so loader-pillar
// code can import it and typecheck. Calling it at runtime throws.
export function fromTextproto<Desc extends DescMessage>(
  _schema: Desc,
  _input: string,
): MessageShape<Desc> {
  throw new Error(
    "fromTextproto: not yet implemented — see packages/proto/src/util/textproto.ts. " +
      "Real parser will land in a follow-up; loader-pillar callers throw at runtime.",
  );
}
