/**
 * SVG output: primitive serialisation utilities (stage 0, complete) and the renderSVG pipeline.
 * Owner: stage 0 for the utilities; render-1 (stage 1) may extend renderSVG (tileMode 'fit',
 * blend 'knockout') but must keep the output contract in CONVENTIONS §3, §5, §7.
 *
 * Output contract:
 *  - viewBox = region in pt, origin top-left; width/height carry the unit (pt|mm|px).
 *  - Numbers written with SVG_DECIMALS (3) decimals, no exponent, "-0" -> "0"; NaN/Infinity throw.
 *  - Only two colours ever appear: ink and paper (as '#rrggbb'). No opacity, no gradients.
 *  - Layers are <g data-layer="id"> in draw order; the frame outline is drawn last.
 */

import { SVG_DECIMALS, LIMITS } from '../core/defaults.js';
import { NotImplementedError, LimitError, GeometryError, ZcError, makeCounts } from '../core/errors.js';
import { normalizeColor } from '../core/colors.js';
import { validatePrimitive, bbox, transformPrimitive } from '../core/primitives.js';
import { resolveSpec } from '../core/resolve.js';
import { DEFAULT_ENV } from '../core/validate.js';
import { createRng, layerSeed } from '../core/rng.js';
import { fromPt } from '../core/units.js';
import { buildMotif, motifExtent } from '../motifs/index.js';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Format a number for SVG: fixed decimals, trailing zeros removed, no exponent.
 * @param {number} n @param {number} [decimals]
 */
export function fmt(n, decimals = SVG_DECIMALS) {
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new TypeError(`fmt: not a finite number: ${n}`);
  let s = n.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s;
}

const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => XML_ESC[c]);
}

/**
 * Attribute string from an object; numbers go through fmt, undefined/null are omitted.
 * Keys are written in insertion order.
 */
export function attrs(o) {
  const parts = [];
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    parts.push(`${k}="${typeof v === 'number' ? fmt(v) : escapeXml(v)}"`);
  }
  return parts.join(' ');
}

/** Points list "x,y x,y". */
export function pointsAttr(points) {
  return points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ');
}

/** Path commands -> path data. */
export function pathData(cmds) {
  return cmds.map((c) => {
    switch (c.op) {
      case 'M': case 'L': return `${c.op}${fmt(c.x)} ${fmt(c.y)}`;
      case 'C': return `C${fmt(c.x1)} ${fmt(c.y1)} ${fmt(c.x2)} ${fmt(c.y2)} ${fmt(c.x)} ${fmt(c.y)}`;
      case 'Q': return `Q${fmt(c.x1)} ${fmt(c.y1)} ${fmt(c.x)} ${fmt(c.y)}`;
      case 'Z': return 'Z';
      default: throw new TypeError(`pathData: unknown op ${c.op}`);
    }
  }).join('');
}

/**
 * Paint token -> attribute value. Root <g> sets stroke=ink, fill=none, so only deviations are written.
 * @param {{ink:string, paper:string}} colors
 */
export function paintValue(token, colors) {
  if (token === 'ink') return colors.ink;
  if (token === 'paper') return colors.paper;
  if (token === 'none') return 'none';
  throw new TypeError(`unknown paint token ${JSON.stringify(token)}`);
}

/**
 * One primitive -> one SVG element string.
 * @param {object} p primitive (validated) @param {{ink:string, paper:string}} colors
 */
export function primitiveToSVG(p, colors) {
  const st = p.style;
  const common = {
    stroke: st.stroke !== 'ink' ? paintValue(st.stroke, colors) : undefined,
    fill: st.fill !== 'none' ? paintValue(st.fill, colors) : undefined,
    'stroke-dasharray': st.dash ? `${fmt(st.dash[0])} ${fmt(st.dash[1])}` : undefined,
    'stroke-dashoffset': st.dash && st.dashOffset ? st.dashOffset : undefined,
  };
  switch (p.type) {
    case 'line':
      return `<line ${attrs({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, ...common })}/>`;
    case 'polyline':
      return `<polyline ${attrs({ points: pointsAttr(p.points), ...common })}/>`;
    case 'polygon':
      return `<polygon ${attrs({ points: pointsAttr(p.points), ...common })}/>`;
    case 'circle':
      return `<circle ${attrs({ cx: p.cx, cy: p.cy, r: p.r, ...common })}/>`;
    case 'ellipse': {
      // math-convention CCW rotation = SVG rotate(-deg) in y-down coordinates
      const transform = p.rotation ? `rotate(${fmt(-p.rotation)} ${fmt(p.cx)} ${fmt(p.cy)})` : undefined;
      return `<ellipse ${attrs({ cx: p.cx, cy: p.cy, rx: p.rx, ry: p.ry, transform, ...common })}/>`;
    }
    case 'path':
      return `<path ${attrs({ d: pathData(p.cmds), ...common })}/>`;
    default:
      throw new TypeError(`primitiveToSVG: unknown type ${p.type}`);
  }
}

/**
 * Complete SVG document.
 * @param {{region:{width:number,height:number}, unit:'pt'|'mm'|'px', dpi:number, body:string, defs?:string, title?:string}} o
 */
export function svgDocument(o) {
  const w = fromPt(o.region.width, o.unit, o.dpi);
  const h = fromPt(o.region.height, o.unit, o.dpi);
  const unit = o.unit === 'px' ? '' : o.unit;
  const head = `<svg xmlns="http://www.w3.org/2000/svg" ${attrs({ width: `${fmt(w)}${unit}`, height: `${fmt(h)}${unit}`, viewBox: `0 0 ${fmt(o.region.width)} ${fmt(o.region.height)}` })}>`;
  const title = o.title ? `<title>${escapeXml(o.title)}</title>` : '';
  const defs = o.defs ? `<defs>${o.defs}</defs>` : '';
  return `${head}${title}${defs}${o.body}</svg>`;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

let defaultRegistryPromise = null;
async function defaultRegistry() {
  if (!defaultRegistryPromise) {
    defaultRegistryPromise = import('../presets/index.js').then((m) => m.loadDefaultRegistry().registry);
  }
  return defaultRegistryPromise;
}

/**
 * A preset id/query is looked up in the registry; a full spec is returned as is.
 * @param {string|object} input @param {{registry?:object}} [deps] @returns {Promise<object>}
 */
export async function resolveInputSpec(input, deps = {}) {
  if (typeof input !== 'string') return input;
  const reg = deps.registry ?? await defaultRegistry();
  return reg.get(reg.resolveId(input));
}

function checkLayerResult(res, layer) {
  const where = `layer ${layer.id} (${layer.archetype})`;
  if (!res || !Array.isArray(res.primitives)) throw new ZcError(`${where}: render() must return {primitives, placed, skipped, warnings}`);
  for (const k of ['placed', 'skipped']) {
    if (!Number.isInteger(res[k]) || res[k] < 0) throw new ZcError(`${where}: result.${k} must be an integer >= 0`);
  }
  if (!Array.isArray(res.warnings)) throw new ZcError(`${where}: result.warnings must be an array`);
  return { ...res, primitives: res.primitives.map((p, i) => {
    try { return validatePrimitive(p); } catch (e) { throw new ZcError(`${where}: primitive ${i}: ${e.message}`); }
  }) };
}

// ---------------------------------------------------------------------------
// Periodic tiling (design §5.5, CONVENTIONS §3.3)
// ---------------------------------------------------------------------------

/** Identity fit: archetypes scale their periods by ctx.fit (1 = no adjustment). */
const UNIT_FIT = Object.freeze({ x: 1, y: 1 });
/** Search bound for a common period: T = k * p0 for k = 1..PERIOD_MAX_MULTIPLE. */
const PERIOD_MAX_MULTIPLE = 64;
/** Largest rounding of a period to an integer count (design §5.5 "±5 %"). */
const FIT_TOLERANCE = 0.05;
/** Tolerance on a ratio that must be an integer. */
const RATIO_EPS = 1e-6;

const isIntegerRatio = (r) => Number.isFinite(r) && Math.abs(r - Math.round(r)) <= RATIO_EPS;

/** Context handed to archetype.render() and archetype.period(). */
function makeLayerCtx(drawSpec, render, layer, { region, tileMode, fit, results }) {
  const rng = createRng(layerSeed(drawSpec.seed, layer));
  return {
    region,
    tileMode,
    fit,
    strokeWidth: render.strokeWidth,
    origin: drawSpec.origin,
    jitter: drawSpec.jitter,
    clip: layer.clip ?? drawSpec.clip,
    rng,
    results,
    buildMotif: (m, motifRng = rng) => buildMotif(m, { strokeWidth: render.strokeWidth, rng: motifRng }),
    motifExtent,
  };
}

function checkPrimitiveLimit(n, label) {
  if (n > LIMITS.maxPrimitives) {
    throw new LimitError(`more than ${LIMITS.maxPrimitives} primitives (${label}); lower the density or the output size`);
  }
}

/**
 * Render every layer of a resolved spec into `region`. Returns the primitives of the domain
 * (each individual once, straddlers included); no periodic copies are made here.
 * @returns {{results: Record<string, object>, counts: object, warnings: string[]}}
 */
export function computeLayers(drawSpec, env, render, { region, tileMode, fit = UNIT_FIT }) {
  const counts = { layers: makeCounts(), instances: { placed: 0, skipped: 0 }, primitives: 0 };
  const warnings = [];
  const results = {};
  for (const layer of drawSpec.layers) {
    const arch = env.archetypes[layer.archetype];
    if (layer.blend === 'knockout') throw new NotImplementedError(`blend "knockout" (layer ${layer.id})`, 'render-1');
    const ctx = makeLayerCtx(drawSpec, render, layer, { region, tileMode, fit, results: { ...results } });
    let res;
    try {
      res = checkLayerResult(arch.render(layer, ctx), layer);
    } catch (e) {
      counts.layers.failed++;
      throw e; // a single render never returns a partial picture
    }
    if (res.primitives.length === 0 && layer.archetype !== 'empty') warnings.push(`layer ${layer.id}: produced no primitives (placed ${res.placed}, skipped ${res.skipped})`);
    warnings.push(...res.warnings.map((w) => `layer ${layer.id}: ${w}`));
    counts.layers.processed++;
    counts.instances.placed += res.placed;
    counts.instances.skipped += res.skipped;
    counts.primitives += res.primitives.length;
    checkPrimitiveLimit(counts.primitives, `layer ${layer.id}`);
    results[layer.id] = res;
  }
  return { results, counts, warnings };
}

/**
 * Period of every layer at the given fit. A layer whose archetype has no period yields null.
 * @returns {Array<{id:string, archetype:string, period:({w:number,h:number}|null)}>}
 */
export function layerPeriods(drawSpec, env, render, fit = UNIT_FIT) {
  const frame = { x: 0, y: 0, width: drawSpec.frame.width, height: drawSpec.frame.height };
  return drawSpec.layers.map((layer) => {
    const arch = env.archetypes[layer.archetype];
    const ctx = makeLayerCtx(drawSpec, render, layer, { region: frame, tileMode: 'period', fit, results: {} });
    const p = arch.period(layer, ctx);
    if (p === null) return { id: layer.id, archetype: layer.archetype, period: null };
    if (!p || !(Number.isFinite(p.w) && p.w > 0 && Number.isFinite(p.h) && p.h > 0)) {
      throw new ZcError(`layer ${layer.id} (${layer.archetype}): period() must return null or {w, h} with w, h > 0`);
    }
    return { id: layer.id, archetype: layer.archetype, period: { w: p.w, h: p.h } };
  });
}

/**
 * Smallest period T that is an integer multiple of every given period, on each axis
 * (searched as k * p0 for k <= PERIOD_MAX_MULTIPLE). null when no such T exists.
 * @param {Array<{w:number,h:number}>} periods non-empty
 */
export function commonPeriod(periods) {
  if (periods.length === 0) throw new GeometryError('commonPeriod: no periods given');
  const axis = (key) => {
    const base = periods[0][key];
    for (let k = 1; k <= PERIOD_MAX_MULTIPLE; k++) {
      const T = base * k;
      if (periods.every((p) => isIntegerRatio(T / p[key]))) return T;
    }
    return null;
  };
  const w = axis('w');
  const h = axis('h');
  return w === null || h === null ? null : { w, h };
}

/**
 * Round one period so that an integer number of periods spans the target length.
 * @returns {{n:number, tile:number, ratio:number}} ratio = tile / period
 */
function fitAxis(period, length, axis, label) {
  if (!(Number.isFinite(length) && length > 0)) throw new GeometryError(`${label}: target ${axis} length must be > 0, got ${length}`);
  const n = Math.max(1, Math.round(length / period));
  const tile = length / n;
  const ratio = tile / period;
  if (Math.abs(ratio - 1) > FIT_TOLERANCE) {
    throw new GeometryError(`${label}: ${axis} period ${fmt(period)} pt cannot be fitted to ${fmt(length)} pt within ±5 % (nearest count ${n} gives ${fmt(tile)} pt, ratio ${fmt(ratio)})`);
  }
  return { n, tile, ratio };
}

/** Run a period() pass; a NotImplementedError is re-raised with the tiling mode named. */
function periodsFor(drawSpec, env, render, fit, label) {
  try {
    return layerPeriods(drawSpec, env, render, fit);
  } catch (e) {
    if (e instanceof NotImplementedError) throw new NotImplementedError(`${label}: ${e.what}`, e.owner);
    throw e;
  }
}

/**
 * tileMode "fit": one common period rounded so that an integer count fills `target`.
 * Verifies that every archetype honoured ctx.fit (its period must divide the new tile).
 * @returns {{tile:{width:number,height:number}, fit:{x:number,y:number}, adjust:object}}
 */
export function fitTiling(drawSpec, env, render, target, label = 'tileMode "fit"') {
  const per = periodsFor(drawSpec, env, render, UNIT_FIT, label);
  const missing = per.filter((p) => p.period === null).map((p) => p.id);
  if (missing.length) throw new GeometryError(`${label}: layer(s) ${missing.join(', ')} have no period (period() returned null); they cannot be tiled`);
  const T = commonPeriod(per.map((p) => p.period));
  if (!T) {
    const list = per.map((p) => `${p.id} ${fmt(p.period.w)}x${fmt(p.period.h)}`).join(', ');
    throw new GeometryError(`${label}: the layers have no common period within ${PERIOD_MAX_MULTIPLE} multiples (${list}); fit cannot round them to one tile`);
  }
  const x = fitAxis(T.w, target.width, 'x', label);
  const y = fitAxis(T.h, target.height, 'y', label);
  const fit = { x: x.ratio, y: y.ratio };
  const tile = { width: x.tile, height: y.tile };
  for (const p of periodsFor(drawSpec, env, render, fit, label)) {
    if (!isIntegerRatio(tile.width / p.period.w) || !isIntegerRatio(tile.height / p.period.h)) {
      throw new GeometryError(`${label}: layer ${p.id} (${p.archetype}) did not apply ctx.fit: its period ${fmt(p.period.w)} x ${fmt(p.period.h)} pt does not divide the tile ${fmt(tile.width)} x ${fmt(tile.height)} pt`);
    }
  }
  return {
    tile,
    fit,
    adjust: {
      x: { period: T.w, tile: x.tile, n: x.n, ratio: x.ratio },
      y: { period: T.h, tile: y.tile, n: y.n, ratio: y.ratio },
    },
  };
}

/**
 * Tile of a spec for a tileMode, and whether its content is periodic (needs wrapping).
 *  - 'frame': the target itself, not periodic.
 *  - 'period': the common period of all layers; when a layer has no period, or no common period
 *    exists, the tile falls back (warning recorded): no period -> frame; no common period -> fit.
 *  - 'fit': fitTiling (errors are not swallowed).
 * @param {object} drawSpec resolved spec with density applied
 * @param {{env:object, render:object, mode:string, target:{width:number,height:number}}} ctx
 * @returns {{mode:'frame'|'period'|'fit', periodic:boolean, tile:{width:number,height:number}, fit:{x:number,y:number}, adjust:(object|null), warnings:string[]}}
 */
export function computeTile(drawSpec, ctx) {
  const { env, render, mode, target } = ctx;
  const warnings = [];
  const frameTile = { mode: 'frame', periodic: false, tile: { width: target.width, height: target.height }, fit: UNIT_FIT, adjust: null, warnings };
  if (mode === 'frame') return frameTile;
  if (mode === 'fit') {
    const t = fitTiling(drawSpec, env, render, target);
    return { mode: 'fit', periodic: true, tile: t.tile, fit: t.fit, adjust: t.adjust, warnings };
  }
  if (mode !== 'period') throw new GeometryError(`tileMode must be "period", "frame" or "fit", got ${JSON.stringify(mode)}`);
  const per = layerPeriods(drawSpec, env, render);
  const missing = per.filter((p) => p.period === null).map((p) => p.id);
  if (missing.length) {
    warnings.push(`tileMode "period": no period for layer(s) ${missing.join(', ')}; the tile falls back to the target size (frame, not seamless)`);
    return frameTile;
  }
  const T = commonPeriod(per.map((p) => p.period));
  if (T) return { mode: 'period', periodic: true, tile: { width: T.w, height: T.h }, fit: UNIT_FIT, adjust: null, warnings };
  warnings.push(`tileMode "period": no common period among the layers; fitted to ${fmt(target.width)} x ${fmt(target.height)} pt (within ±5 %)`);
  const t = fitTiling(drawSpec, env, render, target, 'tileMode "period" fallback to fit');
  return { mode: 'fit', periodic: true, tile: t.tile, fit: t.fit, adjust: t.adjust, warnings };
}

/**
 * Add the periodic copies of domain primitives that meet `rect` (the copies are the shifts by
 * whole tiles, each applied once). Each individual is in the domain once, so nothing is doubled.
 * @param {object[]} prims domain primitives (pt) @param {{width:number,height:number}} tile
 * @param {{x0:number,y0:number,x1:number,y1:number}} rect @param {number} halo half the stroke width
 */
export function wrapToRect(prims, tile, rect, halo) {
  const out = [];
  for (const p of prims) {
    const b = bbox(p);
    const i0 = Math.ceil((rect.x0 - halo - b.maxX) / tile.width);
    const i1 = Math.floor((rect.x1 + halo - b.minX) / tile.width);
    const j0 = Math.ceil((rect.y0 - halo - b.maxY) / tile.height);
    const j1 = Math.floor((rect.y1 + halo - b.minY) / tile.height);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        out.push(i === 0 && j === 0 ? p : transformPrimitive(p, { x: i * tile.width, y: j * tile.height }));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Markup shared by renderSpecToSVG and the <pattern> output (svgPattern.js)
// ---------------------------------------------------------------------------

/** z order: ascending z, ties keep array order (CONVENTIONS §3.4). */
export function zOrder(layers) {
  return layers.map((l, i) => ({ l, i })).sort((a, b) => a.l.z - b.l.z || a.i - b.i).map((x) => x.l);
}

/** Full-size paper rectangle for ground: 'paper'. */
export function paperRect(region, colors) {
  return `<rect ${attrs({ x: 0, y: 0, width: region.width, height: region.height, fill: colors.paper })}/>`;
}

/**
 * The root <g> with the stroke settings and one <g data-layer> per layer (in z order).
 * @param {object} drawSpec @param {object} render @param {{ink:string,paper:string}} colors
 * @param {Record<string, object[]>} prims primitives per layer id
 * @param {string|null} clipId clipPath id to apply to clipped layers, or null for none
 */
export function contentMarkup(drawSpec, render, colors, prims, clipId) {
  const rootAttrs = attrs({
    fill: 'none', stroke: colors.ink, 'stroke-width': render.strokeWidth,
    'stroke-linecap': drawSpec.stroke.cap, 'stroke-linejoin': drawSpec.stroke.join,
  });
  const parts = [`<g ${rootAttrs}>`];
  for (const layer of zOrder(drawSpec.layers)) {
    const clipped = clipId !== null && (layer.clip ?? drawSpec.clip);
    const clip = clipped ? `url(#${clipId})` : undefined;
    const body = prims[layer.id].map((p) => primitiveToSVG(p, colors)).join('');
    parts.push(`<g ${attrs({ 'data-layer': layer.id, 'clip-path': clip })}>${body}</g>`);
  }
  parts.push('</g>');
  return parts.join('');
}

/** Colours of a resolved spec; only ink and paper (CONVENTIONS §5). */
export function colorsOf(drawSpec) {
  return { ink: normalizeColor(drawSpec.ink), paper: normalizeColor(drawSpec.paper) };
}

// ---------------------------------------------------------------------------
// Public SVG output
// ---------------------------------------------------------------------------

/**
 * Draw a spec to an SVG string (synchronous core; `spec` must be a full spec, not an id).
 * tileMode 'frame' draws the region once; 'period' and 'fit' fill the region with the tile.
 * @param {object} spec @param {object} [options] @param {{env?:object}} [deps]
 * @returns {import('../core/types.js').RenderResult}
 */
export function renderSpecToSVG(spec, options = {}, deps = {}) {
  const env = deps.env ?? DEFAULT_ENV;
  const r = resolveSpec(spec, options, env);
  const { drawSpec: s, render } = r;
  const colors = colorsOf(s);
  const region = { x: 0, y: 0, width: render.region.width, height: render.region.height };
  const warnings = [...r.warnings];
  const halo = render.strokeWidth / 2;

  const tiling = computeTile(s, { env, render, mode: render.tileMode, target: { width: region.width, height: region.height } });
  warnings.push(...tiling.warnings);
  const tileRegion = { x: 0, y: 0, width: tiling.tile.width, height: tiling.tile.height };
  const computed = computeLayers(s, env, render, { region: tileRegion, tileMode: tiling.periodic ? 'period' : 'frame', fit: tiling.fit });
  warnings.push(...computed.warnings);

  const prims = {};
  let total = 0;
  for (const layer of s.layers) {
    const domain = computed.results[layer.id].primitives;
    prims[layer.id] = tiling.periodic ? wrapToRect(domain, tiling.tile, { x0: 0, y0: 0, x1: region.width, y1: region.height }, halo) : domain;
    total += prims[layer.id].length;
  }
  checkPrimitiveLimit(total, 'output');

  const anyClip = s.layers.some((l) => l.clip ?? s.clip);
  const clipId = `${render.idPrefix}-clip`;
  const defs = anyClip ? `<clipPath id="${escapeXml(clipId)}"><rect ${attrs({ x: 0, y: 0, width: region.width, height: region.height })}/></clipPath>` : '';
  const parts = [];
  if (s.ground === 'paper') parts.push(paperRect(region, colors));
  parts.push(contentMarkup(s, render, colors, prims, anyClip ? clipId : null));
  if (s.frame.show === 'ink') {
    // inset by half the line width so the whole frame line is visible inside the viewBox (CONVENTIONS §3.4)
    const lw = s.frame.lineWidth;
    parts.push(`<rect ${attrs({ x: lw / 2, y: lw / 2, width: region.width - lw, height: region.height - lw, fill: 'none', stroke: colors.ink, 'stroke-width': lw })}/>`);
  }
  const svg = svgDocument({ region, unit: render.unit, dpi: render.dpi, defs, body: parts.join(''), title: s.names?.ja });
  return {
    svg,
    meta: {
      id: s.id,
      width: fromPt(region.width, render.unit, render.dpi),
      height: fromPt(region.height, render.unit, render.dpi),
      unit: render.unit,
      region: { width: region.width, height: region.height },
      density: render.density,
      strokeWidth: render.strokeWidth,
      colors,
      tiling: { mode: tiling.mode, periodic: tiling.periodic, tile: tiling.tile, fit: tiling.fit, adjust: tiling.adjust },
      warnings,
      counts: { layers: computed.counts.layers, instances: computed.counts.instances, primitives: total },
    },
  };
}

/**
 * Public renderSVG (design §5.1). `input` is a preset id/query or a full spec.
 * Async because the default registry is loaded lazily.
 * @param {string|object} input @param {object} [options] @param {{registry?:object, env?:object}} [deps]
 * @returns {Promise<import('../core/types.js').RenderResult>}
 */
export async function renderSVG(input, options = {}, deps = {}) {
  const spec = await resolveInputSpec(input, deps);
  return renderSpecToSVG(spec, options, deps);
}

/**
 * Render many inputs; never throws for an individual failure.
 * @returns {Promise<{results:Array<{input:any, ok:boolean, svg?:string, meta?:object, error?:string}>, counts:{processed:number, skipped:number, failed:number}}>}
 *   skipped = duplicate inputs (rendered once, reported here)
 */
export async function renderBatch(inputs, options = {}, deps = {}) {
  const counts = makeCounts();
  const results = [];
  const seen = new Set();
  for (const input of inputs) {
    const key = typeof input === 'string' ? input : input?.id;
    if (key !== undefined && seen.has(key)) {
      counts.skipped++;
      results.push({ input, ok: false, error: `duplicate input ${key} (skipped)` });
      continue;
    }
    if (key !== undefined) seen.add(key);
    try {
      const r = await renderSVG(input, options, deps);
      counts.processed++;
      results.push({ input, ok: true, svg: r.svg, meta: r.meta });
    } catch (e) {
      counts.failed++;
      results.push({ input, ok: false, error: `${e.name}: ${e.message}` });
    }
  }
  return { results, counts };
}
