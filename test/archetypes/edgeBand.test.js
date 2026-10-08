import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHETYPE, DENSITY, MOTIF, PARAMS, period, render } from '../../src/archetypes/edgeBand.js';
import { applyDefaults, validateValue } from '../../src/core/schema.js';
import { GeometryError } from '../../src/core/errors.js';
import { circle } from '../../src/core/primitives.js';

const TOL = 1e-9;
// R2 table 3-9 frame: 56.22-56.26 x 28.52 pt; band width 6.92 pt.
const REGION = { x: 0, y: 0, width: 56.24, height: 28.52 };
const BAND = 6.92;

function resolve(input) {
  const out = { errors: [], warnings: [] };
  validateValue(PARAMS, input, '', out);
  assert.deepEqual(out.errors, []);
  return applyDefaults(PARAMS, input);
}

function ctxOf({ region = REGION, origin = 'center', ext = { w: 1.42, h: 1.42 }, prims0 } = {}) {
  const motif = prims0 ?? [circle(0, 0, 0.71, { fill: 'ink' })];
  return {
    region,
    tileMode: 'frame',
    strokeWidth: 0.238,
    origin,
    jitter: 0,
    clip: true,
    rng: null,
    results: {},
    buildMotif: () => motif,
    motifExtent: () => ext,
  };
}

function layerOf(params, id = 'edges') {
  return { id, archetype: ARCHETYPE, motif: { kind: 'dot', d: 1.42 }, params };
}

const BASE = { pitchY: 4.23 };

test('period is the region width by pitchY when the band outline is off, and null when it is on', () => {
  const quiet = layerOf(resolve({ ...BASE, bandFrame: { stroke: 'none' } }));
  assert.deepEqual(period(quiet, ctxOf()), { w: REGION.width, h: 4.23 });
  const outlined = layerOf(resolve(BASE));
  assert.equal(period(outlined, ctxOf()), null);
});

test('module declares the stage-0 contract: name, motif policy, density classes', () => {
  assert.equal(ARCHETYPE, 'edgeBand');
  assert.equal(MOTIF, 'required');
  assert.deepEqual(DENSITY, { params: true, motif: false });
});

test('default layout: both bands, floor(height / pitchY) rows centred, one motif per row per band', () => {
  const res = render(layerOf(resolve(BASE)), ctxOf());
  assert.equal(res.placed, 12);
  assert.equal(res.skipped, 0);
  const left = res.anchors.filter((a) => a.col === 0).sort((p, q) => p.row - q.row);
  const right = res.anchors.filter((a) => a.col === 1).sort((p, q) => p.row - q.row);
  assert.equal(left.length, 6);
  assert.equal(right.length, 6);
  const first = REGION.height / 2 - 2.5 * 4.23;
  for (let k = 0; k < 6; k++) {
    assert.ok(Math.abs(left[k].y - (first + k * 4.23)) < TOL, `row ${k} y`);
    assert.ok(Math.abs(right[k].y - left[k].y) < TOL, 'right band uses the same rows');
  }
  assert.ok(Math.abs(left[0].x - BAND / 2) < TOL);
  assert.ok(Math.abs(right[0].x - (REGION.width - BAND / 2)) < TOL);
});

test('right band is the left band translated by width minus bandWidth', () => {
  const res = render(layerOf(resolve(BASE)), ctxOf());
  const l = res.anchors.find((a) => a.col === 0);
  const r = res.anchors.find((a) => a.col === 1 && a.row === l.row);
  assert.ok(Math.abs((r.x - l.x) - (REGION.width - BAND)) < TOL);
});

test('band ground and outline are two polygons with paper fill and ink stroke, drawn before the motifs', () => {
  const res = render(layerOf(resolve(BASE)), ctxOf());
  const polys = res.primitives.filter((p) => p.type === 'polygon');
  assert.equal(polys.length, 2);
  for (const p of polys) {
    assert.equal(p.style.fill, 'paper');
    assert.equal(p.style.stroke, 'ink');
  }
  const xs = polys.map((p) => [Math.min(...p.points.map((q) => q[0])), Math.max(...p.points.map((q) => q[0]))]);
  assert.ok(Math.abs(xs[0][0]) < TOL && Math.abs(xs[0][1] - BAND) < TOL);
  assert.ok(Math.abs(xs[1][0] - (REGION.width - BAND)) < TOL && Math.abs(xs[1][1] - REGION.width) < TOL);
  assert.equal(res.primitives[0].type, 'polygon');
  assert.equal(res.primitives[1].type, 'polygon');
});

test('sides left draws one band and one motif per row', () => {
  const res = render(layerOf(resolve({ ...BASE, sides: 'left' })), ctxOf());
  assert.equal(res.placed, 6);
  assert.equal(res.primitives.filter((p) => p.type === 'polygon').length, 1);
  assert.ok(res.anchors.every((a) => a.col === 0));
});

test('explicit rows that overflow the region are counted as skipped, not drawn', () => {
  const res = render(layerOf(resolve({ ...BASE, rows: 8, sides: 'left' })), ctxOf());
  assert.equal(res.skipped, 2, 'top and bottom rows overflow');
  assert.equal(res.placed, 6);
});

test('density 2 halves pitchY (doubling the rows) while the band width and the motif stay fixed', () => {
  const res = render(layerOf(resolve({ pitchY: 4.23 / 2, sides: 'left' })), ctxOf());
  assert.equal(res.placed, 13);
  const a = res.anchors[0];
  assert.ok(Math.abs(a.x - BAND / 2) < TOL, 'band width fixed: centre stays at bandWidth / 2');
  for (const p of res.primitives.filter((q) => q.type === 'circle')) assert.ok(Math.abs(p.r - 0.71) < TOL);
});

test('a motif wider than the band warns that it crosses the band edge', () => {
  const res = render(layerOf(resolve({ ...BASE, sides: 'left' })), ctxOf({ ext: { w: 8, h: 1.42 } }));
  assert.ok(res.warnings.some((w) => /wider than the band/.test(w)));
});

test('a motif taller than pitchY warns about overlap between rows', () => {
  const res = render(layerOf(resolve({ ...BASE, sides: 'left' })), ctxOf({ ext: { w: 1.42, h: 5 } }));
  assert.ok(res.warnings.some((w) => /overlap/.test(w)));
});

test('origin {x, y} puts the first row at y and warns that origin.x is ignored when x is not 0', () => {
  const res = render(layerOf(resolve({ ...BASE, sides: 'left' })), ctxOf({ origin: { x: 3, y: 5 } }));
  assert.ok(res.warnings.some((w) => /origin\.x/.test(w)));
  const ys = res.anchors.map((a) => a.y).sort((p, q) => p - q);
  assert.ok(Math.abs(ys[0] - 5) < TOL);
});

test('origin topLeft puts the first row at pitchY / 2', () => {
  const res = render(layerOf(resolve({ ...BASE, sides: 'left' })), ctxOf({ origin: 'topLeft' }));
  const ys = res.anchors.map((a) => a.y).sort((p, q) => p - q);
  assert.ok(Math.abs(ys[0] - 4.23 / 2) < TOL);
});

test('every motif of a band lies inside its band (x between the band edges)', () => {
  const res = render(layerOf(resolve(BASE)), ctxOf());
  for (const a of res.anchors) {
    const [x0, x1] = a.col === 0 ? [0, BAND] : [REGION.width - BAND, REGION.width];
    assert.ok(a.x - 0.71 >= x0 - TOL && a.x + 0.71 <= x1 + TOL, `anchor x ${a.x}`);
  }
});

test('bandWidth wider than half the region with both sides raises a GeometryError', () => {
  assert.throws(() => render(layerOf(resolve({ ...BASE, bandWidth: 30 })), ctxOf()),
    (e) => e instanceof GeometryError && /do not fit/.test(e.message));
});

test('pitchY larger than the region height raises a GeometryError', () => {
  assert.throws(() => render(layerOf(resolve({ pitchY: 40 })), ctxOf()),
    (e) => e instanceof GeometryError && /no row fits/.test(e.message));
});

test('a layout with no motif inside the region raises a GeometryError instead of returning nothing', () => {
  assert.throws(() => render(layerOf(resolve({ pitchY: 4, rows: 1, sides: 'left' })), ctxOf({ origin: { x: 0, y: -50 } })),
    (e) => e instanceof GeometryError && /no motif fits/.test(e.message));
});

test('colours are paint tokens only and the output is deterministic', () => {
  const a = render(layerOf(resolve(BASE)), ctxOf());
  for (const p of a.primitives) {
    assert.ok(['ink', 'paper', 'none'].includes(p.style.stroke));
    assert.ok(['ink', 'paper', 'none'].includes(p.style.fill));
  }
  assert.deepEqual(a, render(layerOf(resolve(BASE)), ctxOf()));
});

test('unknown bandFrame key is rejected by validation with candidates', () => {
  const out = { errors: [], warnings: [] };
  validateValue(PARAMS, { pitchY: 4, bandFrame: { strok: 'ink' } }, '', out);
  assert.equal(out.errors.length, 1);
  assert.ok(out.errors[0].candidates.includes('stroke'));
});
