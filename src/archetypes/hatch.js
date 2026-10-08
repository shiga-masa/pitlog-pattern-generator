/**
 * Archetype `hatch`. Owner: arch-2 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/hatch.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { angle, arr, enumOf, len, margin, obj, ratio, size, union } from '../core/schema.js';

const OWNER = 'arch-2';

export const ARCHETYPE = 'hatch';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  angle: union([
    angle('line direction (deg, CCW); 0 = horizontal'),
    arr(angle('one direction (deg)'), 'several directions in one layer (R1 §1.16: [45, 135])', { minItems: 1, maxItems: 4 }),
  ], 'line direction(s)', { default: 0 }),
  spacing: len('distance between lines, PERPENDICULAR to them (pt)', { required: true }),
  offset: { type: 'number', unit: 'pt', density: 'length', default: 0, desc: 'perpendicular shift of the line family; 0 = a line through the region centre' },
  cycle: arr(enumOf(['solid', 'dashed'], 'line style'), 'line styles in turn (R1 §1.7, R2 §56)', { minItems: 1, maxItems: 4, default: ['solid'] }),
  dash: size('dash length (pt); required if cycle has dashed'),
  gap: size('gap length (pt); required if cycle has dashed'),
  dashPhase: ratio('dash phase as a fraction of (dash + gap)', { min: 0, max: 1, default: 0 }),
  margin: margin('distance kept from the region edges (pt) (R1 §1.7: 2.85)', { default: 0 }),
}, 'hatch parameters (design §2.2)');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype hatch: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype hatch: period()', OWNER);
}
