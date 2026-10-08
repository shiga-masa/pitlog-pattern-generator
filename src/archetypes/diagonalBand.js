/**
 * Archetype `diagonalBand`. Owner: arch-5 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/diagonalBand.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { angle, count, enumOf, len, obj, ratio, union, vec } from '../core/schema.js';

const OWNER = 'arch-5';

export const ARCHETYPE = 'diagonalBand';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'required';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  angle: angle('band direction (deg); null = atan(height/width) of the region', { nullable: true, default: null }),
  bands: count('number of bands (3 = -ic, 1 = mixed, 2 = organic)', { min: 1, required: true }),
  bandSpacing: len('distance between bands, perpendicular (pt); required if bands > 1'),
  alongPitch: len('pitch of motifs along a band (pt)'),
  step: vec('length', 'explicit step between successive motifs (pt); overrides alongPitch direction (R3 volcanic-ash: (7.07, -2.83))'),
  bandShift: vec('length', 'explicit shift between bands (pt) (R3 organic: (2.83, 2.85))'),
  bandPhase: ratio('along-band phase shift per band, fraction of alongPitch', { min: 0, max: 1, default: 0 }),
  elementAngle: union([enumOf(['band'], 'parallel to the band'), angle('fixed angle (deg)')], 'motif rotation', { default: 'band' }),
  edgeMode: enumOf(['auto', 'whole', 'clip'], 'auto = line motifs clip, closed motifs whole (R3 §4)', { default: 'auto' }),
}, 'diagonal band parameters (design §2.2)');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype diagonalBand: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype diagonalBand: period()', OWNER);
}
