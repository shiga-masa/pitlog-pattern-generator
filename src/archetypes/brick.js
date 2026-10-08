/**
 * Archetype `brick`. Owner: arch-2 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/brick.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { angle, enumOf, len, obj, ratio } from '../core/schema.js';

const OWNER = 'arch-2';

export const ARCHETYPE = 'brick';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  courseHeight: len('distance between course lines, perpendicular (pt)', { required: true }),
  brickLength: len('distance between joints along a course (pt)', { required: true }),
  jointAngle: angle('joint angle to the course (deg); 90 = perpendicular (R1 §1.14: 52)', { min: 1, max: 179, default: 90 }),
  stagger: ratio('joint shift between courses as a fraction of brickLength', { min: 0, max: 1, default: 0.5 }),
  angle: angle('rotation of the whole brick field (deg, CCW) (R2 §41: 45)', { default: 0 }),
  jointInset: { type: 'number', unit: 'pt', density: 'motif', min: 0, default: 0, desc: 'gap between joint ends and course lines (pt) (R2 §41: 0.3)' },
  courseExtent: enumOf(['full'], 'course lines span the full region (R1 §1.12)', { default: 'full' }),
}, 'brick parameters (design §2.2)');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype brick: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype brick: period()', OWNER);
}
