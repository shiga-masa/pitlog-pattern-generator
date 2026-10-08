/**
 * Clipping to the region and edgeMode handling.
 * Owner: core-A (stage 1). Contract: docs/CONVENTIONS.md §3.
 * Renderers clip visually with the frame clipPath; these functions are for archetypes that need
 * geometric clipping (hatch margins, lines that must stop at the frame edge, edgeMode 'whole').
 */

import { NotImplementedError } from './errors.js';

const OWNER = 'core-A';

/**
 * Clip a segment to an axis-aligned rect (Liang–Barsky).
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @param {{x:number,y:number,width:number,height:number}} rect
 * @returns {[number, number, number, number] | null} null when fully outside
 */
export function clipSegment(x1, y1, x2, y2, rect) {
  throw new NotImplementedError('clip.clipSegment()', OWNER);
}

/**
 * Clip a polyline; may split into several pieces.
 * @param {Array<[number, number]>} points @param {{x:number,y:number,width:number,height:number}} rect
 * @returns {Array<Array<[number, number]>>}
 */
export function clipPolyline(points, rect) {
  throw new NotImplementedError('clip.clipPolyline()', OWNER);
}

/**
 * Apply edgeMode to one placed instance (its primitives in region coordinates).
 * 'whole': keep only if the geometric bbox is inside the rect (core/geom.bboxInside); 'clip': keep if it touches.
 * @param {object[]} prims @param {{x:number,y:number,width:number,height:number}} rect @param {'whole'|'clip'} edgeMode
 * @returns {boolean} true = draw
 */
export function keepInstance(prims, rect, edgeMode) {
  throw new NotImplementedError('clip.keepInstance()', OWNER);
}
