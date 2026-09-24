// SPDX-License-Identifier: MPL-2.0

import { create, fromBinary, toJson } from '@bufbuild/protobuf';
import { ArcheviewSchema, ViewEdgeSchema, ViewNodeSchema } from '@archeglyph/proto/gen/archegraph/view_pb';
import { DiagramSchema, LocalizationSchema } from '@archeglyph/proto/gen/content_pb';
import { fromArchegraph } from '@archeglyph/importer-archegraph';

const GCODE = '.archegraph/gcode.pb';

const KIND = process.argv[2] ?? 'Dependency';
const suffix = KIND === 'Dependency' ? '' : `-${KIND.toLowerCase()}`;
const OUT = `examples/archeglyph-architecture${suffix}.diag.json`;
const STYLE_OUT = `examples/archeglyph-architecture${suffix}.style.json`;

const raw = fromBinary(ArcheviewSchema, new Uint8Array(await Bun.file(GCODE).arrayBuffer()));

function packageOf(nodeId: string): string | undefined {
  const node = raw.nodes[nodeId];
  if (node === undefined || node.isExternal) { return undefined; }
  const path = node.implementLocation?.filePath ?? node.protoLocation?.filePath ?? '';
  const match = path.match(/^packages\/([^/]+)\//);
  return match?.[1];
}

const members = new Map<string, number>();
for (const id of Object.keys(raw.nodes)) {
  const pkg = packageOf(id);
  if (pkg !== undefined) { members.set(pkg, (members.get(pkg) ?? 0) + 1); }
}

const key = (from: string, to: string): string => `${from} ${to}`;

const weights = new Map<string, number>();
for (const edge of Object.values(raw.edges)) {
  if (edge.kindLabel !== KIND) { continue; }
  const from = packageOf(edge.source);
  const to = packageOf(edge.target);
  if (from === undefined || to === undefined || from === to) { continue; }
  weights.set(key(from, to), (weights.get(key(from, to)) ?? 0) + 1);
}

const rolled = create(ArcheviewSchema, {
  nodes: Object.fromEntries(
    [...members].map(([pkg, count]) => [
      pkg,
      create(ViewNodeSchema, {
        displayName: pkg,
        kindLabel: 'Package',
        tags: { 'archeglyph.symbols': String(count) },
      }),
    ]),
  ),
  edges: Object.fromEntries(
    [...weights.keys()].map((k) => {
      const [from, to] = k.split(' ');
      return [`${from}__${to}`, create(ViewEdgeSchema, { source: from, target: to, kindLabel: '' })];
    }),
  ),
  metadata: { projectName: `archeglyph-architecture${suffix}` },
});

const imported = fromArchegraph(rolled);

const edges = Object.fromEntries(
  Object.entries(imported.graph?.edges ?? {}).map(([id, edge]) => [
    id,
    {
      ...edge,
      tags: {
        ...edge.tags,
        kind: KIND,
        'archeglyph.references': String(weights.get(key(edge.source, edge.target)) ?? 0),
      },
    },
  ]),
);

const diagram = create(DiagramSchema, {
  ...imported,
  title: [create(LocalizationSchema, { locale: 'en', source: `archeglyph — package architecture (${KIND})` })],
  graph: { ...imported.graph!, edges },
  metadata: { ...imported.metadata!, canonicalLocale: 'en' },
});

await Bun.write(OUT, JSON.stringify(toJson(DiagramSchema, diagram), null, 2) + '\n');

const style = {
  schemaVersion: 1,
  canvas: { nodeSpacing: 56, edgeSpacing: 20 },
  nodes: {},
  edges: {},
  groups: {},
};
await Bun.write(STYLE_OUT, JSON.stringify(style, null, 2) + '\n');

console.log(`wrote ${OUT}: kind=${KIND}, ${members.size} packages, ${weights.size} edges`);
