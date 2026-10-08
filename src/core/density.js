/**
 * Density, method B (design §3, user decision): pitches and motif sizes scale with 1/density,
 * line widths stay fixed in pt. CONVENTIONS §8.
 *
 * Each numeric descriptor carries a density class:
 *   'length' -> × 1/(density × layer.densityScale)    pitches, spacings, wavelengths, offsets
 *   'motif'  -> × motifScale ('follow' = same as length)   motif dimensions, dash, amplitude
 *   'area'   -> × (density × densityScale)^2, rounded      scatter count
 *   'none'   -> unchanged                                   angles, ratios, counts, margins, frame-bound values
 * Archetypes with DENSITY.params = false (frameDiagonal, symbol, empty) are not scaled;
 * DENSITY.motif = false (edgeBand, symbol, ...) keeps the motif at size.
 */

import { matchUnion, isPlainObject } from './schema.js';

/**
 * Resolve the scale factors for given render options.
 * @param {{density?:number, motifScale?:number|'follow', strokeScale?:number|'follow'}} o
 * @returns {{density:number, motifScale:number|'follow', strokeFactor:number}}
 */
export function resolveScales(o = {}) {
  const density = o.density ?? 1;
  if (!(Number.isFinite(density) && density > 0)) throw new RangeError(`density must be > 0, got ${density}`);
  const motifScale = o.motifScale ?? 'follow';
  if (motifScale !== 'follow' && !(Number.isFinite(motifScale) && motifScale > 0)) throw new RangeError(`motifScale must be "follow" or > 0, got ${motifScale}`);
  const ss = o.strokeScale ?? 1;
  let strokeFactor;
  if (ss === 'follow') strokeFactor = 1 / density;
  else if (Number.isFinite(ss) && ss > 0) strokeFactor = ss;
  else throw new RangeError(`strokeScale must be "follow" or > 0, got ${ss}`);
  return { density, motifScale, strokeFactor };
}

/** Length under density d (pitch ÷ d). */
export function scaleLength(value, density) {
  return value / density;
}

/**
 * Count under density d: round(n × d²). Returns the raw value too so callers can warn.
 * @returns {{value:number, raw:number}}
 */
export function scaleCount(n, density) {
  const raw = n * density * density;
  return { value: Math.round(raw), raw };
}

/** Factors used for one layer. */
export function layerFactors(scales, arch, densityScale = 1) {
  const d = scales.density * densityScale;
  const motif = scales.motifScale === 'follow' ? 1 / d : scales.motifScale;
  return {
    params: arch.DENSITY.params ? { length: 1 / d, motif, area: d * d } : { length: 1, motif: 1, area: 1 },
    motif: arch.DENSITY.motif ? motif : 1,
  };
}

/**
 * Walk value and descriptor together and scale numbers by their density class.
 * @param {object} desc @param {unknown} value
 * @param {{length:number, motif:number, area:number}} f
 * @param {object} env {motifDescriptor}
 * @param {(msg:string)=>void} warn
 * @param {string} path
 */
export function scaleByDescriptor(desc, value, f, env, warn = () => {}, path = '') {
  if (value === undefined || value === null) return value;
  switch (desc.type) {
    case 'number':
    case 'integer': {
      if (desc.density === 'length') return value * f.length;
      if (desc.density === 'motif') return value * f.motif;
      if (desc.density === 'area') {
        const raw = value * f.area;
        const v = desc.type === 'integer' ? Math.round(raw) : raw;
        if (value > 0 && v === 0) warn(`${path}: count ${value} rounds to 0 at this density (raw ${raw.toFixed(3)})`);
        return v;
      }
      return value;
    }
    case 'object': {
      if (!isPlainObject(value)) return value;
      const o = {};
      for (const [k, v] of Object.entries(value)) {
        const fd = desc.fields[k];
        o[k] = fd ? scaleByDescriptor(fd, v, f, env, warn, `${path}/${k}`) : structuredClone(v);
      }
      return o;
    }
    case 'array':
      return value.map((v, i) => scaleByDescriptor(desc.items, v, f, env, warn, `${path}/${i}`));
    case 'union': {
      const opt = matchUnion(desc, value, env);
      if (!opt) throw new Error(`${path}: value matches no union option (validate before scaling)`);
      return scaleByDescriptor(opt, value, f, env, warn, path);
    }
    case 'record': {
      const o = {};
      for (const [k, v] of Object.entries(value)) o[k] = scaleByDescriptor(desc.values, v, f, env, warn, `${path}/${k}`);
      return o;
    }
    case 'motif': {
      // A motif nested in params (grid cycle) scales with the motif factor of the params.
      const md = env.motifDescriptor(value);
      return scaleByDescriptor(md, value, { length: f.motif, motif: f.motif, area: 1 }, env, warn, path);
    }
    default:
      return structuredClone(value);
  }
}

/**
 * Apply density to every layer of a resolved (defaults-filled, validated) spec.
 * Returns a new spec; the input is not modified.
 * @param {object} spec @param {{density:number, motifScale:number|'follow'}} scales
 * @param {object} env from validate.makeEnv()
 * @returns {{spec:object, warnings:string[]}}
 */
export function applyDensity(spec, scales, env) {
  const warnings = [];
  const layers = spec.layers.map((layer, i) => {
    const arch = env.archetypes[layer.archetype];
    const f = layerFactors(scales, arch, layer.densityScale ?? 1);
    const warn = (m) => warnings.push(`layer ${layer.id}: ${m}`);
    const out = structuredClone(layer);
    out.params = scaleByDescriptor(arch.PARAMS, layer.params ?? {}, f.params, env, warn, `/layers/${i}/params`);
    if (layer.offset) out.offset = { x: layer.offset.x * f.params.length, y: layer.offset.y * f.params.length };
    if (layer.motif) {
      const md = env.motifDescriptor(layer.motif);
      out.motif = scaleByDescriptor(md, layer.motif, { length: f.motif, motif: f.motif, area: 1 }, env, warn, `/layers/${i}/motif`);
    }
    return out;
  });
  return { spec: { ...structuredClone({ ...spec, layers: undefined }), layers }, warnings };
}

/**
 * Method D helper (design §3.2): density that puts `rows` rows of period `pitchY` in `frameHeight`.
 * density = rows × pitchY / frameHeight.
 */
export function densityFromRowsPerFrame(rows, pitchY, frameHeight) {
  for (const [n, v] of [['rows', rows], ['pitchY', pitchY], ['frameHeight', frameHeight]]) {
    if (!(Number.isFinite(v) && v > 0)) throw new RangeError(`densityFromRowsPerFrame: ${n} must be > 0, got ${v}`);
  }
  return (rows * pitchY) / frameHeight;
}

/** Vertical period of a layer used by rowsPerFrame (first matching key). */
export const VERTICAL_PERIOD_KEYS = Object.freeze(['pitchY', 'spacing', 'lineSpacing', 'courseHeight', 'bandSpacing']);

/**
 * Overlap warning (design §3.2): motif extent + stroke width > pitch.
 * @returns {string|null}
 */
export function overlapWarning({ extent, pitchX, pitchY, strokeWidth, layerId }) {
  const over = [];
  if (pitchX !== undefined && extent.w + strokeWidth > pitchX) over.push(`width ${(extent.w + strokeWidth).toFixed(3)} > pitchX ${pitchX.toFixed(3)}`);
  if (pitchY !== undefined && extent.h + strokeWidth > pitchY) over.push(`height ${(extent.h + strokeWidth).toFixed(3)} > pitchY ${pitchY.toFixed(3)}`);
  return over.length ? `layer ${layerId}: motifs overlap (${over.join(', ')})` : null;
}
