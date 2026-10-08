import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fd from '../../src/archetypes/frameDiagonal.js';
import { applyDefaults, validateValue } from '../../src/core/schema.js';
import { createRng } from '../../src/core/rng.js';
import { GeometryError } from '../../src/core/errors.js';

const close = (a, b, tol = 1e-6, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} != ${b} (tol ${tol})`);

function layerOf(params, id = 'diag') {
  const out = { errors: [], warnings: [] };
  validateValue(fd.PARAMS, params, '', out);
  assert.deepEqual(out.errors, [], 'test params must validate');
  return { id, archetype: 'frameDiagonal', params: applyDefaults(fd.PARAMS, params), offset: { x: 0, y: 0 }, z: 0, densityScale: 1, blend: 'over' };
}

const FRAME = { x: 0, y: 0, width: 56.03, height: 28.41 };

function ctxOf(region = FRAME, extra = {}) {
  return {
    region, tileMode: 'frame', strokeWidth: 0.2, origin: 'center', jitter: 0, clip: true,
    rng: createRng(1), results: {},
    buildMotif: () => { throw new Error('frameDiagonal takes no motif'); },
    motifExtent: () => { throw new Error('frameDiagonal takes no motif'); },
    ...extra,
  };
}

/** Endpoints of a line primitive as [[x1,y1],[x2,y2]]. */
const ends = (p) => [[p.x1, p.y1], [p.x2, p.y2]];

/** Does a segment's endpoint set match the expected two corners (order-free)? */
function sameEnds(p, a, b, tol = 1e-6) {
  const e = ends(p);
  const near = (u, v) => Math.abs(u[0] - v[0]) <= tol && Math.abs(u[1] - v[1]) <= tol;
  return (near(e[0], a) && near(e[1], b)) || (near(e[0], b) && near(e[1], a));
}

/** x of a line at height y. */
function xAtY(p, y) {
  const [[x1, y1], [x2, y2]] = ends(p);
  return x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
}

const W = FRAME.width;
const H = FRAME.height;

test("'/' draws one line from the bottom-left corner to the top-right corner", () => {
  const r = fd.render(layerOf({ direction: '/' }), ctxOf());
  assert.equal(r.placed, 1);
  assert.equal(r.skipped, 0);
  assert.equal(r.primitives.length, 1);
  assert.ok(sameEnds(r.primitives[0], [0, H], [W, 0]));
});

test("'\\' draws one line from the top-left corner to the bottom-right corner", () => {
  const r = fd.render(layerOf({ direction: '\\' }), ctxOf());
  assert.equal(r.placed, 1);
  assert.ok(sameEnds(r.primitives[0], [0, 0], [W, H]));
});

test("'x' draws both diagonals", () => {
  const r = fd.render(layerOf({ direction: 'x' }), ctxOf());
  assert.equal(r.placed, 2);
  assert.ok(sameEnds(r.primitives[0], [0, H], [W, 0]));
  assert.ok(sameEnds(r.primitives[1], [0, 0], [W, H]));
});

test('count 2 draws two parallel lines whose horizontal distance is gap', () => {
  const r = fd.render(layerOf({ direction: '/', count: 2, gap: 2.78 }), ctxOf());
  assert.equal(r.placed, 2);
  close(xAtY(r.primitives[1], H / 2) - xAtY(r.primitives[0], H / 2), 2.78, 1e-6, 'horizontal gap at mid height');
});

test('count 2 keeps the pair symmetric about the diagonal', () => {
  const r = fd.render(layerOf({ direction: '\\', count: 2, gap: 2.78 }), ctxOf());
  const mid = (xAtY(r.primitives[0], H / 2) + xAtY(r.primitives[1], H / 2)) / 2;
  close(mid, W / 2, 1e-6, 'centre of the pair at the diagonal midpoint');
});

test('count 2 with gap 0 throws GeometryError (the lines would coincide)', () => {
  assert.throws(
    () => fd.render(layerOf({ direction: '/', count: 2, gap: 0 }), ctxOf()),
    (e) => e instanceof GeometryError && /gap > 0/.test(e.message),
  );
});

test('all endpoints stay inside the frame', () => {
  const r = fd.render(layerOf({ direction: 'x', count: 2, gap: 2.78 }), ctxOf());
  for (const p of r.primitives) {
    for (const [x, y] of ends(p)) {
      assert.ok(x >= -1e-6 && x <= W + 1e-6, `x ${x}`);
      assert.ok(y >= -1e-6 && y <= H + 1e-6, `y ${y}`);
    }
  }
});

test('the diagonal follows a region that is not at the origin', () => {
  const region = { x: 10, y: 5, width: 20, height: 10 };
  const r = fd.render(layerOf({ direction: '/' }), ctxOf(region));
  assert.ok(sameEnds(r.primitives[0], [10, 15], [30, 5]));
});

test('DENSITY is off: the archetype asks not to be density-scaled', () => {
  assert.equal(fd.DENSITY.params, false);
  assert.equal(fd.DENSITY.motif, false);
});

test('period is the frame itself', () => {
  assert.deepEqual(fd.period(layerOf({ direction: '/' }), ctxOf()), { w: W, h: H });
});

test('jitter is reported as not applied', () => {
  const r = fd.render(layerOf({ direction: '/' }), ctxOf(FRAME, { jitter: 0.5 }));
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /jitter is not applied/);
});
