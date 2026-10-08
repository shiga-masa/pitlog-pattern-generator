/**
 * Archetype registry (design §1.2). Owner: stage 0 (frozen).
 * One archetype = one file src/archetypes/<name>.js; the file name equals ARCHETYPE.
 */

import * as grid from './grid.js';
import * as brick from './brick.js';
import * as hatch from './hatch.js';
import * as frameDiagonal from './frameDiagonal.js';
import * as wave from './wave.js';
import * as scatter from './scatter.js';
import * as diagonalBand from './diagonalBand.js';
import * as edgeBand from './edgeBand.js';
import * as symbol from './symbol.js';
import * as empty from './empty.js';

const LIST = [grid, brick, hatch, frameDiagonal, wave, scatter, diagonalBand, edgeBand, symbol, empty];
const MOTIF_POLICIES = ['required', 'forbidden', 'motifOrCycle'];

export const ARCHETYPES = (() => {
  const out = {};
  for (const m of LIST) {
    if (out[m.ARCHETYPE]) throw new Error(`archetype ${m.ARCHETYPE} registered twice`);
    if (!MOTIF_POLICIES.includes(m.MOTIF)) throw new Error(`archetype ${m.ARCHETYPE}: MOTIF must be one of ${MOTIF_POLICIES.join(', ')}`);
    if (typeof m.render !== 'function' || typeof m.period !== 'function') throw new Error(`archetype ${m.ARCHETYPE}: render() and period() are required exports`);
    if (!m.PARAMS || m.PARAMS.type !== 'object') throw new Error(`archetype ${m.ARCHETYPE}: PARAMS must be an object descriptor`);
    if (!m.DENSITY || typeof m.DENSITY.params !== 'boolean' || typeof m.DENSITY.motif !== 'boolean') throw new Error(`archetype ${m.ARCHETYPE}: DENSITY must be {params:boolean, motif:boolean}`);
    out[m.ARCHETYPE] = m;
  }
  return Object.freeze(out);
})();

export const ARCHETYPE_NAMES = Object.freeze(Object.keys(ARCHETYPES));
