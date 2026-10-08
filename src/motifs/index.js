/**
 * Motif registry: merges the kind tables of the four motif files and dispatches build/extent.
 * Owner: stage 0 (frozen). Stage-1 motif owners edit only their own file; adding a kind there
 * is picked up here automatically. Duplicate kinds across files are an import-time error.
 */

import * as basic from './basic.js';
import * as lineGlyph from './lineGlyph.js';
import * as curves from './curves.js';
import * as glyphs from './glyphs.js';
import { rankCandidates } from '../core/errors.js';
import { validateValue } from '../core/schema.js';

const MODULES = { 'motifs/basic.js': basic, 'motifs/lineGlyph.js': lineGlyph, 'motifs/curves.js': curves, 'motifs/glyphs.js': glyphs };

/** kind -> { descriptor (with `kind`), build, extent, file } */
export const MOTIFS = (() => {
  const out = {};
  for (const [file, mod] of Object.entries(MODULES)) {
    for (const [kind, d] of Object.entries(mod.KINDS)) {
      if (out[kind]) throw new Error(`motif kind "${kind}" defined twice: ${out[kind].file} and ${file}`);
      if (typeof mod.BUILDERS?.[kind] !== 'function') throw new Error(`${file}: BUILDERS.${kind} missing`);
      if (typeof mod.EXTENTS?.[kind] !== 'function') throw new Error(`${file}: EXTENTS.${kind} missing`);
      if ('kind' in d.fields) throw new Error(`${file}: kind "${kind}" must not declare a "kind" field`);
      out[kind] = {
        descriptor: { ...d, fields: { kind: { type: 'enum', values: [kind], required: true, desc: 'motif kind' }, ...d.fields } },
        build: mod.BUILDERS[kind],
        extent: mod.EXTENTS[kind],
        file,
      };
    }
  }
  return Object.freeze(out);
})();

export const MOTIF_KINDS = Object.freeze(Object.keys(MOTIFS));

/** Descriptor for a motif value (throws on unknown kind; validate first). */
export function motifDescriptor(m) {
  const e = MOTIFS[m?.kind];
  if (!e) throw new Error(`unknown motif kind ${JSON.stringify(m?.kind)}`);
  return e.descriptor;
}

/** Validator hook for the schema engine (`env.validateMotif`). */
export function validateMotif(value, path, out, env = {}) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    out.errors.push({ path, message: `motif must be an object with "kind", got ${JSON.stringify(value)}` });
    return;
  }
  const e = MOTIFS[value.kind];
  if (!e) {
    out.errors.push({ path: `${path}/kind`, message: `unknown motif kind ${JSON.stringify(value.kind)}`, candidates: rankCandidates(String(value.kind), MOTIF_KINDS) });
    return;
  }
  validateValue(e.descriptor, value, path, out, env);
}

/**
 * Build a motif in local coordinates (CONVENTIONS §7.3). Rejects an empty result.
 * @param {object} motif density-scaled motif @param {{strokeWidth:number, rng:object}} ctx
 */
export function buildMotif(motif, ctx) {
  const prims = motifDescriptorEntry(motif).build(motif, ctx);
  if (!Array.isArray(prims) || prims.length === 0) throw new Error(`motif ${motif.kind}: build() returned no primitives`);
  return prims;
}

/** Geometric extent {w, h} of a motif (CONVENTIONS §7.3). */
export function motifExtent(motif) {
  const ext = motifDescriptorEntry(motif).extent(motif);
  if (!ext || !(ext.w >= 0) || !(ext.h >= 0)) throw new Error(`motif ${motif.kind}: extent() must return {w, h} >= 0`);
  return ext;
}

function motifDescriptorEntry(motif) {
  const e = MOTIFS[motif?.kind];
  if (!e) throw new Error(`unknown motif kind ${JSON.stringify(motif?.kind)}; known: ${MOTIF_KINDS.join(', ')}`);
  return e;
}
