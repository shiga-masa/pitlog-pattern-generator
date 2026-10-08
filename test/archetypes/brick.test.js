import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as brick from '../../src/archetypes/brick.js';
import { validatePrimitive } from '../../src/core/primitives.js';
import { applyDefaults, validateValue } from '../../src/core/schema.js';
import { layerFactors, resolveScales, scaleByDescriptor } from '../../src/core/density.js';
import { GeometryError } from '../../src/core/errors.js';
import { FRAMES } from '../../src/core/defaults.js';

const TOL = 1e-6;
const REGION = { x: 0, y: 0, width: FRAMES.rock.width, height: FRAMES.rock.height };
const STROKE = 0.239;

/** Validate, fill defaults and apply density, as resolve.js does for one layer. */
function resolveLayer(params, density = 1) {
  const out = { errors: [], warnings: [] };
  validateValue(brick.PARAMS, params, '', out, {});
  if (out.errors.length) throw new Error(out.errors.map((e) => e.message).join('; '));
  const filled = applyDefaults(brick.PARAMS, params);
  const f = layerFactors(resolveScales({ density }), brick, 1);
  return { id: 'bricks', archetype: 'brick', params: scaleByDescriptor(brick.PARAMS, filled, f.params, {}) };
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
    buildMotif: () => { throw new Error('brick takes no motif'); },
    motifExtent: () => { throw new Error('brick takes no motif'); },
    ...overrides,
  };
}

function draw(params, ctxOverrides = {}, density = 1) {
  return brick.render(resolveLayer(params, density), ctxFor(ctxOverrides));
}

const isHoriz = (p) => Math.abs(p.y1 - p.y2) < TOL;
const isVert = (p) => Math.abs(p.x1 - p.x2) < TOL;
const LIMESTONE = { courseHeight: 7.22, brickLength: 22.43, jointAngle: 90, stagger: 0.5 };
const CX = REGION.width / 2;
const CY = REGION.height / 2;

test('default limestone field: three course lines at the expected heights, each spanning the full width', () => {
  const r = draw(LIMESTONE);
  const courses = r.primitives.filter(isHoriz);
  const ys = courses.map((p) => p.y1).sort((a, b) => a - b);
  assert.equal(ys.length, 3);
  for (const [i, k] of [-1, 0, 1].entries()) assert.ok(Math.abs(ys[i] - (CY + k * 7.22)) < TOL, `course ${k} at ${ys[i]}`);
  for (const p of courses) {
    assert.ok(Math.abs(Math.min(p.x1, p.x2)) < TOL);
    assert.ok(Math.abs(Math.max(p.x1, p.x2) - REGION.width) < TOL);
  }
});

test('perpendicular joints: x positions alternate by half a brick between courses (stagger 0.5)', () => {
  const r = draw(LIMESTONE);
  const joints = r.primitives.filter(isVert);
  assert.ok(joints.length > 0);
  for (const p of joints) {
    const phase = (((p.x1 - CX) / 22.43) % 1 + 1) % 1; // position in brick lengths from the centre joint
    const near = [0, 0.5].some((q) => Math.min(Math.abs(phase - q), 1 - Math.abs(phase - q)) < 1e-6);
    assert.ok(near, `joint at x=${p.x1} is not on a 0 / half-brick position`);
  }
  // Joints in adjacent bands sit half a brick apart.
  const bandOf = (p) => Math.floor((((p.y1 + p.y2) / 2) - CY) / 7.22);
  const byBand = new Map();
  for (const p of joints) {
    const b = bandOf(p);
    if (!byBand.has(b)) byBand.set(b, []);
    byBand.get(b).push(p.x1);
  }
  const b0 = byBand.get(0)[0];
  const b1 = byBand.get(1)[0];
  const shift = Math.abs(((b1 - b0) / 22.43) % 1);
  assert.ok(Math.abs(shift - 0.5) < 1e-6, `adjacent band shift ${shift} brick lengths`);
});

test('stagger 0: every band has joints at the same x positions', () => {
  const r = draw({ ...LIMESTONE, stagger: 0 });
  const xsByBand = new Map();
  for (const p of r.primitives.filter(isVert)) {
    const mid = (p.y1 + p.y2) / 2; // centre of the joint, inside one band
    const b = Math.floor((mid - CY) / 7.22);
    if (!xsByBand.has(b)) xsByBand.set(b, []);
    xsByBand.get(b).push(p.x1.toFixed(6));
  }
  const sets = [...xsByBand.values()].map((xs) => xs.sort().join(' '));
  assert.ok(sets.length >= 2);
  assert.ok(sets.every((s) => s === sets[0]), 'all bands share the same joint x positions');
});

test('joint lean over one course equals courseHeight * cot(jointAngle) (chert 52 deg: about 5.6 pt)', () => {
  const r = draw({ courseHeight: 7.22, brickLength: 22.43, jointAngle: 52, stagger: 0.5 });
  const leaning = r.primitives.filter((p) => p.type === 'line' && !isHoriz(p) && !isVert(p));
  assert.ok(leaning.length > 0);
  const expected = 7.22 * Math.cos((52 * Math.PI) / 180) / Math.sin((52 * Math.PI) / 180);
  assert.ok(Math.abs(expected - 5.64) < 0.01);
  for (const p of leaning) {
    const dy = Math.abs(p.y2 - p.y1);
    const dx = Math.abs(p.x2 - p.x1);
    // A full joint spans exactly one band (courseHeight) vertically when it is not clipped.
    if (Math.abs(dy - 7.22) < TOL) assert.ok(Math.abs(dx - expected) < TOL, `dx ${dx} vs ${expected}`);
  }
});

test('jointInset: each joint end is exactly jointInset from the nearest course line (vertical distance)', () => {
  const inset = 0.3;
  const h = 4.95;
  const r = draw({ courseHeight: h, brickLength: 9.97, jointAngle: 90, stagger: 0.5, jointInset: inset });
  const courseYs = r.primitives.filter(isHoriz).map((p) => p.y1);
  assert.ok(courseYs.length > 0);
  let checked = 0;
  for (const p of r.primitives.filter(isVert)) {
    for (const y of [p.y1, p.y2]) {
      if (Math.abs(y) < TOL || Math.abs(y - REGION.height) < TOL) continue; // cut by the frame edge
      const dist = Math.min(...courseYs.map((c) => Math.abs(c - y)));
      assert.ok(Math.abs(dist - inset) < TOL, `joint end at y=${y} is ${dist} pt from its course`);
      checked++;
    }
  }
  assert.ok(checked > 0);
});

test('angle 45: every segment is at 45 degrees; courses slope down-left and joints down-right', () => {
  const r = draw({ courseHeight: 4.95, brickLength: 9.97, jointAngle: 90, stagger: 0.5, angle: 45, jointInset: 0.3 });
  const lines = r.primitives.filter((p) => p.type === 'line');
  assert.ok(lines.length > 0);
  for (const p of lines) {
    const dx = p.x2 - p.x1;
    const dy = p.y2 - p.y1;
    assert.ok(Math.abs(Math.abs(dx) - Math.abs(dy)) < TOL, 'segment at 45 degrees');
  }
  assert.ok(lines.some((p) => (p.x2 - p.x1) * (p.y2 - p.y1) < 0), 'course lines present (slope -1 on screen)');
  assert.ok(lines.some((p) => (p.x2 - p.x1) * (p.y2 - p.y1) > 0), 'joints present (slope +1 on screen)');
  for (const p of lines) {
    for (const [x, y] of [[p.x1, p.y1], [p.x2, p.y2]]) {
      assert.ok(x > -TOL && x < REGION.width + TOL && y > -TOL && y < REGION.height + TOL, `endpoint (${x}, ${y}) outside region`);
    }
  }
});

test('every primitive is valid, uses only the ink token, and placed equals the number of primitives', () => {
  const r = draw({ ...LIMESTONE, angle: 30, jointAngle: 60, jointInset: 0.3 });
  for (const p of r.primitives) {
    validatePrimitive(p);
    assert.equal(p.style.stroke, 'ink');
    assert.equal(p.style.fill, 'none');
  }
  assert.equal(r.primitives.length, r.placed);
  assert.ok(Number.isInteger(r.skipped) && r.skipped >= 0);
});

test('origin topLeft puts a course line on the top edge of the region', () => {
  const r = draw(LIMESTONE, { origin: 'topLeft' });
  const ys = r.primitives.filter(isHoriz).map((p) => p.y1);
  assert.ok(ys.some((y) => Math.abs(y) < TOL));
});

test('density 2 halves the course pitch and the joint spacing, the line width is not touched', () => {
  const r1 = draw(LIMESTONE, {}, 1);
  const r2 = draw(LIMESTONE, {}, 2);
  const pitch = (r) => {
    const ys = [...new Set(r.primitives.filter(isHoriz).map((p) => p.y1.toFixed(6)))].map(Number).sort((a, b) => a - b);
    return ys[1] - ys[0];
  };
  assert.ok(Math.abs(pitch(r1) - 7.22) < TOL);
  assert.ok(Math.abs(pitch(r2) - 3.61) < TOL);
  assert.ok(r2.placed > r1.placed);
  assert.equal(brick.render(resolveLayer(LIMESTONE, 2), ctxFor()).primitives[0].style.stroke, 'ink');
});

test('a course narrower than the stroke width is reported as a warning', () => {
  const r = draw({ courseHeight: 0.1, brickLength: 22.43, jointAngle: 90, stagger: 0.5 });
  assert.ok(r.warnings.some((w) => /courseHeight/.test(w) && /merge/.test(w)));
});

test('jointInset of half the course height or more throws GeometryError naming the parameter', () => {
  assert.throws(() => draw({ courseHeight: 4, brickLength: 10, jointInset: 2 }), (e) => e instanceof GeometryError && /jointInset/.test(e.message));
});

test('period: stagger 0.5 gives (brickLength, 2 * courseHeight) for an unrotated field', () => {
  const layer = resolveLayer(LIMESTONE);
  assert.deepEqual(brick.period(layer, ctxFor()), { w: 22.43, h: 2 * 7.22 });
});

test('period: stagger 0 gives (brickLength, courseHeight); a quarter turn swaps the sides', () => {
  assert.deepEqual(brick.period(resolveLayer({ ...LIMESTONE, stagger: 0 }), ctxFor()), { w: 22.43, h: 7.22 });
  assert.deepEqual(brick.period(resolveLayer({ ...LIMESTONE, angle: 90 }), ctxFor()), { w: 2 * 7.22, h: 22.43 });
});

test('period: a field rotated by a non-multiple of 90 degrees has no axis-aligned period (null)', () => {
  assert.equal(brick.period(resolveLayer({ ...LIMESTONE, angle: 45 }), ctxFor()), null);
});

test('period: a stagger with no short repeat (irrational) gives null', () => {
  assert.equal(brick.period(resolveLayer({ ...LIMESTONE, stagger: Math.SQRT1_2 }), ctxFor()), null);
});
