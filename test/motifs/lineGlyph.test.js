import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTIFS } from '../../src/motifs/index.js';
import { GeometryError } from '../../src/core/errors.js';
import { bboxOf } from '../../src/core/primitives.js';

const TOL = 1e-9;
const ctx = { strokeWidth: 0.239, rng: null };
const build = (m) => MOTIFS[m.kind].build(m, ctx);
const extent = (m) => MOTIFS[m.kind].extent(m);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= TOL, `${msg ?? ''} expected ${b}, got ${a}`);
const endpoints = (p) => (p.type === 'line' ? [[p.x1, p.y1], [p.x2, p.y2]] : p.points);

const LG = (o) => ({
  kind: 'lineGlyph', hLines: 0, hLen: 0, hGap: 0, vLines: 0, vLen: 0, vGap: 0, vAnchor: 'center', rotation: 0, ...o,
});

test('line-glyph kinds are registered in the motif registry', () => {
  for (const k of ['lineGlyph', 'L', 'chevron', 'splitChevron', 'parallelPair', 'pairVline']) {
    assert.ok(MOTIFS[k], `kind ${k} missing`);
    assert.equal(MOTIFS[k].file, 'motifs/lineGlyph.js');
  }
});

test('plus glyph: one horizontal and one vertical stroke crossing at the origin', () => {
  const m = LG({ hLines: 1, hLen: 5.66, vLines: 1, vLen: 5.75 });
  const p = build(m);
  assert.equal(p.length, 2);
  assert.deepEqual(p[0], { type: 'line', x1: -2.83, y1: 0, x2: 2.83, y2: 0, style: { stroke: 'ink', fill: 'none', dash: null, dashOffset: 0 } });
  near(p[1].x1, 0); near(p[1].x2, 0);
  near(p[1].y1, -2.875); near(p[1].y2, 2.875);
  assert.deepEqual(extent(m), { w: 5.66, h: 5.75 });
});

test('cross glyph rotated 45 degrees has extent L / sqrt(2) on both axes', () => {
  const m = LG({ hLines: 1, hLen: 5.66, vLines: 1, vLen: 5.66, rotation: 45 });
  const e = extent(m);
  near(e.w, 5.66 / Math.SQRT2); near(e.h, 5.66 / Math.SQRT2);
});

test('two horizontal strokes are placed symmetrically at +- gap/2', () => {
  const p = build(LG({ hLines: 2, hLen: 8.43, hGap: 2.85 }));
  assert.equal(p.length, 2);
  near(p[0].y1, -1.425, 'upper'); near(p[1].y1, 1.425, 'lower');
  assert.equal(p[0].x1, -4.215);
  assert.deepEqual(extent(LG({ hLines: 2, hLen: 8.43, hGap: 2.85 })), { w: 8.43, h: 2.85 });
});

test('three vertical strokes are spaced by vGap around the origin', () => {
  const p = build(LG({ vLines: 3, vLen: 5.66, vGap: 2 }));
  assert.deepEqual(p.map((q) => q.x1), [-2, 0, 2]);
});

test('T glyph (vAnchor top): vertical stroke hangs from the top horizontal bar', () => {
  const m = LG({ hLines: 1, hLen: 8.43, vLines: 1, vLen: 5.66, vAnchor: 'top' });
  const [h, v] = build(m);
  near(h.y1, -2.83, 'bar at top');
  near(v.y1, -2.83, 'vertical starts at bar'); near(v.y2, 2.83, 'vertical ends at bottom');
  assert.deepEqual(extent(m), { w: 8.43, h: 5.66 });
});

test('perpendicular glyph (vAnchor bottom): vertical stroke rises to the bottom bar', () => {
  const m = LG({ hLines: 1, hLen: 8.43, vLines: 1, vLen: 5.66, vAnchor: 'bottom' });
  const [h, v] = build(m);
  near(h.y1, 2.83, 'bar at bottom');
  near(v.y1, -2.83, 'top end'); near(v.y2, 2.83, 'joins bar');
});

test('vAnchor other than center without horizontal strokes is an error, not a silent no-op', () => {
  assert.throws(() => build(LG({ vLines: 1, vLen: 5, vAnchor: 'top' })), (e) => e instanceof GeometryError && /vAnchor/.test(e.message));
});

test('a glyph with no strokes is an error', () => {
  assert.throws(() => build(LG({})), (e) => e instanceof GeometryError && /no strokes/.test(e.message));
});

test('more than three strokes of one kind is an error with the allowed range', () => {
  assert.throws(() => build(LG({ hLines: 4, hLen: 5 })), (e) => e instanceof GeometryError && /0\.\.3/.test(e.message));
});

test('horizontal strokes without a length are an error', () => {
  assert.throws(() => build(LG({ hLines: 1 })), (e) => e instanceof GeometryError && /hLen/.test(e.message));
});

test('L glyph bottomLeft: arms meet at the bottom-left corner of the bbox', () => {
  const m = { kind: 'L', vLen: 5, hLen: 3, corner: 'bottomLeft' };
  const [p] = build(m);
  assert.equal(p.type, 'polyline');
  assert.deepEqual(p.points, [[-1.5, -2.5], [-1.5, 2.5], [1.5, 2.5]]);
  assert.deepEqual(extent(m), { w: 3, h: 5 });
});

test('L glyph topRight: vertical arm goes down and horizontal arm goes left from the top-right corner', () => {
  const [p] = build({ kind: 'L', vLen: 5, hLen: 3, corner: 'topRight' });
  assert.deepEqual(p.points, [[1.5, 2.5], [1.5, -2.5], [-1.5, -2.5]]);
});

test('L glyph rejects an unknown corner', () => {
  assert.throws(() => build({ kind: 'L', vLen: 5, hLen: 3, corner: 'middle' }), (e) => e instanceof GeometryError && /corner/.test(e.message));
});

test('chevron up (V) has its apex at the bottom and arm ends at the top', () => {
  const m = { kind: 'chevron', width: 8.43, depth: 4.34, open: 'up' };
  const [p] = build(m);
  assert.deepEqual(p.points, [[-4.215, -2.17], [0, 2.17], [4.215, -2.17]]);
  assert.deepEqual(extent(m), { w: 8.43, h: 4.34 });
});

test('chevron down (^) has its apex at the top', () => {
  const [p] = build({ kind: 'chevron', width: 8.43, depth: 4.34, open: 'down' });
  assert.deepEqual(p.points, [[-4.215, 2.17], [0, -2.17], [4.215, 2.17]]);
});

test('chevron left (>) has its apex on the right and the depth along x', () => {
  const m = { kind: 'chevron', width: 5.7, depth: 5.66, open: 'left' };
  const [p] = build(m);
  assert.deepEqual(p.points, [[-2.83, -2.85], [2.83, 0], [-2.83, 2.85]]);
  assert.deepEqual(extent(m), { w: 5.66, h: 5.7 });
});

test('chevron right (<) has its apex on the left', () => {
  const [p] = build({ kind: 'chevron', width: 5.7, depth: 5.66, open: 'right' });
  assert.deepEqual(p.points, [[2.83, -2.85], [-2.83, 0], [2.83, 2.85]]);
});

test('chevron rejects an unknown opening', () => {
  assert.throws(() => build({ kind: 'chevron', width: 5, depth: 5, open: 'diag' }), (e) => e instanceof GeometryError && /open/.test(e.message));
});

test('split chevron (Λ) legs start apexGap apart and run at legAngle from the screen horizontal', () => {
  const L = 5.12; const a = 57.8; const g = 1.42;
  const m = { kind: 'splitChevron', legLength: L, legAngle: a, apexGap: g, open: 'down' };
  const p = build(m);
  assert.equal(p.length, 2);
  const rad = (a * Math.PI) / 180;
  const e = extent(m);
  near(e.w, 2 * L * Math.cos(rad) + g, 'width (opening across the axis)');
  near(e.h, L * Math.sin(rad), 'height (along the axis)');
  // The leg direction makes angle a with the horizontal.
  const q = p[1].points;
  near(Math.atan2(Math.abs(q[1][1] - q[0][1]), Math.abs(q[1][0] - q[0][0])) * 180 / Math.PI, a, 'leg angle');
});

test('split chevron (>) keeps the leg angle measured from the screen horizontal, so the arms are shallow', () => {
  const L = 5.0; const a = 33.7; const g = 1.3;
  const m = { kind: 'splitChevron', legLength: L, legAngle: a, apexGap: g, open: 'left' };
  const e = extent(m);
  const rad = (a * Math.PI) / 180;
  near(e.w, L * Math.cos(rad), 'depth along the axis');
  near(e.h, 2 * L * Math.sin(rad) + g, 'opening across the axis');
});

test('split chevron rejects a leg angle outside (0, 90) degrees', () => {
  assert.throws(() => build({ kind: 'splitChevron', legLength: 5, legAngle: 0, apexGap: 1, open: 'down' }), (e) => e instanceof GeometryError && /legAngle/.test(e.message));
  assert.throws(() => build({ kind: 'splitChevron', legLength: 5, legAngle: 90, apexGap: 1, open: 'down' }), (e) => e instanceof GeometryError && /legAngle/.test(e.message));
});

test('parallel pair (=) at rotation 0 has two horizontal strokes gap apart', () => {
  const m = { kind: 'parallelPair', length: 7.1, gap: 2.8, rotation: 0 };
  const p = build(m);
  near(p[0].y1, -1.4); near(p[1].y1, 1.4);
  assert.deepEqual(extent(m), { w: 7.1, h: 2.8 });
});

test('parallel pair rotated 90 degrees swaps its extent', () => {
  const e = extent({ kind: 'parallelPair', length: 7.1, gap: 2.8, rotation: 90 });
  near(e.w, 2.8); near(e.h, 7.1);
});

test('parallel pair rotation is counter-clockwise on screen', () => {
  const [p] = build({ kind: 'parallelPair', length: 10, gap: 2, rotation: 30 });
  assert.ok(p.x2 > p.x1 && p.y2 < p.y1, 'right end should be higher');
});

test('vertical pair (||) has two vertical strokes gap apart and length tall', () => {
  const m = { kind: 'pairVline', length: 5.75, gap: 3.88 };
  const p = build(m);
  near(p[0].x1, -1.94); near(p[1].x1, 1.94);
  assert.deepEqual(extent(m), { w: 3.88, h: 5.75 });
});

test('every line-glyph kind is centred on the origin and its extent equals the geometric bbox', () => {
  const samples = [
    LG({ hLines: 1, hLen: 8.43, vLines: 2, vLen: 5.66, vGap: 2.85 }),
    LG({ hLines: 2, hLen: 8.43, hGap: 2.85, vLines: 1, vLen: 5.66, vAnchor: 'top' }),
    { kind: 'L', vLen: 5, hLen: 3, corner: 'topLeft' },
    { kind: 'chevron', width: 8.43, depth: 4.34, open: 'down' },
    { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'right' },
    { kind: 'parallelPair', length: 7.1, gap: 2.8, rotation: 120 },
    { kind: 'pairVline', length: 5.75, gap: 3.88 },
  ];
  for (const m of samples) {
    const b = bboxOf(build(m));
    near((b.minX + b.maxX) / 2, 0, `${m.kind} centre x`);
    near((b.minY + b.maxY) / 2, 0, `${m.kind} centre y`);
    const e = extent(m);
    near(e.w, b.maxX - b.minX, `${m.kind} w`);
    near(e.h, b.maxY - b.minY, `${m.kind} h`);
  }
});

test('glyph output uses only paint tokens for strokes', () => {
  for (const p of build(LG({ hLines: 1, hLen: 5, vLines: 1, vLen: 5 }))) {
    assert.equal(p.style.stroke, 'ink');
    assert.equal(p.style.fill, 'none');
  }
});
