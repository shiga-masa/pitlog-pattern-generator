/**
 * Free-form glyph motifs rebuilt parametrically (design §1.4 b2): ptGlyph, vein, blob,
 * plus user-supplied `path` (design §1.4 b3).
 * Owner: motif-2 (stage 1). Builder contract: see src/motifs/basic.js header and CONVENTIONS §7.3.
 * Source vertex lists are NOT shipped and must not be used: only the dimensions listed here.
 * `blob` uses ctx.rng (seeded); never Math.random().
 */

import { NotImplementedError } from '../core/errors.js';
import { obj, size, angle, vec, count, ratio, PAINT } from '../core/schema.js';

const OWNER = 'motif-2';

export const KINDS = {
  ptGlyph: obj({
    stemLen: size('stem height (pt)', { required: true }),
    armLen: size('right arm width (pt)', { required: true }),
  }, 'highly-organic-soil glyph (R3)'),
  vein: obj({
    chord: size('chord length of each S curve (pt)', { required: true }),
    height: size('extent across the chord (pt)', { required: true }),
    secondOffset: vec('motif', 'translation of the second curve (pt)', { required: true }),
    rungs: count('number of cross strokes', { min: 0, required: true }),
    rungLengthMin: size('shortest cross stroke (pt)', { required: true }),
    rungLengthMax: size('longest cross stroke (pt)', { required: true }),
  }, 'mineral vein (R2 §59)'),
  blob: obj({
    w: size('bbox full width (pt)', { required: true }),
    h: size('bbox full height (pt)', { required: true }),
    vertices: count('vertex count', { min: 3, default: 17 }),
    irregularity: ratio('radial perturbation as a fraction of the radius; unmeasured (null) must be set by the preset', { min: 0, max: 1, nullable: true, default: null }),
    rotation: angle('rotation (deg); unmeasured in R1 §4.6', { nullable: true, default: null }),
    fill: PAINT('fill paint', { required: true }),
  }, 'irregular polygon for breccia (R1 §1.3)'),
  path: obj({
    d: { type: 'string', pattern: /\S/, required: true, desc: 'SVG path data, local coordinates in pt (M L H V C Q Z)' },
    fill: PAINT('fill paint', { default: 'none' }),
  }, 'user-supplied path (design §1.4 b3)'),
};

export const BUILDERS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif, ctx) => {
  throw new NotImplementedError(`motif ${k}: build()`, OWNER);
}]));

export const EXTENTS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif) => {
  throw new NotImplementedError(`motif ${k}: extent()`, OWNER);
}]));
