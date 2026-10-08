/**
 * Resolve a spec + options into what the renderers draw (CONVENTIONS §8.3).
 *
 * Order (fixed): validate spec -> validate options -> table defaults -> options common fields
 * -> overrides (JSON Pointer) -> points / paths -> descriptor defaults -> validate again
 * -> density -> render settings. Every step that cannot be applied throws; nothing is dropped.
 */

import { SchemaError, ResolveError, rankCandidates } from './errors.js';
import { defaultsForTable, RENDER_DEFAULTS } from './defaults.js';
import { assertValidSpec, assertValidOptions, specWithDefaults, DEFAULT_ENV } from './validate.js';
import { resolveScales, applyDensity, densityFromRowsPerFrame, VERTICAL_PERIOD_KEYS } from './density.js';
import { toPt } from './units.js';

const PROTECTED_ROOTS = ['schema', 'id', 'table', 'code', 'symbol', 'names', 'provenance', 'aliasOf'];

function unescape(tok) {
  return tok.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Set `value` at JSON Pointer `ptr` inside `target` (mutates). The parent must exist;
 * array indices must exist. Errors name the closest existing keys.
 */
export function setByPointer(target, ptr, value) {
  if (typeof ptr !== 'string' || !ptr.startsWith('/')) throw new SchemaError([{ path: String(ptr), message: 'override path must be a JSON Pointer starting with "/", e.g. "/layers/0/params/pitchX"' }], 'overrides');
  const toks = ptr.slice(1).split('/').map(unescape);
  if (PROTECTED_ROOTS.includes(toks[0])) throw new SchemaError([{ path: ptr, message: `"${toks[0]}" identifies the preset and cannot be overridden` }], 'overrides');
  let cur = target;
  for (let i = 0; i < toks.length - 1; i++) {
    const t = toks[i];
    const next = Array.isArray(cur) ? cur[Number(t)] : cur?.[t];
    if (next === undefined || next === null || typeof next !== 'object') {
      const here = `/${toks.slice(0, i).join('/')}`;
      const keys = cur && typeof cur === 'object' ? Object.keys(cur) : [];
      throw new SchemaError([{ path: ptr, message: `no object at "${here === '/' ? '' : here}/${t}"`, candidates: rankCandidates(t, keys) }], 'overrides');
    }
    cur = next;
  }
  const last = toks[toks.length - 1];
  if (Array.isArray(cur) && !(Number(last) >= 0 && Number(last) < cur.length)) {
    throw new SchemaError([{ path: ptr, message: `array index ${last} out of range (length ${cur.length})` }], 'overrides');
  }
  cur[last] = structuredClone(value);
}

function layerIndex(spec, id, what) {
  const i = spec.layers.findIndex((l) => l.id === id);
  if (i < 0) throw new ResolveError(`${what}: no layer "${id}"`, rankCandidates(id, spec.layers.map((l) => l.id)));
  return i;
}

/**
 * @param {object} spec full (non-alias) spec
 * @param {object} [options] render options (design §5.2)
 * @param {object} [env] from validate.makeEnv()
 * @returns {{spec:object, drawSpec:object, render:object, warnings:string[]}}
 *   spec: defaults + options applied (what toSpec() returns; reproducible)
 *   drawSpec: spec after density scaling (what archetypes receive)
 *   render: { density, motifScale, strokeWidth, tileMode, region:{width,height}, unit, dpi, idPrefix }
 */
export function resolveSpec(spec, options = {}, env = DEFAULT_ENV) {
  if (spec && 'aliasOf' in spec) throw new ResolveError(`spec ${spec.id} is an alias of ${spec.aliasOf}; resolve it through the registry first`);
  const warnings = [];
  const sv = assertValidSpec(spec, env);
  warnings.push(...sv.warnings.map((w) => `${w.path}: ${w.message}`));
  const ov = assertValidOptions(options, env);
  warnings.push(...ov.warnings.map((w) => `options${w.path}: ${w.message}`));

  const s = structuredClone(spec);
  // table defaults under the spec's own values
  const td = defaultsForTable(s.table);
  s.frame = { ...td.frame, ...(s.frame ?? {}) };
  s.stroke = { ...td.stroke, ...(s.stroke ?? {}) };
  // options common fields over the spec
  if (options.stroke) s.stroke = { ...s.stroke, ...options.stroke };
  if (options.frame) s.frame = { ...s.frame, ...options.frame };
  for (const k of ['ink', 'paper', 'ground', 'clip', 'seed', 'jitter', 'origin']) {
    if (options[k] !== undefined) s[k] = structuredClone(options[k]);
  }
  // overrides
  for (const [ptr, value] of Object.entries(options.overrides ?? {})) setByPointer(s, ptr, value);
  // user points / paths
  for (const [id, pts] of Object.entries(options.points ?? {})) {
    const i = layerIndex(s, id, 'options.points');
    if (s.layers[i].archetype !== 'scatter') throw new ResolveError(`options.points: layer "${id}" is ${s.layers[i].archetype}, points apply only to scatter layers`);
    s.layers[i].params = { ...(s.layers[i].params ?? {}), points: structuredClone(pts) };
  }
  for (const [id, d] of Object.entries(options.paths ?? {})) {
    const i = layerIndex(s, id, 'options.paths');
    const arch = env.archetypes[s.layers[i].archetype];
    if (arch.MOTIF === 'forbidden') throw new ResolveError(`options.paths: layer "${id}" (${arch.ARCHETYPE}) has no motif`);
    const fill = s.layers[i].motif?.fill;
    s.layers[i].motif = { kind: 'path', d, ...(fill ? { fill } : {}) };
    if (s.layers[i].params?.cycle) delete s.layers[i].params.cycle;
  }
  // defaults + re-validate the merged result
  assertValidSpec(s, env);
  const full = specWithDefaults(s, env);
  assertValidSpec(full, env);

  // density
  let density = options.density ?? RENDER_DEFAULTS.density;
  if (options.rowsPerFrame !== undefined) {
    const p0 = full.layers[0].params ?? {};
    const key = VERTICAL_PERIOD_KEYS.find((k) => typeof p0[k] === 'number');
    if (!key) throw new ResolveError(`rowsPerFrame: layer "${full.layers[0].id}" has no vertical period`, [...VERTICAL_PERIOD_KEYS]);
    density = densityFromRowsPerFrame(options.rowsPerFrame, p0[key], full.frame.height);
  }
  const scales = resolveScales({ density, motifScale: options.motifScale ?? RENDER_DEFAULTS.motifScale, strokeScale: options.strokeScale ?? RENDER_DEFAULTS.strokeScale });
  const dens = applyDensity(full, scales, env);
  warnings.push(...dens.warnings);

  const unit = options.size?.unit ?? RENDER_DEFAULTS.unit;
  const dpi = options.dpi ?? RENDER_DEFAULTS.dpi;
  const region = options.size
    ? { width: toPt(options.size.width, unit, dpi), height: toPt(options.size.height, unit, dpi) }
    : { width: full.frame.width, height: full.frame.height };

  return {
    spec: full,
    drawSpec: dens.spec,
    render: {
      density: scales.density,
      motifScale: scales.motifScale,
      strokeWidth: full.stroke.width * scales.strokeFactor,
      tileMode: options.tileMode ?? RENDER_DEFAULTS.tileMode,
      region,
      unit,
      dpi,
      idPrefix: options.idPrefix ?? `zc-${full.id.replace(/[^A-Za-z0-9]/g, '_')}`,
    },
    warnings,
  };
}
