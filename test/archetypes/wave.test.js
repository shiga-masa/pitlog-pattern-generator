import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as wave from '../../src/archetypes/wave.js';
import { applyDefaults, validateValue } from '../../src/core/schema.js';
import { createRng } from '../../src/core/rng.js';
import { GeometryError } from '../../src/core/errors.js';
import { resolveSpec } from '../../src/core/resolve.js';

const close = (a, b, tol = 1e-6, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} != ${b} (tol ${tol})`);

/** Layer as the pipeline hands it to render(): validated, defaults applied. */
function layerOf(params, id = 'w') {
  const out = { errors: [], warnings: [] };
  validateValue(wave.PARAMS, params, '', out);
  assert.deepEqual(out.errors, [], 'test params must validate');
  return { id, archetype: 'wave', params: applyDefaults(wave.PARAMS, params), offset: { x: 0, y: 0 }, z: 0, densityScale: 1, blend: 'over' };
}

const FRAME = { x: 0, y: 0, width: 56.03, height: 28.41 };

function ctxOf(region = FRAME, extra = {}) {
  return {
    region, tileMode: 'frame', strokeWidth: 0.2, origin: 'center', jitter: 0, clip: true,
    rng: createRng(1), results: {},
    buildMotif: () => { throw new Error('wave takes no motif'); },
    motifExtent: () => { throw new Error('wave takes no motif'); },
    ...extra,
  };
}

const polylines = (r) => r.primitives.filter((p) => p.type === 'polyline');

test('default sine: three horizontal lines fill the frame, one polyline each', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, angle: 0, lines: 3 }), ctxOf());
  assert.equal(r.placed, 3);
  assert.equal(r.skipped, 0);
  assert.equal(polylines(r).length, 3);
  assert.deepEqual(r.warnings, []);
});

test('auto line count covers the frame and drops lattice lines that lie fully outside it', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17 }), ctxOf());
  assert.equal(r.placed, 3, 'lines at -8.17, 0, +8.17 about the centre');
  assert.equal(r.skipped, 0);
});

test('amplitude is the half crest-to-trough height: a sine line spans 2A vertically', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, lines: 1 }), ctxOf());
  const ys = polylines(r)[0].points.map((p) => p[1]);
  close(Math.max(...ys) - Math.min(...ys), 2.0, 0.01, 'crest-to-trough');
  close(Math.max(...ys) - 14.205, 1.0, 0.01, 'crest above the centre line');
});

test('lines outside the region are counted as skipped, not dropped silently', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, lines: 5 }), ctxOf());
  assert.equal(r.placed, 3);
  assert.equal(r.skipped, 2, 'the two outer lines at +-16.34 pt from the centre');
});

test('phase 0.25 puts the crest of the centre line at the reference point', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, lines: 1, phase: 0.25 }), ctxOf());
  const pts = polylines(r)[0].points;
  const cx = FRAME.width / 2;
  const nearest = pts.reduce((best, p) => (Math.abs(p[0] - cx) < Math.abs(best[0] - cx) ? p : best));
  close(nearest[1], 14.205 + 1.0, 0.05, 'displacement along n = +A at t = 0');
});

test('double line: doubleGap adds a second parallel curve for every base line', () => {
  const r = wave.render(layerOf({ wavelength: 8.5, amplitude: 1.0, lineSpacing: 13.75, angle: 45, doubleGap: 0.93, lines: 2 }), ctxOf());
  assert.equal(r.placed, 2);
  assert.equal(polylines(r).length, 4);
});

test('the wave lines respect margin: no vertex lies inside the margin band', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, margin: 2.78 }), ctxOf());
  const eps = 1e-6;
  for (const p of polylines(r)) {
    for (const [x, y] of p.points) {
      assert.ok(x >= 2.78 - eps && x <= FRAME.width - 2.78 + eps, `x ${x} inside margin`);
      assert.ok(y >= 2.78 - eps && y <= FRAME.height - 2.78 + eps, `y ${y} inside margin`);
    }
  }
});

test('per-side margin object is accepted and applied per side', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, margin: { left: 5, right: 0, top: 0, bottom: 0 } }), ctxOf());
  for (const p of polylines(r)) for (const [x] of p.points) assert.ok(x >= 5 - 1e-6, `x ${x} left of margin`);
});

test('margin larger than the region throws GeometryError with the reason', () => {
  assert.throws(
    () => wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, margin: 20 }), ctxOf()),
    (e) => e instanceof GeometryError && /margin/.test(e.message),
  );
});

test('trapezoid: flat part derived from wavelength; vertices reach +A and -A only', () => {
  const r = wave.render(layerOf({ wavelength: 19.6, amplitude: 1.445, lineSpacing: 7.06, waveform: 'trapezoid', flat: 7.0, rampDx: 2.85, rampDy: 2.89, lines: 1 }), ctxOf());
  const ys = polylines(r)[0].points.map((p) => p[1]);
  const mid = FRAME.height / 2;
  const offs = [...new Set(ys.map((y) => Number((y - mid).toFixed(6))))];
  close(Math.max(...offs), 1.445, 1e-6, 'high plateau');
  close(Math.min(...offs), -1.445, 1e-6, 'low plateau');
});

test('trapezoid rampDy must equal 2 x amplitude; mismatch throws with both values', () => {
  assert.throws(
    () => wave.render(layerOf({ wavelength: 19.6, amplitude: 2.89, lineSpacing: 7.06, waveform: 'trapezoid', rampDx: 2.85, rampDy: 2.89 }), ctxOf()),
    (e) => e instanceof GeometryError && /rampDy 2.89 must equal 2 x amplitude = 5.78/.test(e.message),
  );
});

test('trapezoid flat inconsistent with wavelength/2 - rampDx throws', () => {
  assert.throws(
    () => wave.render(layerOf({ wavelength: 19.6, amplitude: 1.445, lineSpacing: 7.06, waveform: 'trapezoid', flat: 3.0, rampDx: 2.85 }), ctxOf()),
    (e) => e instanceof GeometryError && /flat/.test(e.message),
  );
});

test('trapezoid without rampDx throws GeometryError', () => {
  assert.throws(
    () => wave.render(layerOf({ wavelength: 19.6, amplitude: 1.445, lineSpacing: 7.06, waveform: 'trapezoid' }), ctxOf()),
    (e) => e instanceof GeometryError && /rampDx/.test(e.message),
  );
});

test('lines closer than the stroke width produce a warning', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 0.1, lines: 3 }, 'tight'), ctxOf());
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /layer tight: wave lines come within/);
});

test('an explicit line count in the period tile is warned as not seamless', () => {
  const r = wave.render(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, lines: 3 }), ctxOf(FRAME, { tileMode: 'period' }));
  assert.ok(r.warnings.some((w) => /not seamless/.test(w)));
});

test('render is deterministic: same layer gives identical primitives', () => {
  const l = layerOf({ wavelength: 8.5, amplitude: 1.0, lineSpacing: 13.75, angle: 45, doubleGap: 0.93 });
  assert.deepEqual(wave.render(l, ctxOf()).primitives, wave.render(l, ctxOf()).primitives);
});

test('period of a horizontal sine is (wavelength, lineSpacing)', () => {
  const p = wave.period(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, angle: 0 }), ctxOf());
  close(p.w, 11.33, 1e-9);
  close(p.h, 8.17, 1e-9);
});

test('period of a vertical wave swaps the roles of wavelength and lineSpacing', () => {
  const p = wave.period(layerOf({ wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, angle: 90 }), ctxOf());
  close(p.w, 8.17, 1e-9);
  close(p.h, 11.33, 1e-9);
});

test('period of a 45 deg wave is null when wavelength and spacing are incommensurate', () => {
  assert.equal(wave.period(layerOf({ wavelength: 8.5, amplitude: 1.0, lineSpacing: 13.75, angle: 45 }), ctxOf()), null);
});

test('period of a 45 deg wave exists when wavelength/spacing are commensurate', () => {
  // a*8*u + b*4*n with a = 1, b = 2 gives (8 + 8) / sqrt2 = 11.3137 horizontally, 0 vertically
  const p = wave.period(layerOf({ wavelength: 8, amplitude: 1.0, lineSpacing: 4, angle: 45 }), ctxOf());
  close(p.w, 16 / Math.SQRT2, 1e-9);
  close(p.h, 16 / Math.SQRT2, 1e-9);
});

test('density 2 halves wavelength, lineSpacing and amplitude (motif density), stroke unchanged', () => {
  const s = {
    schema: 'zc-pattern/1.0.0', id: 'zc:111101002', table: '3-1', names: { ja: 'wave test' },
    provenance: { doc: 'design', section: 'test', measured: false },
    layers: [{ id: 'w', archetype: 'wave', params: { wavelength: 8, amplitude: 1, lineSpacing: 8, lines: 3 } }],
  };
  const r = resolveSpec(s, { density: 2 });
  const p = r.drawSpec.layers[0].params;
  close(p.wavelength, 4, 1e-9);
  close(p.lineSpacing, 4, 1e-9);
  close(p.amplitude, 0.5, 1e-9);
});
