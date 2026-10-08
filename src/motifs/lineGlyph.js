/**
 * Line glyph motifs: lineGlyph (+, ╪, #, ⊥, T, 卄, ×), L, chevron (V/^/</>),
 * splitChevron (Λ with a gap), parallelPair (＝), pairVline (‖).
 * Owner: motif-1 (stage 1). Builder contract: see src/motifs/basic.js header and CONVENTIONS §7.3.
 */

import { NotImplementedError } from '../core/errors.js';
import { obj, size, angle, enumOf, count } from '../core/schema.js';

const OWNER = 'motif-1';
const OPEN = (desc, extra) => enumOf(['up', 'down', 'left', 'right'], desc, extra);

export const KINDS = {
  lineGlyph: obj({
    hLines: count('number of horizontal strokes (0..3)', { max: 3, default: 0 }),
    hLen: size('horizontal stroke length (pt); required when hLines > 0'),
    hGap: size('gap between horizontal strokes (pt)', { exclusiveMin: undefined, min: 0, default: 0 }),
    vLines: count('number of vertical strokes (0..3)', { max: 3, default: 0 }),
    vLen: size('vertical stroke length (pt); required when vLines > 0'),
    vGap: size('gap between vertical strokes (pt)', { exclusiveMin: undefined, min: 0, default: 0 }),
    vAnchor: enumOf(['center', 'top', 'bottom'], 'where vertical strokes meet the horizontal ones (⊥ = bottom, T = top)', { default: 'center' }),
    rotation: angle('rotation of the whole glyph (deg, CCW); 45 gives ×', { default: 0 }),
  }, 'cross-type glyph (R1 §3.1–3.12, R2 §42, §50, §51)'),
  L: obj({
    vLen: size('vertical arm (pt)', { required: true }),
    hLen: size('horizontal arm (pt)', { required: true }),
    corner: enumOf(['bottomLeft', 'bottomRight', 'topLeft', 'topRight'], 'corner where arms meet', { default: 'bottomLeft' }),
  }, 'L glyph (R1 §3.13)'),
  chevron: obj({
    width: size('opening width (pt)', { required: true }),
    depth: size('apex depth (pt)', { required: true }),
    open: OPEN('side the chevron opens to (V = up, ^ = down, > = left)', { required: true }),
  }, 'chevron with joined apex (R1 §3.16, R2 §25, §40)'),
  splitChevron: obj({
    legLength: size('leg length (pt)', { required: true }),
    legAngle: angle('leg angle from the horizontal (deg)', { required: true }),
    apexGap: size('gap between the legs at the apex (pt)', { exclusiveMin: undefined, min: 0, required: true }),
    open: OPEN('side the chevron opens to (Λ = down)', { required: true }),
  }, 'chevron with separated legs (R2 §9, §15, R3 Kanto loam)'),
  parallelPair: obj({
    length: size('stroke length (pt)', { required: true }),
    gap: size('distance between the strokes (pt)', { required: true }),
    rotation: angle('rotation (deg, CCW); 0 = horizontal ＝', { default: 0 }),
  }, '＝ (R2 §47)'),
  pairVline: obj({
    length: size('stroke length (pt)', { required: true }),
    gap: size('distance between the strokes (pt)', { required: true }),
  }, '‖ (R3 organic soil)'),
};

export const BUILDERS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif, ctx) => {
  throw new NotImplementedError(`motif ${k}: build()`, OWNER);
}]));

export const EXTENTS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif) => {
  throw new NotImplementedError(`motif ${k}: extent()`, OWNER);
}]));
