/**
 * SVG <pattern> output for seamless tiling (design §5.1, §5.5).
 * Owner: render-1 (stage 1). Contract: docs/CONVENTIONS.md §3.3, §5, §7.
 * Reuses the utilities and the tiling pipeline in render/svg.js (fmt, attrs, computeLayers,
 * computeTile, wrapToRect, contentMarkup); nothing is re-implemented here.
 *
 * Pattern contract: the tile is in pt, origin top-left, patternUnits="userSpaceOnUse" with x = y = 0.
 * Individuals are placed once each in the tile's domain; those that cross a tile edge get their
 * periodic copies on the other side (wrapToRect), so the tile repeats without seams or doubles.
 * The frame (frame.show 'ink') is not part of a tile and is not drawn; a warning says so.
 */

import { resolveSpec } from '../core/resolve.js';
import { DEFAULT_ENV } from '../core/validate.js';
import { LimitError } from '../core/errors.js';
import { LIMITS } from '../core/defaults.js';
import {
  attrs, colorsOf, computeLayers, computeTile, contentMarkup, paperRect, resolveInputSpec, wrapToRect,
} from './svg.js';

export { computeTile } from './svg.js';

/**
 * Build the <pattern> for a resolved spec (synchronous core; `spec` must be a full spec).
 * @param {object} spec @param {object} [options] tileMode defaults to 'period' here
 * @param {{env?:object}} [deps]
 * @returns {{defs:string, ref:string, tile:{w:number,h:number}, meta:object}}
 */
export function buildPattern(spec, options = {}, deps = {}) {
  const env = deps.env ?? DEFAULT_ENV;
  const mode = options.tileMode ?? 'period';
  const r = resolveSpec(spec, options, env);
  const { drawSpec: s, render } = r;
  const colors = colorsOf(s);
  const target = { width: render.region.width, height: render.region.height };
  const warnings = [...r.warnings];

  const tiling = computeTile(s, { env, render, mode, target });
  warnings.push(...tiling.warnings);
  if (s.frame.show === 'ink') warnings.push('frame is not part of a pattern tile; frame.show "ink" is not drawn');

  const tile = tiling.tile;
  const computed = computeLayers(s, env, render, {
    region: { x: 0, y: 0, width: tile.width, height: tile.height },
    tileMode: tiling.periodic ? 'period' : 'frame',
    fit: tiling.fit,
  });
  warnings.push(...computed.warnings);

  const halo = render.strokeWidth / 2;
  const rect = { x0: 0, y0: 0, x1: tile.width, y1: tile.height };
  const prims = {};
  let total = 0;
  for (const layer of s.layers) {
    const domain = computed.results[layer.id].primitives;
    prims[layer.id] = tiling.periodic ? wrapToRect(domain, tile, rect, halo) : domain;
    total += prims[layer.id].length;
  }
  if (total > LIMITS.maxPrimitives) {
    throw new LimitError(`more than ${LIMITS.maxPrimitives} primitives in one pattern tile; lower the density`);
  }

  const id = `${render.idPrefix}-pattern`;
  const body = (s.ground === 'paper' ? paperRect(tile, colors) : '') + contentMarkup(s, render, colors, prims, null);
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
      region: target,
      density: render.density,
      strokeWidth: render.strokeWidth,
      colors,
      warnings,
      counts: { layers: computed.counts.layers, instances: computed.counts.instances, primitives: total },
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
