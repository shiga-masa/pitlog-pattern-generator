import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PatternRegistry } from '../../src/core/registry.js';
import { ResolveError, SchemaError } from '../../src/core/errors.js';
import { loadDefaultRegistry } from '../../src/presets/index.js';
import { spec, alias } from '../fixtures/specs.js';

function reg() {
  const r = new PatternRegistry();
  r.add(spec());
  r.add(alias('zc:111101102', 'zc:111101002', { names: { ja: '巨礫岩' } }));
  r.add(spec({ id: 'zc:111200002', code: '111200002', symbol: 'Pt', names: { ja: '砂岩' } }));
  r.add(spec({ id: 'zc:111300002', code: '111300002', symbol: 'Pt', names: { ja: '泥岩' } }));
  return r;
}

test('get resolves aliases and returns deep copies', () => {
  const r = reg();
  const s = r.get('zc:111101102');
  assert.equal(s.id, 'zc:111101002');
  s.layers[0].params.pitchX = 999;
  assert.equal(r.get('zc:111101002').layers[0].params.pitchX, 11.22);
  assert.equal(r.getRaw('zc:111101102').aliasOf, 'zc:111101002');
  assert.deepEqual(r.aliasesOf('zc:111101002'), ['zc:111101102']);
});

test('resolveId: id, code, symbol, Japanese name', () => {
  const r = reg();
  assert.equal(r.resolveId('zc:111101002'), 'zc:111101002');
  assert.equal(r.resolveId('111200002'), 'zc:111200002');
  assert.equal(r.resolveId('sym:Cg'), 'zc:111101002');
  assert.equal(r.resolveId('巨礫岩'), 'zc:111101102');
});

test('ambiguous symbol is an error listing every match (never the first)', () => {
  assert.throws(() => reg().resolveId('sym:Pt'), (e) => e instanceof ResolveError && e.candidates.length === 2 && /ambiguous/.test(e.message));
});

test('unknown queries list near candidates', () => {
  assert.throws(() => reg().resolveId('zc:111101003'), (e) => e instanceof ResolveError && e.candidates[0] === 'zc:111101002');
  assert.throws(() => reg().resolveId('礫'), (e) => e instanceof ResolveError && e.candidates.length > 0);
  assert.throws(() => reg().resolveId(''), ResolveError);
});

test('add rejects invalid specs and duplicate ids', () => {
  const r = reg();
  assert.throws(() => r.add(spec()), /duplicate preset id/);
  assert.throws(() => r.add(spec({ id: 'zc:999999999', bogus: 1 })), SchemaError);
});

test('addAll reports processed/skipped/failed and throws when strict', () => {
  const r = new PatternRegistry();
  const batch = [spec(), spec({ id: 'zc:000000001', oops: 1 }), spec({ id: 'zc:000000002' })];
  assert.throws(() => r.addAll(batch, 'batch.js'), (e) => e.report.failed === 1 && e.report.processed === 2 && /batch.js/.test(e.message));
  const r2 = new PatternRegistry();
  const rep = r2.addAll(batch, 'batch.js', { strict: false });
  assert.deepEqual([rep.processed, rep.skipped, rep.failed], [2, 0, 1]);
  assert.equal(rep.errors[0].index, 1);
});

test('finalize finds dangling aliases and loops', () => {
  const r = new PatternRegistry();
  r.add(alias('zc:000000001', 'zc:000000002'));
  r.add(alias('zc:000000002', 'zc:000000001'));
  r.add(alias('zc:000000003', 'zc:000000009'));
  const f = r.finalize();
  assert.equal(f.failed, 3);
  assert.ok(f.errors.some((e) => /alias loop/.test(e.message)));
  assert.ok(f.errors.some((e) => /not registered/.test(e.message)));
});

test('list filters by table, archetype and text', () => {
  const r = reg();
  assert.equal(r.list().length, 4);
  assert.equal(r.list({ archetype: 'grid' }).length, 4);
  assert.equal(r.list({ archetype: 'hatch' }).length, 0);
  assert.deepEqual(r.list({ text: '砂' }).map((x) => x.id), ['zc:111200002']);
  assert.equal(r.list({ table: '4-1' }).length, 0);
});

test('default registry loads every preset file and reports counts per file', () => {
  const { registry, report } = loadDefaultRegistry();
  assert.equal(Object.keys(report.files).length, 12);
  assert.equal(report.total.failed, 0);
  assert.equal(registry.size, report.total.processed);
});

test('an alias that re-lists a match under the same name is not counted (table 5 rows); other aliases still count', () => {
  const r = reg();
  // a table-5 style row: same name as its target, alias only
  r.add(alias('zc:t5-1:0', 'zc:111101002', { table: '5-1', names: { ja: '礫岩' } }));
  assert.equal(r.resolveId('礫岩'), 'zc:111101002');
  // an alias with its own name resolves to itself
  assert.equal(r.resolveId('巨礫岩'), 'zc:111101102');
  // two different names sharing a symbol stay ambiguous
  assert.throws(() => r.resolveId('sym:Pt'), (e) => e instanceof ResolveError && /ambiguous/.test(e.message));
  // an alias with a different name and the same symbol as its target stays a separate candidate
  r.add(alias('zc:111300012', 'zc:111300002', { symbol: 'Pt', names: { ja: '頁岩もどき' } }));
  assert.throws(() => r.resolveId('sym:Pt'), (e) => e.candidates.length === 3);
});
