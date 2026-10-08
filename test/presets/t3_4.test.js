import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../../src/presets/t3_4.js';
import { validateSpec } from '../../src/core/validate.js';

const byId = new Map(PRESETS.map((p) => [p.id, p]));

test('every preset in t3_4.js passes validateSpec', () => {
  const failures = [];
  for (const p of PRESETS) {
    const r = validateSpec(p);
    if (!r.ok) failures.push(`${p.id}: ${r.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
  }
  assert.deepEqual(failures, []);
});

test('preset ids are unique within table 3-4', () => {
  const ids = PRESETS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every alias points at an existing drawing in the same file', () => {
  for (const p of PRESETS) {
    if (p.aliasOf === undefined) continue;
    const target = byId.get(p.aliasOf);
    assert.ok(target, `${p.id} aliases ${p.aliasOf}, which is not in t3_4.js`);
    assert.equal(target.aliasOf, undefined, `${p.id} aliases ${p.aliasOf}, which is itself an alias`);
  }
});

test('an alias carries only head fields and aliasOf (no copied drawing values)', () => {
  const head = new Set(['schema', 'id', 'table', 'code', 'symbol', 'names', 'aliasOf', 'provenance']);
  for (const p of PRESETS) {
    if (p.aliasOf === undefined) continue;
    for (const key of Object.keys(p)) assert.ok(head.has(key), `${p.id} has key ${key}`);
  }
});

test('every preset cites a provenance section and a measured flag', () => {
  for (const p of PRESETS) {
    assert.equal(typeof p.provenance.section, 'string', `${p.id} section`);
    assert.ok(p.provenance.section.trim().length > 0, `${p.id} section is empty`);
    assert.equal(typeof p.provenance.measured, 'boolean', `${p.id} measured`);
  }
});

test('the file holds 36 registered presets: 15 drawings and 21 aliases', () => {
  const aliases = PRESETS.filter((p) => p.aliasOf !== undefined).length;
  assert.equal(PRESETS.length, 36);
  assert.equal(aliases, 21);
  assert.equal(PRESETS.length - aliases, 15);
});

test('the staggered grid of 火山礫 keeps the measured pitches (14.07 x 5.70, half offset)', () => {
  const layer = byId.get('zc:221010400').layers[0];
  assert.equal(layer.params.pitchX, 14.07);
  assert.equal(layer.params.pitchY, 5.70);
  assert.equal(layer.params.rowOffset, 0.5);
});

test('empty rows use the empty archetype and carry no motif', () => {
  for (const id of ['zc:231020100', 'zc:231020200', 'zc:231020300']) {
    const layers = byId.get(id).layers;
    assert.equal(layers.length, 1);
    assert.equal(layers[0].archetype, 'empty');
    assert.equal(layers[0].motif, undefined);
  }
});
