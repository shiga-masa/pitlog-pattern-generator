/**
 * Clipping to the region and edgeMode handling.
 * Owner: core-A (stage 1). Contract: docs/CONVENTIONS.md §3.
 * Renderers clip visually with the frame clipPath; these functions are for archetypes that need
 * geometric clipping (hatch margins, lines that must stop at the frame edge, edgeMode 'whole').
 *
 * The rect is closed: points on its edge are inside. No outward tolerance is applied to the rect
 * itself (clipping never extends geometry); the tolerance EPS is used only by the bbox tests.
 */

import { bboxOf } from './primitives.js';
import { bboxInside, bboxIntersects } from './geom.js';
import { GeometryError } from './errors.js';

/** Parameter tolerance: a clip parameter this close to 0 or 1 counts as "not clipped". */
const T_TOL = 1e-12;

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

function checkRect(rect, name) {
  if (!rect || typeof rect !== 'object') throw new TypeError(`${name}: rect must be {x, y, width, height}`);
  for (const k of ['x', 'y', 'width', 'height']) {
    if (!isFiniteNumber(rect[k])) throw new TypeError(`${name}: rect.${k} must be a finite number, got ${rect[k]}`);
  }
  if (!(rect.width > 0) || !(rect.height > 0)) throw new RangeError(`${name}: rect width and height must be > 0`);
}

/**
 * Liang–Barsky: parameters [t0, t1] of the part of segment a->b inside the rect, or null.
 * @returns {{t0:number, t1:number} | null}
 */
function clipParams(x1, y1, x2, y2, rect) {
  const xmin = rect.x;
  const xmax = rect.x + rect.width;
  const ymin = rect.y;
  const ymax = rect.y + rect.height;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null; // parallel to this edge and outside it
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return { t0, t1 };
}

/**
 * Clip a segment to an axis-aligned rect (Liang–Barsky).
 * Endpoints that are not clipped keep their input values exactly.
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @param {{x:number,y:number,width:number,height:number}} rect
 * @returns {[number, number, number, number] | null} null when fully outside
 */
export function clipSegment(x1, y1, x2, y2, rect) {
  checkRect(rect, 'clipSegment');
  for (const v of [x1, y1, x2, y2]) if (!isFiniteNumber(v)) throw new TypeError(`clipSegment: coordinates must be finite, got ${v}`);
  const r = clipParams(x1, y1, x2, y2, rect);
  if (!r) return null;
  const { t0, t1 } = r;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const sx = t0 <= T_TOL ? x1 : x1 + t0 * dx;
  const sy = t0 <= T_TOL ? y1 : y1 + t0 * dy;
  const ex = t1 >= 1 - T_TOL ? x2 : x1 + t1 * dx;
  const ey = t1 >= 1 - T_TOL ? y2 : y1 + t1 * dy;
  return [sx, sy, ex, ey];
}

/** Shortest clipped segment kept by clipSegmentProper (pt): a line that only touches a corner is dropped. */
export const MIN_SEGMENT_LENGTH = 1e-6;

/**
 * clipSegment, but a segment that only touches the rect (a point, e.g. a 45° hatch line through a
 * corner) counts as outside (null). Without this a round cap would paint a dot. Stage 2.
 * @returns {[number, number, number, number] | null}
 */
export function clipSegmentProper(x1, y1, x2, y2, rect) {
  const s = clipSegment(x1, y1, x2, y2, rect);
  if (!s) return null;
  return Math.hypot(s[2] - s[0], s[3] - s[1]) > MIN_SEGMENT_LENGTH ? s : null;
}

/**
 * Clip a polyline; may split into several pieces.
 * A piece continues across an original vertex that lies inside the rect; it is cut where a segment
 * leaves the rect. Segments that lie fully outside produce no piece. Pieces keep the input order.
 * @param {Array<[number, number]>} points @param {{x:number,y:number,width:number,height:number}} rect
 * @returns {Array<Array<[number, number]>>}
 */
export function clipPolyline(points, rect) {
  checkRect(rect, 'clipPolyline');
  if (!Array.isArray(points) || points.length < 2) throw new RangeError('clipPolyline: needs >= 2 points');
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!Array.isArray(p) || p.length !== 2 || !isFiniteNumber(p[0]) || !isFiniteNumber(p[1])) {
      throw new TypeError(`clipPolyline: point ${i} must be [x, y] with finite numbers`);
    }
  }
  const pieces = [];
  let cur = null;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const r = clipParams(ax, ay, bx, by, rect);
    if (!r) {
      if (cur) pieces.push(cur);
      cur = null;
      continue;
    }
    const { t0, t1 } = r;
    const dx = bx - ax;
    const dy = by - ay;
    const startUnclipped = t0 <= T_TOL;
    const endUnclipped = t1 >= 1 - T_TOL;
    const start = startUnclipped ? [ax, ay] : [ax + t0 * dx, ay + t0 * dy];
    const end = endUnclipped ? [bx, by] : [ax + t1 * dx, ay + t1 * dy];
    if (cur && startUnclipped) {
      cur.push(end);
    } else {
      if (cur) pieces.push(cur);
      cur = [start, end];
    }
    if (!endUnclipped) {
      pieces.push(cur);
      cur = null;
    }
  }
  if (cur) pieces.push(cur);
  return pieces;
}

/**
 * Apply edgeMode to one placed instance (its primitives in region coordinates).
 * 'whole': keep only if the geometric bbox is inside the rect (core/geom.bboxInside); 'clip': keep if it touches.
 * The bbox is core/primitives.bboxOf, so a path's bbox is the hull of its control points (conservative
 * for Bézier segments).
 * @param {object[]} prims @param {{x:number,y:number,width:number,height:number}} rect @param {'whole'|'clip'} edgeMode
 * @returns {boolean} true = draw
 */
export function keepInstance(prims, rect, edgeMode) {
  checkRect(rect, 'keepInstance');
  if (edgeMode !== 'whole' && edgeMode !== 'clip') {
    throw new RangeError(`keepInstance: edgeMode must be 'whole' or 'clip', got ${JSON.stringify(edgeMode)}`);
  }
  if (!Array.isArray(prims) || prims.length === 0) {
    throw new GeometryError('keepInstance: instance has no primitives (an empty instance is a bug, not a skip)');
  }
  const b = bboxOf(prims);
  return edgeMode === 'whole' ? bboxInside(b, rect) : bboxIntersects(b, rect);
}
