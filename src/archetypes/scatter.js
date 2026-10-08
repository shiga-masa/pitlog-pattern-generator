/**
 * Archetype `scatter`. Owner: arch-4 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/scatter.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * Stage 2 contract notes:
 * - sampling: 'jitteredGrid' (default) one centre per cell of a near-square grid; 'poisson' uniform
 *   candidates with minDistance REQUIRED (dart throwing); 'uniform' independent uniform centres, with
 *   minDistance applied only when it is given. 'uniform' is kept as the plain baseline of the other two.
 * - spec.origin is not used (the segments are placed over the whole region).
 * - layer.offset translates every segment after placement; a segment that leaves the region is
 *   counted in `skipped` with a warning.
 * - period: one region (frame) scaled by ctx.fit (design §5.5).
 */

import { GeometryError } from '../core/errors.js';
import { angle, arr, enumOf, fixed, obj, ratio, size } from '../core/schema.js';
import { bboxInside, dir } from '../core/geom.js';
import { line } from '../core/primitives.js';
import { fitPeriod, offsetOf } from '../core/fit.js';

/**
 * Attempts per segment when minDistance rejects a candidate centre (an implementation limit chosen here,
 * not from the design). A segment that still fails is counted in `skipped`, never dropped silently.
 */
const MAX_ATTEMPTS = 200;

export const ARCHETYPE = 'scatter';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  count: { type: 'integer', unit: 'count', density: 'area', min: 0, required: true, desc: 'segments per frame; scales with density^2 (design §3.2)' },
  length: size('median segment length (pt)', { required: true }),
  lengthJitter: { type: 'number', unit: 'pt', density: 'motif', min: 0, default: 0, desc: 'half-range of the uniform length variation (pt)' },
  angles: arr(obj({
    deg: angle('segment direction (deg, CCW)', { required: true }),
    weight: ratio('relative frequency', { exclusiveMin: 0, required: true }),
  }, 'one direction class'), 'direction classes with weights (R2 §18)', { minItems: 1, required: true }),
  minDistance: { type: 'number', unit: 'pt', density: 'length', min: 0, nullable: true, default: null, desc: 'minimum centre distance (pt); unmeasured, null = no constraint' },
  margin: fixed('distance of segment ends from the region edges (pt)', { min: 0, default: 2.0 }),
  sampling: enumOf(['jitteredGrid', 'poisson', 'uniform'], 'placement method (design §1.4 a2)', { default: 'jitteredGrid' }),
  points: arr(obj({
    x: fixed('centre x (pt)', { required: true }),
    y: fixed('centre y (pt)', { required: true }),
    len: fixed('length (pt)', { exclusiveMin: 0 }),
    angle: angle('direction (deg)'),
  }, 'one user segment'), 'user-supplied segments; disables random placement (design §1.4 a3)'),
}, 'scatter parameters (design §2.2)');

/** Segment endpoints for a centre, length and direction (CONVENTIONS §2, via geom.dir). */
function endpoints(cx, cy, len, deg) {
  const d = dir(deg);
  const h = len / 2;
  return { x1: cx - h * d.x, y1: cy - h * d.y, x2: cx + h * d.x, y2: cy + h * d.y };
}

/** Half extents of a segment's bounding box. */
function halfExtent(len, deg) {
  const d = dir(deg);
  return { hx: Math.abs((len * d.x) / 2), hy: Math.abs((len * d.y) / 2) };
}

/**
 * Grid shape for the jittered grid: about sqrt(N * aspect) columns, rows = ceil(N / cols).
 * A degenerate box (zero width or height) is a line or a point and gets a single row or column.
 */
function gridShape(n, bw, bh) {
  let cols;
  if (bw > 0 && bh > 0) cols = Math.round(Math.sqrt((n * bw) / bh));
  else cols = bh === 0 && bw > 0 ? n : 1;
  cols = Math.min(n, Math.max(1, cols));
  return { cols, rows: Math.ceil(n / cols) };
}

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  const res = renderUnshifted(layer, ctx);
  const off = offsetOf(layer);
  if (off.x === 0 && off.y === 0) return res;
  const primitives = [];
  const anchors = [];
  let gone = 0;
  res.primitives.forEach((q, i) => {
    const s = { ...q, x1: q.x1 + off.x, y1: q.y1 + off.y, x2: q.x2 + off.x, y2: q.y2 + off.y };
    const b = { minX: Math.min(s.x1, s.x2), minY: Math.min(s.y1, s.y2), maxX: Math.max(s.x1, s.x2), maxY: Math.max(s.y1, s.y2) };
    if (bboxInside(b, ctx.region)) {
      primitives.push(s);
      anchors.push({ x: res.anchors[i].x + off.x, y: res.anchors[i].y + off.y });
    } else gone++;
  });
  const warnings = [...res.warnings];
  if (gone > 0) warnings.push(`scatter: layer offset (${off.x}, ${off.y}) moves ${gone} segment(s) out of the region; not drawn`);
  return { primitives, placed: res.placed - gone, skipped: res.skipped + gone, warnings, anchors };
}

function renderUnshifted(layer, ctx) {
  const p = layer.params;
  const region = ctx.region;
  const W = region.width;
  const H = region.height;
  const rng = ctx.rng;
  const warnings = [];
  const primitives = [];
  const anchors = [];
  let placed = 0;
  let skipped = 0;

  // User-supplied segments (a3): drawn exactly as given; no random placement.
  if (p.points) {
    if (p.points.length !== p.count) {
      warnings.push(`scatter: points given, so count (${p.count}) is ignored; ${p.points.length} segment(s) are drawn`);
    }
    p.points.forEach((pt, i) => {
      if (pt.angle === undefined) throw new GeometryError(`scatter: points[${i}] has no angle (required when points are given)`);
      const len = pt.len ?? p.length;
      const e = endpoints(pt.x, pt.y, len, pt.angle);
      const b = {
        minX: Math.min(e.x1, e.x2), minY: Math.min(e.y1, e.y2),
        maxX: Math.max(e.x1, e.x2), maxY: Math.max(e.y1, e.y2),
      };
      if (bboxInside(b, region)) {
        primitives.push(line(e.x1, e.y1, e.x2, e.y2));
        anchors.push({ x: pt.x, y: pt.y });
        placed++;
      } else {
        skipped++;
        warnings.push(`scatter: points[${i}] lies outside the region; not drawn`);
      }
    });
    return { primitives, placed, skipped, warnings, anchors };
  }

  const n = p.count;
  if (n === 0) return { primitives, placed, skipped, warnings, anchors };

  // Lengths and direction classes first, so the placement box can be sized for the longest segment.
  const weights = p.angles.map((c) => c.weight);
  const segs = [];
  for (let i = 0; i < n; i++) {
    const len = p.lengthJitter > 0 ? p.length + rng.uniform(-p.lengthJitter, p.lengthJitter) : p.length;
    if (!(len > 0)) {
      throw new GeometryError(`scatter: lengthJitter ${p.lengthJitter} gives a segment length <= 0 (length ${p.length} pt)`);
    }
    const deg = p.angles[rng.weightedIndex(weights)].deg;
    segs.push({ len, deg });
  }
  let hxMax = 0;
  let hyMax = 0;
  for (const s of segs) {
    const h = halfExtent(s.len, s.deg);
    if (h.hx > hxMax) hxMax = h.hx;
    if (h.hy > hyMax) hyMax = h.hy;
  }

  // Centres lie in a box that keeps every segment inside the margin, whatever its direction.
  const minX = p.margin + hxMax;
  const maxX = W - p.margin - hxMax;
  const minY = p.margin + hyMax;
  const maxY = H - p.margin - hyMax;
  if (maxX < minX || maxY < minY) {
    const longest = Math.max(...segs.map((s) => s.len));
    throw new GeometryError(
      `scatter: region ${W} x ${H} pt is too small for segments up to ${longest} pt long with margin ${p.margin} pt`,
    );
  }
  const bw = maxX - minX;
  const bh = maxY - minY;

  const md = p.minDistance;
  const centres = [];
  const farEnough = (cx, cy) => {
    if (md === null) return true;
    for (const c of centres) {
      if (Math.hypot(c.cx - cx, c.cy - cy) < md) return false;
    }
    return true;
  };

  // Candidate-centre generator for segment i, depending on the sampling method.
  let sample;
  if (p.sampling === 'jitteredGrid') {
    const { cols, rows } = gridShape(n, bw, bh);
    const total = cols * rows;
    // n cells are used; when the grid has spare cells, the rng decides which ones are dropped.
    let cellIdx = [...Array(total).keys()];
    if (total > n) cellIdx = rng.shuffle(cellIdx).slice(0, n).sort((a, b) => a - b);
    const cw = bw / cols;
    const ch = bh / rows;
    sample = (i) => {
      const k = cellIdx[i];
      const c = k % cols;
      const r = Math.floor(k / cols);
      return {
        cx: rng.uniform(minX + c * cw, minX + (c + 1) * cw),
        cy: rng.uniform(minY + r * ch, minY + (r + 1) * ch),
      };
    };
  } else if (p.sampling === 'poisson' || p.sampling === 'uniform') {
    if (p.sampling === 'poisson' && md === null) {
      throw new GeometryError("scatter: sampling 'poisson' needs minDistance (pt); it is null");
    }
    sample = () => ({ cx: rng.uniform(minX, maxX), cy: rng.uniform(minY, maxY) });
  } else {
    throw new GeometryError(`scatter: unknown sampling ${JSON.stringify(p.sampling)}`);
  }

  for (let i = 0; i < n; i++) {
    const s = segs[i];
    let found = null;
    for (let t = 0; t < MAX_ATTEMPTS && found === null; t++) {
      const c = sample(i);
      if (farEnough(c.cx, c.cy)) found = c;
    }
    if (found === null) {
      skipped++;
      continue;
    }
    centres.push(found);
    const e = endpoints(found.cx, found.cy, s.len, s.deg);
    primitives.push(line(e.x1, e.y1, e.x2, e.y2));
    anchors.push({ x: found.cx, y: found.cy });
    placed++;
  }
  if (skipped > 0) {
    warnings.push(
      `scatter: ${skipped} of ${n} segment(s) not placed (minDistance ${md ?? 'none'} pt, ${MAX_ATTEMPTS} attempts each)`,
    );
  }
  return { primitives, placed, skipped, warnings, anchors };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * Design §5.5: scatter uses one frame as its period (the seed is fixed, so the same picture repeats).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  return fitPeriod({ w: ctx.region.width, h: ctx.region.height }, ctx);
}
