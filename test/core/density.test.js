import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveScales, scaleLength, scaleCount, applyDensity, densityFromRowsPerFrame, overlapWarning, layerFactors } from '../../src/core/density.js';
import { specWithDefaults, DEFAULT_ENV } from '../../src/core/validate.js';
import { resolveSpec } from '../../src/core/resolve.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { spec } from '../fixtures/specs.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ''} ${a} != ${b}`);
const dense = (s, o) => applyDensity(specWithDefaults(s), resolveScales(o), DEFAULT_ENV);

test('method B: pitch and motif ÷ density, stroke fixed', () => {
  const r = resolveSpec(spec(), { density: 2 });
  const l = r.drawSpec.layers[0];
  close(l.params.pitchX, 11.22 / 2);
  close(l.params.pitchY, 9.27 / 2);
  close(l.motif.d, 3.5);
  close(r.render.strokeWidth, 0.239, 'stroke stays in pt');
  // the reproducible spec keeps the undensified values
  close(r.spec.layers[0].params.pitchX, 11.22);
});

test('rowOffset: ratio is unchanged, {pt} is scaled', () => {
  const a = dense(spec(), { density: 2 }).spec.layers[0].params.rowOffset;
  assert.equal(a, 0.5);
  const s = spec();
  s.layers[0].params.rowOffset = { pt: 4.77 };
  close(dense(s, { density: 2 }).spec.layers[0].params.rowOffset.pt, 2.385);
});

test('layer offset scales as a length', () => {
  const s = spec();
  s.layers[0].offset = { x: 2, y: -4 };
  assert.deepEqual(dense(s, { density: 4 }).spec.layers[0].offset, { x: 0.5, y: -1 });
});

test('method A via motifScale 1 keeps the motif', () => {
  const l = dense(spec(), { density: 2, motifScale: 1 }).spec.layers[0];
  close(l.params.pitchX, 5.61);
  close(l.motif.d, 7);
});

test('strokeScale follow = method C', () => {
  close(resolveSpec(spec(), { density: 2, strokeScale: 'follow' }).render.strokeWidth, 0.1195);
});

test('scatter count scales with density² and lengths with motifScale', () => {
  const s = spec({ layers: [{ id: 'ash', archetype: 'scatter', params: { count: 19, length: 6.18, angles: [{ deg: 27, weight: 9 }, { deg: -27, weight: 7 }] } }] });
  const p = dense(s, { density: 2 }).spec.layers[0].params;
  assert.equal(p.count, 76);
  close(p.length, 3.09);
  close(p.margin, 2.0, 'margin is not density-scaled');
  assert.equal(p.angles[0].deg, 27, 'angles are not scaled');
  const q = dense(s, { density: 0.1 });
  assert.equal(q.spec.layers[0].params.count, 0);
  assert.ok(q.warnings.some((w) => /rounds to 0/.test(w)));
});

test('grid cycle motifs scale with the motif factor', () => {
  const s = spec();
  delete s.layers[0].motif;
  s.layers[0].params.cycle = [{ kind: 'dot', d: 1.3 }, { kind: 'circle', d: 7, fill: 'paper' }];
  const c = dense(s, { density: 2 }).spec.layers[0].params.cycle;
  close(c[0].d, 0.65);
  close(c[1].d, 3.5);
});

test('frameDiagonal and symbol are exempt; edgeBand keeps its motif and band width', () => {
  const fd = spec({ layers: [{ id: 'diag', archetype: 'frameDiagonal', params: { direction: 'x', count: 2, gap: 2.78 } }] });
  assert.equal(dense(fd, { density: 3 }).spec.layers[0].params.gap, 2.78);
  const eb = spec({ table: '3-9', id: 'zc:t3-9:5', layers: [{ id: 'band', archetype: 'edgeBand', motif: { kind: 'hline', length: 6.92 }, params: { pitchY: 3.57 } }] });
  const l = dense(eb, { density: 2 }).spec.layers[0];
  close(l.params.pitchY, 1.785);
  close(l.params.bandWidth, 6.92);
  close(l.motif.length, 6.92);
  const sy = spec({ layers: [{ id: 'mark', archetype: 'symbol', motif: { kind: 'ellipse', w: 12.72, h: 8.47, fill: 'paper' }, params: { offsets: [{ x: 13.4, y: -4.3 }] } }] });
  const m = dense(sy, { density: 2 }).spec.layers[0];
  close(m.motif.w, 12.72);
  close(m.params.offsets[0].x, 13.4);
});

test('densityScale multiplies per layer', () => {
  const s = spec();
  s.layers[0].densityScale = 2;
  close(dense(s, { density: 1.5 }).spec.layers[0].params.pitchX, 11.22 / 3);
});

test('rowsPerFrame (method D) converts to density', () => {
  close(densityFromRowsPerFrame(6, 9.27, 28.41), (6 * 9.27) / 28.41);
  const r = resolveSpec(spec(), { rowsPerFrame: 6 });
  close(r.render.density, (6 * 9.27) / 28.41);
  assert.throws(() => densityFromRowsPerFrame(0, 1, 1), /rows must be > 0/);
});

test('scales and helpers validate input', () => {
  assert.deepEqual(resolveScales({}), { density: 1, motifScale: 'follow', strokeFactor: 1 });
  assert.throws(() => resolveScales({ density: 0 }), /density/);
  assert.throws(() => resolveScales({ motifScale: -1 }), /motifScale/);
  close(scaleLength(10, 4), 2.5);
  assert.deepEqual(scaleCount(19, 2), { value: 76, raw: 76 });
  const f = layerFactors(resolveScales({ density: 2 }), ARCHETYPES.symbol);
  assert.deepEqual(f, { params: { length: 1, motif: 1, area: 1 }, motif: 1 });
});

test('overlapWarning reports when motif + stroke exceeds the pitch', () => {
  assert.equal(overlapWarning({ extent: { w: 7, h: 7 }, pitchX: 11.22, pitchY: 9.27, strokeWidth: 0.239, layerId: 'c' }), null);
  assert.match(overlapWarning({ extent: { w: 7, h: 7 }, pitchX: 5.61, pitchY: 9.27, strokeWidth: 0.239, layerId: 'c' }), /overlap.*pitchX/);
});
