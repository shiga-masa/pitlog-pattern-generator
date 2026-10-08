/**
 * Archetype `scatter`. Owner: arch-4 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/scatter.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { angle, arr, enumOf, fixed, obj, ratio, size } from '../core/schema.js';

const OWNER = 'arch-4';

export const ARCHETYPE = 'scatter';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  count: { type: 'integer', unit: 'count', density: 'area', min: 0, required: true, desc: 'segments per frame; scales with density^2 (design §3.2)' },
  length: size('median segment length (pt)', { required: true }),
  lengthJitter: { type: 'number', unit: 'pt', density: 'motif', min: 0, default: 0, desc: 'half-range of the uniform length variation (pt)' },
  angles: arr(obj({
    deg: angle('segment direction (deg, CCW)', { required: true }),
    weight: ratio('relative frequency', { exclusiveMin: 0, required: true }),
  }, 'one direction class'), 'direction classes with weights (R2 §18)', { minItems: 1, required: true }),
  minDistance: { type: 'number', unit: 'pt', density: 'length', min: 0, nullable: true, default: null, desc: 'minimum centre distance (pt); unmeasured, null = no constraint' },
  margin: fixed('distance of segment ends from the region edges (pt)', { min: 0, default: 2.0 }),
  sampling: enumOf(['jitteredGrid', 'poisson', 'uniform'], 'placement method (design §1.4 a2)', { default: 'jitteredGrid' }),
  points: arr(obj({
    x: fixed('centre x (pt)', { required: true }),
    y: fixed('centre y (pt)', { required: true }),
    len: fixed('length (pt)', { exclusiveMin: 0 }),
    angle: angle('direction (deg)'),
  }, 'one user segment'), 'user-supplied segments; disables random placement (design §1.4 a3)'),
}, 'scatter parameters (design §2.2)');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype scatter: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype scatter: period()', OWNER);
}
