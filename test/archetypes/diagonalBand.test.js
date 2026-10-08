import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHETYPE, DENSITY, MOTIF, PARAMS, period, render } from '../../src/archetypes/diagonalBand.js';
import { applyDefaults, validateValue } from '../../src/core/schema.js';
import { GeometryError } from '../../src/core/errors.js';
import { circle, line } from '../../src/core/primitives.js';
import { dir, DEG } from '../../src/core/geom.js';

const TOL = 1e-9;
const REGION = { x: 0, y: 0, width: 56.52, height: 28.30 };
const ANGLE = Math.atan2(REGION.height, REGION.width) / DEG; // region diagonal, about 26.57 deg

/** Resolve user params the way core/resolve.js does: validate, then fill defaults. */
function resolve(input) {
  const out = { errors: [], warnings: [] };
  validateValue(PARAMS, input, '', out);
  assert.deepEqual(out.errors, []);
  return applyDefaults(PARAMS, input);
}

/** Motif primitives are built here, not by motif-1, so the archetype is tested alone. */
function dotCtx(region = REGION, { origin = 'center', motifPrims, ext } = {}) {
  const prims0 = motifPrims ?? [circle(0, 0, 0.71, { fill: 'ink' })];
  const extent = ext ?? { w: 1.42, h: 1.42 };
  return {
    region,
    tileMode: 'frame',
    strokeWidth: 0.239,
    origin,
    jitter: 0,
    clip: true,
    rng: null,
    results: {},
    buildMotif: () => prims0,
    motifExtent: () => extent,
  };
}

function layerOf(params, id = 'bands') {
  return { id, archetype: ARCHETYPE, motif: { kind: 'dot', d: 1.42 }, params };
}

/** R3 table 4-3 gravel (礫質): 3 bands, spacing 3.16, along-band pitch 4.74, phase 1/3. */
const GRAVEL = { bands: 3, bandSpacing: 3.16, alongPitch: 4.74, bandPhase: 1 / 3 };

test('period returns null because a diagonal band has no axis-aligned seamless period', () => {
  const layer = layerOf(resolve(GRAVEL));
  assert.equal(period(layer, dotCtx()), null);
});

test('module declares the stage-0 contract: name, motif policy, density classes', () => {
  assert.equal(ARCHETYPE, 'diagonalBand');
  assert.equal(MOTIF, 'required');
  assert.deepEqual(DENSITY, { params: true, motif: true });
});

test('default gravel layout puts band k on the normal offset (k - 1) * bandSpacing', () => {
  const layer = layerOf(resolve(GRAVEL));
  const res = render(layer, dotCtx());
  assert.ok(res.placed > 0);
  const u = dir(ANGLE);
  const n = dir(ANGLE + 90);
  const c = { x: REGION.width / 2, y: REGION.height / 2 };
  for (const a of res.anchors) {
    const off = (a.x - c.x) * n.x + (a.y - c.y) * n.y;
    assert.ok(Math.abs(off - (a.row - 1) * 3.16) < TOL, `row ${a.row} offset ${off}`);
    const along = (a.x - c.x) * u.x + (a.y - c.y) * u.y;
    assert.ok(Math.abs(along - a.col * 4.74 - (a.row - 1) * (1 / 3) * 4.74) < 1e-6, `along ${along}`);
  }
});

test('band centre motif (row 1, col 0) sits exactly on the region centre when bandOffset is 0', () => {
  const res = render(layerOf(resolve(GRAVEL)), dotCtx());
  const a = res.anchors.find((q) => q.row === 1 && q.col === 0);
  assert.ok(a, 'centre motif present');
  assert.ok(Math.abs(a.x - REGION.width / 2) < TOL && Math.abs(a.y - REGION.height / 2) < TOL);
});

test('consecutive motifs in one band are one alongPitch apart along the band direction', () => {
  const res = render(layerOf(resolve(GRAVEL)), dotCtx());
  const row = res.anchors.filter((q) => q.row === 0).sort((p, q) => p.col - q.col);
  assert.ok(row.length >= 2);
  for (let i = 1; i < row.length; i++) {
    assert.equal(row[i].col - row[i - 1].col, 1);
    const d = Math.hypot(row[i].x - row[i - 1].x, row[i].y - row[i - 1].y);
    assert.ok(Math.abs(d - 4.74) < TOL, `pitch ${d}`);
  }
});

test('edgeMode whole counts motifs that straddle the edge as skipped and keeps all drawn ones inside', () => {
  const res = render(layerOf(resolve({ ...GRAVEL, edgeMode: 'whole' })), dotCtx());
  assert.ok(res.skipped > 0, 'some straddling motifs are counted');
  assert.ok(res.placed > 0);
  for (const p of res.primitives) {
    assert.ok(p.cx - p.r >= -TOL && p.cx + p.r <= REGION.width + TOL, `x inside: ${p.cx}`);
    assert.ok(p.cy - p.r >= -TOL && p.cy + p.r <= REGION.height + TOL, `y inside: ${p.cy}`);
  }
});

test('edgeMode auto clips line motifs: a line crossing the edge is kept, nothing is skipped', () => {
  const hline = [line(-0.7, 0, 0.7, 0, { stroke: 'ink' })];
  const res = render(layerOf(resolve(GRAVEL)), dotCtx(REGION, { motifPrims: hline, ext: { w: 1.4, h: 0 } }));
  assert.equal(res.skipped, 0);
  assert.ok(res.placed > 0);
});

test('elementAngle band rotates a line motif parallel to the band (slope -H/W in y-down coordinates)', () => {
  const hline = [line(-0.7, 0, 0.7, 0, { stroke: 'ink' })];
  const res = render(layerOf(resolve(GRAVEL)), dotCtx(REGION, { motifPrims: hline, ext: { w: 1.4, h: 0 } }));
  const p = res.primitives[0];
  const slope = (p.y2 - p.y1) / (p.x2 - p.x1);
  assert.ok(Math.abs(slope + REGION.height / REGION.width) < 1e-9, `slope ${slope}`);
});

test('elementAngle 0 keeps a line motif horizontal', () => {
  const hline = [line(-0.7, 0, 0.7, 0, { stroke: 'ink' })];
  const res = render(layerOf(resolve({ ...GRAVEL, elementAngle: 0 })), dotCtx(REGION, { motifPrims: hline, ext: { w: 1.4, h: 0 } }));
  for (const p of res.primitives) assert.equal(p.y1, p.y2);
});

test('density 2 halves the along-band pitch and the band spacing and leaves the motif size unchanged', () => {
  const half = { bands: 3, bandSpacing: 1.58, alongPitch: 2.37, bandPhase: 1 / 3 };
  const res = render(layerOf(resolve(half)), dotCtx());
  const row = res.anchors.filter((q) => q.row === 0).sort((p, q) => p.col - q.col);
  const d = Math.hypot(row[1].x - row[0].x, row[1].y - row[0].y);
  assert.ok(Math.abs(d - 2.37) < TOL, `pitch ${d}`);
  const u = dir(ANGLE);
  const n = dir(ANGLE + 90);
  const c = { x: REGION.width / 2, y: REGION.height / 2 };
  const a = res.anchors.find((q) => q.row === 2 && q.col === 0);
  const off = (a.x - c.x) * n.x + (a.y - c.y) * n.y;
  assert.ok(Math.abs(off - 1.58) < TOL, `spacing ${off}`);
  assert.ok(Math.abs((a.x - c.x) * u.x + (a.y - c.y) * u.y - (1 / 3) * 2.37) < 1e-6);
  for (const p of res.primitives) assert.ok(Math.abs(p.r - 0.71) < TOL, 'radius unchanged');
});

test('bandOffset moves the band centre along the normal (positive = upper-left)', () => {
  const res = render(layerOf(resolve({ ...GRAVEL, bandOffset: 0.65 })), dotCtx());
  const a = res.anchors.find((q) => q.row === 1 && q.col === 0);
  const n = dir(ANGLE + 90);
  const off = (a.x - REGION.width / 2) * n.x + (a.y - REGION.height / 2) * n.y;
  assert.ok(Math.abs(off - 0.65) < TOL, `offset ${off}`);
});

test('bandShift places band k at base + (k - (bands-1)/2) * bandShift', () => {
  const organic = { bands: 2, bandShift: { x: 2.83, y: 2.85 }, step: { x: 5.65, y: -2.83 } };
  const res = render(layerOf(resolve(organic)), dotCtx());
  const a0 = res.anchors.find((q) => q.row === 0 && q.col === 0);
  const a1 = res.anchors.find((q) => q.row === 1 && q.col === 0);
  assert.ok(Math.abs((a1.x - a0.x) - 2.83) < TOL && Math.abs((a1.y - a0.y) - 2.85) < TOL);
  const row = res.anchors.filter((q) => q.row === 0).sort((p, q) => p.col - q.col);
  assert.ok(Math.abs((row[1].x - row[0].x) - 5.65) < TOL && Math.abs((row[1].y - row[0].y) + 2.83) < TOL);
});

test('circles 2.83 pt across do not trigger a band overlap warning at bandSpacing 3.16 (exact projection)', () => {
  const res = render(layerOf(resolve(GRAVEL)), dotCtx(REGION, { motifPrims: [circle(0, 0, 1.415, { fill: 'paper' })], ext: { w: 2.83, h: 2.83 } }));
  assert.deepEqual(res.warnings, []);
});

test('circles 2.83 pt across warn about band overlap when bandSpacing is 2.5', () => {
  const res = render(layerOf(resolve({ ...GRAVEL, bandSpacing: 2.5 })), dotCtx(REGION, { motifPrims: [circle(0, 0, 1.415, { fill: 'paper' })], ext: { w: 2.83, h: 2.83 } }));
  assert.ok(res.warnings.some((w) => /bands overlap/.test(w)));
});

test('step overrides alongPitch and says so in the warnings', () => {
  const res = render(layerOf(resolve({ bands: 1, step: { x: 7.07, y: -2.83 }, alongPitch: 4 })), dotCtx());
  assert.equal(res.warnings.length, 1);
  assert.match(res.warnings[0], /step and alongPitch/);
  const row = res.anchors.filter((q) => q.row === 0).sort((p, q) => p.col - q.col);
  assert.ok(Math.abs((row[1].x - row[0].x) - 7.07) < TOL);
});

test('default angle is the region diagonal, with the band passing through the region centre', () => {
  const res = render(layerOf(resolve({ bands: 1, alongPitch: 4.74 })), dotCtx());
  const a = res.anchors.find((q) => q.col === 0);
  assert.ok(Math.abs(a.x - REGION.width / 2) < TOL && Math.abs(a.y - REGION.height / 2) < TOL);
});

test('every primitive colour is a paint token (ink, paper or none)', () => {
  const res = render(layerOf(resolve(GRAVEL)), dotCtx());
  for (const p of res.primitives) {
    assert.ok(['ink', 'paper', 'none'].includes(p.style.stroke));
    assert.ok(['ink', 'paper', 'none'].includes(p.style.fill));
  }
});

test('render is deterministic: the same input gives the same output', () => {
  const a = render(layerOf(resolve(GRAVEL)), dotCtx());
  const b = render(layerOf(resolve(GRAVEL)), dotCtx());
  assert.deepEqual(a, b);
});

test('bands > 1 without bandSpacing or bandShift raises a GeometryError naming bandSpacing', () => {
  assert.throws(() => render(layerOf({ bands: 3, alongPitch: 4.74, bandPhase: 0, angle: null, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto' }), dotCtx()),
    (e) => e instanceof GeometryError && /bandSpacing/.test(e.message));
});

test('bandShift together with bandSpacing raises a GeometryError (give only one)', () => {
  const p = { bands: 2, bandSpacing: 3, bandShift: { x: 2.83, y: 2.85 }, step: { x: 5.65, y: -2.83 }, bandPhase: 0, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto', angle: null };
  assert.throws(() => render(layerOf(p), dotCtx()), (e) => e instanceof GeometryError && /both given/.test(e.message));
});

test('bandShift together with bandPhase raises a GeometryError', () => {
  const p = { bands: 2, bandShift: { x: 2.83, y: 2.85 }, step: { x: 5.65, y: -2.83 }, bandPhase: 0.5, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto', angle: null };
  assert.throws(() => render(layerOf(p), dotCtx()), (e) => e instanceof GeometryError && /bandPhase/.test(e.message));
});

test('no step and no alongPitch raises a GeometryError', () => {
  assert.throws(() => render(layerOf({ bands: 1, bandOffset: 0, bandPhase: 0, elementAngle: 'band', edgeMode: 'auto', angle: null }), dotCtx()),
    (e) => e instanceof GeometryError && /step or alongPitch/.test(e.message));
});

test("origin 'topLeft' raises a GeometryError (not defined for a diagonal band)", () => {
  assert.throws(() => render(layerOf(resolve(GRAVEL)), dotCtx(REGION, { origin: 'topLeft' })),
    (e) => e instanceof GeometryError && /topLeft/.test(e.message));
});

test('a band that misses the region raises a GeometryError instead of returning nothing', () => {
  assert.throws(() => render(layerOf(resolve({ bands: 1, alongPitch: 4.74, bandOffset: 500 })), dotCtx()),
    (e) => e instanceof GeometryError && /no motif falls in the region/.test(e.message));
});

test('a layer without a motif raises a GeometryError', () => {
  assert.throws(() => render({ id: 'bands', archetype: ARCHETYPE, params: resolve(GRAVEL) }, dotCtx()), GeometryError);
});

test('unknown parameter keys are rejected by validation with a candidate list', () => {
  const out = { errors: [], warnings: [] };
  validateValue(PARAMS, { bands: 1, alongPitch: 4, bandSpacng: 3 }, '', out);
  assert.equal(out.errors.length, 1);
  assert.match(out.errors[0].message, /unknown key/);
  assert.ok(out.errors[0].candidates.includes('bandSpacing'));
});

// ---------------------------------------------------------------------------
// Uneven steps (hand-placed originals) and edgeMode 'trim'
// ---------------------------------------------------------------------------

/** Two alternating steps (the R3 volcanic-ash-bearing kind of unevenness: dy -3.40 and -3.96). */
const UNEVEN = [{ x: 7.07, y: -3.40 }, { x: 7.07, y: -3.96 }];

test('steps places motif j at base + the sum of the first j steps, cycling the list', () => {
  const res = render(layerOf(resolve({ bands: 1, steps: [UNEVEN] })), dotCtx());
  const c = { x: REGION.width / 2, y: REGION.height / 2 };
  const at = (j) => res.anchors.find((q) => q.col === j);
  assert.ok(Math.abs(at(0).x - c.x) < TOL && Math.abs(at(0).y - c.y) < TOL);
  assert.ok(Math.abs(at(1).y - (c.y - 3.40)) < TOL);
  assert.ok(Math.abs(at(2).y - (c.y - 3.40 - 3.96)) < TOL);
  assert.ok(Math.abs(at(2).x - (c.x + 2 * 7.07)) < TOL);
});

test('steps walks backwards from j = -1 with the list read from its end', () => {
  const res = render(layerOf(resolve({ bands: 1, steps: [UNEVEN] })), dotCtx());
  const c = { x: REGION.width / 2, y: REGION.height / 2 };
  const m1 = res.anchors.find((q) => q.col === -1);
  const m2 = res.anchors.find((q) => q.col === -2);
  assert.ok(Math.abs(m1.y - (c.y + 3.96)) < TOL, `j -1 uses the last step: ${m1.y}`);
  assert.ok(Math.abs(m2.y - (c.y + 3.96 + 3.40)) < TOL);
  assert.ok(Math.abs(m2.x - (c.x - 2 * 7.07)) < TOL);
});

test('steps with one list per band gives each band its own sequence', () => {
  const p = { bands: 2, bandSpacing: 4, steps: [[{ x: 5, y: -2.5 }], [{ x: 6, y: -3 }]] };
  const res = render(layerOf(resolve(p)), dotCtx());
  for (const [row, dx] of [[0, 5], [1, 6]]) {
    const r = res.anchors.filter((q) => q.row === row).sort((a, b) => a.col - b.col);
    assert.ok(r.length >= 2);
    for (let i = 1; i < r.length; i++) assert.ok(Math.abs(r[i].x - r[i - 1].x - dx) < TOL);
  }
});

test('steps covers the region: every motif touching the region is drawn and none is missed', () => {
  const res = render(layerOf(resolve({ bands: 1, steps: [UNEVEN], edgeMode: 'clip' })), dotCtx());
  const cols = res.anchors.map((q) => q.col).sort((a, b) => a - b);
  for (let i = 1; i < cols.length; i++) assert.equal(cols[i] - cols[i - 1], 1, 'contiguous columns');
  const first = res.anchors.find((q) => q.col === cols[0]);
  const last = res.anchors.find((q) => q.col === cols[cols.length - 1]);
  // the next motif beyond either end would not touch the region (clip mode keeps anything touching it)
  const mod = (j) => ((j % 2) + 2) % 2;
  const before = UNEVEN[mod(first.col - 1)];
  const after = UNEVEN[mod(last.col)];
  const misses = (x, y) => x + 0.71 < 0 || x - 0.71 > REGION.width || y + 0.71 < 0 || y - 0.71 > REGION.height;
  assert.ok(misses(first.x - before.x, first.y - before.y), 'motif before the first is outside');
  assert.ok(misses(last.x + after.x, last.y + after.y), 'motif after the last is outside');
});

test('the steps descriptor is in the length density class (pt, scaled by 1/density)', () => {
  const v = PARAMS.fields.steps.items.items;
  assert.equal(v.fields.x.density, 'length');
  assert.equal(v.fields.y.density, 'length');
  assert.equal(v.fields.x.unit, 'pt');
});

test('steps together with step raises a GeometryError (give only steps)', () => {
  const p = { bands: 1, steps: [UNEVEN], step: { x: 7, y: -3 }, bandPhase: 0, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto', angle: null };
  assert.throws(() => render(layerOf(p), dotCtx()), (e) => e instanceof GeometryError && /give only steps/.test(e.message));
});

test('steps together with a non-zero bandPhase raises a GeometryError', () => {
  const p = { bands: 2, bandSpacing: 3, steps: [UNEVEN], bandPhase: 0.5, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto', angle: null };
  assert.throws(() => render(layerOf(p), dotCtx()), (e) => e instanceof GeometryError && /bandPhase/.test(e.message));
});

test('a steps list count other than 1 or bands raises a GeometryError naming the count', () => {
  const p = { bands: 3, bandSpacing: 3, steps: [UNEVEN, UNEVEN], bandPhase: 0, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto', angle: null };
  assert.throws(() => render(layerOf(p), dotCtx()), (e) => e instanceof GeometryError && /one list per band \(3\), got 2/.test(e.message));
});

test('a step that runs backwards along the band raises a GeometryError', () => {
  const p = { bands: 1, steps: [[{ x: 7, y: -3 }, { x: 7, y: -3 }, { x: -2, y: 1 }]], bandPhase: 0, bandOffset: 0, elementAngle: 'band', edgeMode: 'auto', angle: null };
  assert.throws(() => render(layerOf(p), dotCtx()), (e) => e instanceof GeometryError && /runs backwards/.test(e.message));
});

/** R3 table 4-3 silty: dashes 9.69 pt parallel to the band. */
function dashCtx(style = { stroke: 'ink' }) {
  const seg = [line(-4.845, 0, 4.845, 0, style)];
  return dotCtx(REGION, { motifPrims: seg, ext: { w: 9.69, h: 0 } });
}
const SILTY = { bands: 3, bandShift: { x: 1.241, y: 2.209 }, step: { x: 11.329, y: -5.671 } };

test("edgeMode trim cuts line motifs at the region: every endpoint lies inside, same instances as 'clip'", () => {
  const clip = render(layerOf(resolve({ ...SILTY, edgeMode: 'clip' })), dashCtx());
  const trim = render(layerOf(resolve({ ...SILTY, edgeMode: 'trim' })), dashCtx());
  assert.equal(trim.placed, clip.placed);
  assert.equal(trim.skipped, clip.skipped);
  let shortened = 0;
  for (const p of trim.primitives) {
    for (const [x, y] of [[p.x1, p.y1], [p.x2, p.y2]]) {
      assert.ok(x >= -TOL && x <= REGION.width + TOL && y >= -TOL && y <= REGION.height + TOL, `endpoint (${x}, ${y})`);
    }
    if (Math.hypot(p.x2 - p.x1, p.y2 - p.y1) < 9.69 - 1e-6) shortened += 1;
  }
  assert.ok(shortened > 0, 'the edge dashes are shortened');
});

test('edgeMode trim keeps interior dashes exactly as clip draws them', () => {
  const clip = render(layerOf(resolve({ ...SILTY, edgeMode: 'clip' })), dashCtx());
  const trim = render(layerOf(resolve({ ...SILTY, edgeMode: 'trim' })), dashCtx());
  const inside = (p) => [p.x1, p.x2].every((x) => x >= 0 && x <= REGION.width) && [p.y1, p.y2].every((y) => y >= 0 && y <= REGION.height);
  const a = clip.primitives.filter(inside);
  const b = trim.primitives.filter((p) => Math.abs(Math.hypot(p.x2 - p.x1, p.y2 - p.y1) - 9.69) < 1e-9);
  assert.deepEqual(b, a);
});

test('edgeMode trim advances the dash offset by the length cut from the start of a dashed line', () => {
  const ctx = dotCtx(REGION, { motifPrims: [line(-4, 0, 4, 0, { stroke: 'ink', dash: [1, 1] })], ext: { w: 8, h: 0 } });
  const p = { bands: 1, angle: 0, alongPitch: 20, elementAngle: 0, edgeMode: 'trim' };
  const res = render(layerOf(resolve(p)), { ...ctx, origin: { x: 1, y: 10 } });
  const cut = res.primitives.find((q) => q.y1 === 10 && Math.abs(q.x1) < TOL);
  assert.ok(cut, 'the line crossing x = 0 is present and starts on the edge');
  assert.ok(Math.abs(cut.style.dashOffset - 3) < TOL, `dashOffset ${cut.style.dashOffset}`);
});

test('edgeMode trim on a closed motif raises a GeometryError naming the primitive type', () => {
  const ctx = dotCtx(REGION, { motifPrims: [circle(0, 0, 1.415, { fill: 'paper' })], ext: { w: 2.83, h: 2.83 } });
  assert.throws(() => render(layerOf(resolve({ ...GRAVEL, edgeMode: 'trim' })), ctx),
    (e) => e instanceof GeometryError && /trim/.test(e.message) && /circle/.test(e.message));
});
