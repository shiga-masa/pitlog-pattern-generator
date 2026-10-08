/**
 * Archetype `symbol`. Owner: arch-4 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/symbol.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { arr, enumOf, obj, ratio, vec } from '../core/schema.js';

const OWNER = 'arch-4';

export const ARCHETYPE = 'symbol';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'required';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: false, motif: false });

export const PARAMS = obj({
  anchor: enumOf(['center', 'topLeft'], 'reference point in the region', { default: 'center' }),
  offsets: arr(vec('none', 'offset from the anchor (pt)'), 'one placement per offset (R3 boulders: 2)', { minItems: 1, default: [{ x: 0, y: 0 }] }),
  scale: ratio('uniform scale of the motif', { exclusiveMin: 0, default: 1 }),
}, 'symbol parameters (design §2.2); never tiled, not density-scaled');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype symbol: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype symbol: period()', OWNER);
}
