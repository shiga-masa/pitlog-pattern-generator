/**
 * Canvas 2D backend (design §5.1, §5.7): draws the same primitive list as render/svg.js.
 * Owner: render-2 (stage 1). Contract: docs/CONVENTIONS.md §5, §7.
 * Colours: only ink and paper; no globalAlpha other than 1; no gradients.
 */

import { NotImplementedError } from '../core/errors.js';

const OWNER = 'render-2';

/**
 * Draw a pattern into ctx inside rect (device pixels).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string|object} input preset id/query or full spec
 * @param {object} options render options
 * @param {{x:number,y:number,width:number,height:number}} rect pixels
 * @returns {Promise<{meta:object}>}
 */
export async function renderCanvas(ctx, input, options, rect) {
  throw new NotImplementedError('renderCanvas()', OWNER);
}

/**
 * Draw an already-built primitive list (pt) with a pt->px scale.
 * @param {CanvasRenderingContext2D} ctx @param {object[]} primitives
 * @param {{ink:string, paper:string, strokeWidth:number, cap:string, join:string, scale:number}} o
 */
export function drawPrimitives(ctx, primitives, o) {
  throw new NotImplementedError('drawPrimitives()', OWNER);
}
