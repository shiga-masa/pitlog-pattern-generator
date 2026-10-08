/**
 * Public API (design §5.1). Owner: stage 2 (integration).
 *
 * Every renderer (renderSVG, renderSVGPattern, renderCanvas, renderPNG) draws from the same scene
 * (render/svg.js buildScene) and resolves preset ids through the same default registry, which holds
 * every preset file of src/presets/ (tables 3-1 ... 5-3; table 5 rows are aliases of table 4).
 * Options: dpi defaults to 96 (CSS px, design §5.2); the site passes 300 for PNG (design §5.7).
 */

import { loadDefaultRegistry } from './presets/index.js';
import { validateSpec as validateSpecCore, validateOptions, assertValidSpec } from './core/validate.js';
import { resolveSpec } from './core/resolve.js';
import { defaultsForTable } from './core/defaults.js';
import { ResolveError } from './core/errors.js';

import { renderSVG as renderSVGCore, renderBatch as renderBatchCore } from './render/svg.js';

import { renderSVGPattern as renderSVGPatternCore } from './render/svgPattern.js';
import { renderCanvas as renderCanvasCore } from './render/canvas.js';
import { renderPNG as renderPNGCore } from './render/png.js';

export { renderSpecToSVG } from './render/svg.js';
export { validateOptions };
export { SCHEMA_ID } from './core/schema.js';
export { DEFAULT_INK, DEFAULT_PAPER } from './core/colors.js';
export { SchemaError, NotImplementedError, ResolveError, LimitError, GeometryError } from './core/errors.js';

let loaded = null;
function load() {
  if (!loaded) loaded = loadDefaultRegistry();
  return loaded;
}
function registry() {
  return load().registry;
}

/** renderSVG(id|spec, options) -> Promise<{svg, meta}> using the shared default registry. */
export function renderSVG(input, options = {}) {
  return renderSVGCore(input, options, { registry: registry() });
}

/** renderBatch(inputs, options) -> Promise<{results, counts:{processed, skipped, failed}}>. */
export function renderBatch(inputs, options = {}) {
  return renderBatchCore(inputs, options, { registry: registry() });
}

/** renderSVGPattern(id|spec, options) -> Promise<{defs, ref, tile, meta}> (tileMode defaults to 'period'). */
export function renderSVGPattern(input, options = {}) {
  return renderSVGPatternCore(input, options, { registry: registry() });
}

/** renderCanvas(ctx, id|spec, options, rect) -> Promise<{meta}> (browser 2D context). */
export function renderCanvas(ctx, input, options = {}, rect) {
  return renderCanvasCore(ctx, input, options, rect, { registry: registry() });
}

/** renderPNG(id|spec, options) -> Promise<Blob> (browser; dpi defaults to 96, the site passes 300). */
export function renderPNG(input, options = {}) {
  return renderPNGCore(input, options, { registry: registry() });
}

/**
 * Load report of the default registry: per preset file and in total {processed, skipped, failed},
 * plus the alias check. Every preset file is loaded strictly (one failure throws).
 */
export function presetReport() {
  return structuredClone(load().report);
}

/** Deep copy of the drawing spec for an id/query (aliases resolved). */
export function getPreset(query) {
  const r = registry();
  return r.get(r.resolveId(query));
}

/** Canonical id for an id, 9-digit code, 'sym:<symbol>' or Japanese name. */
export function resolveId(query) {
  return registry().resolveId(query);
}

/** @param {{table?:string, archetype?:string, text?:string}} [filter] */
export function listPresets(filter = {}) {
  return registry().list(filter);
}

/** Register a user spec in the default registry (validated; duplicate ids throw). */
export function definePreset(spec) {
  return registry().add(spec, '(definePreset)');
}

/** @returns {{ok:boolean, errors:object[], warnings:object[]}} */
export function validateSpec(spec) {
  return validateSpecCore(spec);
}

/** Resolved spec (defaults + options) for sharing / reproduction (design §5.1 toSpec). */
export function toSpec(query, options = {}) {
  const spec = typeof query === 'string' ? getPreset(query) : query;
  return resolveSpec(spec, options).spec;
}

const COMPOSE_BODY_KEYS = ['frame', 'stroke', 'ink', 'paper', 'ground', 'clip', 'seed', 'origin', 'jitter'];

/**
 * Layer concatenation (design §4: a main pattern + a table 3-9 band, or any other pair).
 * Inputs are preset ids/queries (aliases resolved) or full specs. The result is a new full spec:
 *  - id, table, frame, stroke and every other spec-level field come from the FIRST input
 *    (table defaults included); a later input whose spec-level value differs is listed in
 *    provenance.notes as "not used" (never dropped silently);
 *  - layers are the layers of all inputs in order; a layer id already used gets the input index
 *    as a suffix (e.g. "dots" -> "dots2"), and avoid / relation.to inside that input follow the rename.
 *    A renamed layer without its own seed draws a different random sequence (the id is its seed label).
 *  - names.ja joins the names with " + "; code and symbol are not carried (the result is not that preset).
 * @param {Array<string|object>} inputs at least two
 * @returns {object} PatternSpec, validated
 */
export function compose(inputs) {
  if (!Array.isArray(inputs) || inputs.length < 2) {
    throw new TypeError(`compose: give an array of at least two preset ids or specs, got ${Array.isArray(inputs) ? `${inputs.length} item(s)` : typeof inputs}`);
  }
  const specs = inputs.map((x, i) => {
    if (typeof x === 'string') return getPreset(x);
    if (!x || typeof x !== 'object') throw new TypeError(`compose: input ${i} must be a preset id or a spec object`);
    if ('aliasOf' in x) throw new ResolveError(`compose: input ${i} (${x.id}) is an alias of ${x.aliasOf}; pass the id instead`);
    assertValidSpec(x);
    return structuredClone(x);
  });
  const withTable = (s) => {
    const d = defaultsForTable(s.table);
    return { ...s, frame: { ...d.frame, ...(s.frame ?? {}) }, stroke: { ...d.stroke, ...(s.stroke ?? {}) } };
  };
  const head = withTable(specs[0]);
  const notes = [];
  const used = new Set();
  const layers = [];
  specs.forEach((raw, i) => {
    const s = withTable(raw);
    if (i > 0) {
      for (const k of COMPOSE_BODY_KEYS) {
        if (s[k] !== undefined && JSON.stringify(s[k]) !== JSON.stringify(head[k])) {
          notes.push(`${s.id} ${k} ${JSON.stringify(s[k])} not used (the first input's ${k} applies)`);
        }
      }
    }
    const rename = {};
    for (const l of s.layers) {
      let id = l.id;
      if (used.has(id)) {
        id = `${l.id}${i + 1}`;
        let n = 1;
        while (used.has(id)) id = `${l.id}${i + 1}x${n++}`;
        notes.push(`${s.id} layer ${l.id} renamed to ${id}`);
      }
      rename[l.id] = id;
      used.add(id);
    }
    for (const l of s.layers) {
      const c = structuredClone(l);
      c.id = rename[l.id];
      if (c.params?.avoid !== undefined) c.params.avoid = rename[c.params.avoid] ?? c.params.avoid;
      if (c.relation) c.relation.to = rename[c.relation.to] ?? c.relation.to;
      layers.push(c);
    }
  });
  const out = {
    schema: head.schema,
    id: head.id,
    table: head.table,
    names: { ja: specs.map((s) => s.names.ja).join(' + ') },
    provenance: {
      doc: 'design',
      section: '§4 compose',
      measured: false,
      notes: [`compose of ${specs.map((s) => s.id).join(', ')}`, ...notes].join('; '),
    },
    layers,
  };
  for (const k of COMPOSE_BODY_KEYS) if (head[k] !== undefined) out[k] = structuredClone(head[k]);
  assertValidSpec(out);
  return out;
}
