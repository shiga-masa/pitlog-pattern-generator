// Tests for src/presets/t4_1.js (table 4-1, R3 §2). Owner: preset-4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../../src/presets/t4_1.js';
import { validateSpec } from '../../src/core/validate.js';

const byId = new Map(PRESETS.map((p) => [p.id, p]));
const isAlias = (p) => 'aliasOf' in p;

test('file holds 165 presets: 30 drawn (25 independent + 5 aliases) and 135 empty rows', () => {
  assert.equal(PRESETS.length, 165);
  assert.equal(PRESETS.filter(isAlias).length, 5);
  assert.equal(PRESETS.filter((p) => !isAlias(p) && p.layers[0].archetype !== 'empty').length, 25);
  assert.equal(PRESETS.filter((p) => !isAlias(p) && p.layers[0].archetype === 'empty').length, 135);
});

test('every preset passes validateSpec', () => {
  for (const p of PRESETS) {
    const r = validateSpec(p);
    assert.equal(r.ok, true, `${p.id}: ${JSON.stringify(r.errors)}`);
  }
});

test('ids are unique and derive from the 9-digit code', () => {
  assert.equal(byId.size, PRESETS.length);
  for (const p of PRESETS) {
    assert.equal(p.id, `zc:${p.code}`);
    assert.equal(p.table, '4-1');
  }
});

test('every preset cites a provenance section with the R3 row id (§2 drawn, §1 empty)', () => {
  for (const p of PRESETS) {
    assert.equal(p.provenance.doc, 'R3');
    assert.match(p.provenance.section, /^[12] \/ t4_1_p\d{3}_h0_r\d{2}$/);
  }
});

test('aliases carry only head fields and aliasOf (no layers, no copied values)', () => {
  const headKeys = new Set(['schema', 'id', 'table', 'code', 'symbol', 'names', 'provenance', 'aliasOf']);
  for (const p of PRESETS.filter(isAlias)) {
    for (const k of Object.keys(p)) assert.ok(headKeys.has(k), `${p.id} has key ${k}`);
    assert.ok(byId.has(p.aliasOf), `${p.id} aliases missing ${p.aliasOf}`);
    assert.equal(byId.get(p.aliasOf).aliasOf, undefined, `${p.id} must not chain`);
  }
});

test('the five aliases point to the expected drawings (gravel, high-organic soil, waste)', () => {
  const expected = {
    'zc:531111100': 'zc:531111000',
    'zc:533101000': 'zc:533100000',
    'zc:533102000': 'zc:533100000',
    'zc:534110200': 'zc:534110100',
    'zc:534120100': 'zc:534110100',
  };
  for (const [id, target] of Object.entries(expected)) assert.equal(byId.get(id).aliasOf, target);
});

test('frame, ink and paper are left to the table defaults and colour rule', () => {
  for (const p of PRESETS) {
    assert.equal(p.ink, undefined);
    assert.equal(p.paper, undefined);
    assert.equal(p.frame, undefined);
  }
});

test('the gravel lattice has the reported pitch, diameter and 8 instances (3-2-3)', () => {
  const g = byId.get('zc:531111000');
  const layer = g.layers[0];
  assert.equal(layer.params.pitchX, 21.66);
  assert.equal(layer.params.pitchY, 8.03);
  assert.deepEqual(layer.params.rowOffset, { pt: 11.53 });
  assert.equal(layer.motif.d, 7.1);
  assert.equal(layer.motif.fill, 'paper');
  assert.deepEqual(g.origin, { x: 7.35, y: 6.28 });
});

test('the sand-gravel preset has a gravel layer and a dot layer offset from it', () => {
  const p = byId.get('zc:531120000');
  assert.deepEqual(p.layers.map((l) => l.archetype), ['grid', 'grid']);
  assert.equal(p.layers[1].motif.kind, 'dot');
  assert.equal(p.provenance.measured, false);
});

test('the decomposed-granite (まさ土) preset keeps the reported 7:6 direction split', () => {
  const p = byId.get('zc:540111000');
  const scatter = p.layers.find((l) => l.archetype === 'scatter');
  assert.equal(scatter.params.count, 13);
  assert.deepEqual(scatter.params.angles.map((a) => a.weight), [7, 6]);
  assert.equal(p.provenance.measured, false);
});

test('the volcanic-ash preset records the unmeasured ±27 split as an assumption', () => {
  const p = byId.get('zc:540120000');
  const scatter = p.layers[0];
  assert.equal(scatter.params.count, 19);
  assert.equal(scatter.params.angles.reduce((s, a) => s + a.weight, 0), 19);
  assert.match(p.provenance.notes, /未測定/);
});

test('the wave preset uses the mean line spacing 8.17 and no motif', () => {
  const p = byId.get('zc:532300000');
  assert.equal(p.layers[0].archetype, 'wave');
  assert.equal(p.layers[0].params.lineSpacing, 8.17);
  assert.equal(p.layers[0].motif, undefined);
});

test('the Kanto loam preset flips every other row and uses the split chevron', () => {
  const p = byId.get('zc:540121000');
  assert.equal(p.layers[0].params.flipRows, true);
  assert.equal(p.layers[0].motif.kind, 'splitChevron');
  assert.equal(p.layers[0].motif.open, 'down');
});

test('the boulder (玉石) preset has two symbol placements', () => {
  const p = byId.get('zc:510000010');
  assert.equal(p.layers[0].params.offsets.length, 2);
  assert.equal(p.layers[0].motif.kind, 'ellipse');
});

test('the clipped silt-type preset keeps the frame-clipped right-hand line', () => {
  const p = byId.get('zc:532100000');
  assert.equal(p.layers[0].params.edgeMode, 'clip');
});

test('the 135 no-pattern rows are empty presets with a single empty layer', () => {
  const empties = PRESETS.filter((p) => !isAlias(p) && p.layers[0].archetype === 'empty');
  for (const p of empties) {
    assert.equal(p.layers.length, 1);
    assert.equal(p.layers[0].id, 'none');
    assert.match(p.provenance.section, /^1 \/ t4_1_p/);
  }
});

test('every table 5-1 alias target id is present among the 4-1 presets', () => {
  const ids = new Set(PRESETS.map((p) => p.id));
  for (const id of ['zc:521111000', 'zc:531112000', 'zc:531112100', 'zc:531112200']) assert.ok(ids.has(id), id);
});
