import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSpec, setByPointer } from '../../src/core/resolve.js';
import { SchemaError, ResolveError } from '../../src/core/errors.js';
import { spec, alias } from '../fixtures/specs.js';

test('table defaults fill frame and stroke; spec values win', () => {
  const r = resolveSpec(spec());
  assert.deepEqual(r.spec.frame, { width: 56.03, height: 28.41, show: 'none', lineWidth: 0.2 });
  assert.equal(r.spec.stroke.width, 0.239);
  const soil = resolveSpec(spec({ table: '4-1', stroke: { width: 0.3 } }));
  assert.equal(soil.spec.frame.show, 'ink');
  assert.equal(soil.spec.stroke.width, 0.3);
  assert.equal(resolveSpec(spec({ table: '3-9' })).spec.stroke.cap, 'butt');
});

test('options override common variables, colours included', () => {
  const r = resolveSpec(spec(), { ink: '#112233', paper: '#fafafa', clip: false, seed: 9, frame: { show: 'ink' } });
  assert.equal(r.spec.ink, '#112233');
  assert.equal(r.spec.paper, '#fafafa');
  assert.equal(r.spec.clip, false);
  assert.equal(r.spec.seed, 9);
  assert.equal(r.spec.frame.show, 'ink');
});

test('overrides use JSON Pointer and are validated after applying', () => {
  const r = resolveSpec(spec(), { overrides: { '/layers/0/params/pitchX': 12, '/layers/0/motif/d': 1.6 } });
  assert.equal(r.spec.layers[0].params.pitchX, 12);
  assert.equal(r.spec.layers[0].motif.d, 1.6);
  assert.throws(() => resolveSpec(spec(), { overrides: { '/layers/0/params/pitchx': 12 } }), (e) => e instanceof SchemaError && /unknown key "pitchx"/.test(e.message));
  assert.throws(() => resolveSpec(spec(), { overrides: { '/layers/3/params/pitchX': 1 } }), /no object at "\/layers\/3"/);
  assert.throws(() => resolveSpec(spec(), { overrides: { '/layers/3': {} } }), /out of range/);
  assert.throws(() => resolveSpec(spec(), { overrides: { '/id': 'zc:000000000' } }), /cannot be overridden/);
  assert.throws(() => resolveSpec(spec(), { overrides: { '/layers/0/motif/fill': '#ff0000' } }), SchemaError);
  const o = {};
  assert.throws(() => setByPointer(o, 'a/b', 1), /JSON Pointer/);
});

test('points and paths target layers by id', () => {
  const s = spec({ layers: [{ id: 'ash', archetype: 'scatter', params: { count: 2, length: 6, angles: [{ deg: 27, weight: 1 }] } }] });
  const r = resolveSpec(s, { points: { ash: [{ x: 1, y: 2, len: 6, angle: 27 }] } });
  assert.equal(r.spec.layers[0].params.points.length, 1);
  assert.throws(() => resolveSpec(s, { points: { ahs: [] } }), (e) => e instanceof ResolveError && e.candidates[0] === 'ash');
  assert.throws(() => resolveSpec(spec(), { points: { circles: [] } }), /only to scatter/);
  const p = resolveSpec(spec(), { paths: { circles: 'M0 0 L1 1' } });
  assert.deepEqual(p.spec.layers[0].motif, { kind: 'path', d: 'M0 0 L1 1', fill: 'ink' });
});

test('size option sets the region in pt', () => {
  const r = resolveSpec(spec(), { size: { width: 20, height: 10, unit: 'mm' } });
  assert.ok(Math.abs(r.render.region.width - 20 * 72 / 25.4) < 1e-9);
  assert.equal(r.render.unit, 'mm');
});

test('aliases must be resolved through the registry first', () => {
  assert.throws(() => resolveSpec(alias('zc:111101102', 'zc:111101002')), ResolveError);
});
