import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHETYPE, PARAMS, render, period } from '../../src/archetypes/scatter.js';
import { createRng } from '../../src/core/rng.js';
import { applyDefaults } from '../../src/core/schema.js';
import { GeometryError } from '../../src/core/errors.js';

// Statistics of the report R2 §18 (volcanic ash group): 19 segments, median length 6.18,
// directions +27 deg (9), +15 deg (1), -27 deg (7), -15 deg (2).
const ASH_ANGLES = [
  { deg: 27, weight: 9 },
  { deg: 15, weight: 1 },
  { deg: -27, weight: 7 },
  { deg: -15, weight: 2 },
];
const ASH_RAW = { count: 19, length: 6.18, angles: ASH_ANGLES };

function makeLayer(raw) {
  return { id: 'lines', archetype: ARCHETYPE, params: applyDefaults(PARAMS, raw) };
}

function makeCtx({ width = 100, height = 100, seed = 1 } = {}) {
  return {
    region: { x: 0, y: 0, width, height },
    tileMode: 'frame',
    strokeWidth: 0.2,
    origin: 'center',
    jitter: 0,
    clip: true,
    rng: createRng(seed),
    results: {},
    buildMotif: () => { throw new Error('scatter does not use motifs'); },
    motifExtent: () => ({ w: 0, h: 0 }),
  };
}

/** Centre, length and direction (0..180, math convention) of a line primitive. */
function info(p) {
  const dx = p.x2 - p.x1;
  const dy = p.y2 - p.y1;
  const deg = (((Math.atan2(-dy, dx) * 180) / Math.PI) % 180 + 180) % 180;
  return { cx: (p.x1 + p.x2) / 2, cy: (p.y1 + p.y2) / 2, len: Math.hypot(dx, dy), deg };
}

const norm180 = (d) => ((d % 180) + 180) % 180;

test('scatter: the same seed gives the same segments', () => {
  const a = render(makeLayer(ASH_RAW), makeCtx({ seed: 42 }));
  const b = render(makeLayer(ASH_RAW), makeCtx({ seed: 42 }));
  assert.deepEqual(a.primitives, b.primitives);
  assert.deepEqual(a.anchors, b.anchors);
  assert.equal(a.placed, b.placed);
});

test('scatter: a different seed gives different segments', () => {
  const a = render(makeLayer(ASH_RAW), makeCtx({ seed: 1 }));
  const b = render(makeLayer(ASH_RAW), makeCtx({ seed: 2 }));
  assert.notDeepEqual(a.anchors, b.anchors);
});

test('scatter: default statistics draw 19 segments, all placed, none skipped', () => {
  const r = render(makeLayer(ASH_RAW), makeCtx({ seed: 11 }));
  assert.equal(r.primitives.length, 19);
  assert.equal(r.placed, 19);
  assert.equal(r.skipped, 0);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.anchors.length, 19);
});

test('scatter: every segment uses one of the direction classes', () => {
  const r = render(makeLayer(ASH_RAW), makeCtx({ seed: 3 }));
  const allowed = ASH_ANGLES.map((c) => norm180(c.deg));
  for (const p of r.primitives) {
    const { deg } = info(p);
    assert.ok(allowed.some((a) => Math.abs(a - deg) < 1e-9), `direction ${deg} is not a class`);
  }
});

test('scatter: with lengthJitter 0 every segment has the median length', () => {
  const r = render(makeLayer(ASH_RAW), makeCtx({ seed: 5 }));
  for (const p of r.primitives) assert.ok(Math.abs(info(p).len - 6.18) < 1e-9);
});

test('scatter: lengthJitter keeps each length within length +/- lengthJitter', () => {
  const r = render(makeLayer({ ...ASH_RAW, lengthJitter: 0.5 }), makeCtx({ seed: 6 }));
  const lens = r.primitives.map((p) => info(p).len);
  for (const l of lens) assert.ok(l >= 5.68 - 1e-9 && l <= 6.68 + 1e-9, `length ${l} out of range`);
  assert.ok(lens.some((l) => Math.abs(l - 6.18) > 1e-6), 'lengths should vary');
});

test('scatter: every segment stays inside the margin', () => {
  const margin = 2;
  const r = render(makeLayer(ASH_RAW), makeCtx({ seed: 8 }));
  for (const p of r.primitives) {
    for (const [x, y] of [[p.x1, p.y1], [p.x2, p.y2]]) {
      assert.ok(x >= margin - 1e-9 && x <= 100 - margin + 1e-9, `x ${x} outside the margin`);
      assert.ok(y >= margin - 1e-9 && y <= 100 - margin + 1e-9, `y ${y} outside the margin`);
    }
  }
});

test('scatter: density 2 (count x4, length /2 as the framework passes them) gives 4x segments of half length', () => {
  const base = render(makeLayer(ASH_RAW), makeCtx({ seed: 9 }));
  const dense = render(makeLayer({ ...ASH_RAW, count: 76, length: 3.09 }), makeCtx({ seed: 9 }));
  assert.equal(base.placed, 19);
  assert.equal(dense.placed, 76);
  for (const p of dense.primitives) assert.ok(Math.abs(info(p).len - 3.09) < 1e-9);
});

test('scatter: minDistance is respected between all placed centres', () => {
  const md = 5;
  const r = render(makeLayer({ ...ASH_RAW, minDistance: md }), makeCtx({ seed: 12 }));
  assert.equal(r.placed + r.skipped, 19);
  assert.equal(r.skipped, 0);
  for (let i = 0; i < r.anchors.length; i++) {
    for (let j = i + 1; j < r.anchors.length; j++) {
      const d = Math.hypot(r.anchors[i].x - r.anchors[j].x, r.anchors[i].y - r.anchors[j].y);
      assert.ok(d >= md - 1e-9, `centres ${i} and ${j} are ${d} pt apart`);
    }
  }
});

test('scatter: segments that cannot satisfy minDistance are counted as skipped and warned about', () => {
  const r = render(makeLayer({ count: 50, length: 2, angles: ASH_ANGLES, minDistance: 20 }), makeCtx({ width: 30, height: 30, seed: 4 }));
  assert.ok(r.skipped > 0, 'some segments must be skipped');
  assert.equal(r.placed + r.skipped, 50);
  assert.equal(r.primitives.length, r.placed);
  assert.ok(r.warnings.some((w) => w.includes('not placed')), 'a warning must name the skipped segments');
});

test("scatter: sampling 'poisson' without minDistance is a GeometryError", () => {
  assert.throws(
    () => render(makeLayer({ ...ASH_RAW, sampling: 'poisson' }), makeCtx({ seed: 1 })),
    (e) => e instanceof GeometryError && /minDistance/.test(e.message),
  );
});

test("scatter: sampling 'poisson' with minDistance keeps the spacing", () => {
  const md = 6;
  const r = render(makeLayer({ ...ASH_RAW, sampling: 'poisson', minDistance: md }), makeCtx({ seed: 21 }));
  assert.equal(r.placed + r.skipped, 19);
  for (let i = 0; i < r.anchors.length; i++) {
    for (let j = i + 1; j < r.anchors.length; j++) {
      const d = Math.hypot(r.anchors[i].x - r.anchors[j].x, r.anchors[i].y - r.anchors[j].y);
      assert.ok(d >= md - 1e-9);
    }
  }
});

test("scatter: sampling 'uniform' places the requested count", () => {
  const r = render(makeLayer({ ...ASH_RAW, sampling: 'uniform' }), makeCtx({ seed: 22 }));
  assert.equal(r.placed, 19);
  assert.equal(r.skipped, 0);
});

test('scatter: a region too small for the segments is a GeometryError with the sizes', () => {
  assert.throws(
    () => render(makeLayer(ASH_RAW), makeCtx({ width: 5, height: 100, seed: 1 })),
    (e) => e instanceof GeometryError && /region 5 x 100/.test(e.message),
  );
});

test('scatter: count 0 draws nothing', () => {
  const r = render(makeLayer({ ...ASH_RAW, count: 0 }), makeCtx({ seed: 1 }));
  assert.deepEqual(r.primitives, []);
  assert.equal(r.placed, 0);
  assert.equal(r.skipped, 0);
});

test('scatter: user points are drawn exactly, and points outside the region are counted as skipped', () => {
  const layer = makeLayer({
    count: 3,
    length: 6.18,
    angles: ASH_ANGLES,
    points: [
      { x: 10, y: 10, angle: 0 },
      { x: 50, y: 50, len: 4, angle: 90 },
      { x: -5, y: 10, angle: 0 },
    ],
  });
  const r = render(layer, makeCtx({ seed: 1 }));
  assert.equal(r.placed, 2);
  assert.equal(r.skipped, 1);
  assert.ok(r.warnings.some((w) => w.includes('points[2]')));
  const first = info(r.primitives[0]);
  assert.ok(Math.abs(first.cx - 10) < 1e-9 && Math.abs(first.cy - 10) < 1e-9 && Math.abs(first.len - 6.18) < 1e-9);
  const second = info(r.primitives[1]);
  assert.ok(Math.abs(second.cx - 50) < 1e-9 && Math.abs(second.len - 4) < 1e-9 && Math.abs(second.deg - 90) < 1e-9);
});

test('scatter: points disregard the random draw, so the seed does not change them', () => {
  const layer = makeLayer({ count: 1, length: 6, angles: ASH_ANGLES, points: [{ x: 30, y: 30, angle: 15 }] });
  const a = render(layer, makeCtx({ seed: 1 }));
  const b = render(layer, makeCtx({ seed: 999 }));
  assert.deepEqual(a.primitives, b.primitives);
});

test('scatter: a user point without angle is a GeometryError', () => {
  const layer = makeLayer({ count: 1, length: 6, angles: ASH_ANGLES, points: [{ x: 30, y: 30 }] });
  assert.throws(() => render(layer, makeCtx({ seed: 1 })), GeometryError);
});

test('scatter: period is one frame', () => {
  assert.deepEqual(period(makeLayer(ASH_RAW), makeCtx({ width: 100, height: 80 })), { w: 100, h: 80 });
});
