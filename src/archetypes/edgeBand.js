/**
 * Archetype `edgeBand`. Owner: arch-5 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/edgeBand.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * Geometry (R2 table 3-9, fault and shear-zone auxiliary patterns):
 *   - a band of width `bandWidth` (pt, fixed) at the left edge (x 0..bandWidth) and/or the right edge
 *     (x W-bandWidth..W). The right band is the left band translated by W - bandWidth (not mirrored).
 *   - motifs are centred in the band, one per row; rows are pitchY apart vertically.
 *   - rows: 'auto' = floor(H / pitchY) rows; origin 'center' centres the rows in the region,
 *     'topLeft' puts the first row at pitchY / 2, {x, y} puts the first row at y (x is ignored, see warnings).
 *   - the motif size is not density-scaled (DENSITY.motif = false), the band width is not density-scaled.
 *   - Provisional: the band width and the motif stay fixed when the density changes (design §3.2).
 *   - Stage 2: edgeMode 'auto' (default) keeps whole motifs when the motif fits the band width and
 *     clips them at the region otherwise (R2 §63/§64: the measured lens 7.05 pt and hook 7.38 pt are
 *     wider than the 6.92 pt band, so a centred motif crosses the frame edge by < 0.3 pt).
 *     layer.offset.y shifts the rows; a non-zero offset.x is rejected (the bands sit at the sides).
 *     ctx.fit scales pitchY by fit.y; period() is scaled by the fit.
 */

import { GeometryError } from '../core/errors.js';
import { EPS } from '../core/defaults.js';
import { keepInstance } from '../core/clip.js';
import { overlapWarning } from '../core/density.js';
import { polygon, transformPrimitive } from '../core/primitives.js';
import { autoCount, enumOf, fixed, len, obj } from '../core/schema.js';
import { fitOf, fitPeriod, offsetOf } from '../core/fit.js';

export const ARCHETYPE = 'edgeBand';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'required';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: false });

export const PARAMS = obj({
  bandWidth: fixed('band width (pt); not density-scaled (design §3.2)', { exclusiveMin: 0, default: 6.92 }),
  sides: enumOf(['both', 'left', 'right'], 'which side(s); right band is a translation of the left (R2 §62)', { default: 'both' }),
  pitchY: len('vertical pitch of motifs in the band (pt)', { required: true }),
  rows: autoCount('motifs per band; auto = floor(height / pitchY)', { default: 'auto' }),
  edgeMode: enumOf(['auto', 'whole', 'clip'], 'auto = whole when the motif fits the band width, clip otherwise; whole = only motifs inside the region; clip = motifs touching the region, clipped', { default: 'auto' }),
  bandFrame: obj({
    stroke: enumOf(['ink', 'none'], 'band outline (stroke is the spec stroke width; per-element widths do not exist)', { default: 'ink' }),
    fill: enumOf(['paper', 'none'], 'band ground', { default: 'paper' }),
  }, 'band outline and ground', { default: {} }),
}, 'edge band parameters (design §2.2); motif is not density-scaled');

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
  const bw = p.bandWidth;
  const warnings = [];

  if (!layer.motif) throw new GeometryError(`layer ${id}: edgeBand needs a motif`);
  const sides = p.sides === 'both' ? ['left', 'right'] : [p.sides];
  if (sides.length === 2 && 2 * bw > W + EPS) {
    throw new GeometryError(`layer ${id}: two bands of width ${bw} do not fit in region width ${W}; use sides left or right`);
  }
  if (bw > W + EPS) throw new GeometryError(`layer ${id}: band width ${bw} exceeds region width ${W}`);
  const bandX = { left: [0, bw], right: [W - bw, W] };
  const off = offsetOf(layer);
  if (off.x !== 0) throw new GeometryError(`layer ${id}: edgeBand sits at the region sides; layer.offset.x (${off.x}) cannot be applied (offset.y shifts the rows)`);

  // Row positions (vertical).
  const pitch = p.pitchY * fitOf(ctx).y;
  let rows;
  if (p.rows === 'auto') {
    rows = Math.floor(H / pitch + 1e-9);
    if (rows < 1) throw new GeometryError(`layer ${id}: pitchY ${pitch} is larger than region height ${H}; no row fits`);
  } else {
    rows = p.rows;
  }
  let yAt;
  const o = ctx.origin;
  if (o === 'center') yAt = (k) => H / 2 + (k - (rows - 1) / 2) * pitch + off.y;
  else if (o === 'topLeft') yAt = (k) => pitch / 2 + k * pitch + off.y;
  else if (o && typeof o === 'object') {
    if (o.x !== 0) warnings.push(`layer ${id}: origin.x (${o.x}) is ignored for edgeBand; bands sit at the region sides`);
    yAt = (k) => o.y + k * pitch + off.y;
  } else throw new GeometryError(`layer ${id}: unknown origin ${JSON.stringify(o)}`);

  const out = [];
  const anchors = [];
  let placed = 0;
  let skipped = 0;

  // Band ground and outline first (drawn under the motifs).
  const fs = p.bandFrame;
  if (fs.fill !== 'none' || fs.stroke !== 'none') {
    for (const s of sides) {
      const [x0, x1] = bandX[s];
      out.push(polygon([[x0, 0], [x1, 0], [x1, H], [x0, H]], { stroke: fs.stroke, fill: fs.fill }));
    }
  }

  const prims0 = ctx.buildMotif(layer.motif);
  const ext = ctx.motifExtent(layer.motif);
  if (ext.w > bw + EPS) warnings.push(`layer ${id}: motif width ${ext.w} is wider than the band ${bw}; it will cross the band edge`);
  const mode = p.edgeMode === 'auto' ? (ext.w > bw + EPS ? 'clip' : 'whole') : p.edgeMode;
  const ov = overlapWarning({ extent: ext, pitchY: pitch, strokeWidth: ctx.strokeWidth, layerId: id });
  if (ov) warnings.push(ov);

  for (const s of sides) {
    const cx = (bandX[s][0] + bandX[s][1]) / 2;
    const col = s === 'left' ? 0 : 1;
    for (let k = 0; k < rows; k++) {
      const y = yAt(k);
      const prims = prims0.map((q) => transformPrimitive(q, { x: cx, y }));
      if (keepInstance(prims, R, mode)) {
        for (const q of prims) out.push(q);
        anchors.push({ x: cx, y, row: k, col });
        placed += 1;
      } else {
        skipped += 1;
      }
    }
  }
  if (placed === 0) throw new GeometryError(`layer ${id}: no motif fits inside the bands (check rows, pitchY, origin)`);
  return { primitives: out, placed, skipped, warnings, anchors };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists.
 * The band ground repeats every region width W (left and right bands are adjacent across the seam) and
 * the rows repeat every pitchY. A band outline with stroke 'ink' has horizontal edges at the tile
 * boundary, which would show as seams, so it returns null in that case (CONVENTIONS §3.3).
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  if (layer.params.bandFrame.stroke === 'ink') return null;
  return fitPeriod({ w: ctx.region.width, h: layer.params.pitchY }, ctx);
}
