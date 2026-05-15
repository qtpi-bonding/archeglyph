// SPDX-License-Identifier: AGPL-3.0-or-later

import type { DescEnum, DescField, DescMessage, MessageShape } from '@bufbuild/protobuf';
import { create, ScalarType } from '@bufbuild/protobuf';

// --- Tokenizer ---

type Token =
  | { kind: 'ident'; value: string }
  | { kind: 'int'; value: string }
  | { kind: 'float'; value: string }
  | { kind: 'string'; value: string }
  | { kind: 'punct'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i: number = 0;
  const n: number = input.length;

  while (i < n) {
    const ch: string = input[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { i++; continue; }

    if (ch === '#') {
      while (i < n && input[i] !== '\n') i++;
      continue;
    }

    if (ch === '"') {
      let s: string = '';
      i++;
      while (i < n && input[i] !== '"') {
        if (input[i] === '\\') {
          i++;
          if (i >= n) throw new Error('fromTextproto: unterminated string escape');
          const esc: string = input[i];
          if (esc === 'n') { s += '\n'; }
          else if (esc === 'r') { s += '\r'; }
          else if (esc === 't') { s += '\t'; }
          else if (esc === '\\') { s += '\\'; }
          else if (esc === '"') { s += '"'; }
          else if (esc === '\'') { s += '\''; }
          else if (esc === '0') { s += '\0'; }
          else if (esc === 'x') {
            const hex: string = input.slice(i + 1, i + 3);
            if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error('fromTextproto: invalid \\x escape');
            s += String.fromCharCode(parseInt(hex, 16));
            i += 2;
          } else if (esc === 'u') {
            const hex: string = input.slice(i + 1, i + 5);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error('fromTextproto: invalid \\u escape');
            s += String.fromCharCode(parseInt(hex, 16));
            i += 4;
          } else {
            s += esc;
          }
          i++;
        } else {
          s += input[i];
          i++;
        }
      }
      if (i >= n) throw new Error('fromTextproto: unterminated string literal');
      i++;
      tokens.push({ kind: 'string', value: s });
      continue;
    }

    if (ch === ':' || ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ',') {
      tokens.push({ kind: 'punct', value: ch });
      i++;
      continue;
    }

    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let s: string = '';
      if (ch === '-') { s += '-'; i++; }
      if (i < n && input[i] === '0' && i + 1 < n && (input[i + 1] === 'x' || input[i + 1] === 'X')) {
        s += input[i]; s += input[i + 1]; i += 2;
        while (i < n && /[0-9a-fA-F]/.test(input[i])) { s += input[i]; i++; }
        tokens.push({ kind: 'int', value: s });
      } else {
        while (i < n && input[i] >= '0' && input[i] <= '9') { s += input[i]; i++; }
        if (i < n && (input[i] === '.' || input[i] === 'e' || input[i] === 'E')) {
          if (input[i] === '.') {
            s += '.'; i++;
            while (i < n && input[i] >= '0' && input[i] <= '9') { s += input[i]; i++; }
          }
          if (i < n && (input[i] === 'e' || input[i] === 'E')) {
            s += input[i]; i++;
            if (i < n && (input[i] === '+' || input[i] === '-')) { s += input[i]; i++; }
            while (i < n && input[i] >= '0' && input[i] <= '9') { s += input[i]; i++; }
          }
          tokens.push({ kind: 'float', value: s });
        } else {
          tokens.push({ kind: 'int', value: s });
        }
      }
      continue;
    }

    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let s: string = '';
      while (i < n && /[a-zA-Z0-9_]/.test(input[i])) { s += input[i]; i++; }
      tokens.push({ kind: 'ident', value: s });
      continue;
    }

    throw new Error(`fromTextproto: unexpected character '${ch}' at position ${i}`);
  }

  return tokens;
}

// --- Parser helpers ---

function skipValue(tokens: Token[], pos: number): number {
  if (pos >= tokens.length) return pos;
  const t: Token = tokens[pos];
  if (t.kind === 'punct' && (t.value === '{' || t.value === '[')) {
    const open: string = t.value;
    const close: string = open === '{' ? '}' : ']';
    pos++;
    let depth: number = 1;
    while (pos < tokens.length && depth > 0) {
      if (tokens[pos].kind === 'punct' && tokens[pos].value === open) depth++;
      else if (tokens[pos].kind === 'punct' && tokens[pos].value === close) depth--;
      pos++;
    }
    return pos;
  }
  return pos + 1;
}

function parseScalar(tokens: Token[], pos: number, scalar: ScalarType): { val: unknown; pos: number } {
  if (pos >= tokens.length) throw new Error('fromTextproto: unexpected end of input');
  const t: Token = tokens[pos];
  if (scalar === ScalarType.STRING) {
    if (t.kind !== 'string') throw new Error(`fromTextproto: expected string, got ${t.kind}`);
    return { val: t.value, pos: pos + 1 };
  }
  if (scalar === ScalarType.BOOL) {
    if (t.kind === 'ident' && (t.value === 'true' || t.value === 'false')) {
      return { val: t.value === 'true', pos: pos + 1 };
    }
    throw new Error(`fromTextproto: expected boolean, got ${t.kind}`);
  }
  if (scalar === ScalarType.BYTES) {
    if (t.kind !== 'string') throw new Error('fromTextproto: expected base64 string for bytes field');
    const binaryStr: string = atob(t.value);
    const bytes: Uint8Array = new Uint8Array(binaryStr.length);
    for (let i: number = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return { val: bytes, pos: pos + 1 };
  }
  if (scalar === ScalarType.DOUBLE || scalar === ScalarType.FLOAT) {
    if (t.kind === 'int' || t.kind === 'float') return { val: parseFloat(t.value), pos: pos + 1 };
    throw new Error(`fromTextproto: expected number, got ${t.kind}`);
  }
  if (t.kind !== 'int') throw new Error(`fromTextproto: expected integer, got ${t.kind}`);
  const hexNeg: boolean = t.value.startsWith('-0x') || t.value.startsWith('-0X');
  if (hexNeg) return { val: -parseInt(t.value.slice(1), 16), pos: pos + 1 };
  const hex: boolean = t.value.startsWith('0x') || t.value.startsWith('0X');
  return { val: parseInt(t.value, hex ? 16 : 10), pos: pos + 1 };
}

function parseEnum(tokens: Token[], pos: number, enumDesc: DescEnum): { val: number; pos: number } {
  if (pos >= tokens.length) throw new Error('fromTextproto: unexpected end of input');
  const t: Token = tokens[pos];
  if (t.kind === 'ident') {
    const ev = enumDesc.values.find((v) => v.name === t.value);
    return { val: ev !== undefined ? ev.number : 0, pos: pos + 1 };
  }
  if (t.kind === 'int') {
    const hexNeg: boolean = t.value.startsWith('-0x') || t.value.startsWith('-0X');
    if (hexNeg) return { val: -parseInt(t.value.slice(1), 16), pos: pos + 1 };
    const isHex: boolean = t.value.startsWith('0x') || t.value.startsWith('0X');
    return { val: parseInt(t.value, isHex ? 16 : 10), pos: pos + 1 };
  }
  throw new Error(`fromTextproto: expected enum value, got ${t.kind}`);
}

type ListField = DescField & { fieldKind: 'list' };

function parseListItem(fd: ListField, tokens: Token[], pos: number): { val: unknown; pos: number } {
  if (fd.listKind === 'scalar') return parseScalar(tokens, pos, fd.scalar);
  if (fd.listKind === 'enum') return parseEnum(tokens, pos, fd.enum);
  if (pos >= tokens.length || !(tokens[pos].kind === 'punct' && tokens[pos].value === '{')) {
    throw new Error('fromTextproto: expected \'{\' for message list item');
  }
  pos++;
  const { obj: nested, pos: afterBody } = parseMessageBody(fd.message, tokens, pos);
  if (afterBody >= tokens.length || !(tokens[afterBody].kind === 'punct' && tokens[afterBody].value === '}')) {
    throw new Error('fromTextproto: unclosed \'{\' in message list item');
  }
  return { val: nested, pos: afterBody + 1 };
}

function parseMessageBody(
  schema: DescMessage,
  tokens: Token[],
  startPos: number,
): { obj: Record<string, unknown>; pos: number } {
  const obj: Record<string, unknown> = create(schema) as Record<string, unknown>;
  let pos: number = startPos;

  while (pos < tokens.length) {
    const t: Token = tokens[pos];
    if (t.kind === 'punct' && t.value === '}') break;
    if (t.kind !== 'ident') throw new Error(`fromTextproto: expected field name, got ${t.kind} '${t.value}'`);

    const fieldName: string = t.value;
    pos++;

    if (pos < tokens.length && tokens[pos].kind === 'punct' && tokens[pos].value === ':') pos++;

    const fd: DescField | undefined = schema.fields.find((f) => f.name === fieldName);
    if (!fd) { pos = skipValue(tokens, pos); continue; }

    if (fd.fieldKind === 'scalar') {
      const { val, pos: nextPos } = parseScalar(tokens, pos, fd.scalar);
      if (fd.oneof !== undefined) {
        obj[fd.oneof.localName] = { case: fd.localName, value: val };
      } else {
        obj[fd.localName] = val;
      }
      pos = nextPos;
    } else if (fd.fieldKind === 'enum') {
      const { val, pos: nextPos } = parseEnum(tokens, pos, fd.enum);
      if (fd.oneof !== undefined) {
        obj[fd.oneof.localName] = { case: fd.localName, value: val };
      } else {
        obj[fd.localName] = val;
      }
      pos = nextPos;
    } else if (fd.fieldKind === 'message') {
      if (pos >= tokens.length || !(tokens[pos].kind === 'punct' && tokens[pos].value === '{')) {
        throw new Error(`fromTextproto: expected '{' for message field '${fieldName}'`);
      }
      pos++;
      const { obj: nested, pos: afterBody } = parseMessageBody(fd.message, tokens, pos);
      if (afterBody >= tokens.length || !(tokens[afterBody].kind === 'punct' && tokens[afterBody].value === '}')) {
        throw new Error(`fromTextproto: unclosed '{' in message field '${fieldName}'`);
      }
      pos = afterBody + 1;
      if (fd.oneof !== undefined) {
        obj[fd.oneof.localName] = { case: fd.localName, value: nested };
      } else {
        obj[fd.localName] = nested;
      }
    } else if (fd.fieldKind === 'list') {
      const arr: unknown[] = obj[fd.localName] as unknown[];
      if (pos < tokens.length && tokens[pos].kind === 'punct' && tokens[pos].value === '[') {
        pos++;
        while (pos < tokens.length && !(tokens[pos].kind === 'punct' && tokens[pos].value === ']')) {
          if (tokens[pos].kind === 'punct' && tokens[pos].value === ',') { pos++; continue; }
          const { val, pos: nextPos } = parseListItem(fd, tokens, pos);
          arr.push(val);
          pos = nextPos;
        }
        if (pos >= tokens.length) throw new Error(`fromTextproto: unclosed '[' in list field '${fieldName}'`);
        pos++;
      } else {
        const { val, pos: nextPos } = parseListItem(fd, tokens, pos);
        arr.push(val);
        pos = nextPos;
      }
    } else if (fd.fieldKind === 'map') {
      if (pos >= tokens.length || !(tokens[pos].kind === 'punct' && tokens[pos].value === '{')) {
        throw new Error(`fromTextproto: expected '{' for map field '${fieldName}'`);
      }
      pos++;
      let mapKey: unknown = undefined;
      let mapValue: unknown = undefined;
      while (pos < tokens.length && !(tokens[pos].kind === 'punct' && tokens[pos].value === '}')) {
        if (tokens[pos].kind !== 'ident') throw new Error('fromTextproto: expected field in map entry');
        const entryField: string = tokens[pos].value;
        pos++;
        if (pos < tokens.length && tokens[pos].kind === 'punct' && tokens[pos].value === ':') pos++;
        if (entryField === 'key') {
          const { val, pos: nextPos } = parseScalar(tokens, pos, fd.mapKey);
          mapKey = val;
          pos = nextPos;
        } else if (entryField === 'value') {
          if (fd.enum !== undefined) {
            const { val, pos: nextPos } = parseEnum(tokens, pos, fd.enum);
            mapValue = val;
            pos = nextPos;
          } else if (fd.message === undefined) {
            const { val, pos: nextPos } = parseScalar(tokens, pos, fd.scalar);
            mapValue = val;
            pos = nextPos;
          } else {
            if (pos >= tokens.length || !(tokens[pos].kind === 'punct' && tokens[pos].value === '{')) {
              throw new Error('fromTextproto: expected \'{\' for map message value');
            }
            pos++;
            const { obj: nested, pos: afterBody } = parseMessageBody(fd.message, tokens, pos);
            if (afterBody >= tokens.length || !(tokens[afterBody].kind === 'punct' && tokens[afterBody].value === '}')) {
              throw new Error('fromTextproto: unclosed \'{\' in map message value');
            }
            mapValue = nested;
            pos = afterBody + 1;
          }
        } else {
          pos = skipValue(tokens, pos);
        }
      }
      if (pos >= tokens.length) throw new Error(`fromTextproto: unclosed '{' in map field '${fieldName}'`);
      pos++;
      if (mapKey !== undefined) {
        (obj[fd.localName] as Record<string, unknown>)[String(mapKey)] = mapValue;
      }
    }
  }

  return { obj, pos };
}

// --- Public parse API ---

export function fromTextproto<Desc extends DescMessage>(
  schema: Desc,
  input: string,
): MessageShape<Desc> {
  const tokens: Token[] = tokenize(input);
  const { obj } = parseMessageBody(schema, tokens, 0);
  return obj as MessageShape<Desc>;
}

// --- Serializer ---

function escapeString(s: string): string {
  let out: string = '';
  for (let i: number = 0; i < s.length; i++) {
    const code: number = s.charCodeAt(i);
    const ch: string = s[i];
    if (ch === '\\') { out += '\\\\'; }
    else if (ch === '"') { out += '\\"'; }
    else if (ch === '\n') { out += '\\n'; }
    else if (ch === '\t') { out += '\\t'; }
    else if (ch === '\r') { out += '\\r'; }
    else if (code < 0x20) { out += '\\x' + code.toString(16).padStart(2, '0'); }
    else { out += ch; }
  }
  return '"' + out + '"';
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin: string = '';
  for (let i: number = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function serializeScalar(val: unknown, scalar: ScalarType): string {
  if (scalar === ScalarType.STRING) return escapeString(val as string);
  if (scalar === ScalarType.BOOL) return (val as boolean) ? 'true' : 'false';
  if (scalar === ScalarType.BYTES) return '"' + bytesToBase64(val as Uint8Array) + '"';
  if (scalar === ScalarType.DOUBLE || scalar === ScalarType.FLOAT) return (val as number).toString();
  if (typeof val === 'bigint') return val.toString();
  return (val as number).toString();
}

function serializeEnum(val: number, enumDesc: DescEnum): string {
  const ev = enumDesc.values.find((v) => v.number === val);
  return ev !== undefined ? ev.name : val.toString();
}

function isDefaultScalar(val: unknown, scalar: ScalarType): boolean {
  if (scalar === ScalarType.BOOL) return val === false;
  if (scalar === ScalarType.STRING) return val === '';
  if (scalar === ScalarType.BYTES) {
    const b: Uint8Array = val as Uint8Array;
    return b === undefined || b === null || b.length === 0;
  }
  if (scalar === ScalarType.DOUBLE || scalar === ScalarType.FLOAT) return val === 0;
  if (typeof val === 'bigint') return val === BigInt(0);
  return val === 0;
}

function mapKeyFromString(k: string, mapKey: ScalarType): unknown {
  if (mapKey === ScalarType.STRING) return k;
  if (mapKey === ScalarType.BOOL) return k === 'true';
  return parseInt(k, 10);
}

function emitOneof(
  schema: DescMessage,
  msg: Record<string, unknown>,
  oneofLocalName: string,
  indent: number,
  pad: string,
  lines: string[],
): void {
  const discriminant = msg[oneofLocalName] as { case: string; value: unknown } | undefined;
  if (discriminant === undefined || discriminant.case === undefined) return;
  const caseFd: DescField | undefined = schema.fields.find((f) => f.localName === discriminant.case);
  if (caseFd === undefined) return;
  if (caseFd.fieldKind === 'scalar') {
    lines.push(`${pad}${caseFd.name}: ${serializeScalar(discriminant.value, caseFd.scalar)}`);
  } else if (caseFd.fieldKind === 'enum') {
    lines.push(`${pad}${caseFd.name}: ${serializeEnum(discriminant.value as number, caseFd.enum)}`);
  } else if (caseFd.fieldKind === 'message') {
    const nested: string = serializeMessageBody(caseFd.message, discriminant.value as Record<string, unknown>, indent + 2);
    if (nested.length > 0) {
      lines.push(`${pad}${caseFd.name}: {\n${nested}\n${pad}}`);
    } else {
      lines.push(`${pad}${caseFd.name}: {}`);
    }
  }
}

function serializeMessageBody(
  schema: DescMessage,
  msg: Record<string, unknown>,
  indent: number,
): string {
  const pad: string = ' '.repeat(indent);
  const lines: string[] = [];
  const visitedOneofs: Set<string> = new Set();

  const sorted: DescField[] = schema.fields.slice().sort((a, b) => a.number - b.number);

  for (const fd of sorted) {
    // Oneof fields: handle the whole oneof when we first encounter any of its fields
    if (fd.fieldKind !== 'list' && fd.fieldKind !== 'map' && fd.oneof !== undefined) {
      if (visitedOneofs.has(fd.oneof.localName)) continue;
      visitedOneofs.add(fd.oneof.localName);
      emitOneof(schema, msg, fd.oneof.localName, indent, pad, lines);
      continue;
    }

    if (fd.fieldKind === 'scalar') {
      const val: unknown = msg[fd.localName];
      if (isDefaultScalar(val, fd.scalar)) continue;
      lines.push(`${pad}${fd.name}: ${serializeScalar(val, fd.scalar)}`);
    } else if (fd.fieldKind === 'enum') {
      const val: number = (msg[fd.localName] as number) ?? 0;
      if (val === 0) continue;
      lines.push(`${pad}${fd.name}: ${serializeEnum(val, fd.enum)}`);
    } else if (fd.fieldKind === 'message') {
      const val: unknown = msg[fd.localName];
      if (val === undefined || val === null) continue;
      const nested: string = serializeMessageBody(fd.message, val as Record<string, unknown>, indent + 2);
      if (nested.length > 0) {
        lines.push(`${pad}${fd.name}: {\n${nested}\n${pad}}`);
      } else {
        lines.push(`${pad}${fd.name}: {}`);
      }
    } else if (fd.fieldKind === 'list') {
      const arr: unknown[] = (msg[fd.localName] as unknown[]) ?? [];
      if (arr.length === 0) continue;
      const innerPad: string = ' '.repeat(indent + 2);
      const items: string[] = arr.map((item) => {
        if (fd.listKind === 'scalar') return `${innerPad}${serializeScalar(item, fd.scalar)},`;
        if (fd.listKind === 'enum') return `${innerPad}${serializeEnum(item as number, fd.enum)},`;
        const nested: string = serializeMessageBody(fd.message, item as Record<string, unknown>, indent + 4);
        if (nested.length > 0) {
          return `${innerPad}{\n${nested}\n${innerPad}},`;
        }
        return `${innerPad}{},`;
      });
      lines.push(`${pad}${fd.name}: [\n${items.join('\n')}\n${pad}]`);
    } else if (fd.fieldKind === 'map') {
      const mapObj: Record<string, unknown> = (msg[fd.localName] as Record<string, unknown>) ?? {};
      const keys: string[] = Object.keys(mapObj).sort();
      if (keys.length === 0) continue;
      const innerPad: string = ' '.repeat(indent + 2);
      for (const k of keys) {
        const typedKey: unknown = mapKeyFromString(k, fd.mapKey);
        const keyStr: string = serializeScalar(typedKey, fd.mapKey);
        if (fd.enum !== undefined) {
          const valueStr: string = serializeEnum(mapObj[k] as number, fd.enum);
          lines.push(`${pad}${fd.name}: { key: ${keyStr} value: ${valueStr} }`);
        } else if (fd.message === undefined) {
          const valueStr: string = serializeScalar(mapObj[k], fd.scalar);
          lines.push(`${pad}${fd.name}: { key: ${keyStr} value: ${valueStr} }`);
        } else {
          const nested: string = serializeMessageBody(fd.message, mapObj[k] as Record<string, unknown>, indent + 4);
          if (nested.length > 0) {
            lines.push(`${pad}${fd.name}: {\n${innerPad}key: ${keyStr}\n${innerPad}value: {\n${nested}\n${innerPad}}\n${pad}}`);
          } else {
            lines.push(`${pad}${fd.name}: {\n${innerPad}key: ${keyStr}\n${innerPad}value: {}\n${pad}}`);
          }
        }
      }
    }
  }

  return lines.join('\n');
}

export function toTextproto<Desc extends DescMessage>(
  schema: Desc,
  message: MessageShape<Desc>,
): string {
  return serializeMessageBody(schema, message as Record<string, unknown>, 0);
}
