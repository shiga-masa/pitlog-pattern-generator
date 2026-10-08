/**
 * SVG <pattern> output for seamless tiling (design §5.1, §5.5).
 * Owner: render-1 (stage 1). Contract: docs/CONVENTIONS.md §3.3, §5, §7.
 * Must reuse the utilities in render/svg.js (fmt, attrs, primitiveToSVG); do not re-implement them.
 */

import { NotImplementedError } from '../core/errors.js';

const OWNER = 'render-1';

/**
 * @param {string|object} input preset id/query or full spec
 * @param {object} [options] render options; tileMode defaults to 'period' here
 * @param {object} [deps]
 * @returns {Promise<{defs:string, ref:string, tile:{w:number,h:number}, meta:object}>}
 *   defs = '<pattern id=... patternUnits="userSpaceOnUse">...</pattern>', ref = 'url(#...)'
 */
export async function renderSVGPattern(input, options = {}, deps = {}) {
  throw new NotImplementedError('renderSVGPattern()', OWNER);
}

/**
 * Period tile of a resolved spec: least common period of all layers (archetype.period()).
 * When no common period exists within ±5 %, fall back to 'fit' and add a warning (design §5.5).
 * @param {object} drawSpec @param {object} ctx
 * @returns {{w:number, h:number, warnings:string[]}}
 */
export function computeTile(drawSpec, ctx) {
  throw new NotImplementedError('computeTile()', OWNER);
}
