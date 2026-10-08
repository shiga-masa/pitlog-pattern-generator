/**
 * Archetype `frameDiagonal`. Owner: arch-3 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/frameDiagonal.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * The diagonal joins the frame corners, so it follows the frame size and is never repeated.
 * count 2 draws a pair of parallel lines whose horizontal distance is `gap`. `placement` chooses how
 * the pair sits in the frame:
 *  - 'centered' (default): both lines keep the corner-to-corner slope H/W and are offset by ±gap/2
 *    horizontally, then clipped to the frame (each line misses one corner by gap/2).
 *  - 'corners': each line ends in one frame corner and on the opposite edge gap short of the other
 *    corner, so both lines span the full height with slope H/(W - gap). For '/' the lines are
 *    (0,H)-(W-gap,0) and (gap,H)-(W,0); for '\' they are (0,0)-(W-gap,H) and (gap,0)-(W,H).
 *    This is the geometry of R3 廃棄物 / 盛土 (prim t4_1_p057_h0_r01, t4_2_p057_h1_r00).
 * For count 1 the placement makes no difference (the single line joins the corners).
 * Stage 2: the lines are tied to the frame corners, so spec.origin is not used and a non-zero
 * layer.offset is rejected (GeometryError) rather than ignored.
 */

import { GeometryError } from '../core/errors.js';
import { line } from '../core/primitives.js';
import { clipSegmentProper as clipSegment } from '../core/clip.js';
import { enumOf, fixed, obj } from '../core/schema.js';
import { fitPeriod, offsetOf } from '../core/fit.js';

const OWNER = 'arch-3';

export const ARCHETYPE = 'frameDiagonal';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: false, motif: false });

export const PARAMS = obj({
  direction: enumOf(['/', '\\', 'x'], 'diagonal(s) between region corners', { required: true }),
  count: enumOf([1, 2], 'lines per diagonal', { default: 1 }),
  gap: fixed('horizontal distance between the two lines when count = 2 (pt) (R3: 2.78)', { min: 0, default: 0 }),
  placement: enumOf(['centered', 'corners'], "count 2: 'centered' offsets both lines by ±gap/2 from the diagonal; 'corners' ends each line in one frame corner (R3)", { default: 'centered' }),
}, 'frame diagonal parameters (design §2.2); not density-scaled');

/** Extension (pt) of the infinite line before clipping to the frame. Larger than any frame diagonal. */
const EXTEND_FACTOR = 2;
const STYLE = Object.freeze({ stroke: 'ink', fill: 'none' });

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  const p = layer.params;
  const { x: x0, y: y0, width: W, height: H } = ctx.region;
  if (!(W > 0 && H > 0)) throw new GeometryError(`frameDiagonal ${layer.id}: region must have positive size, got ${W} x ${H}`);
  const off = offsetOf(layer);
  if (off.x !== 0 || off.y !== 0) throw new GeometryError(`frameDiagonal ${layer.id}: the lines join the frame corners; layer.offset (${off.x}, ${off.y}) cannot be applied`);
  if (p.count === 2 && !(p.gap > 0)) throw new GeometryError(`frameDiagonal ${layer.id}: count 2 needs gap > 0 (got ${p.gap}); the two lines would coincide`);
  if (p.count === 2 && p.placement === 'corners' && !(p.gap < W)) throw new GeometryError(`frameDiagonal ${layer.id}: placement 'corners' needs gap < frame width (gap ${p.gap}, width ${W})`);

  const TL = { x: x0, y: y0 };
  const TR = { x: x0 + W, y: y0 };
  const BL = { x: x0, y: y0 + H };
  const BR = { x: x0 + W, y: y0 + H };
  // y is down: '/' rises to the right (bottom-left to top-right), '\' falls to the right.
  const diagonals = p.direction === '/' ? [[BL, TR]]
    : p.direction === '\\' ? [[TL, BR]]
      : [[BL, TR], [TL, BR]];
  const warnings = ctx.jitter ? [`layer ${layer.id}: jitter is not applied to frameDiagonal`] : [];

  if (p.count === 2 && p.placement === 'corners') {
    // Each diagonal runs between the bottom and top edges; P is its left end, Q its right end.
    // Line 1 keeps P and moves Q left by gap; line 2 moves P right by gap and keeps Q.
    const primitives = [];
    for (const [P, Q] of diagonals) {
      primitives.push(line(P.x, P.y, Q.x - p.gap, Q.y, STYLE));
      primitives.push(line(P.x + p.gap, P.y, Q.x, Q.y, STYLE));
    }
    return { primitives, placed: primitives.length, skipped: 0, warnings };
  }
  const shifts = p.count === 2 ? [-p.gap / 2, p.gap / 2] : [0];
  const ext = EXTEND_FACTOR * (W + H);
  const region = { x: x0, y: y0, width: W, height: H };

  const primitives = [];
  let placed = 0;
  let skipped = 0;
  for (const [P, Q] of diagonals) {
    const len = Math.hypot(Q.x - P.x, Q.y - P.y);
    const ux = (Q.x - P.x) / len;
    const uy = (Q.y - P.y) / len;
    for (const sh of shifts) {
      const px = P.x + sh;
      const py = P.y;
      const clipped = clipSegment(px - ux * ext, py - uy * ext, px + ux * ext, py + uy * ext, region);
      if (clipped === null) {
        skipped++;
        continue;
      }
      primitives.push(line(clipped[0], clipped[1], clipped[2], clipped[3], STYLE));
      placed++;
    }
  }

  return { primitives, placed, skipped, warnings };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists.
 * The pattern is one cell (the frame), so the period is the region itself.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  return fitPeriod({ w: ctx.region.width, h: ctx.region.height }, ctx);
}
