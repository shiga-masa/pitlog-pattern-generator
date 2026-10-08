// Tests for the preset files owned by preset-3: t3_5.js, t3_7.js, t3_8.js, t3_9.js.
// Checks counts, schema validity, alias resolution, provenance, and a few values
// re-derived from the report statistics (CONVENTIONS §10, design §1.5.5-1.5.6).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS as T35 } from '../../src/presets/t3_5.js';
import { PRESETS as T37 } from '../../src/presets/t3_7.js';
import { PRESETS as T38 } from '../../src/presets/t3_8.js';
import { PRESETS as T39 } from '../../src/presets/t3_9.js';
import { PatternRegistry } from '../../src/core/registry.js';
import { validateSpec } from '../../src/core/validate.js';
import { SCHEMA_ID } from '../../src/core/schema.js';

const FILES = [
  { name: 'presets/t3_5.js', table: '3-5', list: T35, count: 18, aliases: 0, empty: 8 },
  { name: 'presets/t3_7.js', table: '3-7', list: T37, count: 16, aliases: 7, empty: 2 },
  { name: 'presets/t3_8.js', table: '3-8', list: T38, count: 12, aliases: 5, empty: 3 },
  { name: 'presets/t3_9.js', table: '3-9', list: T39, count: 5, aliases: 0, empty: 0 },
];
const ALL = FILES.flatMap((f) => f.list);
const HEAD_KEYS = ['schema', 'id', 'table', 'code', 'symbol', 'names', 'provenance', 'aliasOf'];

const isAlias = (s) => 'aliasOf' in s;
const isEmptyOnly = (s) => !isAlias(s) && s.layers.length === 1 && s.layers[0].archetype === 'empty';
const isPattern = (s) => !isAlias(s) && !isEmptyOnly(s);

/** Mean of consecutive differences, rounded to 2 decimals (as the report values are). */
function meanGap2(ys) {
  const d = [];
  for (let i = 1; i < ys.length; i++) d.push(ys[i] - ys[i - 1]);
  const m = d.reduce((a, b) => a + b, 0) / d.length;
  return Math.round(m * 100) / 100;
}

test('each file holds the expected number of presets (counts per table)', () => {
  for (const f of FILES) {
    assert.equal(f.list.length, f.count, `${f.name}: preset count`);
    assert.equal(f.list.filter(isAlias).length, f.aliases, `${f.name}: alias count`);
    assert.equal(f.list.filter(isEmptyOnly).length, f.empty, `${f.name}: empty-row count`);
  }
});

test('every preset carries the table of its file', () => {
  for (const f of FILES) {
    for (const s of f.list) assert.equal(s.table, f.table, `${s.id}: table`);
  }
});

test('every full spec passes validateSpec (schema, motifs, colours)', () => {
  for (const s of ALL) {
    if (isAlias(s)) continue;
    const r = validateSpec(s);
    assert.ok(r.ok, `${s.id}: ${JSON.stringify(r.errors)}`);
  }
});

test('alias specs carry only head fields and aliasOf, never layers or values', () => {
  for (const s of ALL.filter(isAlias)) {
    for (const k of Object.keys(s)) assert.ok(HEAD_KEYS.includes(k), `${s.id}: unexpected key ${k}`);
    assert.equal(s.schema, SCHEMA_ID);
    assert.ok(!('layers' in s));
  }
});

test('every preset has a provenance with doc, a non-empty section and a boolean measured flag', () => {
  for (const s of ALL) {
    assert.ok(['R2'].includes(s.provenance.doc), `${s.id}: provenance.doc`);
    assert.ok(typeof s.provenance.section === 'string' && s.provenance.section.trim() !== '', `${s.id}: section`);
    assert.equal(typeof s.provenance.measured, 'boolean', `${s.id}: measured`);
  }
});

test('preset ids are unique across the four files and 9-digit ids match their code', () => {
  const ids = ALL.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate preset id');
  for (const s of ALL) {
    if (s.code !== undefined) {
      assert.match(s.code, /^\d{9}$/, `${s.id}: code`);
      if (s.id.startsWith('zc:') && /^zc:\d{9}$/.test(s.id)) assert.equal(s.id, `zc:${s.code}`, 'id vs code');
    }
  }
  for (const s of T39) assert.match(s.id, /^zc:t3-9:[1-5]$/, `${s.id}: table 3-9 id form`);
});

test('every alias resolves through the registry to a full drawing without a loop or dangling target', () => {
  const r = new PatternRegistry();
  const rep = r.addAll(ALL, 'presets/t3_5-9 (test)', { strict: true });
  assert.equal(rep.failed, 0);
  assert.equal(rep.processed, ALL.length);
  const fin = r.finalize();
  assert.equal(fin.failed, 0, JSON.stringify(fin.errors));
  for (const s of ALL.filter(isAlias)) {
    const { spec } = r.resolveAlias(s.id);
    assert.ok(!('aliasOf' in spec), `${s.id}: chain ends at a full spec`);
  }
});

test('empty rows use the single empty layer with no motif', () => {
  for (const s of ALL.filter(isEmptyOnly)) {
    assert.deepEqual(s.layers, [{ id: 'none', archetype: 'empty' }], s.id);
  }
});

test('表3-5 patterns use the wave, hatch, grid and brick archetypes', () => {
  const kinds = new Set(T35.filter(isPattern).flatMap((s) => s.layers.map((l) => l.archetype)));
  for (const k of ['wave', 'hatch', 'grid', 'brick']) assert.ok(kinds.has(k), `missing archetype ${k}`);
});

test('片麻岩 lineSpacing 9.70 is the mean distance of the 5 fitted base lines (-19.35 ... 19.47)', () => {
  const s = T35.find((x) => x.id === 'zc:311020000');
  const expected = meanGap2([-19.348, -9.718, -0.009, 9.700, 19.467]);
  assert.equal(s.layers[0].params.lineSpacing, expected);
  assert.equal(expected, 9.70);
});

test('粘板岩 hatch spacing equals the mean of the 5 measured row gaps (4.24)', () => {
  const s = T35.find((x) => x.id === 'zc:312010000');
  assert.equal(s.layers[0].params.spacing, meanGap2([2.89, 6.98, 11.32, 15.65, 19.99, 24.08]));
});

test('黒色片岩 and 緑色片岩 hatch spacings equal the mean of their row gaps (unequal rows)', () => {
  const bsct = T35.find((x) => x.id === 'zc:312160000');
  const gsct = T35.find((x) => x.id === 'zc:312050000');
  assert.equal(bsct.layers[1].params.spacing, meanGap2([2.53, 6.67, 10.81, 14.95, 19.08, 22.99]));
  assert.equal(gsct.layers[1].params.spacing, meanGap2([2.77, 6.69, 10.84, 14.98, 19.13, 23.28]));
});

test('表3-9 lens, hook and bar pitches equal the means of the measured row gaps', () => {
  const byId = Object.fromEntries(T39.map((s) => [s.id, s]));
  assert.equal(byId['zc:t3-9:2'].layers[0].params.pitchY, meanGap2([3.74, 7.61, 12.20, 16.31, 20.91, 24.77]));
  assert.equal(byId['zc:t3-9:3'].layers[0].params.pitchY, meanGap2([2.90, 7.00, 11.36, 15.70, 20.06, 24.18]));
  assert.equal(byId['zc:t3-9:5'].layers[0].params.pitchY, meanGap2([3.50, 7.00, 10.76, 14.26, 17.76, 21.52, 24.90]));
});

test('表3-9 X pitch fills the 28.52 pt frame exactly in 4 rows', () => {
  const x = T39.find((s) => s.id === 'zc:t3-9:4');
  assert.equal(Math.round(x.layers[0].params.pitchY * 4 * 100) / 100, 28.52);
  assert.equal(x.layers[0].params.pitchY, 7.13);
});

test('表3-9 presets all use edgeBand with a 6.92 pt band and the 0.238 pt stroke', () => {
  for (const s of T39) {
    assert.equal(s.layers.length, 1, s.id);
    assert.equal(s.layers[0].archetype, 'edgeBand', s.id);
    assert.equal(s.layers[0].params.bandWidth, 6.92, s.id);
    assert.equal(s.stroke.width, 0.238, s.id);
  }
});

test('表3-7 斑岩 group shares one drawing: 斑岩, 花崗斑岩, 文象斑岩, 花崗閃緑斑岩, 石英閃緑斑岩, 珪長岩 alias 石英斑岩', () => {
  const canon = 'zc:299100002';
  const names = ['斑岩', '花崗斑岩', '文象斑岩', '花崗閃緑斑岩', '石英閃緑斑岩', '珪長岩'];
  for (const n of names) {
    const s = T37.find((x) => x.names.ja === n);
    assert.ok(s && s.aliasOf === canon, `${n} should alias ${canon}`);
  }
});

test('表3-7 砂質岩 and アルコース: pitchY is the mean of the 5 row gaps and dots are d 1.3', () => {
  const sa = T37.find((x) => x.id === 'zc:199100001');
  assert.equal(sa.layers[0].params.pitchY, meanGap2([3.65, 7.78, 12.20, 16.35, 20.63, 24.97]));
  assert.equal(sa.layers[0].motif.d, 1.3);
});

test('表3-8 硬岩, 中硬岩, 軟岩 share the 56.44 x 28.62 black frame; 石英脈 is a single symbol with the vein motif', () => {
  for (const id of ['zc:999010002', 'zc:999010003', 'zc:999010004']) {
    const s = T38.find((x) => x.id === id);
    assert.deepEqual([s.frame.width, s.frame.height, s.frame.show], [56.44, 28.62, 'ink'], id);
  }
  const q = T38.find((x) => x.id === 'zc:999030002');
  assert.equal(q.layers[0].archetype, 'symbol');
  assert.equal(q.layers[0].motif.kind, 'vein');
  assert.equal(q.layers[0].motif.chord, 28.01);
});

test('表3-8 軟岩 and 風化岩 are the same drawing (風化岩 aliases 軟岩)', () => {
  const w = T38.find((x) => x.id === 'zc:999010005');
  assert.equal(w.aliasOf, 'zc:999010004');
});

test('固結粘土 overrides the rock frame size (56.44 x 28.62) and the stroke width (0.2)', () => {
  const s = T37.find((x) => x.id === 'zc:599100002');
  assert.deepEqual([s.frame.width, s.frame.height, s.frame.show], [56.44, 28.62, 'ink']);
  assert.equal(s.stroke.width, 0.2);
});

test('nothing in the four files is written as null (unmeasured values are not used here)', () => {
  const text = JSON.stringify(ALL);
  assert.ok(!/:null[,}\]]/.test(text), 'a null value is present');
});
