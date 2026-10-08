/**
 * Archetype `diagonalBand`. Owner: arch-5 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/diagonalBand.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * Geometry (R3 table 4-3, the diagonal bands of the auxiliary symbols):
 *   - the band direction is `angle` (math convention); the default is the region diagonal atan(height/width)
 *   - band k is a row of motifs at base_k + j * S, j in Z, where S = step (or alongPitch * dir(angle))
 *   - base_k = anchor + bandOffset * n + (k - (bands-1)/2) * D, n = dir(angle + 90) (upper-left is +)
 *     D = n * bandSpacing + bandPhase * S, or D = bandShift when bandShift is given
 *   - the anchor is the region centre (origin 'center') or the point given as origin {x, y}
 */

import { GeometryError, LimitError } from '../core/errors.js';
import { EPS, LIMITS } from '../core/defaults.js';
import { keepInstance } from '../core/clip.js';
import { bboxIntersects, dir, DEG } from '../core/geom.js';
import { bbox, bboxOf, transformPrimitive } from '../core/primitives.js';
import { angle, count, enumOf, len, obj, ratio, union, vec } from '../core/schema.js';

export const ARCHETYPE = 'diagonalBand';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'required';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  angle: angle('band direction (deg); null = atan(height/width) of the region', { nullable: true, default: null }),
  bands: count('number of bands (3 = -ic, 1 = mixed, 2 = organic)', { min: 1, required: true }),
  bandSpacing: len('distance between bands, perpendicular (pt); required if bands > 1 and bandShift is not given'),
  bandOffset: { type: 'number', unit: 'pt', density: 'length', default: 0, desc: 'perpendicular offset (pt) of the band centre from the anchor; + = toward upper-left (dir(angle + 90)) (R3 table 4-3 measured n)' },
  alongPitch: len('pitch of motifs along a band (pt)'),
  step: vec('length', 'explicit step between successive motifs (pt); overrides alongPitch (R3 volcanic-ash: (7.07, -2.83))'),
  bandShift: vec('length', 'explicit shift between bands (pt), replaces bandSpacing and bandPhase (R3 organic: (2.83, 2.85))'),
  bandPhase: ratio('along-band phase shift per band, fraction of the step (R3 gravel: 1/3)', { min: 0, max: 1, default: 0 }),
  elementAngle: union([enumOf(['band'], 'parallel to the band'), angle('fixed angle (deg)')], 'motif rotation', { default: 'band' }),
  edgeMode: enumOf(['auto', 'whole', 'clip'], 'auto = line motifs clip, closed motifs whole (R3 §4)', { default: 'auto' }),
}, 'diagonal band parameters (design §2.2)');

/** A primitive counts as closed when it has an outline-only or filled area (circle, ellipse, polygon, any fill). */
function isClosed(p) {
  return p.type === 'circle' || p.type === 'ellipse' || p.type === 'polygon' || p.style.fill !== 'none';
}

/**
 * Extent of the motif (already rotated about its centre) along the unit vector v: the exact
 * projection for circles, points and polylines, the bounding box for ellipses. Used only for overlap
 * warnings, where the axis-aligned bbox would overstate a circle's extent across a diagonal band.
 */
function extentAlong(prims, v) {
  let lo = Infinity;
  let hi = -Infinity;
  const add = (x, y) => {
    const t = x * v.x + y * v.y;
    if (t < lo) lo = t;
    if (t > hi) hi = t;
  };
  for (const q of prims) {
    if (q.type === 'circle') {
      const t = q.cx * v.x + q.cy * v.y;
      lo = Math.min(lo, t - q.r);
      hi = Math.max(hi, t + q.r);
    } else if (q.type === 'line') {
      add(q.x1, q.y1);
      add(q.x2, q.y2);
    } else if (q.type === 'polyline' || q.type === 'polygon') {
      for (const [x, y] of q.points) add(x, y);
    } else if (q.type === 'ellipse') {
      const b = bbox(q);
      add(b.minX, b.minY);
      add(b.maxX, b.maxY);
      add(b.minX, b.maxY);
      add(b.maxX, b.minY);
    } else if (q.type === 'path') {
      for (const c of q.cmds) {
        if ('x1' in c) add(c.x1, c.y1);
        if ('x2' in c) add(c.x2, c.y2);
        if ('x' in c) add(c.x, c.y);
      }
    }
  }
  return Number.isFinite(lo) ? hi - lo : 0;
}

/** Solve lo <= b + j * s <= hi for integer j. Returns [jmin, jmax] (may be empty), or unbounded for s = 0. */
function jRange(b, s, lo, hi) {
  if (Math.abs(s) < 1e-12) return (b >= lo - EPS && b <= hi + EPS) ? [-Infinity, Infinity] : [1, 0];
  let a = (lo - b) / s;
  let c = (hi - b) / s;
  if (a > c) [a, c] = [c, a];
  return [Math.ceil(a - 1e-9), Math.floor(c + 1e-9)];
}

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  const p = layer.params;
  const id = layer.id;
  const R = ctx.region;
  const W = R.width;
  const H = R.height;
  const warnings = [];

  if (!layer.motif) throw new GeometryError(`layer ${id}: diagonalBand needs a motif`);
  const hasShift = p.bandShift !== undefined && p.bandShift !== null;
  const hasSpacing = p.bandSpacing !== undefined && p.bandSpacing !== null;
  const hasStep = p.step !== undefined && p.step !== null;
  const hasAlong = p.alongPitch !== undefined && p.alongPitch !== null;
  if (hasShift && hasSpacing) throw new GeometryError(`layer ${id}: bandShift and bandSpacing are both given; give only one (bandShift replaces bandSpacing and bandPhase)`);
  if (hasShift && p.bandPhase !== 0) throw new GeometryError(`layer ${id}: bandPhase must be 0 when bandShift is given (bandShift already contains the phase)`);
  if (p.bands > 1 && !hasShift && !hasSpacing) throw new GeometryError(`layer ${id}: bandSpacing is required when bands > 1 (or give bandShift)`);
  if (!hasStep && !hasAlong) throw new GeometryError(`layer ${id}: give step or alongPitch (the spacing of motifs along a band)`);
  if (hasStep && hasAlong) warnings.push(`layer ${id}: step and alongPitch are both given; step is used and alongPitch is ignored`);

  // Band direction and the two unit vectors (CONVENTIONS §2: dir() is the only angle -> vector conversion).
  const ang = p.angle ?? Math.atan2(H, W) / DEG;
  const u = dir(ang);
  const n = dir(ang + 90);
  const S = hasStep ? { x: p.step.x, y: p.step.y } : { x: u.x * p.alongPitch, y: u.y * p.alongPitch };
  const sLen = Math.hypot(S.x, S.y);
  if (!(sLen > 0)) throw new GeometryError(`layer ${id}: the step between motifs has zero length`);

  // Anchor (where band centre 0 passes through the motif at j = 0).
  let c;
  if (ctx.origin === 'center') c = { x: W / 2, y: H / 2 };
  else if (ctx.origin === 'topLeft') throw new GeometryError(`layer ${id}: origin 'topLeft' is not defined for diagonalBand (the bands run through the region); use 'center' or {x, y}`);
  else if (ctx.origin && typeof ctx.origin === 'object') c = { x: ctx.origin.x, y: ctx.origin.y };
  else throw new GeometryError(`layer ${id}: unknown origin ${JSON.stringify(ctx.origin)}`);

  // Band-to-band vector D.
  const N = p.bands;
  let D;
  if (hasShift) D = { x: p.bandShift.x, y: p.bandShift.y };
  else {
    const sp = N > 1 ? p.bandSpacing : 0;
    D = { x: n.x * sp + S.x * p.bandPhase, y: n.y * sp + S.y * p.bandPhase };
  }

  const prims0 = ctx.buildMotif(layer.motif);
  const ext = ctx.motifExtent(layer.motif);
  const rot = p.elementAngle === 'band' ? ang : p.elementAngle;
  const closed = prims0.some(isClosed);
  const mode = p.edgeMode === 'auto' ? (closed ? 'whole' : 'clip') : p.edgeMode;

  // Overlap checks (along the band and across bands), using the rotated motif projected on each axis.
  const rotated = prims0.map((q) => transformPrimitive(q, { rotate: rot }));
  const su = { x: S.x / sLen, y: S.y / sLen };
  const projAlong = extentAlong(rotated, su);
  if (sLen < projAlong + ctx.strokeWidth) {
    warnings.push(`layer ${id}: motifs overlap along the band (pitch ${sLen.toFixed(3)} < projected extent ${projAlong.toFixed(3)} + stroke)`);
  }
  if (N > 1 && !hasShift) {
    const projAcross = extentAlong(rotated, n);
    if (p.bandSpacing < projAcross + ctx.strokeWidth) {
      warnings.push(`layer ${id}: bands overlap (bandSpacing ${p.bandSpacing} < projected extent ${projAcross.toFixed(3)} + stroke)`);
    }
  }

  // Candidate range: any motif whose centre lies within half its diagonal of the region may touch it.
  const rad = Math.hypot(ext.w, ext.h) / 2;
  const out = [];
  const anchors = [];
  let placed = 0;
  let skipped = 0;
  for (let k = 0; k < N; k++) {
    const kk = k - (N - 1) / 2;
    const base = { x: c.x + n.x * p.bandOffset + kk * D.x, y: c.y + n.y * p.bandOffset + kk * D.y };
    const jx = jRange(base.x, S.x, -rad, W + rad);
    const jy = jRange(base.y, S.y, -rad, H + rad);
    const jmin = Math.max(jx[0], jy[0]);
    const jmax = Math.min(jx[1], jy[1]);
    if (!Number.isFinite(jmin) || !Number.isFinite(jmax)) throw new GeometryError(`layer ${id}: band ${k} has no finite range of motifs`);
    for (let j = jmin; j <= jmax; j++) {
      const P = { x: base.x + j * S.x, y: base.y + j * S.y };
      const prims = prims0.map((q) => transformPrimitive(q, { rotate: rot, x: P.x, y: P.y }));
      if (!bboxIntersects(bboxOf(prims), R)) continue; // outside the region: not a candidate
      if (keepInstance(prims, R, mode)) {
        for (const q of prims) out.push(q);
        anchors.push({ x: P.x, y: P.y, row: k, col: j });
        placed += 1;
        if (out.length > LIMITS.maxPrimitives) throw new LimitError(`layer ${id}: more than ${LIMITS.maxPrimitives} primitives`);
      } else {
        skipped += 1;
      }
    }
  }
  if (placed === 0) {
    throw new GeometryError(`layer ${id}: no motif falls in the region (check bandOffset, bands, bandSpacing, origin)`);
  }
  return { primitives: out, placed, skipped, warnings, anchors };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists.
 * A diagonal band is one stripe along the region diagonal: its translation lattice contains no
 * axis-aligned vector, so no rectangular seamless tile exists and null is returned (CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  return null;
}
