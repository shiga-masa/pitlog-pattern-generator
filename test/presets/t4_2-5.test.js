// Tests for src/presets/t4_2.js, t4_3.js, t5.js (preset-5).
// Checks counts, id format, schema validity and provenance. Alias targets in table 4-1 are checked
// only once src/presets/t4_1.js is filled (preset-4); until then that test is reported as skipped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec } from '../../src/core/validate.js';
import { PRESETS as T4_1 } from '../../src/presets/t4_1.js';
import { PRESETS as T4_2 } from '../../src/presets/t4_2.js';
import { PRESETS as T4_3 } from '../../src/presets/t4_3.js';
import { PRESETS as T5 } from '../../src/presets/t5.js';

const byId = (list) => new Map(list.map((p) => [p.id, p]));

test('t4_2 has 6 presets: 4 drawn, 2 empty, 埋土 is an alias', () => {
  assert.equal(T4_2.length, 6);
  const drawn = T4_2.filter((p) => p.layers && p.layers.some((l) => l.archetype !== 'empty'));
  const empty = T4_2.filter((p) => p.layers && p.layers.every((l) => l.archetype === 'empty'));
  const alias = T4_2.filter((p) => 'aliasOf' in p);
  assert.equal(drawn.length, 3, 'drawn: 盛土, 表土, 崩積土');
  assert.equal(empty.length, 2, 'empty: 沖積層, 洪積層');
  assert.equal(alias.length, 1, 'alias: 埋土');
  assert.equal(alias[0].names.ja, '埋土');
  assert.equal(alias[0].aliasOf, 'zc:599200001');
});

test('t4_2 ids are unique and of the form zc:<9-digit code>', () => {
  const ids = T4_2.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of T4_2) assert.match(p.id, /^zc:\d{9}$/);
});

test('every t4_2 spec passes validateSpec', () => {
  for (const p of T4_2) {
    const r = validateSpec(p);
    assert.equal(r.ok, true, `${p.id}: ${JSON.stringify(r.errors)}`);
  }
});

test('t4_2 provenance has a section and a measured flag on every preset', () => {
  for (const p of T4_2) {
    assert.ok(p.provenance && typeof p.provenance.section === 'string' && p.provenance.section.length > 0, p.id);
    assert.equal(typeof p.provenance.measured, 'boolean', p.id);
    assert.equal(p.provenance.doc, 'R3', p.id);
  }
});

test('盛土 keeps the measured horizontal gap 2.78 and two diagonals', () => {
  const p = byId(T4_2).get('zc:599200001');
  assert.equal(p.layers[0].archetype, 'frameDiagonal');
  assert.equal(p.layers[0].params.count, 2);
  assert.equal(p.layers[0].params.gap, 2.78);
});

test('崩積土 has 0.239 pt lines, no frame, and the measured triangle size', () => {
  const p = byId(T4_2).get('zc:599200004');
  assert.equal(p.stroke.width, 0.239);
  assert.equal(p.frame.show, 'none');
  const g = p.layers[0];
  assert.equal(g.motif.kind, 'triangle');
  assert.equal(g.motif.fill, 'paper');
  assert.equal(g.motif.base, 5.58);
  assert.equal(g.motif.height, 4.46);
  assert.equal(g.params.pitchX, 19.70);
  assert.deepEqual(g.params.rowOffset, { pt: 10.21 });
});

test('t4_3 has 15 presets: 14 drawn and サンゴ混じり empty', () => {
  assert.equal(T4_3.length, 15);
  const empty = T4_3.filter((p) => p.layers.every((l) => l.archetype === 'empty'));
  assert.deepEqual(empty.map((p) => p.id), ['zc:t4-3:-Co']);
});

test('t4_3 ids are zc:t4-3:<symbol> with the leading "-" for mixed symbols', () => {
  for (const p of T4_3) assert.match(p.id, /^zc:t4-3:-?[A-Z][a-z]?$/, p.id);
  assert.equal(new Set(T4_3.map((p) => p.id)).size, 15);
  assert.ok(byId(T4_3).has('zc:t4-3:-Sh'));
  assert.ok(byId(T4_3).has('zc:t4-3:G'));
});

test('every t4_3 spec passes validateSpec', () => {
  for (const p of T4_3) {
    const r = validateSpec(p);
    assert.equal(r.ok, true, `${p.id}: ${JSON.stringify(r.errors)}`);
  }
});

test('t4_3 unmeasured phases are flagged measured:false and carry no invented value', () => {
  const m = byId(T4_3);
  for (const id of ['zc:t4-3:S', 'zc:t4-3:M']) {
    assert.equal(m.get(id).provenance.measured, false, id);
    assert.equal('bandPhase' in m.get(id).layers[0].params, false, id);
  }
});

test('t4_3 provenance has a section on every preset', () => {
  for (const p of T4_3) {
    assert.ok(p.provenance && p.provenance.section, p.id);
    assert.equal(p.provenance.doc, 'R3', p.id);
  }
});

test('t5 has 171 aliases (5-1: 165, 5-2: 6) and no table 5-3 entries', () => {
  assert.equal(T5.length, 171);
  assert.equal(T5.filter((p) => p.table === '5-1').length, 165);
  assert.equal(T5.filter((p) => p.table === '5-2').length, 6);
  assert.equal(T5.filter((p) => p.table === '5-3').length, 0);
});

test('t5 entries are aliases only: aliasOf, no drawing fields', () => {
  for (const p of T5) {
    assert.ok(typeof p.aliasOf === 'string' && p.aliasOf.startsWith('zc:'), p.id);
    assert.equal('layers' in p, false, `${p.id} must not carry layers`);
    assert.equal('motif' in p, false, p.id);
  }
});

test('t5 ids are unique and follow zc:t5-<1|2>:<row>', () => {
  const ids = T5.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of T5) assert.match(p.id, /^zc:t5-[12]:\d{1,3}$/, p.id);
});

test('every t5 alias passes validateSpec', () => {
  for (const p of T5) {
    const r = validateSpec(p);
    assert.equal(r.ok, true, `${p.id}: ${JSON.stringify(r.errors)}`);
  }
});

test('t5 table 5-2 aliases point to table 4-2 presets (which exist in t4_2.js)', () => {
  const ids4_2 = new Set(T4_2.map((p) => p.id));
  for (const p of T5.filter((x) => x.table === '5-2')) {
    assert.ok(ids4_2.has(p.aliasOf), `${p.id} -> ${p.aliasOf}`);
  }
});

test('t5 table 5-1 aliases point to 9-digit codes (table 4-1 ids)', () => {
  for (const p of T5.filter((x) => x.table === '5-1')) {
    assert.match(p.aliasOf, /^zc:\d{9}$/, p.id);
  }
});

test('t5 table 5-1 alias targets exist in t4_1.js', { skip: T4_1.length === 0 ? 'preset-4 has not filled t4_1.js yet' : false }, () => {
  const ids4_1 = new Set(T4_1.map((p) => p.id));
  for (const p of T5.filter((x) => x.table === '5-1')) {
    assert.ok(ids4_1.has(p.aliasOf), `${p.id} -> ${p.aliasOf}`);
  }
});
