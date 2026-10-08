// Shared test fixtures (imported by tests; contains no tests itself).
// Values are the published parameters of the design document (§1.5), not source drawings.

export const CONGLOMERATE = Object.freeze({
  schema: 'zc-pattern/1.0.0',
  id: 'zc:111101002',
  table: '3-1',
  code: '111101002',
  symbol: 'Cg',
  names: { ja: '礫岩' },
  layers: [{
    id: 'circles',
    archetype: 'grid',
    motif: { kind: 'circle', d: 7.0, fill: 'ink' },
    params: { pitchX: 11.22, pitchY: 9.27, rowOffset: 0.5, rows: 3 },
  }],
  provenance: { doc: 'R1', section: '1.1', measured: true },
});

export function spec(overrides = {}) {
  return { ...structuredClone(CONGLOMERATE), ...structuredClone(overrides) };
}

export function alias(id, aliasOf, extra = {}) {
  return { schema: 'zc-pattern/1.0.0', id, table: '3-1', names: { ja: `alias ${id}` }, aliasOf, provenance: { doc: 'R1', section: '1.2', measured: true }, ...extra };
}
