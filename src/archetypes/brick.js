/**
 * Archetype `brick`. Owner: arch-2 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Course lines (horizontal in the local frame, perpendicular spacing courseHeight) cut the region
 * fully; joints run between two neighbouring course lines, staggered by `stagger` * brickLength
 * per course, and lean by courseHeight * cot(jointAngle) within one course. The whole field is
 * rotated by `angle` about the anchor point. Everything is clipped geometrically to the region.
 *
 * Edit only this file (and test/archetypes/brick.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { GeometryError } from '../core/errors.js';
import { clipSegment } from '../core/clip.js';
import { dir, rotatePoint } from '../core/geom.js';
import { line } from '../core/primitives.js';
import { angle, enumOf, len, obj, ratio } from '../core/schema.js';

export const ARCHETYPE = 'brick';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  courseHeight: len('distance between course lines, perpendicular (pt)', { required: true }),
  brickLength: len('distance between joints along a course (pt)', { required: true }),
  jointAngle: angle('joint angle to the course (deg); 90 = perpendicular (R1 §1.14: 52)', { min: 1, max: 179, default: 90 }),
  stagger: ratio('joint shift between courses as a fraction of brickLength', { min: 0, max: 1, default: 0.5 }),
  angle: angle('rotation of the whole brick field (deg, CCW) (R2 §41: 45)', { default: 0 }),
  jointInset: { type: 'number', unit: 'pt', density: 'motif', min: 0, default: 0, desc: 'gap between joint ends and course lines (pt) (R2 §41: 0.3)' },
  courseExtent: enumOf(['full'], 'course lines span the full region (R1 §1.12)', { default: 'full' }),
}, 'brick parameters (design §2.2)');

const INK_LINE = Object.freeze({ stroke: 'ink', fill: 'none', dash: null, dashOffset: 0 });
const EPS = 1e-9;
// Longest tile, in multiples of the base repeat, that is still a practical period. Longer
// coincidences (e.g. 845/424 ratios of two dash lengths) return null so the caller falls back.
const MAX_REPEAT = 64;

/** Anchor point of the lattice: 'center' (default), 'topLeft', or {x, y} (region coordinates). */
function anchorOf(origin, region) {
  if (origin === 'center') return { x: region.x + region.width / 2, y: region.y + region.height / 2 };
  if (origin === 'topLeft') return { x: region.x, y: region.y };
  if (origin && typeof origin === 'object' && Number.isFinite(origin.x) && Number.isFinite(origin.y)) return { x: origin.x, y: origin.y };
  throw new TypeError(`brick: unsupported origin ${JSON.stringify(origin)}`);
}

/** Min / max of the projection of the rect corners, relative to A, onto unit vector `v`. */
function projectRange(rect, A, v) {
  const xs = [rect.x, rect.x + rect.width];
  const ys = [rect.y, rect.y + rect.height];
  let lo = Infinity;
  let hi = -Infinity;
  for (const x of xs) {
    for (const y of ys) {
      const t = (x - A.x) * v.x + (y - A.y) * v.y;
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
  }
  return { lo, hi };
}

/**
 * Draw the course lines: one solid line per integer k, through the anchor at local y = k * courseHeight.
 * Returns the primitives and the count of courses drawn / clipped away.
 */
function drawCourses(rect, A, rot, h) {
  const u = dir(rot);
  const v = vecOf(rot);
  const { lo, hi } = projectRange(rect, A, v);
  const primitives = [];
  let placed = 0;
  let skipped = 0;
  const diag = Math.hypot(rect.width, rect.height);
  for (let k = Math.ceil(lo / h); k * h <= hi; k++) {
    const d = k * h;
    const fx = A.x + d * v.x;
    const fy = A.y + d * v.y;
    const T = diag + 2 * Math.hypot(fx - (rect.x + rect.width / 2), fy - (rect.y + rect.height / 2));
    const seg = clipSegment(fx - T * u.x, fy - T * u.y, fx + T * u.x, fy + T * u.y, rect);
    if (seg) {
      primitives.push(line(seg[0], seg[1], seg[2], seg[3], INK_LINE));
      placed++;
    } else {
      skipped++;
    }
  }
  return { primitives, placed, skipped };
}

/** Unit vector of local +y (down the field) for rotation `deg`, as {x, y}. */
function vecOf(deg) {
  const [x, y] = rotatePoint(0, 1, deg, 0, 0);
  return { x, y };
}

/** Smallest j >= 1 with j * stagger an integer (the course-to-course shift repeats), or null. */
function staggerRepeat(s) {
  for (let j = 1; j <= MAX_REPEAT; j++) {
    const r = j * s;
    if (Math.abs(r - Math.round(r)) <= EPS * Math.max(1, Math.abs(r))) return j;
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
  const h = p.courseHeight;
  const L = p.brickLength;
  const thetaJ = p.jointAngle;
  const s = p.stagger;
  const inset = p.jointInset ?? 0;
  const warnings = [];
  if (region.width <= 0 || region.height <= 0) throw new GeometryError(`brick: region ${region.width}x${region.height} has no area`);
  if (2 * inset >= h) {
    throw new GeometryError(`brick: jointInset ${inset} pt must be less than half of courseHeight ${h} pt (joints would vanish)`);
  }
  if (h < ctx.strokeWidth) warnings.push(`brick: courseHeight ${h} pt is not larger than stroke width ${ctx.strokeWidth} pt; courses will merge`);
  if (L < ctx.strokeWidth) warnings.push(`brick: brickLength ${L} pt is not larger than stroke width ${ctx.strokeWidth} pt; joints will merge`);

  const A = anchorOf(ctx.origin, region);
  const rect = { x: region.x, y: region.y, width: region.width, height: region.height };
  const rot = p.angle;
  const u = dir(rot);
  const v = vecOf(rot);

  const courses = drawCourses(rect, A, rot, h);

  // Joints: one segment per (band j, joint i). Band j lies between local y = j*h (top) and (j+1)*h (bottom).
  // Joint bottoms sit at local x = (i + j*stagger) * L; the top is shifted by h * cot(jointAngle).
  const dj = dir(thetaJ);
  const cot = dj.x / -dj.y; // dir(θ) = (cos θ, -sin θ), so cot θ = dir.x / -dir.y
  const hc = h * cot;
  const du = projectRange(rect, A, u);
  const dv = projectRange(rect, A, v);
  const G = (x, y) => [A.x + x * u.x + y * v.x, A.y + x * u.y + y * v.y];
  const primitives = [...courses.primitives];
  let jointPlaced = 0;
  let jointSkipped = 0;
  const lo = du.lo - Math.max(0, hc);
  const hi = du.hi - Math.min(0, hc);
  const t0 = inset / h;
  const t1 = 1 - inset / h;
  for (let j = Math.ceil(dv.lo / h - 1); j * h <= dv.hi; j++) {
    for (let i = Math.ceil(lo / L - j * s); (i + j * s) * L <= hi; i++) {
      const xb = (i + j * s) * L;
      const bx = xb;
      const by = (j + 1) * h;
      const tx = xb + hc;
      const ty = j * h;
      const [ax, ay] = G(bx + (tx - bx) * t0, by + (ty - by) * t0);
      const [cx, cy] = G(bx + (tx - bx) * t1, by + (ty - by) * t1);
      const seg = clipSegment(ax, ay, cx, cy, rect);
      if (seg) {
        primitives.push(line(seg[0], seg[1], seg[2], seg[3], INK_LINE));
        jointPlaced++;
      } else {
        jointSkipped++;
      }
    }
  }

  return {
    primitives,
    placed: courses.placed + jointPlaced,
    skipped: courses.skipped + jointSkipped,
    warnings,
  };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * The field repeats every brickLength along a course and every j courses, where j is the smallest
 * integer with j * stagger integer (2 for stagger 0.5). Only fields rotated by a multiple of 90 deg
 * have an axis-aligned period; other angles return null.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  const p = layer.params;
  const j = staggerRepeat(p.stagger);
  if (j === null) return null;
  const L = p.brickLength;
  const H = j * p.courseHeight;
  const a = ((p.angle % 180) + 180) % 180;
  if (Math.abs(a) <= EPS || Math.abs(a - 180) <= EPS) return { w: L, h: H };
  if (Math.abs(a - 90) <= EPS) return { w: H, h: L };
  return null;
}
