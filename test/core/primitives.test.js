import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  line, polyline, polygon, circle, ellipse, path, makeStyle, validatePrimitive, transformPrimitive,
  bbox, bboxOf, circlePolygonPoints, circleBezierCmds, parsePathData,
} from '../../src/core/primitives.js';
import { dir, rotatePoint, spacingFromHorizontalIntercept, bboxInside } from '../../src/core/geom.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('angles are math convention in y-down coordinates', () => {
  assert.deepEqual(dir(0), { x: 1, y: 0 });
  assert.deepEqual(dir(90), { x: 0, y: -1 });
  const d = dir(45);
  close(d.x, Math.SQRT1_2);
  close(d.y, -Math.SQRT1_2);
  const [x, y] = rotatePoint(1, 0, 90);
  close(x, 0); close(y, -1);
  close(spacingFromHorizontalIntercept(21.72, 45), 21.72 * Math.SQRT1_2);
});

test('constructors validate numbers and styles', () => {
  assert.throws(() => line(0, 0, NaN, 1), /finite/);
  assert.throws(() => circle(0, 0, 0), /r must be > 0/);
  assert.throws(() => polygon([[0, 0], [1, 1]]), />= 3/);
  assert.throws(() => makeStyle({ stroke: 'none', fill: 'none' }), /invisible/);
  assert.throws(() => makeStyle({ dash: [1] }), /dash/);
  assert.throws(() => path([{ op: 'L', x: 0, y: 0 }, { op: 'L', x: 1, y: 1 }]), /first command must be M/);
  assert.throws(() => validatePrimitive({ type: 'rect' }), /unknown type/);
  assert.deepEqual(line(0, 0, 1, 1).style, { stroke: 'ink', fill: 'none', dash: null, dashOffset: 0 });
});

test('bbox of each primitive', () => {
  assert.deepEqual(bbox(line(1, 2, 3, -1)), { minX: 1, minY: -1, maxX: 3, maxY: 2 });
  assert.deepEqual(bbox(circle(5, 5, 2)), { minX: 3, minY: 3, maxX: 7, maxY: 7 });
  const e = bbox(ellipse(0, 0, 2, 1, 90));
  close(e.maxX, 1); close(e.maxY, 2);
  assert.deepEqual(bboxOf([line(0, 0, 1, 1), polyline([[2, 2], [3, -1]])]), { minX: 0, minY: -1, maxX: 3, maxY: 2 });
  assert.throws(() => bboxOf([]), /empty/);
});

test('transform: scale -> mirror -> rotate -> translate', () => {
  const t = transformPrimitive(line(0, 0, 1, 0), { scale: 2, rotate: 90, x: 10, y: 10 });
  close(t.x2, 10); close(t.y2, 8);
  const m = transformPrimitive(polygon([[0, -1], [1, 1], [-1, 1]], { fill: 'ink' }), { mirrorY: true });
  assert.deepEqual(m.points.map(([x, y]) => [x, y + 0]), [[0, 1], [1, -1], [-1, -1]]);
  const el = transformPrimitive(ellipse(0, 0, 2, 1, 10), { mirrorY: true, rotate: 5 });
  close(el.rotation, -5);
  const c = transformPrimitive(circle(1, 0, 1), { scale: 3, x: 1 });
  close(c.cx, 4); close(c.r, 3);
  assert.throws(() => transformPrimitive(circle(0, 0, 1), { scale: -1 }), /scale/);
});

test('circle approximations', () => {
  const p = circlePolygonPoints(0, 0, 2, 4);
  assert.equal(p.length, 4);
  close(p[0][0], 0); close(p[0][1], -2);
  for (const [x, y] of circlePolygonPoints(1, 1, 3.5, 13)) close(Math.hypot(x - 1, y - 1), 3.5);
  const cmds = circleBezierCmds(0, 0, 1);
  assert.equal(cmds.length, 6);
  // midpoint of the first cubic is within 0.03 % of the radius
  const c = cmds[1];
  const mx = 0.125 * 1 + 0.375 * c.x1 + 0.375 * c.x2 + 0.125 * c.x;
  const my = 0.125 * 0 + 0.375 * c.y1 + 0.375 * c.y2 + 0.125 * c.y;
  close(Math.hypot(mx, my), 1, 3e-4);
  assert.throws(() => circlePolygonPoints(0, 0, 1, 2), /n must be/);
});

test('parsePathData: absolute, relative, H/V, implicit lineto, Z', () => {
  const cmds = parsePathData('M1 1 l2 0 V3 h-2 z m1,1 2,2 C0 0 1 1 2 2 q1 1 2 2');
  assert.deepEqual(cmds.slice(0, 5), [
    { op: 'M', x: 1, y: 1 }, { op: 'L', x: 3, y: 1 }, { op: 'L', x: 3, y: 3 }, { op: 'L', x: 1, y: 3 }, { op: 'Z' },
  ]);
  assert.deepEqual(cmds[5], { op: 'M', x: 2, y: 2 });
  assert.deepEqual(cmds[6], { op: 'L', x: 4, y: 4 });
  assert.deepEqual(cmds[8], { op: 'Q', x1: 3, y1: 3, x: 4, y: 4 });
  assert.throws(() => parsePathData('M0 0 A1 1 0 0 1 2 2'), /unsupported command A/);
  assert.throws(() => parsePathData('M0 0 L1'), /missing number/);
  assert.throws(() => parsePathData('M0 0 L1 1 #'), /unexpected/);
});

test('bboxInside tolerance', () => {
  const r = { x: 0, y: 0, width: 10, height: 5 };
  assert.equal(bboxInside({ minX: 0, minY: 0, maxX: 10, maxY: 5 }, r), true);
  assert.equal(bboxInside({ minX: -1e-3, minY: 0, maxX: 1, maxY: 1 }, r), false);
});
