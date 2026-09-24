// SPDX-License-Identifier: MPL-2.0

import { parseArgs } from 'node:util';
import { z } from 'zod';
import type { Operation } from './op';

interface OpMeta {
  name: string;
  description: string;
  params: z.ZodObject<z.ZodRawShape>;
}

type OptionSpec = { type: 'string' | 'boolean'; multiple?: boolean };
type HelpRow = [string, string, string, string];

function toKebabCase(key: string): string {
  let result: string = '';
  for (let i: number = 0; i < key.length; i++) {
    const ch: string = key[i];
    const isUpper: boolean = ch >= 'A' && ch <= 'Z';
    const sep: string = isUpper && i > 0 ? '-' : '';
    const lower: string = isUpper ? ch.toLowerCase() : ch;
    result = result + sep + lower;
  }
  return result;
}

function toCamelCase(key: string): string {
  const parts: string[] = key.split('-');
  let result: string = parts[0];
  for (let i: number = 1; i < parts.length; i++) {
    const part: string = parts[i];
    const capitalized: string = part.length > 0 ? part[0].toUpperCase() + part.slice(1) : '';
    result = result + capitalized;
  }
  return result;
}

function unwrapField(schema: z.ZodTypeAny): z.ZodTypeAny {
  const typeName: string = (schema._def as { typeName: string }).typeName;
  if (typeName === 'ZodOptional' || typeName === 'ZodDefault') {
    return unwrapField((schema._def as { innerType: z.ZodTypeAny }).innerType);
  } else {
    return schema;
  }
}

function getTypeLabel(innerTypeName: string, inner: z.ZodTypeAny): string {
  if (innerTypeName === 'ZodString') {
    return 'string';
  } else if (innerTypeName === 'ZodNumber') {
    return 'number';
  } else if (innerTypeName === 'ZodBoolean') {
    return 'boolean';
  } else if (innerTypeName === 'ZodEnum') {
    const vals: string[] = (inner._def as { values: string[] }).values;
    return 'enum<' + vals.join('|') + '>';
  } else if (innerTypeName === 'ZodArray') {
    return 'string[]';
  } else {
    return 'string';
  }
}

function getRequiredTag(outerTypeName: string, rawSchema: z.ZodTypeAny): string {
  if (outerTypeName === 'ZodOptional') {
    return '[optional]';
  } else if (outerTypeName === 'ZodDefault') {
    const defaultValue: unknown = (rawSchema._def as { defaultValue: () => unknown }).defaultValue();
    return `[default: ${String(defaultValue)}]`;
  } else {
    return '[required]';
  }
}

export function parseArgv<P>(
  schema: z.ZodObject<z.ZodRawShape>,
  argv: string[],
): P {
  const options: Record<string, OptionSpec> = {};
  const numberKeys: string[] = [];
  const shapeEntries: [string, z.ZodTypeAny][] = Object.entries(schema.shape) as [string, z.ZodTypeAny][];

  for (const shapeEntry of shapeEntries) {
    const key: string = shapeEntry[0];
    const rawSchema: z.ZodTypeAny = shapeEntry[1];
    const flagName: string = toKebabCase(key);
    const inner: z.ZodTypeAny = unwrapField(rawSchema);
    const typeName: string = (inner._def as { typeName: string }).typeName;

    if (typeName === 'ZodString') {
      options[flagName] = { type: 'string' };
    } else if (typeName === 'ZodNumber') {
      options[flagName] = { type: 'string' };
      numberKeys.push(key);
    } else if (typeName === 'ZodBoolean') {
      options[flagName] = { type: 'boolean' };
    } else if (typeName === 'ZodEnum') {
      options[flagName] = { type: 'string' };
    } else if (typeName === 'ZodArray') {
      options[flagName] = { type: 'string', multiple: true };
    } else {
      throw new Error(`parseArgv: unsupported Zod type for field "${key}" — use a different schema, or restructure`);
    }
  }

  const { values } = parseArgs({ args: argv, options, allowPositionals: false });

  const rebuilt: Record<string, unknown> = {};
  const valueEntries: [string, unknown][] = Object.entries(values) as [string, unknown][];
  for (const valueEntry of valueEntries) {
    const kebabKey: string = valueEntry[0];
    const val: unknown = valueEntry[1];
    rebuilt[toCamelCase(kebabKey)] = val;
  }

  for (const numKey of numberKeys) {
    const val: unknown = rebuilt[numKey];
    if (val !== undefined) {
      rebuilt[numKey] = Number.parseFloat(val as string);
    }
  }

  const parsed: P = schema.parse(rebuilt) as P;
  return parsed;
}

export function formatOpHelp(op: Operation<unknown, unknown>): string {
  const meta: OpMeta = op as unknown as OpMeta;
  const shapeEntries: [string, z.ZodTypeAny][] = Object.entries(meta.params.shape) as [string, z.ZodTypeAny][];

  const rows: HelpRow[] = shapeEntries.map((entry: [string, z.ZodTypeAny]): HelpRow => {
    const key: string = entry[0];
    const rawSchema: z.ZodTypeAny = entry[1];
    const outerTypeName: string = (rawSchema._def as { typeName: string }).typeName;
    const inner: z.ZodTypeAny = unwrapField(rawSchema);
    const innerTypeName: string = (inner._def as { typeName: string }).typeName;
    const flagStr: string = '--' + toKebabCase(key);
    const typeStr: string = getTypeLabel(innerTypeName, inner);
    const descStr: string = (rawSchema as { description?: string }).description ?? '(no description)';
    const reqStr: string = getRequiredTag(outerTypeName, rawSchema);
    return [flagStr, typeStr, descStr, reqStr];
  });

  const maxFlag: number = rows.reduce((acc: number, row: HelpRow) => Math.max(acc, row[0].length), 0);
  const maxType: number = rows.reduce((acc: number, row: HelpRow) => Math.max(acc, row[1].length), 0);
  const maxDesc: number = rows.reduce((acc: number, row: HelpRow) => Math.max(acc, row[2].length), 0);

  const optionLines: string[] = rows.map((row: HelpRow): string => {
    const flag: string = row[0].padEnd(maxFlag);
    const typeStr: string = row[1].padEnd(maxType);
    const desc: string = row[2].padEnd(maxDesc);
    return `  ${flag}  ${typeStr}  ${desc}  ${row[3]}`;
  });

  const headerLines: string[] = [
    `archeglyph ${meta.name} — ${meta.description}`,
    '',
    `Usage: archeglyph ${meta.name} [options]`,
    '',
    'Options:',
  ];
  return headerLines.concat(optionLines).join('\n');
}

export function formatRootHelp(ops: Operation<unknown, unknown>[]): string {
  const metas: OpMeta[] = ops as unknown as OpMeta[];
  const opNames: string[] = metas.map((op: OpMeta) => op.name);
  const allNames: string[] = opNames.concat(['help']);
  const maxName: number = allNames.reduce((acc: number, name: string) => Math.max(acc, name.length), 0);

  const subLines: string[] = metas.map((op: OpMeta): string => {
    return `  ${op.name.padEnd(maxName)}  ${op.description}`;
  });

  const fixedLines: string[] = [
    `  ${'help'.padEnd(maxName)}  Show this help (or pass --help to any subcommand)`,
  ];

  const headerLines: string[] = [
    'archeglyph — node-and-edge graph rendering tool',
    '',
    'Usage: archeglyph <subcommand> [options]',
    '',
    'Subcommands:',
  ];
  const footerLines: string[] = [
    '',
    'Run `archeglyph <subcommand> --help` for per-command details.',
  ];
  return headerLines.concat(subLines).concat(fixedLines).concat(footerLines).join('\n');
}
