/**
 * Tests for presets t3_1, t3_2, t3_3 (table 3-1 to 3-3). Owner: preset-1.
 * Checks: every preset passes validateSpec, ids are unique, aliases resolve to full presets,
 * and each full preset carries its provenance section.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateSpec } from '../../src/core/validate.js';
import { PRESETS as T3_1 } from '../../src/presets/t3_1.js';
import { PRESETS as T3_2 } from '../../src/presets/t3_2.js';
import { PRESETS as T3_3 } from '../../src/presets/t3_3.js';

const ALL = [...T3_1, ...T3_2, ...T3_3];
const ALIAS_KEYS = new Set(['schema', 'id', 'table', 'code', 'symbol', 'names', 'provenance', 'aliasOf']);

test('every preset in t3_1, t3_2, t3_3 passes validateSpec', () => {
  for (const spec of ALL) {
    const r = validateSpec(spec);
    assert.equal(r.ok, true, `${spec.id}: ${JSON.stringify(r.errors)}`);
  }
});

test('every preset in t3_1, t3_2, t3_3 has no validation warnings', () => {
  for (const spec of ALL) {
    const r = validateSpec(spec);
    assert.deepEqual(r.warnings, [], `${spec.id} warnings`);
  }
});

test('preset ids are unique across the three files', () => {
  const ids = ALL.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
});

test('source codes are unique across the three files', () => {
  const codes = ALL.map((s) => s.code);
  assert.equal(new Set(codes).size, codes.length, 'duplicate codes');
});

test('each file holds the rows of its own table', () => {
  for (const spec of T3_1) assert.equal(spec.table, '3-1', spec.id);
  for (const spec of T3_2) assert.equal(spec.table, '3-2', spec.id);
  for (const spec of T3_3) assert.equal(spec.table, '3-3', spec.id);
});

test('the three files hold the 60 rows of tables 3-1 to 3-3', () => {
  assert.equal(T3_1.length, 27);
  assert.equal(T3_2.length, 13);
  assert.equal(T3_3.length, 20);
});

test('aliases carry only head fields and aliasOf, never layers', () => {
  const aliases = ALL.filter((s) => 'aliasOf' in s);
  assert.ok(aliases.length > 0, 'expected at least one alias');
  for (const spec of aliases) {
    for (const key of Object.keys(spec)) {
      assert.ok(ALIAS_KEYS.has(key), `${spec.id} has non-alias key "${key}"`);
    }
  }
});

test('every alias points to an existing full preset (not to another alias)', () => {
  const byId = new Map(ALL.map((s) => [s.id, s]));
  for (const spec of ALL.filter((s) => 'aliasOf' in s)) {
    const target = byId.get(spec.aliasOf);
    assert.ok(target, `${spec.id} aliasOf ${spec.aliasOf} does not exist`);
    assert.ok(!('aliasOf' in target), `${spec.id} aliases ${spec.aliasOf}, which is itself an alias`);
    assert.notEqual(spec.aliasOf, spec.id, `${spec.id} aliases itself`);
  }
});

test('every full preset has layers and a provenance section', () => {
  for (const spec of ALL.filter((s) => !('aliasOf' in s))) {
    assert.ok(Array.isArray(spec.layers) && spec.layers.length > 0, `${spec.id} has no layers`);
    assert.ok(spec.provenance.section && spec.provenance.section.trim() !== '', `${spec.id} has no section`);
  }
});

test('every alias and full preset has a provenance section', () => {
  for (const spec of ALL) {
    assert.ok(spec.provenance.section && spec.provenance.section.trim() !== '', `${spec.id} has no section`);
  }
});

test('only the breccia (角礫岩) and wacke (ワッケ) are flagged as partly unmeasured', () => {
  const unmeasured = ALL.filter((s) => s.provenance.measured === false).map((s) => s.id).sort();
  assert.deepEqual(unmeasured, ['zc:111102002', 'zc:114200002']);
});

test('the breccia blob values measured from the source prim are documented in provenance', () => {
  const breccia = T3_1.find((s) => s.id === 'zc:111102002');
  const blobs = breccia.layers[0].params.cycle;
  assert.equal(blobs.length, 2);
  for (const b of blobs) {
    assert.equal(typeof b.irregularity, 'number');
    assert.equal(typeof b.rotation, 'number');
  }
  assert.match(breccia.provenance.notes, /irregularity 0\.3/);
  assert.match(breccia.provenance.notes, /rotation/);
});
