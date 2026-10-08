import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTIFS } from '../../src/motifs/index.js';
import { BUILDERS, EXTENTS } from '../../src/motifs/basic.js';
import { GeometryError } from '../../src/core/errors.js';
import { bboxOf } from '../../src/core/primitives.js';

const TOL = 1e-9;
const ctx = { strokeWidth: 0.239, rng: null };
const build = (m, c = ctx) => MOTIFS[m.kind].build(m, c);
const extent = (m) => MOTIFS[m.kind].extent(m);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= TOL, `${msg ?? ''} expected ${b}, got ${a}`);

const SAMPLES = [
  { kind: 'circle', d: 7, fill: 'ink', polygonSides: null },
  { kind: 'circle', d: 7, fill: 'paper', polygonSides: 5 },
  { kind: 'dot', d: 1.3 },
  { kind: 'ellipse', w: 6, h: 3, rotation: 30, fill: 'paper' },
  { kind: 'triangle', base: 5.58, height: 4.58, fill: 'none', apex: 'up' },
  { kind: 'triangle', base: 5.58, height: 4.58, fill: 'ink', apex: 'down' },
  { kind: 'hline', length: 8.43 },
  { kind: 'seg', length: 6.33, angle: 27 },
];

test('basic kinds are registered in the motif registry', () => {
  for (const k of ['circle', 'dot', 'ellipse', 'triangle', 'hline', 'seg']) {
    assert.ok(MOTIFS[k], `kind ${k} missing`);
    assert.equal(MOTIFS[k].file, 'motifs/basic.js');
  }
});

test('circle with polygonSides null is a true circle of radius d/2 at the origin', () => {
  const p = build({ kind: 'circle', d: 7, fill: 'ink', polygonSides: null });
  assert.equal(p.length, 1);
  assert.equal(p[0].type, 'circle');
  near(p[0].cx, 0); near(p[0].cy, 0); near(p[0].r, 3.5);
  assert.deepEqual(p[0].style, { stroke: 'ink', fill: 'ink', dash: null, dashOffset: 0 });
  assert.deepEqual(extent({ kind: 'circle', d: 7, fill: 'none', polygonSides: null }), { w: 7, h: 7 });
});

test('circle fill paper keeps an ink outline on a paper fill', () => {
  const p = build({ kind: 'circle', d: 7, fill: 'paper', polygonSides: null });
  assert.equal(p[0].style.stroke, 'ink');
  assert.equal(p[0].style.fill, 'paper');
});

test('regular pentagon has its vertex at the top and its bbox centred on the origin', () => {
  const m = { kind: 'circle', d: 7, fill: 'none', polygonSides: 5 };
  const p = build(m);
  assert.equal(p[0].type, 'polygon');
  assert.equal(p[0].points.length, 5);
  const r = 3.5;
  const e = extent(m);
  near(e.w, 2 * r * Math.sin((72 * Math.PI) / 180), 'pentagon width');
  near(e.h, r + r * Math.cos((36 * Math.PI) / 180), 'pentagon height');
  const b = bboxOf(p);
  near((b.minX + b.maxX) / 2, 0, 'centre x');
  near((b.minY + b.maxY) / 2, 0, 'centre y');
});

test('circle rejects polygonSides below 3 with the reason', () => {
  assert.throws(() => build({ kind: 'circle', d: 7, fill: 'ink', polygonSides: 2 }), (e) => e instanceof GeometryError && /polygonSides/.test(e.message));
});

test('circle rejects a non-positive diameter instead of drawing nothing', () => {
  assert.throws(() => build({ kind: 'circle', d: 0, fill: 'ink', polygonSides: null }), (e) => e instanceof GeometryError && /circle d/.test(e.message));
});

test('dot is an ink-filled circle whatever the context', () => {
  const p = build({ kind: 'dot', d: 1.3 });
  near(p[0].r, 0.65);
  assert.equal(p[0].style.fill, 'ink');
  assert.equal(p[0].style.stroke, 'ink');
});

test('ellipse extent is the full width and height at rotation 0 and swaps at 90 degrees', () => {
  assert.deepEqual(extent({ kind: 'ellipse', w: 6, h: 3, rotation: 0, fill: 'ink' }), { w: 6, h: 3 });
  const e90 = extent({ kind: 'ellipse', w: 6, h: 3, rotation: 90, fill: 'ink' });
  near(e90.w, 3, 'w at 90'); near(e90.h, 6, 'h at 90');
});

test('ellipse extent at 30 degrees matches the rotated-ellipse bbox formula', () => {
  const e = extent({ kind: 'ellipse', w: 6, h: 3, rotation: 30, fill: 'paper' });
  const t = (30 * Math.PI) / 180;
  near(e.w, 2 * Math.hypot(3 * Math.cos(t), 1.5 * Math.sin(t)), 'w');
  near(e.h, 2 * Math.hypot(3 * Math.sin(t), 1.5 * Math.cos(t)), 'h');
});

test('ellipse without an explicit rotation raises instead of assuming 0', () => {
  assert.throws(() => build({ kind: 'ellipse', w: 6, h: 3, fill: 'ink' }), (e) => e instanceof GeometryError && /rotation/.test(e.message));
});

test('triangle apex up has its apex at the top and base at the bottom, centred', () => {
  const p = build({ kind: 'triangle', base: 6, height: 4, fill: 'ink', apex: 'up' });
  const pts = p[0].points;
  assert.deepEqual(pts.map(([x, y]) => [x, y]), [[-3, 2], [3, 2], [0, -2]]);
  assert.deepEqual(extent({ kind: 'triangle', base: 6, height: 4, fill: 'ink', apex: 'up' }), { w: 6, h: 4 });
});

test('triangle apex down mirrors the apex to the bottom', () => {
  const p = build({ kind: 'triangle', base: 6, height: 4, fill: 'none', apex: 'down' });
  assert.deepEqual(p[0].points, [[-3, -2], [3, -2], [0, 2]]);
});

test('triangle rejects an unknown apex direction', () => {
  assert.throws(() => build({ kind: 'triangle', base: 6, height: 4, fill: 'ink', apex: 'left' }), (e) => e instanceof GeometryError && /apex/.test(e.message));
});

test('hline is a horizontal segment of the full length centred on the origin', () => {
  const p = build({ kind: 'hline', length: 8 });
  assert.deepEqual([p[0].x1, p[0].y1, p[0].x2, p[0].y2], [-4, 0, 4, 0]);
  assert.deepEqual(extent({ kind: 'hline', length: 8 }), { w: 8, h: 0 });
});

test('seg at 90 degrees is vertical and at 45 degrees has equal extents', () => {
  const v = build({ kind: 'seg', length: 10, angle: 90 })[0];
  near(v.x1, 0); near(v.x2, 0); near(v.y1 + v.y2, 0, 'centred');
  assert.equal(Math.abs(v.y2 - v.y1), 10);
  const e = extent({ kind: 'seg', length: 10, angle: 45 });
  near(e.w, 10 / Math.SQRT2); near(e.h, 10 / Math.SQRT2);
});

test('seg direction is counter-clockwise on screen: positive angle rises to the right', () => {
  const s = build({ kind: 'seg', length: 10, angle: 30 })[0];
  assert.ok(s.x2 > s.x1 && s.y2 < s.y1, 'right end should be higher (smaller y)');
});

test('every basic kind is centred on the origin and its extent equals the geometric bbox', () => {
  for (const m of SAMPLES) {
    const p = build(m);
    const b = bboxOf(p);
    near((b.minX + b.maxX) / 2, 0, `${m.kind} centre x`);
    near((b.minY + b.maxY) / 2, 0, `${m.kind} centre y`);
    const e = EXTENTS[m.kind](m);
    near(e.w, b.maxX - b.minX, `${m.kind} w`);
    near(e.h, b.maxY - b.minY, `${m.kind} h`);
  }
});

test('stroke width does not change basic geometry (strokes are not part of the extent)', () => {
  for (const m of SAMPLES) {
    assert.deepEqual(build(m, { strokeWidth: 0, rng: null }), build(m, { strokeWidth: 5, rng: null }));
  }
});

test('halving every dimension halves the extent (density 2 applied upstream)', () => {
  const full = { kind: 'triangle', base: 5.58, height: 4.58, fill: 'ink', apex: 'up' };
  const half = { ...full, base: 5.58 / 2, height: 4.58 / 2 };
  const a = extent(full);
  const b = extent(half);
  near(b.w * 2, a.w); near(b.h * 2, a.h);
});

test('paint tokens are the only style values emitted', () => {
  for (const m of SAMPLES) {
    for (const p of build(m)) {
      assert.ok(['ink', 'paper', 'none'].includes(p.style.stroke), `stroke ${p.style.stroke}`);
      assert.ok(['ink', 'paper', 'none'].includes(p.style.fill), `fill ${p.style.fill}`);
    }
  }
});

test('the motif builders never return an empty list', () => {
  for (const m of SAMPLES) assert.ok(build(m).length > 0, m.kind);
  assert.equal(Object.keys(BUILDERS).length, 6);
});
