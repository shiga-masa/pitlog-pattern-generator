/**
 * Public API (design §5.1). Owner: stage 2 (integration); stage 0 provides the skeleton.
 * Functions owned by stage-1 files throw NotImplementedError until they are implemented.
 */

import { loadDefaultRegistry } from './presets/index.js';
import { validateSpec as validateSpecCore, validateOptions } from './core/validate.js';
import { resolveSpec } from './core/resolve.js';
import { NotImplementedError } from './core/errors.js';

import { renderSVG as renderSVGCore, renderBatch as renderBatchCore } from './render/svg.js';

export { renderSpecToSVG } from './render/svg.js';
export { renderSVGPattern } from './render/svgPattern.js';
export { renderCanvas } from './render/canvas.js';
export { renderPNG } from './render/png.js';
export { validateOptions };
export { SCHEMA_ID } from './core/schema.js';
export { DEFAULT_INK, DEFAULT_PAPER } from './core/colors.js';
export { SchemaError, NotImplementedError, ResolveError, LimitError, GeometryError } from './core/errors.js';

let loaded = null;
function registry() {
  if (!loaded) loaded = loadDefaultRegistry().registry;
  return loaded;
}

/** renderSVG(id|spec, options) -> Promise<{svg, meta}> using the shared default registry. */
export function renderSVG(input, options = {}) {
  return renderSVGCore(input, options, { registry: registry() });
}

/** renderBatch(inputs, options) -> Promise<{results, counts:{processed, skipped, failed}}>. */
export function renderBatch(inputs, options = {}) {
  return renderBatchCore(inputs, options, { registry: registry() });
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

/** Layer concatenation (design §4: main pattern + table 3-9 band). Stage 2. */
export function compose(specs) {
  throw new NotImplementedError('compose()', 'integration (stage 2)');
}
