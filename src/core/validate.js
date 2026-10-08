/**
 * Runtime validation of PatternSpec and Options (design §5.4). CONVENTIONS §8–§9.
 *
 * - Unknown keys are errors and list the allowed keys, closest first. Nothing is silently dropped.
 * - validate*() returns {ok, errors, warnings}; assert*() throws SchemaError with every error.
 * - The two-colour rule (colors.js) is checked on every spec and options object.
 */

import { SchemaError, rankCandidates } from './errors.js';
import { checkColors } from './colors.js';
import {
  validateValue, applyDefaults, pointer, isPlainObject,
  ALIAS_SPEC, SPEC_HEAD_FIELDS, SPEC_BODY_FIELDS, LAYER_COMMON_FIELDS, OPTIONS, motif,
} from './schema.js';
import { ARCHETYPES } from '../archetypes/index.js';
import { validateMotif, motifDescriptor } from '../motifs/index.js';

/**
 * Build the validation environment. Tests may inject fake archetypes.
 * @param {{archetypes?:Record<string, object>}} [o]
 */
export function makeEnv(o = {}) {
  const archetypes = o.archetypes ?? ARCHETYPES;
  const env = {
    archetypes,
    rank: rankCandidates,
    motifDescriptor,
    validateMotif: (v, p, out) => validateMotif(v, p, out, env),
  };
  return env;
}

const DEFAULT_ENV = makeEnv();

/** Descriptor of a layer for a given archetype module. */
export function layerDescriptor(arch) {
  const fields = {
    ...LAYER_COMMON_FIELDS,
    archetype: { type: 'enum', values: [arch.ARCHETYPE], required: true, desc: 'archetype name' },
    params: { ...arch.PARAMS, default: {} },
  };
  if (arch.MOTIF !== 'forbidden') fields.motif = motif('motif placed by this layer');
  return { type: 'object', fields, desc: `layer (${arch.ARCHETYPE})` };
}

function fullSpecDescriptor() {
  return {
    type: 'object',
    desc: 'pattern spec',
    fields: {
      ...SPEC_HEAD_FIELDS,
      ...SPEC_BODY_FIELDS,
      layers: { type: 'unknown', required: true, desc: 'validated per layer' },
    },
  };
}

function validateLayers(layers, out, env) {
  const path = '/layers';
  if (!Array.isArray(layers)) {
    out.errors.push({ path, message: 'layers must be an array' });
    return;
  }
  if (layers.length === 0) out.errors.push({ path, message: 'layers needs at least 1 layer (use archetype "empty" for a blank pattern)' });
  const names = Object.keys(env.archetypes);
  const seen = new Map();
  layers.forEach((layer, i) => {
    const lp = pointer(path, i);
    if (!isPlainObject(layer)) {
      out.errors.push({ path: lp, message: 'layer must be an object' });
      return;
    }
    const arch = env.archetypes[layer.archetype];
    if (!arch) {
      out.errors.push({ path: `${lp}/archetype`, message: `unknown archetype ${JSON.stringify(layer.archetype)}`, candidates: rankCandidates(String(layer.archetype), names) });
      return;
    }
    validateValue(layerDescriptor(arch), layer, lp, out, env);
    // motif policy
    const hasMotif = layer.motif !== undefined;
    const hasCycle = layer.params?.cycle !== undefined;
    if (arch.MOTIF === 'required' && !hasMotif) out.errors.push({ path: `${lp}/motif`, message: `archetype ${arch.ARCHETYPE} needs a motif` });
    if (arch.MOTIF === 'motifOrCycle' && hasMotif === hasCycle) {
      out.errors.push({ path: lp, message: `archetype ${arch.ARCHETYPE} needs exactly one of motif or params.cycle (got ${hasMotif ? 'both' : 'neither'})` });
    }
    // ids and references
    if (typeof layer.id === 'string') {
      if (seen.has(layer.id)) out.errors.push({ path: `${lp}/id`, message: `duplicate layer id "${layer.id}" (also at /layers/${seen.get(layer.id)})` });
      else seen.set(layer.id, i);
    }
    const refs = [['relation', layer.relation?.to], ['params/avoid', layer.params?.avoid]];
    for (const [where, ref] of refs) {
      if (ref === undefined) continue;
      const earlier = layers.slice(0, i).map((l) => l?.id).filter(Boolean);
      if (!earlier.includes(ref)) {
        out.errors.push({ path: `${lp}/${where}`, message: `refers to "${ref}", which is not an EARLIER layer`, candidates: rankCandidates(String(ref), earlier) });
      }
    }
  });
}

/**
 * Validate a raw (author-written) spec.
 * @param {object} spec @param {object} [env]
 * @returns {{ok:boolean, errors:object[], warnings:object[]}}
 */
export function validateSpec(spec, env = DEFAULT_ENV) {
  const out = { errors: [], warnings: [] };
  if (!isPlainObject(spec)) {
    out.errors.push({ path: '', message: 'spec must be an object' });
    return { ok: false, ...out };
  }
  const colors = checkColors(spec);
  out.errors.push(...colors.errors);
  out.warnings.push(...colors.warnings);
  if ('aliasOf' in spec) {
    validateValue(ALIAS_SPEC, spec, '', out, env);
    if (spec.aliasOf === spec.id) out.errors.push({ path: '/aliasOf', message: 'a spec cannot alias itself' });
  } else {
    validateValue(fullSpecDescriptor(), spec, '', out, env);
    if ('layers' in spec) validateLayers(spec.layers, out, env);
  }
  return { ok: out.errors.length === 0, ...out };
}

/** @throws {SchemaError} */
export function assertValidSpec(spec, env = DEFAULT_ENV) {
  const r = validateSpec(spec, env);
  if (!r.ok) throw new SchemaError(r.errors, `spec ${spec?.id ?? '(no id)'}`);
  return r;
}

/** @returns {{ok:boolean, errors:object[], warnings:object[]}} */
export function validateOptions(options, env = DEFAULT_ENV) {
  const out = { errors: [], warnings: [] };
  const colors = checkColors(options ?? {});
  out.errors.push(...colors.errors);
  out.warnings.push(...colors.warnings);
  validateValue(OPTIONS, options ?? {}, '', out, env);
  if (options?.size?.unit === 'px' && options.dpi === undefined) {
    out.warnings.push({ path: '/dpi', message: 'size.unit is px but dpi is not given; the default dpi is used' });
  }
  return { ok: out.errors.length === 0, ...out };
}

/** @throws {SchemaError} */
export function assertValidOptions(options, env = DEFAULT_ENV) {
  const r = validateOptions(options, env);
  if (!r.ok) throw new SchemaError(r.errors, 'options');
  return r;
}

/** Fill defaults of a validated full spec (layers, params, motifs). */
export function specWithDefaults(spec, env = DEFAULT_ENV) {
  const head = applyDefaults({ type: 'object', fields: { ...SPEC_HEAD_FIELDS, ...SPEC_BODY_FIELDS }, desc: 'spec' }, spec, env);
  head.layers = spec.layers.map((l) => applyDefaults(layerDescriptor(env.archetypes[l.archetype]), l, env));
  return head;
}

export { DEFAULT_ENV };
