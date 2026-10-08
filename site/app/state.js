/**
 * Application state for the site (CONTRACT.md §1).
 * Pure ES module: no DOM access at load time, so it can be tested under node.
 */

export const OPTION_KEYS = Object.freeze(['density', 'motifScale', 'strokeScale', 'seed', 'tileMode', 'ink', 'paper']);
export const TILE_MODES = Object.freeze(['frame', 'period', 'fit']);
export const OUTPUT_UNITS = Object.freeze(['mm', 'pt', 'px']);
export const OUTPUT_FORMATS = Object.freeze(['svg', 'png']);
export const OVERRIDES_MAX_CHARS = 2048;

const OPTION_DEFAULTS = Object.freeze({
  density: 1,
  motifScale: 'follow',
  strokeScale: 1,
  seed: 0,
  tileMode: 'frame',
  ink: '#000000',
  paper: '#ffffff',
});

const OUTPUT_DEFAULTS = Object.freeze({
  unit: 'mm',
  width: null,
  height: null,
  dpi: 300,
  format: 'svg',
});

const OUTPUT_KEYS = Object.freeze(['unit', 'width', 'height', 'dpi', 'format']);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** @returns {import('./state.js').State} a fresh default state */
export function defaultState() {
  return {
    presetId: null,
    options: {},
    overrides: {},
    output: { ...OUTPUT_DEFAULTS },
  };
}

let state = defaultState();
const listeners = new Set();

function isPositiveNumber(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function checkOptionValue(key, v) {
  let ok;
  switch (key) {
    case 'density':
      ok = isPositiveNumber(v);
      break;
    case 'motifScale':
    case 'strokeScale':
      ok = v === 'follow' || isPositiveNumber(v);
      break;
    case 'seed':
      ok = Number.isInteger(v) && v >= 0 && v <= 0xffffffff;
      break;
    case 'tileMode':
      ok = TILE_MODES.includes(v);
      break;
    case 'ink':
    case 'paper':
      ok = typeof v === 'string' && HEX_COLOR.test(v);
      break;
    default:
      throw new Error(`Unknown option "${key}"; known: ${OPTION_KEYS.join(', ')}`);
  }
  if (!ok) throw new Error(`options.${key}: invalid value ${JSON.stringify(v)}`);
}

function checkOutputValue(key, v) {
  let ok;
  switch (key) {
    case 'unit':
      ok = OUTPUT_UNITS.includes(v);
      break;
    case 'width':
    case 'height':
      ok = v === null || isPositiveNumber(v);
      break;
    case 'dpi':
      ok = isPositiveNumber(v);
      break;
    case 'format':
      ok = OUTPUT_FORMATS.includes(v);
      break;
    default:
      throw new Error(`Unknown output key "${key}"; known: ${OUTPUT_KEYS.join(', ')}`);
  }
  if (!ok) throw new Error(`output.${key}: invalid value ${JSON.stringify(v)}`);
}

function notify() {
  for (const fn of listeners) fn(getState());
}

/** @returns {import('./state.js').State} a deep copy of the current state */
export function getState() {
  return structuredClone(state);
}

/**
 * Subscribe to changes. fn receives its own copy of the state after each change.
 * @returns {() => void} unsubscribe function
 */
export function subscribe(fn) {
  if (typeof fn !== 'function') throw new Error('subscribe: fn must be a function');
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Choose a preset (canonical id, or null). Clears the overrides of the previous preset. */
export function selectPreset(id) {
  if (id !== null && (typeof id !== 'string' || id === '')) {
    throw new Error(`selectPreset: id must be a non-empty string or null, got ${JSON.stringify(id)}`);
  }
  state.presetId = id;
  state.overrides = {};
  notify();
}

/** Set a common option. value === undefined removes the key (back to the default). */
export function setOption(key, value) {
  if (!OPTION_KEYS.includes(key)) {
    throw new Error(`Unknown option "${key}"; known: ${OPTION_KEYS.join(', ')}`);
  }
  if (value === undefined) {
    delete state.options[key];
  } else {
    checkOptionValue(key, value);
    state.options[key] = value;
  }
  notify();
}

/** Set or (value === undefined) remove a JSON Pointer override such as '/layers/0/params/angle'. */
export function setOverride(pointer, value) {
  if (typeof pointer !== 'string' || !/^\/./.test(pointer)) {
    throw new Error(`overrides key must be a JSON Pointer starting with "/", got ${JSON.stringify(pointer)}`);
  }
  if (value === undefined) {
    delete state.overrides[pointer];
  } else {
    state.overrides[pointer] = structuredClone(value);
  }
  notify();
}

/** Update part of the output settings. */
export function setOutput(patch) {
  if (patch === null || typeof patch !== 'object') throw new Error('setOutput: patch must be an object');
  for (const [key, value] of Object.entries(patch)) {
    checkOutputValue(key, value);
  }
  Object.assign(state.output, patch);
  notify();
}

/**
 * Options object for renderSVG / renderPNG (CONTRACT.md §1.1). Pure.
 * forExport: adds dpi, and size when both width and height are set (null = preset frame).
 */
export function buildRenderOptions(s, { forExport = false } = {}) {
  const out = {};
  for (const key of OPTION_KEYS) {
    if (s.options[key] !== undefined) out[key] = s.options[key];
  }
  if (Object.keys(s.overrides).length > 0) out.overrides = { ...s.overrides };
  if (forExport) {
    out.dpi = s.output.dpi;
    if (s.output.width !== null && s.output.height !== null) {
      out.size = { width: s.output.width, height: s.output.height, unit: s.output.unit };
    }
  }
  return out;
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Share-link query (CONTRACT.md §1.2). Values equal to the defaults are omitted.
 * @returns {{query: string, overridesTooLong: boolean, overridesJson: string}}
 */
export function encodeShareQuery(s) {
  const p = new URLSearchParams();
  if (s.presetId) p.set('id', s.presetId);
  const o = s.options;
  if (o.density !== undefined && o.density !== OPTION_DEFAULTS.density) p.set('density', String(o.density));
  if (o.motifScale !== undefined && o.motifScale !== OPTION_DEFAULTS.motifScale) p.set('ms', String(o.motifScale));
  if (o.strokeScale !== undefined && o.strokeScale !== OPTION_DEFAULTS.strokeScale) p.set('ss', String(o.strokeScale));
  if (o.seed !== undefined && o.seed !== OPTION_DEFAULTS.seed) p.set('seed', String(o.seed));
  if (o.tileMode !== undefined && o.tileMode !== OPTION_DEFAULTS.tileMode) p.set('tile', o.tileMode);
  if (o.ink !== undefined && o.ink !== OPTION_DEFAULTS.ink) p.set('ink', o.ink.slice(1));
  if (o.paper !== undefined && o.paper !== OPTION_DEFAULTS.paper) p.set('paper', o.paper.slice(1));

  const u = s.output;
  if (u.unit !== OUTPUT_DEFAULTS.unit) p.set('unit', u.unit);
  if (u.width !== null) p.set('w', String(u.width));
  if (u.height !== null) p.set('h', String(u.height));
  if (u.dpi !== OUTPUT_DEFAULTS.dpi) p.set('dpi', String(u.dpi));
  if (u.format !== OUTPUT_DEFAULTS.format) p.set('fmt', u.format);

  let overridesTooLong = false;
  let overridesJson = '';
  if (Object.keys(s.overrides).length > 0) {
    overridesJson = JSON.stringify(s.overrides);
    const b64 = toBase64Url(overridesJson);
    if (b64.length > OVERRIDES_MAX_CHARS) overridesTooLong = true;
    else p.set('o', b64);
  }
  return { query: p.toString(), overridesTooLong, overridesJson };
}

/**
 * Parse location.search into a state. Unknown keys and invalid values are
 * listed in `warnings` and dropped (never silently). `presetId` is returned
 * as the raw string; the caller resolves it with resolveId().
 * @returns {{state: import('./state.js').State, warnings: string[]}}
 */
export function decodeShareQuery(search) {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const warnings = [];
  const s = defaultState();
  const known = new Set(['id', 'density', 'ms', 'ss', 'seed', 'tile', 'ink', 'paper', 'unit', 'w', 'h', 'dpi', 'fmt', 'o']);

  for (const key of new Set(p.keys())) {
    if (!known.has(key)) warnings.push(`未知のパラメータ "${key}" を無視しました`);
  }

  const raw = (key) => (p.has(key) ? p.get(key) : undefined);
  const invalid = (key, v) => warnings.push(`パラメータ "${key}" の値 "${v}" は使えないため無視しました`);
  const posNum = (key) => {
    const v = raw(key);
    if (v === undefined) return undefined;
    const n = v.trim() === '' ? NaN : Number(v);
    if (isPositiveNumber(n)) return n;
    invalid(key, v);
    return undefined;
  };
  const oneOf = (key, allowed) => {
    const v = raw(key);
    if (v === undefined) return undefined;
    if (allowed.includes(v)) return v;
    invalid(key, v);
    return undefined;
  };
  const followOrNum = (key) => {
    const v = raw(key);
    if (v === 'follow') return 'follow';
    return posNum(key);
  };

  const id = raw('id');
  if (id !== undefined) {
    if (id.trim() === '') invalid('id', id);
    else s.presetId = id;
  }

  const density = posNum('density');
  if (density !== undefined) s.options.density = density;
  const ms = followOrNum('ms');
  if (ms !== undefined) s.options.motifScale = ms;
  const ss = followOrNum('ss');
  if (ss !== undefined) s.options.strokeScale = ss;

  const seedRaw = raw('seed');
  if (seedRaw !== undefined) {
    const n = seedRaw.trim() === '' ? NaN : Number(seedRaw);
    if (Number.isInteger(n) && n >= 0 && n <= 0xffffffff) s.options.seed = n;
    else invalid('seed', seedRaw);
  }

  const tile = oneOf('tile', ['frame', 'period', 'fit']);
  if (tile !== undefined) s.options.tileMode = tile;

  for (const key of ['ink', 'paper']) {
    const v = raw(key);
    if (v === undefined) continue;
    if (/^[0-9a-fA-F]{6}$/.test(v)) s.options[key] = `#${v.toLowerCase()}`;
    else invalid(key, v);
  }

  const unit = oneOf('unit', ['mm', 'pt', 'px']);
  if (unit !== undefined) s.output.unit = unit;
  const w = posNum('w');
  if (w !== undefined) s.output.width = w;
  const h = posNum('h');
  if (h !== undefined) s.output.height = h;
  const dpi = posNum('dpi');
  if (dpi !== undefined) s.output.dpi = dpi;
  const fmt = oneOf('fmt', ['svg', 'png']);
  if (fmt !== undefined) s.output.format = fmt;

  const oRaw = raw('o');
  if (oRaw !== undefined) {
    try {
      const parsed = JSON.parse(fromBase64Url(oRaw));
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('not an object');
      }
      const bad = Object.keys(parsed).filter((k) => !/^\/./.test(k));
      if (bad.length > 0) throw new Error(`keys must be JSON Pointers: ${bad.join(', ')}`);
      s.overrides = parsed;
    } catch (e) {
      warnings.push(`パラメータ "o" を読めないため無視しました (${e.message})`);
    }
  }

  return { state: s, warnings };
}
