/**
 * Archetype `wave`. Owner: arch-3 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/wave.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { angle, autoCount, enumOf, len, margin, obj, ratio, size } from '../core/schema.js';

const OWNER = 'arch-3';

export const ARCHETYPE = 'wave';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  angle: angle('direction of the wave lines (deg, CCW)', { default: 0 }),
  wavelength: len('wavelength along the line (pt)', { required: true }),
  amplitude: size('half crest-to-trough height (pt)', { required: true }),
  lineSpacing: len('distance between wave lines, PERPENDICULAR to them (pt)', { required: true }),
  lines: autoCount('number of wave lines; auto = fill the region', { default: 'auto' }),
  waveform: enumOf(['sine', 'trapezoid'], 'wave shape', { default: 'sine' }),
  flat: len('trapezoid: flat part length (pt) (R2 §35: 7.0)'),
  rampDx: len('trapezoid: ramp horizontal length (pt)'),
  rampDy: size('trapezoid: ramp vertical rise (pt)'),
  doubleGap: { type: 'number', unit: 'pt', density: 'motif', min: 0, default: 0, desc: 'distance of the second parallel line; 0 = single line (R2 §33: 0.93)' },
  phase: ratio('phase as a fraction of the wavelength', { min: 0, max: 1, default: 0 }),
  margin: margin('distance kept from the region edges (pt)', { default: 0 }),
}, 'wave parameters (design §2.2)');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype wave: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype wave: period()', OWNER);
}
