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
import { NotImplementedError, LimitError, ZcError, makeCounts } from '../core/errors.js';
import { normalizeColor } from '../core/colors.js';
import { validatePrimitive } from '../core/primitives.js';
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

/**
 * Draw a spec to an SVG string (synchronous core; `spec` must be a full spec, not an id).
 * @param {object} spec @param {object} [options] @param {{env?:object}} [deps]
 * @returns {import('../core/types.js').RenderResult}
 */
export function renderSpecToSVG(spec, options = {}, deps = {}) {
  const env = deps.env ?? DEFAULT_ENV;
  const r = resolveSpec(spec, options, env);
  const { drawSpec: s, render } = r;
  if (render.tileMode === 'fit') throw new NotImplementedError('renderSVG tileMode "fit" (design §5.5)', 'render-1');
  const colors = { ink: normalizeColor(s.ink), paper: normalizeColor(s.paper) };
  const region = { x: 0, y: 0, width: render.region.width, height: render.region.height };
  const warnings = [...r.warnings];
  const counts = { layers: makeCounts(), instances: { placed: 0, skipped: 0 }, primitives: 0 };

  // compute in array order (avoid/relation refer to earlier layers), draw in z order
  const results = {};
  for (const layer of s.layers) {
    const arch = env.archetypes[layer.archetype];
    if (layer.blend === 'knockout') throw new NotImplementedError(`blend "knockout" (layer ${layer.id})`, 'render-1');
    const rng = createRng(layerSeed(s.seed, layer));
    const ctx = {
      region,
      tileMode: render.tileMode,
      strokeWidth: render.strokeWidth,
      origin: s.origin,
      jitter: s.jitter,
      clip: layer.clip ?? s.clip,
      rng,
      results: { ...results },
      buildMotif: (m, motifRng = rng) => buildMotif(m, { strokeWidth: render.strokeWidth, rng: motifRng }),
      motifExtent,
    };
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
    if (counts.primitives > LIMITS.maxPrimitives) {
      throw new LimitError(`more than ${LIMITS.maxPrimitives} primitives (layer ${layer.id}); lower the density or the output size`);
    }
    results[layer.id] = res;
  }
  const order = s.layers.map((l, i) => ({ l, i })).sort((a, b) => a.l.z - b.l.z || a.i - b.i).map((x) => x.l);

  const id = render.idPrefix;
  const clipId = `${id}-clip`;
  const anyClip = s.layers.some((l) => l.clip ?? s.clip);
  const defs = anyClip ? `<clipPath id="${escapeXml(clipId)}"><rect ${attrs({ x: 0, y: 0, width: region.width, height: region.height })}/></clipPath>` : '';
  const parts = [];
  if (s.ground === 'paper') parts.push(`<rect ${attrs({ x: 0, y: 0, width: region.width, height: region.height, fill: colors.paper })}/>`);
  const rootAttrs = attrs({
    fill: 'none', stroke: colors.ink, 'stroke-width': render.strokeWidth,
    'stroke-linecap': s.stroke.cap, 'stroke-linejoin': s.stroke.join,
  });
  parts.push(`<g ${rootAttrs}>`);
  for (const layer of order) {
    const clip = (layer.clip ?? s.clip) ? `url(#${clipId})` : undefined;
    const body = results[layer.id].primitives.map((p) => primitiveToSVG(p, colors)).join('');
    parts.push(`<g ${attrs({ 'data-layer': layer.id, 'clip-path': clip })}>${body}</g>`);
  }
  parts.push('</g>');
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
      warnings,
      counts,
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
  let spec = input;
  if (typeof input === 'string') {
    const reg = deps.registry ?? await defaultRegistry();
    spec = reg.get(reg.resolveId(input));
  }
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
