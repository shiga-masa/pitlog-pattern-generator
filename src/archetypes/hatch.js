/**
 * Archetype `hatch`. Owner: arch-2 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Families of parallel lines. Family f has direction angle_f (0 = horizontal, CCW positive) and
 * lines at perpendicular offsets offset + k * spacing from the anchor point. Line k takes style
 * cycle[k mod n]. A dashed line is split into separate dash primitives whose phase is measured from
 * the foot of the anchor on that line, so dashes of all dashed lines line up. Everything is clipped
 * geometrically to the region inset by `margin`.
 *
 * Edit only this file (and test/archetypes/hatch.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { GeometryError } from '../core/errors.js';
import { clipSegment } from '../core/clip.js';
import { dir, rotatePoint } from '../core/geom.js';
import { line } from '../core/primitives.js';
import { angle, arr, enumOf, len, margin, obj, ratio, size, union } from '../core/schema.js';

export const ARCHETYPE = 'hatch';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  angle: union([
    angle('line direction (deg, CCW); 0 = horizontal'),
    arr(angle('one direction (deg)'), 'several directions in one layer (R1 §1.16: [45, 135])', { minItems: 1, maxItems: 4 }),
  ], 'line direction(s)', { default: 0 }),
  spacing: len('distance between lines, PERPENDICULAR to them (pt)', { required: true }),
  offset: { type: 'number', unit: 'pt', density: 'length', default: 0, desc: 'perpendicular shift of the line family; 0 = a line through the region centre' },
  cycle: arr(enumOf(['solid', 'dashed'], 'line style'), 'line styles in turn (R1 §1.7, R2 §56)', { minItems: 1, maxItems: 4, default: ['solid'] }),
  dash: size('dash length (pt); required if cycle has dashed'),
  gap: size('gap length (pt); required if cycle has dashed'),
  dashPhase: ratio('dash phase as a fraction of (dash + gap)', { min: 0, max: 1, default: 0 }),
  margin: margin('distance kept from the region edges (pt) (R1 §1.7: 2.85)', { default: 0 }),
}, 'hatch parameters (design §2.2)');

const INK_LINE = Object.freeze({ stroke: 'ink', fill: 'none', dash: null, dashOffset: 0 });
const EPS = 1e-9;
// Longest tile, in multiples of the base repeat, that is still a practical period. Longer
// coincidences (e.g. 845/424 ratios of two dash lengths) return null so the caller falls back.
const MAX_REPEAT = 64;
const FREE = Infinity; // a tile vector that no family constrains

/** Anchor point: 'center' (default), 'topLeft', or {x, y} (region coordinates). */
function anchorOf(origin, region) {
  if (origin === 'center') return { x: region.x + region.width / 2, y: region.y + region.height / 2 };
  if (origin === 'topLeft') return { x: region.x, y: region.y };
  if (origin && typeof origin === 'object' && Number.isFinite(origin.x) && Number.isFinite(origin.y)) return { x: origin.x, y: origin.y };
  throw new TypeError(`hatch: unsupported origin ${JSON.stringify(origin)}`);
}

/** margin as {left, right, top, bottom} (a number applies to all sides). */
function marginSides(m) {
  if (typeof m === 'number') return { left: m, right: m, top: m, bottom: m };
  return { left: m?.left ?? 0, right: m?.right ?? 0, top: m?.top ?? 0, bottom: m?.bottom ?? 0 };
}

function insetRect(region, m) {
  const s = marginSides(m);
  const rect = {
    x: region.x + s.left,
    y: region.y + s.top,
    width: region.width - s.left - s.right,
    height: region.height - s.top - s.bottom,
  };
  if (!(rect.width > 0 && rect.height > 0)) {
    throw new GeometryError(`hatch: margin ${JSON.stringify(m)} leaves no drawing area in a ${region.width} x ${region.height} pt region`);
  }
  return rect;
}

/** Unit normal of a family with direction deg: the local +y axis rotated by deg. */
function normalOf(deg) {
  const [x, y] = rotatePoint(0, 1, deg, 0, 0);
  return { x, y };
}

/** Min / max of the projection of the rect corners, relative to A, onto unit vector v. */
function projectRange(rect, A, v) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const x of [rect.x, rect.x + rect.width]) {
    for (const y of [rect.y, rect.y + rect.height]) {
      const t = (x - A.x) * v.x + (y - A.y) * v.y;
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
  }
  return { lo, hi };
}

/**
 * Draw one family of parallel lines.
 * @param {{x,y,width,height}} rect clip rectangle
 * @param {{x,y}} A anchor
 * @param {number} deg direction of the family
 * @param {number[]} ks integer line indices
 * @param {(k:number)=>number} dOf perpendicular offset of line k from A
 * @param {(k:number)=>('solid'|'dashed')} styleOf
 * @param {{len:number, period:number, phase:number}|null} dash period = dash + gap, phase = fraction
 */
function drawFamily(rect, A, deg, ks, dOf, styleOf, dash) {
  const u = dir(deg);
  const v = normalOf(deg);
  const primitives = [];
  let placed = 0;
  let skipped = 0;
  const diag = Math.hypot(rect.width, rect.height);
  for (const k of ks) {
    const d = dOf(k);
    const fx = A.x + d * v.x;
    const fy = A.y + d * v.y;
    const T = diag + 2 * Math.hypot(fx - (rect.x + rect.width / 2), fy - (rect.y + rect.height / 2));
    const seg = clipSegment(fx - T * u.x, fy - T * u.y, fx + T * u.x, fy + T * u.y, rect);
    if (!seg) {
      skipped++;
      continue;
    }
    const before = primitives.length;
    if (styleOf(k) === 'solid') {
      primitives.push(line(seg[0], seg[1], seg[2], seg[3], INK_LINE));
    } else {
      // Parameter t along the line, measured from the foot F of the anchor (F + t * u).
      const ta = (seg[0] - fx) * u.x + (seg[1] - fy) * u.y;
      const tb = (seg[2] - fx) * u.x + (seg[3] - fy) * u.y;
      const t0 = Math.min(ta, tb);
      const t1 = Math.max(ta, tb);
      const P = dash.period;
      const phi = dash.phase * P;
      for (let j = Math.floor((t0 - phi - dash.len) / P); j * P + phi <= t1; j++) {
        const a = Math.max(t0, j * P + phi);
        const b = Math.min(t1, j * P + phi + dash.len);
        if (b - a > EPS) {
          primitives.push(line(fx + a * u.x, fy + a * u.y, fx + b * u.x, fy + b * u.y, INK_LINE));
        }
      }
    }
    if (primitives.length > before) placed++;
    else skipped++;
  }
  return { primitives, placed, skipped };
}

/**
 * Common period of the lattices a_i * Z (a_i > 0): smallest W > 0 with W / a_i integer for all i.
 * @returns {number} FREE when the list is empty, null when no common period exists within MAX_REPEAT
 */
function commonPeriod(as) {
  if (as.length === 0) return FREE;
  const a0 = as[0];
  for (let k = 1; k <= MAX_REPEAT; k++) {
    const W = k * a0;
    const ok = as.every((a) => {
      const r = W / a;
      return Math.abs(r - Math.round(r)) <= EPS * Math.max(1, Math.abs(r));
    });
    if (ok) return W;
  }
  return null;
}

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  const p = layer.params;
  const region = ctx.region;
  const angles = Array.isArray(p.angle) ? p.angle : [p.angle];
  const cycle = p.cycle;
  const n = cycle.length;
  const dashed = cycle.includes('dashed');
  const warnings = [];
  if (dashed && (p.dash === undefined || p.dash === null || p.gap === undefined || p.gap === null)) {
    throw new GeometryError('hatch: cycle contains "dashed" but dash and gap are not both given');
  }
  if (!dashed && (p.dash != null || p.gap != null)) {
    warnings.push('hatch: dash/gap ignored because cycle has no "dashed" line');
  }
  if (p.spacing < ctx.strokeWidth) warnings.push(`hatch: spacing ${p.spacing} pt is not larger than stroke width ${ctx.strokeWidth} pt; lines will merge`);

  const rect = insetRect(region, p.margin);
  const A = anchorOf(ctx.origin, region);
  const dash = dashed ? { len: p.dash, period: p.dash + p.gap, phase: p.dashPhase } : null;
  const s = p.spacing;

  const primitives = [];
  let placed = 0;
  let skipped = 0;
  for (const deg of angles) {
    const v = normalOf(deg);
    const { lo, hi } = projectRange(rect, A, v);
    const ks = [];
    for (let k = Math.ceil((lo - p.offset) / s); p.offset + k * s <= hi; k++) ks.push(k);
    const styleOf = (k) => cycle[((k % n) + n) % n];
    const r = drawFamily(rect, A, deg, ks, (k) => p.offset + k * s, styleOf, dash);
    primitives.push(...r.primitives);
    placed += r.placed;
    skipped += r.skipped;
  }
  return { primitives, placed, skipped, warnings };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * The tile (W, 0) and (0, H) must map every family onto itself: the normal component must be a
 * multiple of cycleLength * spacing (so the style sequence repeats), and the along-line component
 * must be a multiple of dash + gap when a dashed style is present. A margin is not periodic, so
 * any non-zero margin returns null.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  const p = layer.params;
  const m = marginSides(p.margin);
  if (m.left || m.right || m.top || m.bottom) return null;
  const angles = Array.isArray(p.angle) ? p.angle : [p.angle];
  const nc = p.cycle.length;
  const dashed = p.cycle.includes('dashed');
  const P = dashed ? p.dash + p.gap : null;
  const lineRepeat = nc * p.spacing;
  const wCons = [];
  const hCons = [];
  for (const deg of angles) {
    const u = dir(deg);
    const v = normalOf(deg);
    // Tile vector (W, 0): normal component W * v.x, along-line component W * u.x.
    if (Math.abs(v.x) > EPS) wCons.push(lineRepeat / Math.abs(v.x));
    if (dashed && Math.abs(u.x) > EPS) wCons.push(P / Math.abs(u.x));
    // Tile vector (0, H): normal component H * v.y, along-line component H * u.y.
    if (Math.abs(v.y) > EPS) hCons.push(lineRepeat / Math.abs(v.y));
    if (dashed && Math.abs(u.y) > EPS) hCons.push(P / Math.abs(u.y));
  }
  let W = commonPeriod(wCons);
  let H = commonPeriod(hCons);
  if (W === null || H === null) return null;
  if (W === FREE && H === FREE) return null;
  if (W === FREE) W = H;
  if (H === FREE) H = W;
  return { w: W, h: H };
}
