/**
 * Archetype `symbol`. Owner: arch-4 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/symbol.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 */

import { GeometryError } from '../core/errors.js';
import { arr, enumOf, obj, ratio, vec } from '../core/schema.js';
import { bboxInside } from '../core/geom.js';
import { bboxOf, transformPrimitive } from '../core/primitives.js';

export const ARCHETYPE = 'symbol';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'required';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: false, motif: false });

export const PARAMS = obj({
  anchor: enumOf(['center', 'topLeft'], 'reference point in the region', { default: 'center' }),
  offsets: arr(vec('none', 'offset from the anchor (pt)'), 'one placement per offset (R3 boulders: 2)', { minItems: 1, default: [{ x: 0, y: 0 }] }),
  scale: ratio('uniform scale of the motif', { exclusiveMin: 0, default: 1 }),
}, 'symbol parameters (design §2.2); never tiled, not density-scaled');

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  if (!layer.motif) throw new GeometryError('symbol: layer needs a motif (the motif policy is required)');
  const p = layer.params;
  const region = ctx.region;
  // 'center': the motif's bounding-box centre goes to the region centre. 'topLeft': to the region's (0, 0).
  const base = p.anchor === 'center' ? { x: region.width / 2, y: region.height / 2 } : { x: region.x, y: region.y };
  const local = ctx.buildMotif(layer.motif);
  const primitives = [];
  const anchors = [];
  const warnings = [];
  let placed = 0;
  let skipped = 0;

  p.offsets.forEach((off, i) => {
    const x = base.x + off.x;
    const y = base.y + off.y;
    const placedPrims = local.map((q) => transformPrimitive(q, { scale: p.scale, x, y }));
    if (bboxInside(bboxOf(placedPrims), region)) {
      primitives.push(...placedPrims);
      anchors.push({ x, y });
      placed++;
    } else {
      skipped++;
      warnings.push(`symbol: offsets[${i}] puts the motif outside the region; not drawn`);
    }
  });
  return { primitives, placed, skipped, warnings, anchors };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * Design §5.5: symbol uses one frame (cell) as its period.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  return { w: ctx.region.width, h: ctx.region.height };
}
