/**
 * Presets for R3 §3 (table 4-2).
 * Owner: preset-5 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Empty until stage 1 fills it; presets/index.js reports the count per file.
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [];
