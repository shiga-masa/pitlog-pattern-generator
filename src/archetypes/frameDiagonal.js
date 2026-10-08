/**
 * Archetype `frameDiagonal`. Owner: arch-3 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/frameDiagonal.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * The diagonal joins the frame corners, so it follows the frame size and is never repeated.
 * count 2 draws a pair of parallel lines whose horizontal distance is `gap`; the pair is placed
 * symmetrically about the diagonal (each line offset by gap/2 horizontally). This placement is a
 * provisional decision (see the report of arch-3).
 */

import { GeometryError } from '../core/errors.js';
import { line } from '../core/primitives.js';
import { clipSegment } from '../core/clip.js';
import { enumOf, fixed, obj } from '../core/schema.js';

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
  if (p.count === 2 && !(p.gap > 0)) throw new GeometryError(`frameDiagonal ${layer.id}: count 2 needs gap > 0 (got ${p.gap}); the two lines would coincide`);

  const TL = { x: x0, y: y0 };
  const TR = { x: x0 + W, y: y0 };
  const BL = { x: x0, y: y0 + H };
  const BR = { x: x0 + W, y: y0 + H };
  // y is down: '/' rises to the right (bottom-left to top-right), '\' falls to the right.
  const diagonals = p.direction === '/' ? [[BL, TR]]
    : p.direction === '\\' ? [[TL, BR]]
      : [[BL, TR], [TL, BR]];
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

  const warnings = ctx.jitter ? [`layer ${layer.id}: jitter is not applied to frameDiagonal`] : [];
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
  return { w: ctx.region.width, h: ctx.region.height };
}
