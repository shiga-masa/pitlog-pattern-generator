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
 *   - the anchor is the region centre (origin 'center') or the point given as origin {x, y},
 *     shifted by layer.offset (stage 2)
 *   - uneven steps (hand-placed originals, optional): `steps` replaces step / alongPitch with a cycled
 *     list of step vectors, [[all bands]] or one list per band. Motif j of band k sits at
 *       base_k + Σ_{0<=i<j} L_k[i mod m]           (j >= 0)
 *       base_k - Σ_{j<=i<0} L_k[i mod m]           (j < 0, i mod m taken in [0, m))
 *     so with j = 0 on the first measured motif, L_k is the measured centre-to-centre steps in order.
 *     D (band to band) is bandShift, or n * bandSpacing (bandPhase must stay 0: it is a fraction of one step).
 *   - edgeMode 'trim' (optional): like 'clip', but line and polyline motifs are cut at the region
 *     geometrically (core/clip.js), so the primitives are the visible parts (the originals draw the
 *     edge dashes shortened; R3 table 4-3 silty). A dash pattern keeps its phase (dashOffset grows by the
 *     cut length). Motifs with other primitive types raise a GeometryError.
 */

import { GeometryError, LimitError } from '../core/errors.js';
import { EPS, LIMITS } from '../core/defaults.js';
import { clipSegment, keepInstance, MIN_SEGMENT_LENGTH } from '../core/clip.js';
import { bboxIntersects, dir, DEG } from '../core/geom.js';
import { bbox, bboxOf, transformPrimitive } from '../core/primitives.js';
import { angle, arr, count, enumOf, len, obj, ratio, union, vec } from '../core/schema.js';
import { offsetOf } from '../core/fit.js';

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
  steps: arr(arr(vec('length', 'step from motif j to motif j+1 (pt)'), 'step vectors along one band, cycled', { minItems: 1 }), 'uneven steps (hand-placed originals): [[all bands]] or one list per band; replaces step / alongPitch', { minItems: 1 }),
  bandShift: vec('length', 'explicit shift between bands (pt), replaces bandSpacing and bandPhase (R3 organic: (2.83, 2.85))'),
  bandPhase: ratio('along-band phase shift per band, fraction of the step (R3 gravel: 1/3)', { min: 0, max: 1, default: 0 }),
  elementAngle: union([enumOf(['band'], 'parallel to the band'), angle('fixed angle (deg)')], 'motif rotation', { default: 'band' }),
  edgeMode: enumOf(['auto', 'whole', 'clip', 'trim'], 'auto = line motifs clip, closed motifs whole (R3 §4); trim = clip with line motifs cut at the region geometrically', { default: 'auto' }),
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
 * Cut one instance (region coordinates) at the rect for edgeMode 'trim'. Lines and polylines only;
 * a dashed stroke keeps its phase (dashOffset + the arc length cut from its start).
 * @returns {object[]} visible pieces (may be empty)
 */
function trimInstance(prims, rect, id) {
  const out = [];
  for (const q of prims) {
    let pts;
    if (q.type === 'line') pts = [[q.x1, q.y1], [q.x2, q.y2]];
    else if (q.type === 'polyline') pts = q.points;
    else throw new GeometryError(`layer ${id}: edgeMode 'trim' cuts only line and polyline motifs, got a ${q.type}; use 'clip'`);
    let s = 0;
    let cur = null;
    const flush = () => {
      if (!cur) return;
      let L = 0;
      for (let i = 1; i < cur.pts.length; i++) L += Math.hypot(cur.pts[i][0] - cur.pts[i - 1][0], cur.pts[i][1] - cur.pts[i - 1][1]);
      if (L > MIN_SEGMENT_LENGTH) {
        const style = q.style.dash ? { ...q.style, dash: [...q.style.dash], dashOffset: q.style.dashOffset + cur.off } : { ...q.style };
        if (q.type === 'line') out.push({ type: 'line', x1: cur.pts[0][0], y1: cur.pts[0][1], x2: cur.pts[1][0], y2: cur.pts[1][1], style });
        else out.push({ type: 'polyline', points: cur.pts, style });
      }
      cur = null;
    };
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const segLen = Math.hypot(bx - ax, by - ay);
      const r = clipSegment(ax, ay, bx, by, rect);
      if (!r) flush();
      else {
        const startCut = r[0] !== ax || r[1] !== ay;
        if (cur && !startCut) cur.pts.push([r[2], r[3]]);
        else {
          flush();
          cur = { pts: [[r[0], r[1]], [r[2], r[3]]], off: s + Math.hypot(r[0] - ax, r[1] - ay) };
        }
        if (r[2] !== bx || r[3] !== by) flush();
      }
      s += segLen;
    }
    flush();
  }
  return out;
}

/**
 * Motif positions of one band: base + cumulative steps (cycled list), forward from j = 0 and backward
 * from j = -1, while the projection on the mean step direction stays within [tLo, tHi].
 * @returns {Array<{j:number, x:number, y:number}>}
 */
function unevenPositions(base, list, tLo, tHi, id, k) {
  let cx = 0;
  let cy = 0;
  for (const s of list) { cx += s.x; cy += s.y; }
  const cl = Math.hypot(cx, cy);
  if (!(cl > 0)) throw new GeometryError(`layer ${id}: steps of band ${k} sum to zero length (the band does not advance)`);
  const v = { x: cx / cl, y: cy / cl };
  list.forEach((s, i) => {
    if (!(s.x * v.x + s.y * v.y > 0)) throw new GeometryError(`layer ${id}: steps[${k}][${i}] (${s.x}, ${s.y}) runs backwards along the band (each step must advance along the summed step direction)`);
  });
  const m = list.length;
  const t = (P) => P.x * v.x + P.y * v.y;
  const out = [];
  let P = { x: base.x, y: base.y };
  for (let j = 0; t(P) <= tHi; j++) {
    if (t(P) >= tLo) out.push({ j, x: P.x, y: P.y });
    const s = list[j % m];
    P = { x: P.x + s.x, y: P.y + s.y };
    if (out.length > LIMITS.maxPrimitives) throw new LimitError(`layer ${id}: more than ${LIMITS.maxPrimitives} motifs`);
  }
  P = { x: base.x, y: base.y };
  for (let j = -1; ; j--) {
    const s = list[((j % m) + m) % m];
    P = { x: P.x - s.x, y: P.y - s.y };
    if (t(P) < tLo) break;
    if (t(P) <= tHi) out.push({ j, x: P.x, y: P.y });
    if (out.length > LIMITS.maxPrimitives) throw new LimitError(`layer ${id}: more than ${LIMITS.maxPrimitives} motifs`);
  }
  out.sort((a, b) => a.j - b.j);
  return out;
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
  const hasSteps = p.steps !== undefined && p.steps !== null;
  if (hasShift && hasSpacing) throw new GeometryError(`layer ${id}: bandShift and bandSpacing are both given; give only one (bandShift replaces bandSpacing and bandPhase)`);
  if (hasShift && p.bandPhase !== 0) throw new GeometryError(`layer ${id}: bandPhase must be 0 when bandShift is given (bandShift already contains the phase)`);
  if (p.bands > 1 && !hasShift && !hasSpacing) throw new GeometryError(`layer ${id}: bandSpacing is required when bands > 1 (or give bandShift)`);
  if (hasSteps) {
    if (hasStep || hasAlong) throw new GeometryError(`layer ${id}: steps replaces step and alongPitch; give only steps`);
    if (p.bandPhase !== 0) throw new GeometryError(`layer ${id}: bandPhase must be 0 when steps is given (a phase is a fraction of one even step); give bandShift instead`);
    if (p.steps.length !== 1 && p.steps.length !== p.bands) throw new GeometryError(`layer ${id}: steps needs 1 list (all bands) or one list per band (${p.bands}), got ${p.steps.length}`);
  } else {
    if (!hasStep && !hasAlong) throw new GeometryError(`layer ${id}: give step or alongPitch (the spacing of motifs along a band)`);
    if (hasStep && hasAlong) warnings.push(`layer ${id}: step and alongPitch are both given; step is used and alongPitch is ignored`);
  }

  // Band direction and the two unit vectors (CONVENTIONS §2: dir() is the only angle -> vector conversion).
  const ang = p.angle ?? Math.atan2(H, W) / DEG;
  const u = dir(ang);
  const n = dir(ang + 90);
  let S;
  if (hasSteps) S = null;
  else if (hasStep) S = { x: p.step.x, y: p.step.y };
  else S = { x: u.x * p.alongPitch, y: u.y * p.alongPitch };
  const stepList = hasSteps ? p.steps.flat() : [S];
  for (const s of stepList) {
    if (!(Math.hypot(s.x, s.y) > 0)) throw new GeometryError(`layer ${id}: the step between motifs has zero length`);
  }

  // Anchor (where band centre 0 passes through the motif at j = 0).
  let c;
  if (ctx.origin === 'center') c = { x: W / 2, y: H / 2 };
  else if (ctx.origin === 'topLeft') throw new GeometryError(`layer ${id}: origin 'topLeft' is not defined for diagonalBand (the bands run through the region); use 'center' or {x, y}`);
  else if (ctx.origin && typeof ctx.origin === 'object') c = { x: ctx.origin.x, y: ctx.origin.y };
  else throw new GeometryError(`layer ${id}: unknown origin ${JSON.stringify(ctx.origin)}`);
  const off = offsetOf(layer);
  c = { x: c.x + off.x, y: c.y + off.y };

  // Band-to-band vector D.
  const N = p.bands;
  let D;
  if (hasShift) D = { x: p.bandShift.x, y: p.bandShift.y };
  else {
    const sp = N > 1 ? p.bandSpacing : 0;
    D = hasSteps ? { x: n.x * sp, y: n.y * sp } : { x: n.x * sp + S.x * p.bandPhase, y: n.y * sp + S.y * p.bandPhase };
  }

  const prims0 = ctx.buildMotif(layer.motif);
  const ext = ctx.motifExtent(layer.motif);
  const rot = p.elementAngle === 'band' ? ang : p.elementAngle;
  const closed = prims0.some(isClosed);
  const mode = p.edgeMode === 'auto' ? (closed ? 'whole' : 'clip') : p.edgeMode;
  const keepMode = mode === 'trim' ? 'clip' : mode;

  // Overlap checks (along the band and across bands), using the rotated motif projected on each axis.
  const rotated = prims0.map((q) => transformPrimitive(q, { rotate: rot }));
  // Shortest step relative to the motif projected on its direction (one warning per layer).
  let worst = null;
  for (const s of stepList) {
    const sl = Math.hypot(s.x, s.y);
    const pa = extentAlong(rotated, { x: s.x / sl, y: s.y / sl });
    if (sl < pa + ctx.strokeWidth && (!worst || sl - pa < worst.sl - worst.pa)) worst = { sl, pa };
  }
  if (worst) {
    warnings.push(`layer ${id}: motifs overlap along the band (pitch ${worst.sl.toFixed(3)} < projected extent ${worst.pa.toFixed(3)} + stroke)`);
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
    let cand;
    if (hasSteps) {
      const list = p.steps.length === 1 ? p.steps[0] : p.steps[k];
      let sx = 0;
      let sy = 0;
      for (const s of list) { sx += s.x; sy += s.y; }
      const sl = Math.hypot(sx, sy);
      const v = sl > 0 ? { x: sx / sl, y: sy / sl } : { x: 1, y: 0 };
      const proj = [[-rad, -rad], [W + rad, -rad], [-rad, H + rad], [W + rad, H + rad]].map(([x, y]) => x * v.x + y * v.y);
      cand = unevenPositions(base, list, Math.min(...proj), Math.max(...proj), id, k);
    } else {
      const jx = jRange(base.x, S.x, -rad, W + rad);
      const jy = jRange(base.y, S.y, -rad, H + rad);
      const jmin = Math.max(jx[0], jy[0]);
      const jmax = Math.min(jx[1], jy[1]);
      if (!Number.isFinite(jmin) || !Number.isFinite(jmax)) throw new GeometryError(`layer ${id}: band ${k} has no finite range of motifs`);
      cand = [];
      for (let j = jmin; j <= jmax; j++) cand.push({ j, x: base.x + j * S.x, y: base.y + j * S.y });
    }
    for (const { j, x: Px, y: Py } of cand) {
      const P = { x: Px, y: Py };
      let prims = prims0.map((q) => transformPrimitive(q, { rotate: rot, x: P.x, y: P.y }));
      if (!bboxIntersects(bboxOf(prims), R)) continue; // outside the region: not a candidate
      if (keepInstance(prims, R, keepMode) && (mode !== 'trim' || (prims = trimInstance(prims, R, id)).length > 0)) {
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
