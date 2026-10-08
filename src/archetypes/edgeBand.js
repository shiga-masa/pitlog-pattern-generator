/**
 * Archetype `edgeBand`. Owner: arch-5 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/edgeBand.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { autoCount, enumOf, fixed, len, obj } from '../core/schema.js';

const OWNER = 'arch-5';

export const ARCHETYPE = 'edgeBand';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'required';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: false });

export const PARAMS = obj({
  bandWidth: fixed('band width (pt); not density-scaled (design §3.2)', { exclusiveMin: 0, default: 6.92 }),
  sides: enumOf(['both', 'left', 'right'], 'which side(s); right band is a translation of the left (R2 §62)', { default: 'both' }),
  pitchY: len('vertical pitch of motifs in the band (pt)', { required: true }),
  rows: autoCount('motifs per band; auto = fill the region', { default: 'auto' }),
  bandFrame: obj({
    stroke: enumOf(['ink', 'none'], 'band outline', { default: 'ink' }),
    fill: enumOf(['paper', 'none'], 'band ground', { default: 'paper' }),
    lineWidth: fixed('band outline width (pt) (R2 §62: 0.238)', { min: 0.05, max: 2, default: 0.238 }),
  }, 'band outline and ground', { default: {} }),
}, 'edge band parameters (design §2.2); motif is not density-scaled');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype edgeBand: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype edgeBand: period()', OWNER);
}
