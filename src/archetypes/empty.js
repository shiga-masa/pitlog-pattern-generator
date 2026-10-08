/**
 * Archetype `empty`. Owner: arch-4 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/empty.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { obj } from '../core/schema.js';

export const ARCHETYPE = 'empty';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: false, motif: false });

export const PARAMS = obj({}, 'empty has no parameters');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  return { primitives: [], placed: 0, skipped: 0, warnings: [], anchors: [] };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * Nothing is drawn, so any cell serves as the period: one frame.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  return { w: ctx.region.width, h: ctx.region.height };
}
