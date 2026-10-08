/**
 * Lattice point generation (square / staggered / cycle assignment).
 * Owner: core-A (stage 1). Contract: docs/CONVENTIONS.md §3, §7.
 * Used by grid, diagonalBand, edgeBand. Pure functions, no randomness.
 *
 * Geometry (pt, y-down, region origin at its top-left):
 *   - Row r has y = y0 + r * pitchY. Odd rows (r % 2 === 1) are shifted by rowOffsetPt in x.
 *   - Column c has x = x0 + c * pitchX (before the row shift).
 *   - origin 'center': the base grid is centred on the region centre (middle row/column at W/2, H/2;
 *     for an even count the midpoint of the grid is centred). The row shift is not part of the centring.
 *   - origin 'topLeft': point (row 0, col 0) is at (region.x + pitchX/2, region.y + pitchY/2).
 *   - origin {x, y}: point (row 0, col 0) is at (x, y), in the same frame as the region.
 *   - rows / cols 'auto': N = floor(H / pitchY) + 1 (resp. floor(W / pitchX) + 1), the number of
 *     centres whose extreme rows/cols fit inside the closed region. Points are NOT filtered by the
 *     region here; instance-level fitting is done by keepInstance (edgeMode) in core/clip.js.
 */

const LATTICE_KEYS = ['region', 'pitchX', 'pitchY', 'rowOffsetPt', 'rows', 'cols', 'origin', 'tileMode'];
const TILE_MODES = ['frame', 'period', 'fit'];
const ASSIGNS = ['col', 'row', 'rowcol'];
/** Relative tolerance for floor(H / pitch) so that exact multiples are not lost to rounding. */
const COUNT_TOL = 1e-9;

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

function checkRegion(region) {
  if (!region || typeof region !== 'object') throw new TypeError('latticePoints: region must be {x, y, width, height}');
  for (const k of ['x', 'y', 'width', 'height']) {
    if (!isFiniteNumber(region[k])) throw new TypeError(`latticePoints: region.${k} must be a finite number, got ${region[k]}`);
  }
  if (!(region.width > 0) || !(region.height > 0)) {
    throw new RangeError(`latticePoints: region width and height must be > 0, got ${region.width} x ${region.height}`);
  }
}

function checkCount(v, name) {
  if (v === 'auto') return;
  if (!Number.isInteger(v) || v < 1) throw new RangeError(`latticePoints: ${name} must be 'auto' or an integer >= 1, got ${JSON.stringify(v)}`);
}

/**
 * Lattice points covering `region`.
 * @param {{region:{x:number,y:number,width:number,height:number}, pitchX:number, pitchY:number,
 *   rowOffsetPt:number, rows:number|'auto', cols:number|'auto', origin:'center'|'topLeft'|{x:number,y:number},
 *   tileMode:'frame'|'period'|'fit'}} o
 *   rowOffsetPt is already in pt (the archetype converts a ratio with ratio * pitchX).
 *   tileMode is validated but does not change the positions: period/fit handling belongs to each
 *   archetype's period() and to render-1.
 * @returns {Array<{x:number, y:number, row:number, col:number}>} row-major order
 */
export function latticePoints(o) {
  if (!o || typeof o !== 'object') throw new TypeError('latticePoints: argument must be an object');
  for (const k of Object.keys(o)) {
    if (!LATTICE_KEYS.includes(k)) throw new TypeError(`latticePoints: unknown key "${k}"; allowed: ${LATTICE_KEYS.join(', ')}`);
  }
  checkRegion(o.region);
  for (const k of ['pitchX', 'pitchY']) {
    if (!(isFiniteNumber(o[k]) && o[k] > 0)) throw new RangeError(`latticePoints: ${k} must be a number > 0, got ${o[k]}`);
  }
  if (!isFiniteNumber(o.rowOffsetPt)) throw new TypeError(`latticePoints: rowOffsetPt must be a finite number in pt, got ${o.rowOffsetPt}`);
  checkCount(o.rows, 'rows');
  checkCount(o.cols, 'cols');
  if (!TILE_MODES.includes(o.tileMode)) throw new RangeError(`latticePoints: tileMode must be one of ${TILE_MODES.join(', ')}, got ${JSON.stringify(o.tileMode)}`);

  const { region, pitchX: px, pitchY: py, rowOffsetPt: off } = o;
  const W = region.width;
  const H = region.height;

  const rows = o.rows === 'auto' ? Math.floor(H / py + COUNT_TOL) + 1 : o.rows;
  const cols = o.cols === 'auto' ? Math.floor(W / px + COUNT_TOL) + 1 : o.cols;

  let x0;
  let y0;
  if (o.origin === 'center') {
    x0 = region.x + W / 2 - ((cols - 1) * px) / 2;
    y0 = region.y + H / 2 - ((rows - 1) * py) / 2;
  } else if (o.origin === 'topLeft') {
    x0 = region.x + px / 2;
    y0 = region.y + py / 2;
  } else if (o.origin && typeof o.origin === 'object' && isFiniteNumber(o.origin.x) && isFiniteNumber(o.origin.y)) {
    x0 = o.origin.x;
    y0 = o.origin.y;
  } else {
    throw new RangeError(`latticePoints: origin must be 'center', 'topLeft' or {x, y} (finite), got ${JSON.stringify(o.origin)}`);
  }

  const out = [];
  for (let r = 0; r < rows; r++) {
    const shift = r % 2 === 1 ? off : 0;
    const y = y0 + r * py;
    for (let c = 0; c < cols; c++) {
      out.push({ x: x0 + c * px + shift, y, row: r, col: c });
    }
  }
  return out;
}

const mod = (a, n) => ((a % n) + n) % n;

/**
 * Index into a cycle of length n for lattice cell (row, col).
 *  - 'col':    (col + row + phase) mod n  (alternates along a row; phase flips every row)
 *  - 'row':    (row + phase) mod n        (constant along a row; changes with each row)
 *  - 'rowcol': (2·col + (row mod 2) + phase) mod n, the x-position index on the half-pitch grid of a
 *              lattice staggered by 1/2 (R2 §47; fixed in stage 2, the same rule archetypes/grid.js assumes).
 * @param {number} row @param {number} col @param {number} n @param {'col'|'row'|'rowcol'} assign @param {0|1} phase
 * @returns {number}
 */
export function cycleIndex(row, col, n, assign, phase) {
  if (!Number.isInteger(row) || row < 0) throw new RangeError(`cycleIndex: row must be an integer >= 0, got ${row}`);
  if (!Number.isInteger(col) || col < 0) throw new RangeError(`cycleIndex: col must be an integer >= 0, got ${col}`);
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`cycleIndex: n must be an integer >= 1, got ${n}`);
  if (phase !== 0 && phase !== 1) throw new RangeError(`cycleIndex: phase must be 0 or 1, got ${phase}`);
  switch (assign) {
    case 'col': return mod(col + row + phase, n);
    case 'row': return mod(row + phase, n);
    case 'rowcol': return mod(2 * col + mod(row, 2) + phase, n);
    default:
      throw new RangeError(`cycleIndex: assign must be one of ${ASSIGNS.join(', ')}, got ${JSON.stringify(assign)}`);
  }
}
