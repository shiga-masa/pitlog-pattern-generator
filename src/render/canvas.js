/**
 * Canvas 2D backend (design §5.1, §5.7): draws the same primitive list as render/svg.js.
 * Owner: render-2 (stage 1). Contract: docs/CONVENTIONS.md §5, §7.
 * Colours: only ink and paper; no globalAlpha other than 1; no gradients.
 *
 * Structure (so that most of it runs in Node):
 *  - planSpec(spec, options, deps)        pure: resolve + run the layers -> plan (pt, z order)
 *  - buildInstructions(plan, {x,y,scale}) pure: plan -> flat list of drawing instructions
 *  - primitivesInstructions(list, o)      pure: primitive list -> instructions (drawPrimitives)
 *  - drawInstructions(ctx, list)          browser-only: replays the list on a 2D context
 *  - renderCanvas / drawPrimitives        glue: need a real 2D context
 * The layer loop in planSpec mirrors renderSpecToSVG in render/svg.js; keep them in step.
 */

import { LIMITS } from '../core/defaults.js';
import { NotImplementedError, LimitError, GeometryError, ZcError, makeCounts } from '../core/errors.js';
import { normalizeColor } from '../core/colors.js';
import { validatePrimitive } from '../core/primitives.js';
import { resolveSpec } from '../core/resolve.js';
import { DEFAULT_ENV } from '../core/validate.js';
import { createRng, layerSeed } from '../core/rng.js';
import { DEG } from '../core/geom.js';
import { buildMotif, motifExtent } from '../motifs/index.js';

/** Methods a CanvasRenderingContext2D must have for drawInstructions. */
const CONTEXT_METHODS = Object.freeze([
  'save', 'restore', 'transform', 'beginPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo',
  'closePath', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'setLineDash',
]);

// ---------------------------------------------------------------------------
// Pure part
// ---------------------------------------------------------------------------

let defaultRegistryPromise = null;
async function defaultRegistry() {
  if (!defaultRegistryPromise) {
    defaultRegistryPromise = import('../presets/index.js').then((m) => m.loadDefaultRegistry().registry);
  }
  return defaultRegistryPromise;
}

/**
 * Turn a preset id/query or a full spec into a full spec object (the same lookup as renderSVG).
 * @param {string|object} input @param {{registry?:object}} [deps] @returns {Promise<object>}
 */
export async function resolveInput(input, deps = {}) {
  if (typeof input !== 'string') return input;
  const reg = deps.registry ?? await defaultRegistry();
  return reg.get(reg.resolveId(input));
}

/**
 * Resolve a spec and run every layer, mirroring renderSpecToSVG. Nothing is drawn yet.
 * A failing layer throws; no partial plan is returned.
 * @param {object} spec full spec (not an id) @param {object} [options] @param {{env?:object}} [deps]
 * @returns {{id:string, region:{x:number,y:number,width:number,height:number}, unit:string, dpi:number,
 *   colors:{ink:string,paper:string}, strokeWidth:number, cap:string, join:string, ground:string,
 *   frame:{show:string,lineWidth:number}, layers:Array<{id:string,clip:boolean,primitives:object[]}>,
 *   meta:{id:string, density:number, strokeWidth:number, region:object, unit:string, dpi:number,
 *     colors:object, warnings:string[], counts:object}}}
 */
export function planSpec(spec, options = {}, deps = {}) {
  const env = deps.env ?? DEFAULT_ENV;
  const r = resolveSpec(spec, options, env);
  const { drawSpec: s, render } = r;
  if (render.tileMode === 'fit') throw new NotImplementedError('renderCanvas tileMode "fit" (design §5.5)', 'render-1');
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
  const layers = order.map((l) => ({
    id: l.id,
    clip: Boolean(l.clip ?? s.clip),
    primitives: results[l.id].primitives,
  }));
  return {
    id: s.id,
    region,
    unit: render.unit,
    dpi: render.dpi,
    colors,
    strokeWidth: render.strokeWidth,
    cap: s.stroke.cap,
    join: s.stroke.join,
    ground: s.ground,
    frame: { show: s.frame.show, lineWidth: s.frame.lineWidth },
    layers,
    meta: {
      id: s.id,
      density: render.density,
      strokeWidth: render.strokeWidth,
      region: { width: region.width, height: region.height },
      unit: render.unit,
      dpi: render.dpi,
      colors,
      warnings,
      counts,
    },
  };
}

function checkLayerResult(res, layer) {
  const where = `layer ${layer.id} (${layer.archetype})`;
  if (!res || !Array.isArray(res.primitives)) throw new ZcError(`${where}: render() must return {primitives, placed, skipped, warnings}`);
  for (const k of ['placed', 'skipped']) {
    if (!Number.isInteger(res[k]) || res[k] < 0) throw new ZcError(`${where}: result.${k} must be an integer >= 0`);
  }
  if (!Array.isArray(res.warnings)) throw new ZcError(`${where}: result.warnings must be an array`);
  return {
    ...res,
    primitives: res.primitives.map((p, i) => {
      try { return validatePrimitive(p); } catch (e) { throw new ZcError(`${where}: primitive ${i}: ${e.message}`); }
    }),
  };
}

function colorOf(token, colors) {
  if (token === 'ink') return colors.ink;
  if (token === 'paper') return colors.paper;
  throw new TypeError(`unknown paint token ${JSON.stringify(token)}`);
}

function commandInstruction(c) {
  switch (c.op) {
    case 'M': return { op: 'moveTo', x: c.x, y: c.y };
    case 'L': return { op: 'lineTo', x: c.x, y: c.y };
    case 'C': return { op: 'bezierCurveTo', x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, x: c.x, y: c.y };
    case 'Q': return { op: 'quadraticCurveTo', x1: c.x1, y1: c.y1, x: c.x, y: c.y };
    case 'Z': return { op: 'closePath' };
    default: throw new TypeError(`unknown path op ${c.op}`);
  }
}

/** One validated primitive -> instruction list (path, fill, stroke). Coordinates stay in pt. */
function primitiveInstructions(p, colors) {
  const out = [{ op: 'beginPath' }];
  switch (p.type) {
    case 'line':
      out.push({ op: 'moveTo', x: p.x1, y: p.y1 }, { op: 'lineTo', x: p.x2, y: p.y2 });
      break;
    case 'polyline':
    case 'polygon':
      p.points.forEach(([x, y], i) => out.push({ op: i === 0 ? 'moveTo' : 'lineTo', x, y }));
      if (p.type === 'polygon') out.push({ op: 'closePath' });
      break;
    case 'circle':
      out.push({ op: 'ellipse', x: p.cx, y: p.cy, rx: p.r, ry: p.r, rotation: 0, startAngle: 0, endAngle: 2 * Math.PI });
      break;
    case 'ellipse':
      // math convention (CCW, y up) -> canvas (clockwise on screen): negate, like SVG rotate(-deg)
      out.push({ op: 'ellipse', x: p.cx, y: p.cy, rx: p.rx, ry: p.ry, rotation: -p.rotation * DEG, startAngle: 0, endAngle: 2 * Math.PI });
      break;
    case 'path':
      for (const c of p.cmds) out.push(commandInstruction(c));
      break;
    default:
      throw new TypeError(`primitive type ${p.type} is not drawable`);
  }
  const st = p.style;
  if (st.fill !== 'none') out.push({ op: 'setFillStyle', v: colorOf(st.fill, colors) }, { op: 'fill' });
  if (st.stroke !== 'none') {
    out.push(
      { op: 'setStrokeStyle', v: colorOf(st.stroke, colors) },
      { op: 'setLineDash', v: st.dash ? [st.dash[0], st.dash[1]] : [] },
      { op: 'setLineDashOffset', v: st.dashOffset ?? 0 },
      { op: 'stroke' },
    );
  }
  return out;
}

/**
 * Plan -> drawing instructions. The whole pattern is placed by one transform: pt -> device px
 * with `scale` px per pt and the top-left corner at (x, y).
 * Line width is given in pt and therefore follows the transform.
 * @param {ReturnType<typeof planSpec>} plan @param {{x?:number, y?:number, scale:number}} at
 * @returns {Array<{op:string}>}
 */
export function buildInstructions(plan, { x = 0, y = 0, scale }) {
  if (!(Number.isFinite(scale) && scale > 0)) throw new RangeError(`buildInstructions: scale must be > 0, got ${scale}`);
  const { region, colors, strokeWidth, cap, join, ground, frame } = plan;
  const out = [
    { op: 'save' },
    { op: 'setGlobalAlpha', v: 1 },
    { op: 'transform', a: scale, b: 0, c: 0, d: scale, e: x, f: y },
    { op: 'setLineWidth', v: strokeWidth },
    { op: 'setLineCap', v: cap },
    { op: 'setLineJoin', v: join },
    { op: 'setStrokeStyle', v: colors.ink },
    { op: 'setFillStyle', v: colors.ink },
  ];
  if (ground === 'paper') {
    out.push({ op: 'setFillStyle', v: colors.paper }, { op: 'fillRect', x: region.x, y: region.y, w: region.width, h: region.height });
  }
  for (const layer of plan.layers) {
    out.push({ op: 'save' });
    if (layer.clip) {
      out.push({ op: 'beginPath' }, { op: 'rect', x: region.x, y: region.y, w: region.width, h: region.height }, { op: 'clip' });
    }
    for (const p of layer.primitives) out.push(...primitiveInstructions(p, colors));
    out.push({ op: 'restore' });
  }
  if (frame.show === 'ink') {
    // inset by half the line width so the whole frame line is inside the region (CONVENTIONS §3.4)
    const lw = frame.lineWidth;
    out.push(
      { op: 'setLineWidth', v: lw },
      { op: 'setStrokeStyle', v: colors.ink },
      { op: 'strokeRect', x: region.x + lw / 2, y: region.y + lw / 2, w: region.width - lw, h: region.height - lw },
    );
  }
  out.push({ op: 'restore' });
  return out;
}

/**
 * Instructions for an already-built primitive list (pt), scaled by o.scale and placed at (o.x, o.y).
 * No ground, no frame, no clip: the caller decides those.
 * @param {object[]} primitives @param {{ink:string, paper:string, strokeWidth:number, cap:string, join:string, scale:number, x?:number, y?:number}} o
 */
export function primitivesInstructions(primitives, o) {
  if (!(Number.isFinite(o.scale) && o.scale > 0)) throw new RangeError(`drawPrimitives: scale must be > 0, got ${o.scale}`);
  if (!(Number.isFinite(o.strokeWidth) && o.strokeWidth >= 0)) throw new RangeError(`drawPrimitives: strokeWidth must be >= 0, got ${o.strokeWidth}`);
  const colors = { ink: normalizeColor(o.ink), paper: normalizeColor(o.paper) };
  const out = [
    { op: 'save' },
    { op: 'setGlobalAlpha', v: 1 },
    { op: 'transform', a: o.scale, b: 0, c: 0, d: o.scale, e: o.x ?? 0, f: o.y ?? 0 },
    { op: 'setLineWidth', v: o.strokeWidth },
    { op: 'setLineCap', v: o.cap },
    { op: 'setLineJoin', v: o.join },
    { op: 'setStrokeStyle', v: colors.ink },
    { op: 'setFillStyle', v: colors.ink },
  ];
  for (const p of primitives) out.push(...primitiveInstructions(validatePrimitive(p), colors));
  out.push({ op: 'restore' });
  return out;
}

// ---------------------------------------------------------------------------
// Browser part
// ---------------------------------------------------------------------------

/** Throws a clear error when `ctx` is not a 2D context (e.g. when run in Node). */
export function requireContext2D(ctx) {
  if (!ctx || typeof ctx !== 'object') {
    throw new ZcError(`canvas backend: a CanvasRenderingContext2D is required, got ${ctx === null ? 'null' : typeof ctx}. This backend only runs in a browser (or with a canvas polyfill).`);
  }
  const missing = CONTEXT_METHODS.filter((m) => typeof ctx[m] !== 'function');
  if (missing.length) {
    throw new ZcError(`canvas backend: the given object is not a CanvasRenderingContext2D (missing: ${missing.join(', ')})`);
  }
}

/**
 * Replay instructions on a 2D context. Unknown ops throw.
 * @param {CanvasRenderingContext2D} ctx @param {Array<{op:string}>} instructions
 */
export function drawInstructions(ctx, instructions) {
  requireContext2D(ctx);
  for (const ins of instructions) {
    switch (ins.op) {
      case 'save': ctx.save(); break;
      case 'restore': ctx.restore(); break;
      case 'setGlobalAlpha': ctx.globalAlpha = ins.v; break;
      case 'transform': ctx.transform(ins.a, ins.b, ins.c, ins.d, ins.e, ins.f); break;
      case 'setLineWidth': ctx.lineWidth = ins.v; break;
      case 'setLineCap': ctx.lineCap = ins.v; break;
      case 'setLineJoin': ctx.lineJoin = ins.v; break;
      case 'setStrokeStyle': ctx.strokeStyle = ins.v; break;
      case 'setFillStyle': ctx.fillStyle = ins.v; break;
      case 'setLineDash': ctx.setLineDash(ins.v); break;
      case 'setLineDashOffset': ctx.lineDashOffset = ins.v; break;
      case 'beginPath': ctx.beginPath(); break;
      case 'moveTo': ctx.moveTo(ins.x, ins.y); break;
      case 'lineTo': ctx.lineTo(ins.x, ins.y); break;
      case 'bezierCurveTo': ctx.bezierCurveTo(ins.x1, ins.y1, ins.x2, ins.y2, ins.x, ins.y); break;
      case 'quadraticCurveTo': ctx.quadraticCurveTo(ins.x1, ins.y1, ins.x, ins.y); break;
      case 'closePath': ctx.closePath(); break;
      case 'ellipse': ctx.ellipse(ins.x, ins.y, ins.rx, ins.ry, ins.rotation, ins.startAngle, ins.endAngle); break;
      case 'rect': ctx.rect(ins.x, ins.y, ins.w, ins.h); break;
      case 'clip': ctx.clip(); break;
      case 'fill': ctx.fill(); break;
      case 'stroke': ctx.stroke(); break;
      case 'fillRect': ctx.fillRect(ins.x, ins.y, ins.w, ins.h); break;
      case 'strokeRect': ctx.strokeRect(ins.x, ins.y, ins.w, ins.h); break;
      default: throw new TypeError(`drawInstructions: unknown op ${JSON.stringify(ins.op)}`);
    }
  }
}

/**
 * Draw a pattern into ctx inside rect (device pixels). The pattern is scaled uniformly so that
 * its region fills rect; a rect with a different aspect ratio is an error (never stretched).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string|object} input preset id/query or full spec
 * @param {object} options render options
 * @param {{x:number,y:number,width:number,height:number}} rect pixels
 * @param {{env?:object, registry?:object}} [deps]
 * @returns {Promise<{meta:object}>}
 */
export async function renderCanvas(ctx, input, options, rect, deps = {}) {
  requireContext2D(ctx);
  if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
    throw new RangeError(`renderCanvas: rect needs finite x, y and width, height > 0, got ${JSON.stringify(rect)}`);
  }
  const spec = await resolveInput(input, deps);
  const plan = planSpec(spec, options ?? {}, deps);
  const sx = rect.width / plan.region.width;
  const sy = rect.height / plan.region.height;
  if (Math.abs(sx - sy) > 1e-6 * Math.max(sx, sy)) {
    throw new GeometryError(
      `renderCanvas: rect ${rect.width}x${rect.height} px does not keep the pattern aspect ratio ` +
      `${plan.region.width}:${plan.region.height} pt; use a rect of ${(plan.region.width * sx).toFixed(3)}x${(plan.region.height * sx).toFixed(3)} px for scale ${sx}`,
    );
  }
  drawInstructions(ctx, buildInstructions(plan, { x: rect.x, y: rect.y, scale: sx }));
  return { meta: plan.meta };
}

/**
 * Draw an already-built primitive list (pt) with a pt->px scale.
 * @param {CanvasRenderingContext2D} ctx @param {object[]} primitives
 * @param {{ink:string, paper:string, strokeWidth:number, cap:string, join:string, scale:number, x?:number, y?:number}} o
 */
export function drawPrimitives(ctx, primitives, o) {
  requireContext2D(ctx);
  drawInstructions(ctx, primitivesInstructions(primitives, o));
}
