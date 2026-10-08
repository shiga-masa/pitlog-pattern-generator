/**
 * Lattice point generation (square / staggered / cycle assignment).
 * Owner: core-A (stage 1). Contract: docs/CONVENTIONS.md §3, §7.
 * Used by grid, diagonalBand, edgeBand. Pure functions, no randomness.
 */

import { NotImplementedError } from './errors.js';

const OWNER = 'core-A';

/**
 * Lattice points covering `region`.
 * Row r has y = y0 + r * pitchY; odd rows are shifted by rowOffsetPt.
 * With origin 'center' the lattice is placed so the middle row/column is centred in the region
 * (R3 §5.3-6); 'topLeft' puts the first point at (pitchX/2, pitchY/2) unless rows/cols say otherwise.
 * @param {{region:{x:number,y:number,width:number,height:number}, pitchX:number, pitchY:number,
 *   rowOffsetPt:number, rows:number|'auto', cols:number|'auto', origin:'center'|'topLeft'|{x:number,y:number},
 *   tileMode:'frame'|'period'|'fit'}} o
 * @returns {Array<{x:number, y:number, row:number, col:number}>}
 */
export function latticePoints(o) {
  throw new NotImplementedError('lattice.latticePoints()', OWNER);
}

/**
 * Index into a cycle of length n for lattice cell (row, col).
 * assign 'col': (col + row + phase) mod n; 'row': (row + phase) mod n; 'rowcol': documented by the implementer from R2 §47.
 * @param {number} row @param {number} col @param {number} n @param {'col'|'row'|'rowcol'} assign @param {0|1} phase
 * @returns {number}
 */
export function cycleIndex(row, col, n, assign, phase) {
  throw new NotImplementedError('lattice.cycleIndex()', OWNER);
}
