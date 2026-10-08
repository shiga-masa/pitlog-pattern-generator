/**
 * Basic motifs: circle, dot, ellipse, triangle, hline, seg.
 * Owner: motif-1 (stage 1). Contract: docs/CONVENTIONS.md §7.3.
 *
 * Builder contract (all motif files):
 *   build(motif, ctx) -> Primitive[] in LOCAL coordinates, centred on the motif's
 *   geometric bounding-box centre (0, 0), unrotated except by the motif's own rotation field.
 *   Sizes in `motif` are already density-scaled; do not scale again.
 *   ctx = { strokeWidth:number, rng:Rng }   (rng only for motifs that need randomness)
 *   extent(motif) -> { w, h }  geometric bbox size (without stroke).
 *   Never return []: throw GeometryError if a parameter set cannot be drawn.
 */

import { NotImplementedError } from '../core/errors.js';
import { obj, size, angle, enumOf, PAINT } from '../core/schema.js';

const OWNER = 'motif-1';

/** Field descriptors per kind (the `kind` key itself is added by motifs/index.js). */
export const KINDS = {
  circle: obj({
    d: size('diameter (pt)', { required: true }),
    fill: PAINT('ink = filled, paper = paper-filled with ink outline, none = outline only', { required: true }),
    polygonSides: { type: 'integer', unit: 'count', density: 'none', min: 3, nullable: true, default: null, desc: 'null = true circle (design §2.3); n = regular n-gon' },
  }, 'circle (R1 §1.1, R3 gravel)'),
  dot: obj({
    d: size('diameter (pt); always ink-filled', { required: true }),
  }, 'dot = circle filled with ink (R1 §1.4)'),
  ellipse: obj({
    w: size('full width before rotation (pt)', { required: true }),
    h: size('full height before rotation (pt)', { required: true }),
    rotation: angle('rotation (deg, CCW)', { default: 0 }),
    fill: PAINT('fill paint', { required: true }),
  }, 'ellipse (R3 boulders)'),
  triangle: obj({
    base: size('base width (pt)', { required: true }),
    height: size('height (pt)', { required: true }),
    fill: PAINT('fill paint', { required: true }),
    apex: enumOf(['up', 'down'], 'apex direction', { default: 'up' }),
  }, 'isosceles triangle (R1 §2.1, R2 §1)'),
  hline: obj({
    length: size('length (pt)', { required: true }),
  }, 'horizontal segment (R1 §1.6)'),
  seg: obj({
    length: size('length (pt)', { required: true }),
    angle: angle('direction (deg, CCW)', { default: 0 }),
  }, 'straight segment at an angle'),
};

export const BUILDERS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif, ctx) => {
  throw new NotImplementedError(`motif ${k}: build()`, OWNER);
}]));

export const EXTENTS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif) => {
  throw new NotImplementedError(`motif ${k}: extent()`, OWNER);
}]));
