/**
 * SVG <pattern> output for seamless tiling (design §5.1, §5.5).
 * Owner: render-1 (stage 1). Contract: docs/CONVENTIONS.md §3.3, §5, §7.
 * Reuses the shared pipeline render/svg.js buildScene() (tiling, periodic copies, knockout) and the
 * markup helpers (attrs, contentMarkup, paperRect); nothing is re-implemented here.
 *
 * Pattern contract: the tile is in pt, origin top-left, patternUnits="userSpaceOnUse" with x = y = 0.
 * Individuals are placed once each in the tile's domain; those that cross a tile edge get their
 * periodic copies on the other side (wrapToRect), so the tile repeats without seams or doubles.
 * The frame (frame.show 'ink') is not part of a tile and is not drawn; a warning says so.
 */

import { attrs, buildScene, contentMarkup, paperRect, resolveInputSpec } from './svg.js';

export { computeTile } from './svg.js';

/**
 * Build the <pattern> for a resolved spec (synchronous core; `spec` must be a full spec).
 * Uses the shared pipeline render/svg.js buildScene() with output 'tile'.
 * @param {object} spec @param {object} [options] tileMode defaults to 'period' here
 * @param {{env?:object}} [deps]
 * @returns {{defs:string, ref:string, tile:{w:number,h:number}, meta:object}}
 */
export function buildPattern(spec, options = {}, deps = {}) {
  const sc = buildScene(spec, options, deps, { defaultTileMode: 'period', output: 'tile' });
  const { drawSpec: s, render, colors, tiling } = sc;
  const warnings = [...sc.warnings];
  if (s.frame.show === 'ink') warnings.push('frame is not part of a pattern tile; frame.show "ink" is not drawn');
  const tile = tiling.tile;

  const id = `${render.idPrefix}-pattern`;
  const body = (s.ground === 'paper' ? paperRect(tile, colors) : '') + contentMarkup(s, render, colors, sc.prims, null);
  const defs = `<pattern ${attrs({ id, patternUnits: 'userSpaceOnUse', x: 0, y: 0, width: tile.width, height: tile.height })}>${body}</pattern>`;

  return {
    defs,
    ref: `url(#${id})`,
    tile: { w: tile.width, h: tile.height },
    meta: {
      id: s.id,
      unit: 'pt',
      tileMode: tiling.mode,
      periodic: tiling.periodic,
      tile: { w: tile.width, h: tile.height },
      fit: tiling.fit,
      adjust: tiling.adjust,
      region: { width: sc.region.width, height: sc.region.height },
      density: render.density,
      strokeWidth: render.strokeWidth,
      colors,
      warnings,
      counts: sc.counts,
    },
  };
}

/**
 * Pattern for a preset id/query or a full spec. tileMode defaults to 'period'.
 * @param {string|object} input @param {object} [options] @param {{registry?:object, env?:object}} [deps]
 * @returns {Promise<{defs:string, ref:string, tile:{w:number,h:number}, meta:object}>}
 *   defs = '<pattern id=... patternUnits="userSpaceOnUse">...</pattern>', ref = 'url(#...)'
 */
export async function renderSVGPattern(input, options = {}, deps = {}) {
  const spec = await resolveInputSpec(input, deps);
  return buildPattern(spec, options, deps);
}
