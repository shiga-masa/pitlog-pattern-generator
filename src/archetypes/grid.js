/**
 * Archetype `grid`. Owner: arch-1 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/grid.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { NotImplementedError } from '../core/errors.js';
import { LAYER_ID_PATTERN, angle, arr, autoCount, bool, enumOf, len, motif, obj, ratio, union } from '../core/schema.js';

const OWNER = 'arch-1';

export const ARCHETYPE = 'grid';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'motifOrCycle';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  pitchX: len('horizontal pitch between instances of the same row (pt)', { required: true }),
  pitchY: len('vertical pitch between rows (pt)', { required: true }),
  rowOffset: union([
    ratio('shift of odd rows as a fraction of pitchX (0.5 = staggered)', { min: -1, max: 1 }),
    obj({ pt: len('shift of odd rows (pt), e.g. 4.77 (R3 cohesive soil), -4.1 (R2 §36)', { exclusiveMin: undefined, required: true }) }, 'shift in pt'),
  ], 'odd-row shift (R1 §4.1-6)', { default: 0 }),
  rows: autoCount('number of rows; auto = fill the region', { default: 'auto' }),
  cols: autoCount('number of columns; auto = fill the region', { default: 'auto' }),
  cycle: arr(motif('one motif of the cycle'), 'motifs assigned in turn (replaces layer.motif)', { minItems: 1, maxItems: 4 }),
  assign: enumOf(['col', 'row', 'rowcol'], 'how cycle entries are assigned (design §2.2 grid)', { default: 'col' }),
  phase: enumOf([0, 1], 'start index of the cycle (R1 §2.3)', { default: 0 }),
  flipRows: bool('mirror every other row upside down (R3 Kanto loam)', { default: false }),
  rotations: arr(arr(angle('rotation (deg)'), 'rotations along a row, cycled', { minItems: 1 }), 'per row parity: [[even-row rotations], [odd-row rotations]] (R2 §47)', { minItems: 1, maxItems: 2 }),
  avoid: { type: 'string', pattern: LAYER_ID_PATTERN, desc: 'id of an earlier layer whose lattice points are skipped (R1 §2.10)' },
  edgeMode: enumOf(['whole', 'clip'], 'whole = draw only instances fully inside the region; clip = draw all, clipped', { default: 'whole' }),
}, 'grid parameters (design §2.2)');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  throw new NotImplementedError('archetype grid: render()', OWNER);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  throw new NotImplementedError('archetype grid: period()', OWNER);
}
