import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec, assertValidSpec, validateOptions, specWithDefaults } from '../../src/core/validate.js';
import { checkDescriptor, validateValue, applyDefaults, SPEC_BODY_FIELDS, OPTIONS, ALIAS_SPEC, obj, len } from '../../src/core/schema.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { MOTIFS } from '../../src/motifs/index.js';
import { SchemaError } from '../../src/core/errors.js';
import { spec, alias } from '../fixtures/specs.js';

const errPaths = (r) => r.errors.map((e) => e.path);

test('a valid spec passes', () => {
  const r = validateSpec(spec());
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.errors, []);
});

test('unknown key in params is an error with the closest candidate first', () => {
  const s = spec();
  s.layers[0].params.pitchx = 3;
  const r = validateSpec(s);
  assert.equal(r.ok, false);
  const e = r.errors.find((x) => x.path === '/layers/0/params/pitchx');
  assert.ok(e, JSON.stringify(r.errors));
  assert.match(e.message, /unknown key "pitchx"/);
  assert.equal(e.candidates[0], 'pitchX');
});

test('unknown key at the root and in a motif are errors', () => {
  const s = spec({ denstiy: 2 });
  s.layers[0].motif.diameter = 7;
  const r = validateSpec(s);
  assert.ok(errPaths(r).includes('/denstiy'));
  assert.ok(errPaths(r).includes('/layers/0/motif/diameter'));
  assert.equal(r.errors.find((x) => x.path === '/layers/0/motif/diameter').candidates[0], 'd');
});

test('assertValidSpec throws SchemaError listing every error', () => {
  const s = spec({ foo: 1, bar: 2 });
  assert.throws(() => assertValidSpec(s), (e) => e instanceof SchemaError && e.errors.length === 2 && /\/foo/.test(e.message) && /\/bar/.test(e.message));
});

test('missing required keys are reported', () => {
  const s = spec();
  delete s.provenance;
  delete s.layers[0].params.pitchY;
  const r = validateSpec(s);
  assert.ok(errPaths(r).includes('/provenance'));
  assert.ok(errPaths(r).includes('/layers/0/params/pitchY'));
});

test('type and range errors', () => {
  const s = spec();
  s.layers[0].params.pitchX = -1;
  s.layers[0].params.rows = 2.5;
  s.layers[0].motif.d = 'big';
  const r = validateSpec(s);
  assert.ok(errPaths(r).includes('/layers/0/params/pitchX'));
  assert.ok(errPaths(r).includes('/layers/0/params/rows'));
  assert.ok(errPaths(r).includes('/layers/0/motif/d'));
});

test('NaN and Infinity are rejected', () => {
  const s = spec();
  s.layers[0].params.pitchX = NaN;
  s.layers[0].params.pitchY = Infinity;
  const r = validateSpec(s);
  assert.equal(r.errors.length, 2);
});

test('unknown archetype and motif kind list candidates', () => {
  const s = spec();
  s.layers[0].archetype = 'grd';
  const r = validateSpec(s);
  assert.equal(r.errors[0].path, '/layers/0/archetype');
  assert.equal(r.errors[0].candidates[0], 'grid');
  const s2 = spec();
  s2.layers[0].motif.kind = 'circel';
  const r2 = validateSpec(s2);
  assert.equal(r2.errors[0].path, '/layers/0/motif/kind');
  assert.equal(r2.errors[0].candidates[0], 'circle');
});

test('enum error lists allowed values', () => {
  const s = spec();
  s.layers[0].params.assign = 'column';
  const r = validateSpec(s);
  const e = r.errors.find((x) => x.path === '/layers/0/params/assign');
  assert.deepEqual([...e.candidates].sort(), ['col', 'row', 'rowcol']);
});

test('motif policy: grid needs exactly one of motif / cycle; hatch forbids motif', () => {
  const both = spec();
  both.layers[0].params.cycle = [{ kind: 'dot', d: 1.3 }];
  assert.match(validateSpec(both).errors.map((e) => e.message).join(), /exactly one of motif or params.cycle/);
  const neither = spec();
  delete neither.layers[0].motif;
  assert.equal(validateSpec(neither).ok, false);
  const cycleOnly = spec();
  delete cycleOnly.layers[0].motif;
  cycleOnly.layers[0].params.cycle = [{ kind: 'dot', d: 1.3 }, { kind: 'circle', d: 7, fill: 'paper' }];
  assert.equal(validateSpec(cycleOnly).ok, true, JSON.stringify(validateSpec(cycleOnly).errors));
  const hatch = spec({ layers: [{ id: 'lines', archetype: 'hatch', motif: { kind: 'dot', d: 1 }, params: { spacing: 4.24 } }] });
  assert.ok(errPaths(validateSpec(hatch)).includes('/layers/0/motif'));
});

test('layer ids: duplicates and forward references are errors', () => {
  const s = spec();
  s.layers.push(structuredClone(s.layers[0]));
  assert.match(validateSpec(s).errors.map((e) => e.message).join(), /duplicate layer id/);
  const f = spec();
  f.layers[0].params.avoid = 'later';
  f.layers.push({ id: 'later', archetype: 'empty' });
  assert.match(validateSpec(f).errors.map((e) => e.message).join(), /not an EARLIER layer/);
});

test('empty layers array is an error; archetype empty is the blank pattern', () => {
  assert.equal(validateSpec(spec({ layers: [] })).ok, false);
  assert.equal(validateSpec(spec({ layers: [{ id: 'none', archetype: 'empty' }] })).ok, true);
});

test('alias specs carry only head fields + aliasOf', () => {
  assert.equal(validateSpec(alias('zc:111101102', 'zc:111101002')).ok, true);
  const bad = alias('zc:111101102', 'zc:111101002', { layers: [] });
  assert.ok(errPaths(validateSpec(bad)).includes('/layers'));
  assert.equal(validateSpec(alias('zc:111101102', 'zc:111101102')).ok, false);
});

test('id, schema and table patterns', () => {
  assert.equal(validateSpec(spec({ id: 'zc:12345' })).ok, false);
  assert.equal(validateSpec(spec({ id: 'zc:t4-3:-Sh' })).ok, true);
  assert.equal(validateSpec(spec({ id: 'zc:t3-9:6' })).ok, false);
  assert.equal(validateSpec(spec({ schema: 'zc-pattern/2.0.0' })).ok, false);
  assert.equal(validateSpec(spec({ table: '3-10' })).ok, false);
});

test('union: rowOffset accepts a ratio or {pt}, nothing else', () => {
  const a = spec(); a.layers[0].params.rowOffset = { pt: 4.77 };
  assert.equal(validateSpec(a).ok, true);
  const b = spec(); b.layers[0].params.rowOffset = { mm: 1 };
  assert.equal(validateSpec(b).ok, false);
  const c = spec(); c.layers[0].params.rowOffset = 1.5;
  assert.equal(validateSpec(c).ok, false);
});

test('options: unknown keys, exclusive density/rowsPerFrame, soft range warnings', () => {
  assert.equal(validateOptions({ densty: 2 }).errors[0].candidates[0], 'density');
  assert.match(validateOptions({ density: 2, rowsPerFrame: 3 }).errors[0].message, /mutually exclusive/);
  const w = validateOptions({ density: 8 });
  assert.equal(w.ok, true);
  assert.equal(w.warnings.length, 1);
  assert.equal(validateOptions({ density: 0 }).ok, false);
  assert.equal(validateOptions({ overrides: { 'layers/0': 1 } }).ok, false, 'override keys must be JSON Pointers');
});

test('defaults are filled from descriptors', () => {
  const full = specWithDefaults(spec());
  const p = full.layers[0].params;
  assert.equal(p.assign, 'col');
  assert.equal(p.cols, 'auto');
  assert.equal(p.edgeMode, 'whole');
  assert.deepEqual(full.layers[0].offset, { x: 0, y: 0 });
  assert.equal(full.layers[0].motif.polygonSides, null);
  assert.equal(full.ink, '#000000');
  assert.equal(full.paper, '#ffffff');
  assert.equal(full.clip, true);
  assert.equal(full.origin, 'center');
});

test('every descriptor (spec, options, archetypes, motifs) is well-formed', () => {
  const env = { validateMotif: () => {}, motifDescriptor: () => ({ type: 'object', fields: {}, desc: 'x' }) };
  const all = {
    spec: { type: 'object', fields: SPEC_BODY_FIELDS, desc: 'spec body' },
    alias: ALIAS_SPEC,
    options: OPTIONS,
    ...Object.fromEntries(Object.entries(ARCHETYPES).map(([k, a]) => [`archetype:${k}`, a.PARAMS])),
    ...Object.fromEntries(Object.entries(MOTIFS).map(([k, m]) => [`motif:${k}`, m.descriptor])),
  };
  for (const [name, d] of Object.entries(all)) {
    assert.deepEqual(checkDescriptor(d, name, env), [], name);
  }
});

test('checkDescriptor catches missing unit / density class and bad defaults', () => {
  const bad = obj({ a: { type: 'number', desc: 'no unit' }, b: len('b', { default: -1 }) }, 'bad');
  const problems = checkDescriptor(bad, 'bad');
  assert.ok(problems.some((p) => /needs unit/.test(p)));
  assert.ok(problems.some((p) => /density class/.test(p)));
  assert.ok(problems.some((p) => /default does not validate/.test(p)));
});

test('validateValue / applyDefaults on nested defaults', () => {
  const d = obj({ inner: obj({ v: len('v', { default: 2 }) }, 'inner', { default: {} }) }, 'outer');
  const out = { errors: [], warnings: [] };
  validateValue(d, {}, '', out);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(applyDefaults(d, {}), { inner: { v: 2 } });
});
