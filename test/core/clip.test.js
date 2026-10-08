import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clipSegment, clipPolyline, keepInstance } from '../../src/core/clip.js';
import { circle, line, polygon } from '../../src/core/primitives.js';
import { GeometryError } from '../../src/core/errors.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const rect = { x: 0, y: 0, width: 10, height: 10 };
const STYLE = { stroke: 'ink' };

test('a segment fully inside is returned unchanged', () => {
  assert.deepEqual(clipSegment(1, 2, 8, 9, rect), [1, 2, 8, 9]);
});

test('a segment fully outside returns null', () => {
  assert.equal(clipSegment(-5, -5, -1, -1, rect), null);
  assert.equal(clipSegment(11, 0, 20, 10, rect), null);
});

test('a segment crossing the rect is cut at the edges', () => {
  assert.deepEqual(clipSegment(-5, 5, 15, 5, rect), [0, 5, 10, 5]);
});

test('a diagonal crossing the rect is cut at both corners-to-edge points', () => {
  const [sx, sy, ex, ey] = clipSegment(-1, -1, 11, 11, rect);
  close(sx, 0); close(sy, 0); close(ex, 10); close(ey, 10);
});

test('a segment with one end inside keeps that end exactly', () => {
  const [sx, sy, ex, ey] = clipSegment(5, 5, 20, 5, rect);
  assert.equal(sx, 5);
  assert.equal(sy, 5);
  close(ex, 10); close(ey, 5);
});

test('a segment parallel to an edge and outside it returns null', () => {
  assert.equal(clipSegment(-1, 0, -1, 10, rect), null);
});

test('a segment running along an edge is kept (closed rect)', () => {
  assert.deepEqual(clipSegment(0, 0, 0, 10, rect), [0, 0, 0, 10]);
});

test('clipSegment rejects non-finite coordinates and a bad rect', () => {
  assert.throws(() => clipSegment(0, 0, NaN, 1, rect), /finite/);
  assert.throws(() => clipSegment(0, 0, 1, 1, { x: 0, y: 0, width: 0, height: 1 }), /width and height/);
});

test('a polyline fully inside stays one piece with the same vertices', () => {
  const pts = [[1, 1], [5, 2], [9, 9]];
  assert.deepEqual(clipPolyline(pts, rect), [pts]);
});

test('a polyline that leaves and re-enters the rect is split into two pieces', () => {
  // (5,5)->(15,5) exits at x=10; (15,8)->(5,8) re-enters at x=10
  const pieces = clipPolyline([[5, 5], [15, 5], [15, 8], [5, 8]], rect);
  assert.equal(pieces.length, 2);
  assert.deepEqual(pieces[0], [[5, 5], [10, 5]]);
  assert.deepEqual(pieces[1], [[10, 8], [5, 8]]);
});

test('an inside vertex between two clipped segments keeps a single piece', () => {
  // enters from below at (5,0), vertex (5,5) inside, leaves at (10,5)
  const pieces = clipPolyline([[5, -5], [5, 5], [20, 5]], rect);
  assert.equal(pieces.length, 1);
  assert.deepEqual(pieces[0], [[5, 0], [5, 5], [10, 5]]);
});

test('a polyline entirely outside yields no pieces', () => {
  assert.deepEqual(clipPolyline([[-5, -5], [-1, -9], [-3, -2]], rect), []);
});

test('clipPolyline rejects fewer than two points and malformed points', () => {
  assert.throws(() => clipPolyline([[1, 1]], rect), />= 2 points/);
  assert.throws(() => clipPolyline([[1, 1], [2]], rect), /point 1 must be/);
});

test("keepInstance with 'whole' keeps an instance whose bbox is inside the rect", () => {
  assert.equal(keepInstance([circle(5, 5, 4, STYLE)], rect, 'whole'), true);
});

test("keepInstance with 'whole' drops an instance that crosses the edge", () => {
  assert.equal(keepInstance([circle(5, 5, 6, STYLE)], rect, 'whole'), false);
  assert.equal(keepInstance([line(-1, 5, 3, 5, STYLE)], rect, 'whole'), false);
});

test("keepInstance with 'whole' tolerates a bbox that exceeds the edge by less than EPS (1e-6 pt)", () => {
  assert.equal(keepInstance([circle(5, 5, 5 + 5e-7, STYLE)], rect, 'whole'), true);
  assert.equal(keepInstance([circle(5, 5, 5.001, STYLE)], rect, 'whole'), false);
});

test("keepInstance with 'clip' keeps an instance that touches the rect", () => {
  assert.equal(keepInstance([circle(5, 5, 6, STYLE)], rect, 'clip'), true);
  assert.equal(keepInstance([line(-1, 5, 3, 5, STYLE)], rect, 'clip'), true);
});

test("keepInstance with 'clip' drops an instance wholly outside the rect", () => {
  assert.equal(keepInstance([circle(-20, -20, 3, STYLE)], rect, 'clip'), false);
});

test('keepInstance uses the union bbox of several primitives', () => {
  const prims = [polygon([[1, 1], [3, 1], [3, 3]], { fill: 'ink' }), line(9, 9, 12, 9, STYLE)];
  assert.equal(keepInstance(prims, rect, 'whole'), false);
  assert.equal(keepInstance(prims, rect, 'clip'), true);
});

test('keepInstance raises on an empty instance instead of skipping it', () => {
  assert.throws(() => keepInstance([], rect, 'whole'), GeometryError);
});

test('keepInstance raises on an unknown edgeMode with the allowed values', () => {
  assert.throws(() => keepInstance([circle(5, 5, 1, STYLE)], rect, 'auto'), /edgeMode must be 'whole' or 'clip'/);
});
