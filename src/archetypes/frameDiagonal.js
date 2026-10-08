/**
 * Archetype `frameDiagonal`. Owner: arch-3 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/frameDiagonal.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { enumOf, fixed, obj } from '../core/schema.js';

const OWNER = 'arch-3';

export const ARCHETYPE = 'frameDiagonal';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: false, motif: false });

export const PARAMS = obj({
  direction: enumOf(['/', '\\', 'x'], 'diagonal(s) between region corners', { required: true }),
  count: enumOf([1, 2], 'lines per diagonal', { default: 1 }),
  gap: fixed('horizontal distance between the two lines when count = 2 (pt) (R3: 2.78)', { min: 0, default: 0 }),
}, 'frame diagonal parameters (design §2.2); not density-scaled');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype frameDiagonal: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype frameDiagonal: period()', OWNER);
}
