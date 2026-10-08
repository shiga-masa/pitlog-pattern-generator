/**
 * Curve motifs: waveUnit (~), shell, lens, hook, X.
 * Owner: motif-2 (stage 1). Builder contract: see src/motifs/basic.js header and CONVENTIONS §7.3.
 * Check every value against R2 §62–§66 / R3 before implementing; report unclear semantics, do not guess.
 */

import { NotImplementedError } from '../core/errors.js';
import { obj, size, vec, count } from '../core/schema.js';

const OWNER = 'motif-2';

export const KINDS = {
  waveUnit: obj({
    halfWidth: size('half of the unit width (pt); unit width = 2 * halfWidth', { required: true }),
    height: size('full height crest-to-trough (pt)', { required: true }),
  }, 'one "~" unit (R3 volcanic-ash symbols; also table 3-9 band (1))'),
  shell: obj({
    paperW: size('paper ellipse full width (pt)', { required: true }),
    paperH: size('paper ellipse full height (pt)', { required: true }),
    inkW: size('ink ellipse full width (pt)', { required: true }),
    inkH: size('ink ellipse full height (pt)', { required: true }),
    inkOffset: vec('motif', 'ink ellipse centre relative to the paper ellipse centre (pt)', { required: true }),
  }, 'shell = paper ellipse + ink ellipse (R3 shell-bearing)'),
  lens: obj({
    arcWidth: size('arc chord (pt)', { required: true }),
    arcHeight: size('arc height (pt)', { required: true }),
    arcs: count('number of arcs', { min: 1, default: 2 }),
    shift: vec('motif', 'shift between successive arcs (pt)', { required: true }),
  }, 'lens arcs (R2 §63)'),
  hook: obj({
    outerLen: size('stroke from the outer edge (pt)', { required: true }),
    innerLen: size('stroke from the inner edge (pt)', { required: true }),
    drop: size('vertical drop between the two strokes (pt)', { required: true }),
  }, 'hook joined by an S curve (R2 §64)'),
  X: obj({
    width: size('full width (pt)', { required: true }),
    height: size('full height (pt)', { required: true }),
  }, 'X spanning a box (R2 §65)'),
};

export const BUILDERS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif, ctx) => {
  throw new NotImplementedError(`motif ${k}: build()`, OWNER);
}]));

export const EXTENTS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif) => {
  throw new NotImplementedError(`motif ${k}: extent()`, OWNER);
}]));
