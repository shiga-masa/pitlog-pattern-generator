import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHETYPE, PARAMS, render, period } from '../../src/archetypes/symbol.js';
import { createRng } from '../../src/core/rng.js';
import { applyDefaults } from '../../src/core/schema.js';
import { GeometryError } from '../../src/core/errors.js';
import { circle, line } from '../../src/core/primitives.js';

// Local motif: a horizontal line from x = -3 to 3 (bbox centre at 0,0) and a unit circle at the centre.
const MOTIF_PRIMS = [line(-3, 0, 3, 0), circle(0, 0, 1)];

function makeLayer(raw) {
  return { id: 'vein', archetype: ARCHETYPE, motif: { kind: 'lineGlyph' }, params: applyDefaults(PARAMS, raw) };
}

function makeCtx({ width = 40, height = 30, seed = 1 } = {}) {
  return {
    region: { x: 0, y: 0, width, height },
    tileMode: 'frame',
    strokeWidth: 0.2,
    origin: 'center',
    jitter: 0,
    clip: true,
    rng: createRng(seed),
    results: {},
    buildMotif: () => MOTIF_PRIMS.map((p) => structuredClone(p)),
    motifExtent: () => ({ w: 6, h: 2 }),
  };
}

test('symbol: default anchor centre places the motif at the region centre', () => {
  const r = render(makeLayer({}), makeCtx());
  assert.equal(r.placed, 1);
  assert.equal(r.skipped, 0);
  const l = r.primitives[0];
  assert.equal(l.type, 'line');
  assert.ok(Math.abs(l.x1 - 17) < 1e-9 && Math.abs(l.x2 - 23) < 1e-9);
  assert.ok(Math.abs(l.y1 - 15) < 1e-9 && Math.abs(l.y2 - 15) < 1e-9);
  assert.deepEqual(r.anchors, [{ x: 20, y: 15 }]);
});

test('symbol: each offset gives one placement (two boulders from the report)', () => {
  const r = render(makeLayer({ offsets: [{ x: -1.8, y: 0 }, { x: 13.4, y: -4.3 }] }), makeCtx());
  assert.equal(r.placed, 2);
  assert.equal(r.skipped, 0);
  assert.equal(r.primitives.length, 4);
  assert.ok(Math.abs(r.anchors[1].x - (20 + 13.4)) < 1e-9);
  assert.ok(Math.abs(r.anchors[1].y - (15 - 4.3)) < 1e-9);
});

test('symbol: scale multiplies the motif about its placed centre', () => {
  const r = render(makeLayer({ scale: 2 }), makeCtx());
  const l = r.primitives[0];
  assert.ok(Math.abs(l.x1 - 14) < 1e-9 && Math.abs(l.x2 - 26) < 1e-9);
});

test('symbol: anchor topLeft puts the motif centre at the region origin plus the offset', () => {
  const r = render(makeLayer({ anchor: 'topLeft', offsets: [{ x: 5, y: 5 }] }), makeCtx());
  assert.equal(r.placed, 1);
  assert.deepEqual(r.anchors, [{ x: 5, y: 5 }]);
});

test('symbol: a placement whose motif leaves the region is counted as skipped and warned', () => {
  const r = render(makeLayer({ anchor: 'topLeft', offsets: [{ x: 0, y: 0 }, { x: 5, y: 5 }] }), makeCtx());
  assert.equal(r.placed, 1);
  assert.equal(r.skipped, 1);
  assert.equal(r.primitives.length, 2);
  assert.ok(r.warnings.some((w) => w.includes('offsets[0]')));
});

test('symbol: a layer without a motif is a GeometryError', () => {
  const layer = { id: 'vein', archetype: ARCHETYPE, params: applyDefaults(PARAMS, {}) };
  assert.throws(() => render(layer, makeCtx()), GeometryError);
});

test('symbol: period is one frame', () => {
  assert.deepEqual(period(makeLayer({}), makeCtx({ width: 40, height: 30 })), { w: 40, h: 30 });
});
