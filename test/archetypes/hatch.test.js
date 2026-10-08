import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as hatch from '../../src/archetypes/hatch.js';
import { validatePrimitive } from '../../src/core/primitives.js';
import { applyDefaults, validateValue } from '../../src/core/schema.js';
import { layerFactors, resolveScales, scaleByDescriptor } from '../../src/core/density.js';
import { GeometryError } from '../../src/core/errors.js';
import { FRAMES } from '../../src/core/defaults.js';

const TOL = 1e-6;
const REGION = { x: 0, y: 0, width: FRAMES.rock.width, height: FRAMES.rock.height };
const STROKE = 0.239;
const CX = REGION.width / 2;
const CY = REGION.height / 2;

/** Validate, fill defaults and apply density, as resolve.js does for one layer. */
function resolveLayer(params, density = 1) {
  const out = { errors: [], warnings: [] };
  validateValue(hatch.PARAMS, params, '', out, {});
  if (out.errors.length) throw new Error(out.errors.map((e) => e.message).join('; '));
  const filled = applyDefaults(hatch.PARAMS, params);
  const f = layerFactors(resolveScales({ density }), hatch, 1);
  return { id: 'hatching', archetype: 'hatch', params: scaleByDescriptor(hatch.PARAMS, filled, f.params, {}) };
}

function ctxFor(overrides = {}) {
  return {
    region: { ...REGION },
    tileMode: 'frame',
    strokeWidth: STROKE,
    origin: 'center',
    jitter: 0,
    clip: true,
    rng: null,
    results: {},
    buildMotif: () => { throw new Error('hatch takes no motif'); },
    motifExtent: () => { throw new Error('hatch takes no motif'); },
    ...overrides,
  };
}

function draw(params, ctxOverrides = {}, density = 1) {
  return hatch.render(resolveLayer(params, density), ctxFor(ctxOverrides));
}

const isHoriz = (p) => Math.abs(p.y1 - p.y2) < TOL;
const yOf = (p) => (p.y1 + p.y2) / 2;

test('default: 7 horizontal solid lines at the expected heights through the region centre', () => {
  const r = draw({ spacing: 4.24 });
  const ys = r.primitives.map((p) => p.y1).sort((a, b) => a - b);
  // k = -3..3: CY + k * 4.24; k = -4 (CY - 16.96) and k = +4 (CY + 16.96) are outside the region.
  assert.equal(ys.length, 7);
  for (const [i, k] of [-3, -2, -1, 0, 1, 2, 3].entries()) assert.ok(Math.abs(ys[i] - (CY + k * 4.24)) < TOL);
  assert.equal(r.placed, 7);
  assert.equal(r.skipped, 0);
  for (const p of r.primitives) {
    assert.ok(isHoriz(p));
    assert.ok(Math.abs(p.x1) < TOL && Math.abs(p.x2 - REGION.width) < TOL, 'line spans the full width');
  }
});

test('spacing is perpendicular: at 45 degrees the horizontal intercept is spacing * sqrt(2)', () => {
  const r = draw({ spacing: 4.24, angle: 45 });
  const lines = r.primitives.filter((p) => p.type === 'line');
  assert.ok(lines.length > 2);
  // Intercepts along the bottom edge (y = 0 or the lowest visible point): compare the x of the line's
  // crossing with y = CY on successive lines.
  const crossings = lines.map((p) => {
    const t = (CY - p.y1) / (p.y2 - p.y1);
    return p.x1 + t * (p.x2 - p.x1);
  });
  const xs = [...new Set(crossings.map((x) => x.toFixed(6)))].map(Number).sort((a, b) => a - b);
  assert.ok(xs.length >= 2);
  assert.ok(Math.abs((xs[1] - xs[0]) - 4.24 * Math.SQRT2) < 1e-5, `horizontal intercept ${xs[1] - xs[0]}`);
});

test('every line of an angle-45 family has slope -1 on screen (dy = -dx)', () => {
  const r = draw({ spacing: 4.24, angle: 45 });
  assert.ok(r.primitives.length > 0);
  for (const p of r.primitives) {
    assert.ok(Math.abs(Math.abs(p.y2 - p.y1) - Math.abs(p.x2 - p.x1)) < TOL);
    assert.ok((p.x2 - p.x1) * (p.y2 - p.y1) < 0, 'slope is negative on screen');
  }
});

test('margin: lines start and end at the inset edges; with no margin they touch the region edges', () => {
  const m = draw({ spacing: 4.24, margin: { left: 2.85, right: 2.61, top: 2.82, bottom: 2.82 } });
  for (const p of m.primitives) {
    assert.ok(Math.abs(p.x1 - 2.85) < TOL && Math.abs(p.x2 - (REGION.width - 2.61)) < TOL);
    assert.ok(yOf(p) > 2.82 - TOL && yOf(p) < REGION.height - 2.82 + TOL);
  }
  const none = draw({ spacing: 4.24 });
  assert.ok(none.primitives.some((p) => Math.abs(p.x1) < TOL));
  // A number applies to all four sides.
  const same = draw({ spacing: 4.24, margin: 2 });
  for (const p of same.primitives) assert.ok(Math.abs(p.x1 - 2) < TOL);
});

test('margin larger than the region throws GeometryError', () => {
  assert.throws(() => draw({ spacing: 4.24, margin: 20 }), GeometryError);
});

test('dashed cycle: a dashed line becomes dashes of length dash with gaps of length gap', () => {
  const r = draw({ spacing: 4.24, cycle: ['dashed'], dash: 5.7, gap: 2.75 });
  const dashes = r.primitives.filter((p) => isHoriz(p) && Math.abs(p.x2 - p.x1) > TOL);
  assert.ok(dashes.length > 0);
  const interior = dashes.filter((p) => p.x1 > TOL && p.x2 < REGION.width - TOL);
  for (const p of interior) assert.ok(Math.abs((p.x2 - p.x1) - 5.7) < TOL, `dash length ${p.x2 - p.x1}`);
  const sameLine = interior.filter((p) => Math.abs(yOf(p) - CY) < TOL).map((p) => p.x1).sort((a, b) => a - b);
  assert.ok(sameLine.length >= 2);
  assert.ok(Math.abs((sameLine[1] - sameLine[0]) - 8.45) < TOL, 'dash period 8.45 pt (5.70 + 2.75) on one line');
});

test('dashes of all dashed lines share one phase (foot of the anchor), so their starts are congruent mod the period', () => {
  const r = draw({ spacing: 4.24, cycle: ['dashed'], dash: 5.7, gap: 2.75 });
  const period = 8.45;
  const starts = r.primitives.filter((p) => Math.abs(p.x2 - p.x1) > TOL && p.x1 > TOL).map((p) => p.x1);
  assert.ok(starts.length > 0);
  for (const x of starts) {
    const rel = (x - CX) / period;
    assert.ok(Math.abs(rel - Math.round(rel)) * period < 1e-5, `dash start ${x} off the common phase`);
  }
});

test('cycle [dashed, solid]: line 0 (through the centre) is dashed, line 1 is a single solid line', () => {
  const r = draw({ spacing: 4.24, cycle: ['dashed', 'solid'], dash: 5.7, gap: 2.75 });
  const at = (k) => r.primitives.filter((p) => Math.abs(yOf(p) - (CY + k * 4.24)) < TOL);
  assert.ok(at(0).length > 1, 'line 0 is broken into dashes');
  const line1 = at(1);
  assert.equal(line1.length, 1);
  assert.ok(Math.abs(line1[0].x1) < TOL && Math.abs(line1[0].x2 - REGION.width) < TOL);
});

test('dash and gap are required when the cycle contains dashed', () => {
  assert.throws(() => draw({ spacing: 4.24, cycle: ['dashed'] }), (e) => e instanceof GeometryError && /dash and gap/.test(e.message));
});

test('dash/gap given without a dashed style is reported as ignored', () => {
  const r = draw({ spacing: 4.24, dash: 5, gap: 2 });
  assert.ok(r.warnings.some((w) => /dash\/gap ignored/.test(w)));
});

test('two directions in one layer draw both families (angle [45, 135])', () => {
  const r = draw({ spacing: 4.24, angle: [45, 135] });
  const up = r.primitives.filter((p) => (p.x2 - p.x1) * (p.y2 - p.y1) < 0);
  const down = r.primitives.filter((p) => (p.x2 - p.x1) * (p.y2 - p.y1) > 0);
  assert.ok(up.length > 0 && down.length > 0, 'lines of both slopes present');
  const single = draw({ spacing: 4.24, angle: 45 });
  assert.equal(up.length, single.placed);
  assert.equal(r.placed, single.placed * 2);
});

test('offset moves the family perpendicular to the lines; the lowest line is CY + offset - 3 * spacing', () => {
  const r = draw({ spacing: 4.24, offset: 1 });
  const ys = r.primitives.map(yOf).sort((a, b) => a - b);
  assert.equal(ys.length, 7);
  assert.ok(Math.abs(ys[0] - (CY + 1 - 3 * 4.24)) < TOL, `lowest line at ${ys[0]}`);
  assert.ok(ys.some((y) => Math.abs(y - (CY + 1)) < TOL));
});

test('origin topLeft anchors the first line at the top-left corner', () => {
  const r = draw({ spacing: 4.24 }, { origin: 'topLeft' });
  assert.ok(r.primitives.some((p) => Math.abs(yOf(p)) < TOL));
});

test('every primitive is valid, uses only the ink token and placed + skipped counts the candidate lines', () => {
  const r = draw({ spacing: 4.24, angle: [30, 120], cycle: ['dashed', 'solid'], dash: 5.7, gap: 2.75, margin: 1 });
  for (const p of r.primitives) {
    validatePrimitive(p);
    assert.equal(p.style.stroke, 'ink');
    assert.equal(p.style.fill, 'none');
  }
  assert.ok(r.placed > 0);
  assert.ok(Number.isInteger(r.skipped) && r.skipped >= 0);
});

test('a spacing below the stroke width is reported as a warning', () => {
  const r = draw({ spacing: 0.1 });
  assert.ok(r.warnings.some((w) => /spacing/.test(w) && /merge/.test(w)));
});

test('density 2 halves the spacing and doubles the line count; the stroke width is not scaled', () => {
  const r1 = draw({ spacing: 4.24 }, {}, 1);
  const r2 = draw({ spacing: 4.24 }, {}, 2);
  const ys = (r) => [...new Set(r.primitives.map((p) => yOf(p).toFixed(6)))].map(Number).sort((a, b) => a - b);
  assert.ok(Math.abs((ys(r2)[1] - ys(r2)[0]) - 2.12) < TOL);
  // k = -3..3 at 4.24 (7 lines); k = -6..6 at 2.12 (13 lines): |k| * spacing <= CY = 14.205.
  assert.equal(r1.placed, 7);
  assert.equal(r2.placed, 13);
});

test('period: solid horizontal lines repeat every spacing in y and any x (tile is spacing square)', () => {
  assert.deepEqual(hatch.period(resolveLayer({ spacing: 4.24 }), ctxFor()), { w: 4.24, h: 4.24 });
});

test('period: vertical solid lines repeat every spacing in x', () => {
  assert.deepEqual(hatch.period(resolveLayer({ spacing: 4.24, angle: 90 }), ctxFor()), { w: 4.24, h: 4.24 });
});

test('period: a 45 degree family repeats at spacing * sqrt(2) in both directions', () => {
  const p = hatch.period(resolveLayer({ spacing: 4.24, angle: 45 }), ctxFor());
  assert.ok(Math.abs(p.w - 4.24 * Math.SQRT2) < TOL && Math.abs(p.h - 4.24 * Math.SQRT2) < TOL);
});

test('period: the shale cycle [dashed, solid] with dash 5.70 / gap 2.75 repeats in x every 8.45 and in y every 2 * 4.24', () => {
  const p = hatch.period(resolveLayer({ spacing: 4.24, cycle: ['dashed', 'solid'], dash: 5.7, gap: 2.75 }), ctxFor());
  assert.ok(Math.abs(p.w - 8.45) < TOL, `w ${p.w}`);
  assert.ok(Math.abs(p.h - 8.48) < TOL, `h ${p.h}`);
});

test('period: a non-zero margin is not periodic and gives null', () => {
  assert.equal(hatch.period(resolveLayer({ spacing: 4.24, margin: 2.85 }), ctxFor()), null);
});

test('period: two families at 45 and 135 degrees share the period spacing * sqrt(2)', () => {
  const p = hatch.period(resolveLayer({ spacing: 4.24, angle: [45, 135] }), ctxFor());
  assert.ok(Math.abs(p.w - 4.24 * Math.SQRT2) < TOL && Math.abs(p.h - 4.24 * Math.SQRT2) < TOL);
});

test('period: an irrational direction with a dashed style has no common period (null)', () => {
  assert.equal(hatch.period(resolveLayer({ spacing: 4.24, angle: 30, cycle: ['dashed'], dash: 5.7, gap: 2.75 }), ctxFor()), null);
});

test('period: a dashed 45 degree family whose true repeat is longer than 64 steps gives null, not a huge tile', () => {
  // 8.45 / 4.24 is rational, so the exact period is about 5067 pt; it is not a practical tile.
  assert.equal(hatch.period(resolveLayer({ spacing: 4.24, angle: 45, cycle: ['dashed'], dash: 5.7, gap: 2.75 }), ctxFor()), null);
});
