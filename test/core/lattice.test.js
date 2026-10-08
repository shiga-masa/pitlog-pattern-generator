import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latticePoints, cycleIndex } from '../../src/core/lattice.js';
import { GeometryError } from '../../src/core/errors.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const R = { x: 0, y: 0, width: 100, height: 50 };
const base = (over = {}) => ({ region: R, pitchX: 10, pitchY: 10, rowOffsetPt: 0, rows: 3, cols: 4, origin: 'center', tileMode: 'frame', ...over });

test('square lattice with centred origin puts the middle row and column at the region centre', () => {
  const pts = latticePoints(base());
  assert.equal(pts.length, 12);
  // cols: 50 + (-15, -5, 5, 15) ; rows: 25 + (-10, 0, 10)
  assert.deepEqual(pts[0], { x: 35, y: 15, row: 0, col: 0 });
  assert.deepEqual(pts[3], { x: 65, y: 15, row: 0, col: 3 });
  assert.deepEqual(pts[11], { x: 65, y: 35, row: 2, col: 3 });
  // middle row is at the region centre height
  close(pts[5].y, 25);
  close(pts[5].x, 45);
});

test('points are returned in row-major order with row and col indices', () => {
  const pts = latticePoints(base({ rows: 2, cols: 2 }));
  assert.deepEqual(pts.map((p) => [p.row, p.col]), [[0, 0], [0, 1], [1, 0], [1, 1]]);
});

test('odd rows are shifted by rowOffsetPt, even rows are not', () => {
  const pts = latticePoints(base({ rowOffsetPt: 5, rows: 2, cols: 2 }));
  close(pts[0].x, 45); // row 0, col 0 (centred: 50 - 5)
  close(pts[2].x, 50); // row 1, col 0 = 45 + 5
  close(pts[3].x, 60); // row 1, col 1 = 55 + 5
});

test('negative rowOffsetPt shifts odd rows the other way', () => {
  const pts = latticePoints(base({ rowOffsetPt: -4.1, rows: 2, cols: 1 }));
  close(pts[1].x, pts[0].x - 4.1);
});

test('staggered lattice with rowOffsetPt equal to half the pitch interleaves columns', () => {
  const pts = latticePoints(base({ rowOffsetPt: 5, rows: 2, cols: 3 }));
  const row0 = pts.filter((p) => p.row === 0).map((p) => p.x);
  const row1 = pts.filter((p) => p.row === 1).map((p) => p.x);
  for (let i = 0; i < 3; i++) close(row1[i] - row0[i], 5);
});

test("rows and cols 'auto' fill the region with centres whose extremes fit the closed region", () => {
  const pts = latticePoints(base({ rows: 'auto', cols: 'auto', rowOffsetPt: 0 }));
  // W = 100, H = 50, pitch 10: 11 cols (0..100), 6 rows (0..50)
  const xs = [...new Set(pts.map((p) => p.x))];
  const ys = [...new Set(pts.map((p) => p.y))];
  assert.equal(xs.length, 11);
  assert.equal(ys.length, 6);
  close(Math.min(...xs), 0);
  close(Math.max(...xs), 100);
  close(Math.min(...ys), 0);
  close(Math.max(...ys), 50);
});

test("rows 'auto' with a non-divisible height stays centred", () => {
  const pts = latticePoints(base({ region: { x: 0, y: 0, width: 100, height: 45 }, rows: 'auto', cols: 1 }));
  // floor(45/10) + 1 = 5 rows centred on 22.5: 2.5 .. 42.5
  assert.equal(pts.length, 5);
  close(pts[0].y, 2.5);
  close(pts[4].y, 42.5);
});

test('an even count of rows is centred as a whole (midpoint at the region centre)', () => {
  const pts = latticePoints(base({ rows: 2, cols: 1 }));
  close(pts[0].y, 20);
  close(pts[1].y, 30);
});

test('topLeft origin puts the first point at half a pitch from the region corner', () => {
  const pts = latticePoints(base({ origin: 'topLeft', rows: 2, cols: 2 }));
  assert.deepEqual([pts[0].x, pts[0].y], [5, 5]);
  assert.deepEqual([pts[3].x, pts[3].y], [15, 15]);
});

test('explicit origin {x, y} puts the first point exactly there', () => {
  const pts = latticePoints(base({ origin: { x: 7, y: 9 }, rows: 1, cols: 2 }));
  assert.deepEqual([pts[0].x, pts[0].y], [7, 9]);
  assert.deepEqual([pts[1].x, pts[1].y], [17, 9]);
});

test('a region with a non-zero origin moves the centred lattice with it', () => {
  const pts = latticePoints(base({ region: { x: 10, y: 20, width: 100, height: 50 }, rows: 1, cols: 1 }));
  assert.deepEqual([pts[0].x, pts[0].y], [60, 45]);
});

test('a single point with rows and cols 1 is the region centre', () => {
  const pts = latticePoints(base({ rows: 1, cols: 1 }));
  assert.deepEqual([pts[0].x, pts[0].y], [50, 25]);
});

test('lattice output is not filtered by the region (edgeMode is applied to instances later)', () => {
  const pts = latticePoints(base({ rows: 1, cols: 20 }));
  assert.equal(pts.length, 20);
  assert.ok(pts.some((p) => p.x < 0));
});

test('invalid pitch, count, origin and offset raise with a reason', () => {
  assert.throws(() => latticePoints(base({ pitchX: 0 })), /pitchX must be a number > 0/);
  assert.throws(() => latticePoints(base({ pitchY: -1 })), /pitchY/);
  assert.throws(() => latticePoints(base({ rows: 0 })), /rows must be 'auto' or an integer >= 1/);
  assert.throws(() => latticePoints(base({ cols: 2.5 })), /cols/);
  assert.throws(() => latticePoints(base({ origin: 'bottomRight' })), /origin must be/);
  assert.throws(() => latticePoints(base({ rowOffsetPt: undefined })), /rowOffsetPt must be a finite number/);
  assert.throws(() => latticePoints(base({ region: { x: 0, y: 0, width: 0, height: 5 } })), /width and height/);
});

test('an unknown key raises and lists the allowed keys', () => {
  assert.throws(() => latticePoints({ ...base(), pitch: 3 }), /unknown key "pitch"; allowed: region, pitchX/);
});

test('an invalid tileMode raises', () => {
  assert.throws(() => latticePoints(base({ tileMode: 'tile' })), /tileMode must be one of frame, period, fit/);
});

test('cycleIndex with assign col alternates along a row and flips with the row', () => {
  assert.equal(cycleIndex(0, 0, 2, 'col', 0), 0);
  assert.equal(cycleIndex(0, 1, 2, 'col', 0), 1);
  assert.equal(cycleIndex(1, 0, 2, 'col', 0), 1); // phase flips on the next row
  assert.equal(cycleIndex(1, 0, 2, 'col', 1), 0);
  assert.equal(cycleIndex(0, 3, 3, 'col', 0), 0); // (3 + 0) mod 3
  assert.equal(cycleIndex(2, 2, 3, 'col', 1), 2); // (2 + 2 + 1) mod 3
});

test('cycleIndex with assign row is constant along a row and changes with each row', () => {
  assert.equal(cycleIndex(0, 0, 2, 'row', 0), 0);
  assert.equal(cycleIndex(0, 5, 2, 'row', 0), 0);
  assert.equal(cycleIndex(1, 5, 2, 'row', 0), 1);
  assert.equal(cycleIndex(2, 0, 2, 'row', 1), 1);
});

test('cycleIndex with assign rowcol uses the x-position index 2*col + row parity (R2 §47, same rule as grid.js)', () => {
  assert.equal(cycleIndex(3, 7, 1, 'rowcol', 0), 0);
  assert.equal(cycleIndex(0, 0, 2, 'rowcol', 0), 0);
  assert.equal(cycleIndex(1, 0, 2, 'rowcol', 0), 1);
  assert.equal(cycleIndex(0, 1, 3, 'rowcol', 0), 2);
  assert.equal(cycleIndex(1, 1, 3, 'rowcol', 1), 1);
});

test('cycleIndex rejects unknown assign values with the candidates listed', () => {
  assert.throws(() => cycleIndex(0, 0, 2, 'diag', 0), /assign must be one of col, row, rowcol/);
});

test('cycleIndex rejects invalid arguments', () => {
  assert.throws(() => cycleIndex(-1, 0, 2, 'col', 0), /row must be/);
  assert.throws(() => cycleIndex(0, 0, 0, 'col', 0), /n must be/);
  assert.throws(() => cycleIndex(0, 0, 2, 'col', 2), /phase must be 0 or 1/);
});
