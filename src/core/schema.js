/**
 * Descriptor engine and the spec-level descriptors.
 *
 * A descriptor is a plain object describing one value. It is the single source of truth
 * for validation, defaults and density scaling (docs/CONVENTIONS.md §8):
 *
 *   { type: 'number'|'integer', min?, max?, exclusiveMin?, softMin?, softMax?,
 *     unit: 'pt'|'deg'|'ratio'|'count'|'px'|'dpi'|'factor', density: 'length'|'motif'|'area'|'none',
 *     default?, required?, nullable?, desc }
 *   { type: 'string', pattern?, desc }        { type: 'boolean', default?, desc }
 *   { type: 'enum', values: [...], default?, desc }   { type: 'const', value, desc }
 *   { type: 'object', fields: {...}, exclusive?: [[a,b],...], default?, desc }
 *   { type: 'array', items: <descriptor>, minItems?, maxItems?, default?, desc }
 *   { type: 'union', options: [<descriptor>...], default?, desc }   (first option without errors wins)
 *   { type: 'record', keyPattern?, values: <descriptor>, desc }     (free keys, typed values)
 *   { type: 'motif', desc }                                       (delegated to src/motifs/index.js)
 *   { type: 'unknown', desc }                                     (only for options.overrides values)
 *
 * This module imports nothing from archetypes/motifs; validate.js wires them in via `env`.
 */

import { DEFAULT_INK, DEFAULT_PAPER } from './colors.js';

export const SCHEMA_ID = 'zc-pattern/1.0.0';
export const SCHEMA_PATTERN = /^zc-pattern\/1\.\d+\.\d+$/;

/** Canonical preset id (docs/CONVENTIONS.md §6). */
export const ID_PATTERN = /^zc:(?:\d{9}|t3-9:[1-5]|t4-3:-?[A-Z][a-z]?|t5-[123]:\d{1,3})$/;
/** Layer id: lowerCamelCase ASCII. */
export const LAYER_ID_PATTERN = /^[a-z][A-Za-z0-9]*$/;

export const TABLES = Object.freeze([
  '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '4-1', '4-2', '4-3', '5-1', '5-2', '5-3',
]);

export const UNITS = Object.freeze(['pt', 'deg', 'ratio', 'count', 'px', 'dpi', 'factor', 'mm']);
export const DENSITY_CLASSES = Object.freeze(['length', 'motif', 'area', 'none']);
const TYPES = ['number', 'integer', 'string', 'boolean', 'enum', 'const', 'object', 'array', 'union', 'record', 'motif', 'unknown'];

// ---------------------------------------------------------------------------
// Descriptor helpers (use these in archetype / motif files so every numeric field
// states its unit and density class).
// ---------------------------------------------------------------------------

/** Length in pt that scales with 1/density (pitches, spacings). */
export const len = (desc, extra = {}) => ({ type: 'number', unit: 'pt', density: 'length', exclusiveMin: 0, desc, ...extra });
/** Motif dimension in pt that scales with motifScale. */
export const size = (desc, extra = {}) => ({ type: 'number', unit: 'pt', density: 'motif', exclusiveMin: 0, desc, ...extra });
/** Fixed length in pt (not scaled by density). */
export const fixed = (desc, extra = {}) => ({ type: 'number', unit: 'pt', density: 'none', desc, ...extra });
/** Angle in degrees, math convention (CCW positive, see CONVENTIONS §2). */
export const angle = (desc, extra = {}) => ({ type: 'number', unit: 'deg', density: 'none', min: -360, max: 360, desc, ...extra });
/** Dimensionless ratio. */
export const ratio = (desc, extra = {}) => ({ type: 'number', unit: 'ratio', density: 'none', desc, ...extra });
/** Integer count not scaled by density. */
export const count = (desc, extra = {}) => ({ type: 'integer', unit: 'count', density: 'none', min: 0, desc, ...extra });
export const enumOf = (values, desc, extra = {}) => ({ type: 'enum', values, desc, ...extra });
export const bool = (desc, extra = {}) => ({ type: 'boolean', desc, ...extra });
export const obj = (fields, desc, extra = {}) => ({ type: 'object', fields, desc, ...extra });
export const arr = (items, desc, extra = {}) => ({ type: 'array', items, desc, ...extra });
export const union = (options, desc, extra = {}) => ({ type: 'union', options, desc, ...extra });
export const motif = (desc, extra = {}) => ({ type: 'motif', desc, ...extra });
/** {x, y} vector in pt with the given density class. */
export const vec = (density, desc, extra = {}) => obj({
  x: { type: 'number', unit: 'pt', density, required: true, desc: 'x (pt, right)' },
  y: { type: 'number', unit: 'pt', density, required: true, desc: 'y (pt, down)' },
}, desc, extra);
/** 'auto' or a positive integer count. */
export const autoCount = (desc, extra = {}) => union([
  { type: 'integer', unit: 'count', density: 'none', min: 1, desc: 'explicit count' },
  { type: 'enum', values: ['auto'], desc: 'derive from region size' },
], desc, extra);
/** margin: one number for all sides, or per side. Not density-scaled. */
export const margin = (desc, extra = {}) => union([
  fixed('all sides (pt)', { min: 0 }),
  obj({
    left: fixed('left (pt)', { min: 0, default: 0 }),
    right: fixed('right (pt)', { min: 0, default: 0 }),
    top: fixed('top (pt)', { min: 0, default: 0 }),
    bottom: fixed('bottom (pt)', { min: 0, default: 0 }),
  }, 'per side (pt)'),
], desc, extra);
export const PAINT = (desc, extra = {}) => enumOf(['ink', 'paper', 'none'], desc, extra);

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export function pointer(path, key) {
  return `${path}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`;
}

export function isPlainObject(v) {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function deepClone(v) {
  return v === undefined ? undefined : structuredClone(v);
}

/**
 * Validate `value` against `desc`; push issues into `out.errors` / `out.warnings`.
 * @param {object} desc @param {unknown} value @param {string} path
 * @param {{errors:any[], warnings:any[]}} out
 * @param {{validateMotif?:(value:unknown,path:string,out:object)=>void, rank?:(w:string,c:string[])=>string[]}} env
 */
export function validateValue(desc, value, path, out, env = {}) {
  const err = (message, extra = {}) => out.errors.push({ path, message, ...extra });
  const warn = (message) => out.warnings.push({ path, message });
  if (value === null && desc.nullable) return;
  switch (desc.type) {
    case 'number':
    case 'integer': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return err(`expected a finite ${desc.type}, got ${JSON.stringify(value)}`);
      if (desc.type === 'integer' && !Number.isInteger(value)) return err(`expected an integer, got ${value}`);
      if (desc.min !== undefined && value < desc.min) err(`must be >= ${desc.min}, got ${value}`);
      if (desc.max !== undefined && value > desc.max) err(`must be <= ${desc.max}, got ${value}`);
      if (desc.exclusiveMin !== undefined && value <= desc.exclusiveMin) err(`must be > ${desc.exclusiveMin}, got ${value}`);
      if (desc.softMin !== undefined && value < desc.softMin) warn(`below the recommended range (${desc.softMin}..${desc.softMax ?? '∞'}): ${value}`);
      if (desc.softMax !== undefined && value > desc.softMax) warn(`above the recommended range (${desc.softMin ?? '-∞'}..${desc.softMax}): ${value}`);
      return;
    }
    case 'string':
      if (typeof value !== 'string') return err(`expected a string, got ${JSON.stringify(value)}`);
      if (desc.pattern && !desc.pattern.test(value)) err(`does not match ${desc.pattern}: ${JSON.stringify(value)}`);
      return;
    case 'boolean':
      if (typeof value !== 'boolean') err(`expected true/false, got ${JSON.stringify(value)}`);
      return;
    case 'enum':
      if (!desc.values.includes(value)) {
        const cands = desc.values.map(String);
        err(`unknown value ${JSON.stringify(value)}`, { candidates: env.rank ? env.rank(String(value), cands) : cands });
      }
      return;
    case 'const':
      if (value !== desc.value) err(`must be ${JSON.stringify(desc.value)}, got ${JSON.stringify(value)}`);
      return;
    case 'object': {
      if (!isPlainObject(value)) return err(`expected an object, got ${Array.isArray(value) ? 'array' : JSON.stringify(value)}`);
      const allowed = Object.keys(desc.fields);
      for (const k of Object.keys(value)) {
        if (!(k in desc.fields)) {
          out.errors.push({
            path: pointer(path, k),
            message: `unknown key "${k}"; allowed: ${allowed.join(', ') || '(none)'}`,
            candidates: env.rank ? env.rank(k, allowed) : allowed,
          });
        }
      }
      for (const [k, fd] of Object.entries(desc.fields)) {
        const v = value[k];
        if (v === undefined) {
          if (fd.required) out.errors.push({ path: pointer(path, k), message: 'required key is missing' });
          continue;
        }
        validateValue(fd, v, pointer(path, k), out, env);
      }
      for (const group of desc.exclusive || []) {
        const present = group.filter((k) => value[k] !== undefined);
        if (present.length > 1) err(`keys ${present.join(' and ')} are mutually exclusive; give only one`);
      }
      return;
    }
    case 'array': {
      if (!Array.isArray(value)) return err(`expected an array, got ${JSON.stringify(value)}`);
      if (desc.minItems !== undefined && value.length < desc.minItems) err(`needs at least ${desc.minItems} item(s), got ${value.length}`);
      if (desc.maxItems !== undefined && value.length > desc.maxItems) err(`allows at most ${desc.maxItems} item(s), got ${value.length}`);
      value.forEach((v, i) => validateValue(desc.items, v, pointer(path, i), out, env));
      return;
    }
    case 'union': {
      const tried = [];
      for (const opt of desc.options) {
        const sub = { errors: [], warnings: [] };
        validateValue(opt, value, path, sub, env);
        if (sub.errors.length === 0) {
          out.warnings.push(...sub.warnings);
          return;
        }
        tried.push(`${opt.desc || opt.type}: ${sub.errors[0].message}`);
      }
      err(`matches none of the allowed forms -> ${tried.join(' | ')}`);
      return;
    }
    case 'record': {
      if (!isPlainObject(value)) return err(`expected an object, got ${JSON.stringify(value)}`);
      for (const [k, v] of Object.entries(value)) {
        if (desc.keyPattern && !desc.keyPattern.test(k)) out.errors.push({ path: pointer(path, k), message: `key does not match ${desc.keyPattern}` });
        validateValue(desc.values, v, pointer(path, k), out, env);
      }
      return;
    }
    case 'motif':
      if (!env.validateMotif) throw new Error('validateValue: motif descriptor needs env.validateMotif');
      env.validateMotif(value, path, out);
      return;
    case 'unknown':
      return;
    default:
      throw new Error(`descriptor at ${path} has unknown type ${JSON.stringify(desc.type)}`);
  }
}

/** First union option that validates without errors, or null. */
export function matchUnion(desc, value, env = {}) {
  for (const opt of desc.options) {
    const sub = { errors: [], warnings: [] };
    validateValue(opt, value, '', sub, env);
    if (sub.errors.length === 0) return opt;
  }
  return null;
}

/**
 * Return a deep copy of `value` with descriptor defaults filled in.
 * Call only on values that already validated (unknown keys are kept as is).
 * @param {object} desc @param {unknown} value @param {{motifDescriptor?:(m:object)=>object}} env
 */
export function applyDefaults(desc, value, env = {}) {
  let v = value;
  if (v === undefined) {
    if (desc.default === undefined) return undefined;
    v = deepClone(desc.default);
  }
  if (v === null) return null;
  switch (desc.type) {
    case 'object': {
      if (!isPlainObject(v)) return deepClone(v);
      const outObj = {};
      for (const [k, x] of Object.entries(v)) outObj[k] = deepClone(x);
      for (const [k, fd] of Object.entries(desc.fields)) {
        const filled = applyDefaults(fd, v[k], env);
        if (filled !== undefined) outObj[k] = filled;
      }
      return outObj;
    }
    case 'array':
      return Array.isArray(v) ? v.map((x) => applyDefaults(desc.items, x, env)) : deepClone(v);
    case 'union': {
      const opt = matchUnion(desc, v, env);
      return opt ? applyDefaults(opt, v, env) : deepClone(v);
    }
    case 'record': {
      if (!isPlainObject(v)) return deepClone(v);
      const o = {};
      for (const [k, x] of Object.entries(v)) o[k] = applyDefaults(desc.values, x, env);
      return o;
    }
    case 'motif':
      if (!env.motifDescriptor) throw new Error('applyDefaults: motif descriptor needs env.motifDescriptor');
      return applyDefaults(env.motifDescriptor(v), v, env);
    default:
      return deepClone(v);
  }
}

/**
 * Meta-check a descriptor tree (used by tests to keep stage-1 descriptor edits well-formed).
 * Rules: known type; every number/integer has `unit` and `density`; enums non-empty;
 * defaults validate; fields inside an `exclusive` group have no default; every node has `desc`.
 * @returns {string[]} problems (empty = ok)
 */
export function checkDescriptor(desc, path = '', env = {}) {
  const problems = [];
  const visit = (d, p) => {
    if (!d || typeof d !== 'object') return problems.push(`${p}: descriptor is not an object`);
    if (!TYPES.includes(d.type)) return problems.push(`${p}: unknown type ${JSON.stringify(d.type)}`);
    if (typeof d.desc !== 'string' || d.desc.length === 0) problems.push(`${p}: missing desc`);
    if (d.type === 'number' || d.type === 'integer') {
      if (!UNITS.includes(d.unit)) problems.push(`${p}: number needs unit (one of ${UNITS.join(', ')})`);
      if (!DENSITY_CLASSES.includes(d.density)) problems.push(`${p}: number needs density class (one of ${DENSITY_CLASSES.join(', ')})`);
    }
    if (d.type === 'enum' && (!Array.isArray(d.values) || d.values.length === 0)) problems.push(`${p}: enum needs values`);
    if (d.type === 'object') {
      if (!isPlainObject(d.fields)) problems.push(`${p}: object needs fields`);
      else for (const [k, fd] of Object.entries(d.fields)) visit(fd, `${p}/${k}`);
      for (const g of d.exclusive || []) {
        for (const k of g) {
          if (!d.fields?.[k]) problems.push(`${p}: exclusive key ${k} is not a field`);
          else if (d.fields[k].default !== undefined) problems.push(`${p}/${k}: field in an exclusive group must not have a default`);
        }
      }
    }
    if (d.type === 'array') visit(d.items, `${p}[]`);
    if (d.type === 'union') {
      if (!Array.isArray(d.options) || d.options.length < 2) problems.push(`${p}: union needs >= 2 options`);
      else d.options.forEach((o, i) => visit(o, `${p}|${i}`));
    }
    if (d.type === 'record') visit(d.values, `${p}{}`);
    if (d.default !== undefined && d.type !== 'motif') {
      const out = { errors: [], warnings: [] };
      validateValue(d, d.default, p, out, env);
      if (out.errors.length) problems.push(`${p}: default does not validate: ${out.errors[0].message}`);
    }
    if (d.required && d.default !== undefined) problems.push(`${p}: required field must not have a default`);
  };
  visit(desc, path);
  return problems;
}

// ---------------------------------------------------------------------------
// Spec-level descriptors
// ---------------------------------------------------------------------------

const COLOR = (desc, extra = {}) => ({ type: 'string', pattern: /^#[0-9a-fA-F]{6}$/, desc, ...extra });

export const FRAME = obj({
  width: fixed('frame width (pt)', { exclusiveMin: 0 }),
  height: fixed('frame height (pt)', { exclusiveMin: 0 }),
  show: enumOf(['none', 'ink'], 'draw the frame outline in ink or not'),
  lineWidth: fixed('frame line width (pt, not density-scaled)', { min: 0.05, max: 2 }),
}, 'tile frame (design §2.1)');

export const STROKE = obj({
  width: fixed('line width (pt, fixed under density, design §3 method B)', { min: 0.05, max: 2 }),
  cap: enumOf(['butt', 'round', 'square'], 'line cap'),
  join: enumOf(['miter', 'round', 'bevel'], 'line join (unmeasured in the source, design §10-11)'),
}, 'stroke settings (colour comes from ink only)');

export const ORIGIN = union([
  enumOf(['center', 'topLeft'], 'named origin'),
  vec('none', 'explicit origin (pt)'),
], 'where the lattice is anchored (CONVENTIONS §2)');

export const PROVENANCE = obj({
  doc: enumOf(['R1', 'R2', 'R3', 'R4', 'design'], 'source report id (design §0.1)', { required: true }),
  section: { type: 'string', pattern: /\S/, required: true, desc: 'section in the source report, e.g. "1.1"' },
  measured: bool('true = values measured; false = estimated or unmeasured', { required: true }),
  notes: { type: 'string', desc: 'free notes (averaging, irregularities)' },
}, 'where the numbers come from (design §5.4)');

export const NAMES = obj({
  ja: { type: 'string', pattern: /\S/, required: true, desc: 'Japanese name as in the source table' },
  en: { type: 'string', desc: 'English name; leave absent unless a cited glossary gives it (design §5.3)' },
}, 'display names');

/** Fields shared by full specs and alias specs. */
export const SPEC_HEAD_FIELDS = {
  schema: { type: 'string', pattern: SCHEMA_PATTERN, required: true, desc: `schema version, currently "${SCHEMA_ID}"` },
  id: { type: 'string', pattern: ID_PATTERN, required: true, desc: 'canonical preset id (CONVENTIONS §6)' },
  table: enumOf(TABLES, 'source table', { required: true }),
  code: { type: 'string', pattern: /^\d{9}$/, desc: '9-digit code from the source table' },
  symbol: { type: 'string', pattern: /^\S+$/, desc: 'letter symbol, e.g. "Cg" (not unique)' },
  names: { ...NAMES, required: true },
  provenance: { ...PROVENANCE, required: true },
};

export const ALIAS_SPEC = obj({
  ...SPEC_HEAD_FIELDS,
  aliasOf: { type: 'string', pattern: ID_PATTERN, required: true, desc: 'id of the spec whose drawing is reused (values are never copied)' },
}, 'alias preset: same drawing as aliasOf');

/** Layer fields except `archetype`, `motif`, `params` (validated per archetype in validate.js). */
export const LAYER_COMMON_FIELDS = {
  id: { type: 'string', pattern: LAYER_ID_PATTERN, required: true, desc: 'layer id, lowerCamelCase, unique in the spec' },
  offset: vec('length', 'shift of this layer (pt), scaled with density', { default: { x: 0, y: 0 } }),
  seed: { type: 'integer', unit: 'count', density: 'none', min: 0, max: 0xffffffff, desc: 'layer seed label; mixed with the spec seed (CONVENTIONS §4)' },
  z: { type: 'number', unit: 'count', density: 'none', default: 0, desc: 'draw order; ascending, ties keep array order' },
  densityScale: ratio('extra density factor for this layer', { exclusiveMin: 0, default: 1 }),
  relation: obj({
    to: { type: 'string', pattern: LAYER_ID_PATTERN, required: true, desc: 'id of an earlier layer' },
    pitchRatio: ratio('pitch of this layer / pitch of `to`', { exclusiveMin: 0, default: 1 }),
    phase: ratio('phase shift in units of the `to` pitch', { min: 0, max: 1, default: 0 }),
  }, 'tie this layer\'s lattice to another layer (design §4)'),
  blend: enumOf(['over', 'knockout'], 'over = paper-filled shapes hide lower layers; knockout = remove intersected lower shapes', { default: 'over' }),
  clip: bool('per-layer clip override; absent = use the spec clip'),
};

/** Full-spec fields except `layers` (built in validate.js once the archetypes are known). */
export const SPEC_BODY_FIELDS = {
  frame: FRAME,
  stroke: STROKE,
  ink: COLOR('ink colour: lines and filled shapes', { default: DEFAULT_INK }),
  paper: COLOR('paper colour: ground and paper-filled shapes', { default: DEFAULT_PAPER }),
  ground: enumOf(['paper', 'none'], 'paint the ground with paper, or leave it unpainted (no colour is added either way)', { default: 'paper' }),
  clip: bool('clip everything to the frame', { default: true }),
  seed: { type: 'integer', unit: 'count', density: 'none', min: 0, max: 0xffffffff, default: 0, desc: 'base seed (uint32)' },
  origin: { ...ORIGIN, default: 'center' },
  jitter: fixed('random displacement amplitude (pt, design §1.4 d)', { min: 0, max: 1, default: 0 }),
};

/** Render options (design §5.2), minus colour keys handled by the two-colour rule. */
export const OPTIONS = obj({
  size: obj({
    width: { type: 'number', unit: 'factor', density: 'none', exclusiveMin: 0, required: true, desc: 'output width in `unit`' },
    height: { type: 'number', unit: 'factor', density: 'none', exclusiveMin: 0, required: true, desc: 'output height in `unit`' },
    unit: enumOf(['pt', 'mm', 'px'], 'unit of width/height', { default: 'pt' }),
  }, 'output region; default = preset frame'),
  dpi: { type: 'number', unit: 'dpi', density: 'none', exclusiveMin: 0, desc: 'dots per inch for px sizes and PNG (default 96)' },
  tileMode: enumOf(['period', 'frame', 'fit'], 'design §5.5'),
  density: { type: 'number', unit: 'factor', density: 'none', exclusiveMin: 0, softMin: 0.25, softMax: 4, desc: 'design §3 method B' },
  rowsPerFrame: { type: 'number', unit: 'count', density: 'none', exclusiveMin: 0, desc: 'method D helper, converted to density' },
  motifScale: union([enumOf(['follow'], '1/density'), ratio('fixed motif scale', { exclusiveMin: 0 })], 'motif size factor'),
  strokeScale: union([enumOf(['follow'], '1/density (method C)'), ratio('fixed stroke factor', { exclusiveMin: 0 })], 'stroke width factor'),
  stroke: STROKE,
  ink: COLOR('ink colour override'),
  paper: COLOR('paper colour override'),
  ground: enumOf(['paper', 'none'], 'ground override'),
  frame: obj({ show: FRAME.fields.show, lineWidth: FRAME.fields.lineWidth }, 'frame override'),
  clip: bool('clip override'),
  seed: { type: 'integer', unit: 'count', density: 'none', min: 0, max: 0xffffffff, desc: 'base seed override (uint32)' },
  jitter: fixed('jitter override (pt)', { min: 0, max: 1 }),
  origin: ORIGIN,
  overrides: { type: 'record', keyPattern: /^\/.+/, values: { type: 'unknown', desc: 'value checked after applying' }, desc: 'JSON Pointer -> value (CONVENTIONS §8.3)' },
  points: {
    type: 'record',
    keyPattern: LAYER_ID_PATTERN,
    values: arr(obj({
      x: fixed('x (pt)', { required: true }),
      y: fixed('y (pt)', { required: true }),
      len: fixed('length (pt)', { exclusiveMin: 0 }),
      angle: angle('angle (deg)'),
    }, 'one user-supplied segment'), 'user points for a scatter layer'),
    desc: 'layer id -> user-supplied points (design §1.4 a3)',
  },
  paths: { type: 'record', keyPattern: LAYER_ID_PATTERN, values: { type: 'string', pattern: /\S/, desc: 'SVG path data' }, desc: 'layer id -> SVG path data (design §1.4 b3)' },
  idPrefix: { type: 'string', pattern: /^[A-Za-z][A-Za-z0-9_-]*$/, desc: 'prefix for ids inside the SVG (clipPath etc.)' },
}, 'render options', { exclusive: [['density', 'rowsPerFrame']] });
