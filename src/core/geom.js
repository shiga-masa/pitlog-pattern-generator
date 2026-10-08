/**
 * Small geometry helpers that encode the coordinate conventions (CONVENTIONS §2):
 * coordinates are y-down (SVG), angles are math convention (CCW positive as seen on screen).
 */

import { EPS } from './defaults.js';

export const DEG = Math.PI / 180;

/**
 * Unit vector for an angle in degrees, math convention, expressed in y-down coordinates.
 * dir(0) = (1, 0) right; dir(90) = (0, -1) up on screen; dir(45) points up-right.
 * @param {number} deg @returns {{x:number, y:number}}
 */
export function dir(deg) {
  const r = deg * DEG;
  const x = Math.cos(r);
  const y = -Math.sin(r);
  return { x: Math.abs(x) < 1e-15 ? 0 : x, y: Math.abs(y) < 1e-15 ? 0 : y };
}

/**
 * Rotate point (x, y) by `deg` (CCW on screen) about (cx, cy).
 * @returns {[number, number]}
 */
export function rotatePoint(x, y, deg, cx = 0, cy = 0) {
  const r = deg * DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const dx = x - cx;
  const dy = y - cy;
  // y-down: visual CCW rotation is (x, y) -> (x c + y s, -x s + y c)
  return [cx + dx * c + dy * s, cy - dx * s + dy * c];
}

/** Perpendicular spacing <-> intercept conversion: spacing = intercept * |sin(angle)| (design §2.2 hatch). */
export function spacingFromHorizontalIntercept(intercept, deg) {
  return intercept * Math.abs(Math.sin(deg * DEG));
}

/**
 * Is bbox `b` inside rect `r` (closed, with tolerance EPS)? Used by edgeMode 'whole'.
 * @param {{minX:number,minY:number,maxX:number,maxY:number}} b
 * @param {{x:number,y:number,width:number,height:number}} r
 */
export function bboxInside(b, r, eps = EPS) {
  return b.minX >= r.x - eps && b.minY >= r.y - eps && b.maxX <= r.x + r.width + eps && b.maxY <= r.y + r.height + eps;
}

/** Does bbox `b` touch rect `r` at all (with tolerance)? */
export function bboxIntersects(b, r, eps = EPS) {
  return b.maxX >= r.x - eps && b.maxY >= r.y - eps && b.minX <= r.x + r.width + eps && b.minY <= r.y + r.height + eps;
}
