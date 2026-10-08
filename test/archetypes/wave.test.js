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

// ---------------------------------------------------------------------------
// stage 3: phaseStep, chords, ends 'halfWave'
// ---------------------------------------------------------------------------

/** Point of a polyline nearest to x (horizontal waves). */
const atX = (pts, x) => pts.reduce((best, p) => (Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best));
const MID = FRAME.height / 2;
const CX = FRAME.width / 2;

test('phaseStep 0 is the default and leaves the output unchanged', () => {
  const base = { wavelength: 8.5, amplitude: 1.0, lineSpacing: 9.7, angle: 44.6, doubleGap: 0.95, phase: 0.69 };
  assert.deepEqual(wave.render(layerOf(base), ctxOf()).primitives, wave.render(layerOf({ ...base, phaseStep: 0 }), ctxOf()).primitives);
});

test('phaseStep adds k x phaseStep to the phase of line k (k = normal offset / lineSpacing)', () => {
  const r = wave.render(layerOf({ wavelength: 10, amplitude: 1, lineSpacing: 8, angle: 0, phaseStep: 0.25 }), ctxOf());
  const byLine = (q) => polylines(r).find((p) => Math.abs(atX(p.points, CX)[1] - (MID + q)) < 1.5);
  close(atX(byLine(0).points, CX)[1], MID, 0.01, 'k = 0: phase 0, zero crossing at R');
  close(atX(byLine(8).points, CX)[1], MID + 8 + 1, 0.01, 'k = 1: phase 0.25, +A along n (down)');
  close(atX(byLine(-8).points, CX)[1], MID - 8 - 1, 0.01, 'k = -1: phase -0.25, -A');
});

test('phaseStep with an explicit centred line count uses half-integer k for an even count', () => {
  const r = wave.render(layerOf({ wavelength: 10, amplitude: 1, lineSpacing: 8, angle: 0, lines: 2, phaseStep: 0.25 }), ctxOf());
  const ys = polylines(r).map((p) => atX(p.points, CX)[1]).sort((a, b) => a - b);
  // k = -0.5: sin(2 pi (-0.125)) = -0.7071; k = +0.5: +0.7071
  close(ys[0], MID - 4 - Math.SQRT1_2, 0.01);
  close(ys[1], MID + 4 + Math.SQRT1_2, 0.01);
});

test('period with phaseStep follows the sheared lattice (wavelength u, lineSpacing n - phaseStep wavelength u)', () => {
  // vectors (10, 0) and (-5, 5): (0, 10) = 2 * (-5, 5) + (10, 0)
  const p = wave.period(layerOf({ wavelength: 10, amplitude: 1, lineSpacing: 5, angle: 0, phaseStep: 0.5 }), ctxOf());
  close(p.w, 10, 1e-9);
  close(p.h, 10, 1e-9);
});

test('a phaseStep that brings neighbouring lines together is warned', () => {
  // s = 2.2, A = 1, phaseStep 0.5: the neighbouring line is in antiphase, closest approach 2.2 - 2 = 0.2 pt
  const r = wave.render(layerOf({ wavelength: 40, amplitude: 1, lineSpacing: 2.2, lines: 3, phaseStep: 0.5 }, 'step'), ctxOf());
  assert.ok(r.warnings.some((w) => /layer step: wave lines come within/.test(w)));
  const r0 = wave.render(layerOf({ wavelength: 40, amplitude: 1, lineSpacing: 2.2, lines: 3 }, 'step'), ctxOf());
  assert.deepEqual(r0.warnings, [], 'the same spacing in phase does not warn');
});

test('chords draws the sine as straight chords between samples at phase multiples of 1/(2 chords)', () => {
  const r = wave.render(layerOf({ wavelength: 10, amplitude: 1, lineSpacing: 8, lines: 1, chords: 5 }), ctxOf());
  const pts = polylines(r)[0].points;
  const inner = pts.slice(1, -1); // the clipped end points lie on the region edge
  for (let i = 1; i < inner.length; i++) close(inner[i][0] - inner[i - 1][0], 1, 1e-9, 'vertex spacing wavelength / 10');
  const offs = inner.map((p) => Math.abs(p[1] - MID));
  close(Math.max(...offs), Math.sin((2 * Math.PI) / 5), 1e-9, 'top vertices at A sin(72 deg)');
  assert.ok(offs.some((o) => Math.abs(o - Math.sin(Math.PI / 5)) < 1e-9), 'side vertices at A sin(36 deg)');
  assert.ok(offs.some((o) => o < 1e-9), 'a vertex at every zero crossing');
});

test('chords on the trapezoid throws GeometryError naming the waveform', () => {
  assert.throws(
    () => wave.render(layerOf({ wavelength: 19.6, amplitude: 1.445, lineSpacing: 7.06, waveform: 'trapezoid', rampDx: 2.85, chords: 4 }), ctxOf()),
    (e) => e instanceof GeometryError && /chords 4 applies to waveform 'sine' only/.test(e.message),
  );
});

test("ends 'halfWave' keeps only whole half waves inside the inset; 'clip' runs to the inset edge", () => {
  // zero crossing at x = 3.0: phase = (CX - 3.0) / 10 mod 1; inset x 2 .. 54.03
  const params = { wavelength: 10, amplitude: 1, lineSpacing: 8, lines: 1, margin: 2, phase: ((CX - 3.0) / 10) % 1 };
  const clipped = polylines(wave.render(layerOf(params), ctxOf()))[0].points;
  close(clipped[0][0], 2, 1e-9);
  close(clipped.at(-1)[0], FRAME.width - 2, 1e-9);
  const r = wave.render(layerOf({ ...params, ends: 'halfWave' }), ctxOf());
  assert.equal(polylines(r).length, 1, 'consecutive half waves form one polyline');
  const pts = polylines(r)[0].points;
  close(pts[0][0], 3.0, 1e-9, 'starts at the first zero crossing inside');
  close(pts.at(-1)[0], 53.0, 1e-9, 'ends at the last zero crossing inside (3 + 10 half waves)');
  close(pts[0][1], MID, 1e-9);
  close(pts.at(-1)[1], MID, 1e-9);
});

test('endSlack lets a half wave overrun the inset by that much; the overrun is clipped', () => {
  // zero crossing at x = 2.1, inset starts at x = 2.2: the first half wave overruns by 0.1 pt
  const params = { wavelength: 10, amplitude: 1, lineSpacing: 8, lines: 1, margin: 2.2, phase: ((CX - 2.1) / 10) % 1, ends: 'halfWave' };
  close(polylines(wave.render(layerOf(params), ctxOf()))[0].points[0][0], 7.1, 1e-9, 'slack 0 drops the overrunning half wave');
  close(polylines(wave.render(layerOf({ ...params, endSlack: 0.2 }), ctxOf()))[0].points[0][0], 2.2, 1e-9, 'slack 0.2 keeps it, clipped at the inset');
});

test("ends 'halfWave' on the trapezoid cuts at the mid-ramp zero crossings", () => {
  const r = wave.render(layerOf({ wavelength: 19.6, amplitude: 1.445, lineSpacing: 7.06, waveform: 'trapezoid', rampDx: 2.85, lines: 1, ends: 'halfWave' }), ctxOf());
  for (const p of polylines(r)) {
    close(p.points[0][1], MID, 1e-9, 'run starts on the centre line');
    close(p.points.at(-1)[1], MID, 1e-9, 'run ends on the centre line');
  }
});

test('doubleGap with ends halfWave: both curves of a pair are cut to whole half waves', () => {
  const r = wave.render(layerOf({ wavelength: 8.5, amplitude: 1.0, lineSpacing: 9.7, angle: 44.6, doubleGap: 0.95, lines: 3, phaseStep: 0.85, ends: 'halfWave', endSlack: 0.5 }), ctxOf());
  assert.equal(r.placed, 3);
  assert.equal(r.skipped, 0);
  assert.ok(polylines(r).length >= 6);
});
