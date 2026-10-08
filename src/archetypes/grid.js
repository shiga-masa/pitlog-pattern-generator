/**
 * Archetype `grid`. Owner: arch-1 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/grid.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * Implementation notes (arch-1):
 * - Lattice points come from core/lattice.js (latticePoints, cycleIndex). renderGrid() takes the
 *   lattice functions as an argument so that tests can run with a self-made lattice while
 *   core/lattice.js is still a stub.
 * - Cycle index: lattice.cycleIndex(row, col, n, assign, phase). For assign 'rowcol' the expected
 *   formula is (2·col + (row mod 2) + phase) mod n, derived from R2 §47 (x-position index of a
 *   staggered lattice with rowOffset 1/2).
 * - rotations: [list] applies to every row; [evenRowList, oddRowList] applies by row parity. The
 *   angle is list[col mod list.length].
 * - flipRows: odd rows are mirrored upside down after rotation (final arrangement mirrored in y).
 * - avoid: an instance is skipped when an anchor of the avoided layer lies inside its geometric bbox.
 * - relation: pitch = pitchRatio × pitch of `to`; phase shifts x by phase × pitch.x of `to`.
 *   The reference pitch is read from LayerResult.pitch (grid layers provide it).
 * - layer.offset is applied to the lattice by this archetype.
 * - tileMode 'period': the tile is colPeriod × rowPeriod cells; every cell is drawn ONCE at its
 *   position wrapped into the tile (CONVENTIONS §3.3 period-tile contract). The copies across the
 *   tile edges are made by the renderer (render/svg.js wrapToRect), not here. edgeMode does not apply
 *   inside a period tile.
 * - ctx.fit (tileMode 'fit'): pitchX, pitchY and a pt rowOffset are multiplied by fit.x / fit.y; the
 *   motifs keep their size. A layer tied by `relation` takes its pitch from the reference layer,
 *   which is already fitted.
 * - Uneven lattice (rowPitches / colPitches / rowShifts, all optional, pt, density 'length'):
 *     y(r)      = y0 + Σ_{i<r} rowPitches[i mod k]                 (pitchY·r when absent)
 *     x(r, c)   = x0 + Σ_{j<c} L(r)[j mod len] + odd(r)·rowOffset + rowShifts[r mod m]
 *   where L(r) = colPitches[0] for one list, colPitches[r mod 2] for two (pitchX·c when absent).
 *   pitchX / pitchY stay the nominal pitch: they convert a ratio rowOffset, place the first point for
 *   origin 'topLeft' (pitchX/2, pitchY/2), and are returned as LayerResult.pitch. origin 'center'
 *   centres the span of row 0 (x) and of all rows (y), like the regular lattice. rows/cols 'auto'
 *   count the positions that fall inside the closed region (cols: the larger count of the two parity
 *   lists). fit multiplies rowPitches by fit.y and colPitches, rowShifts by fit.x. period: the tile is
 *   rowPeriod rows (a multiple of k, m and of 2 for two lists) by colPeriod columns (a multiple of
 *   each list length); both parity lists must span the same width over colPeriod, otherwise there is
 *   no period (period() returns null). A layer tied by `relation` cannot use them (GeometryError).
 *   Without these keys the regular lattice of core/lattice.js is used unchanged.
 */

import * as lattice from '../core/lattice.js';
import { GeometryError } from '../core/errors.js';
import { bboxOf, transformPrimitive } from '../core/primitives.js';
import { bboxInside, bboxIntersects } from '../core/geom.js';
import { overlapWarning } from '../core/density.js';
import { EPS } from '../core/defaults.js';
import { LAYER_ID_PATTERN, angle, arr, autoCount, bool, enumOf, len, motif, obj, ratio, union } from '../core/schema.js';

export const ARCHETYPE = 'grid';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'motifOrCycle';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  pitchX: len('horizontal pitch between instances of the same row (pt)', { required: true }),
  pitchY: len('vertical pitch between rows (pt)', { required: true }),
  rowOffset: union([
    ratio('shift of odd rows as a fraction of pitchX (0.5 = staggered)', { min: -1, max: 1 }),
    obj({ pt: len('shift of odd rows (pt), e.g. 4.77 (R3 cohesive soil), -4.1 (R2 §36)', { exclusiveMin: undefined, required: true }) }, 'shift in pt'),
  ], 'odd-row shift (R1 §4.1-6)', { default: 0 }),
  rows: autoCount('number of rows; auto = fill the region', { default: 'auto' }),
  cols: autoCount('number of columns; auto = fill the region', { default: 'auto' }),
  cycle: arr(motif('one motif of the cycle'), 'motifs assigned in turn (replaces layer.motif)', { minItems: 1, maxItems: 4 }),
  assign: enumOf(['col', 'row', 'rowcol'], 'how cycle entries are assigned (design §2.2 grid)', { default: 'col' }),
  phase: enumOf([0, 1], 'start index of the cycle (R1 §2.3)', { default: 0 }),
  flipRows: bool('mirror every other row upside down (R3 Kanto loam)', { default: false }),
  rotations: arr(arr(angle('rotation (deg)'), 'rotations along a row, cycled', { minItems: 1 }), 'per row parity: [[even-row rotations], [odd-row rotations]] (R2 §47)', { minItems: 1, maxItems: 2 }),
  avoid: { type: 'string', pattern: LAYER_ID_PATTERN, desc: 'id of an earlier layer whose lattice points are skipped (R1 §2.10)' },
  edgeMode: enumOf(['whole', 'clip'], 'whole = draw only instances fully inside the region; clip = draw all, clipped', { default: 'whole' }),
  // Explicit uneven lattice (hand-placed originals, e.g. row gaps 7.10/7.58/5.42). Optional; when
  // absent the lattice is the regular one of pitchX/pitchY. See the header and CONVENTIONS §7.3.1.
  rowPitches: arr(len('gap from row r to row r+1 (pt)'), 'row gaps, cycled: gap r = rowPitches[r mod k]; replaces pitchY for the row positions', { minItems: 1 }),
  colPitches: arr(arr(len('gap from column c to column c+1 (pt)'), 'column gaps along a row, cycled', { minItems: 1 }), 'per row parity like rotations: [[all rows]] or [[even rows], [odd rows]]; replaces pitchX for the column positions', { minItems: 1, maxItems: 2 }),
  rowShifts: arr({ type: 'number', unit: 'pt', density: 'length', desc: 'extra x shift of row r (pt), any sign' }, 'per-row x shift on top of rowOffset, cycled: row r gets rowShifts[r mod m]', { minItems: 1 }),
}, 'grid parameters (design §2.2)');

const PERIOD_EPS = 1e-9;
/** Two colPitches parity lists must span the same width over one period within this (pt). */
const PERIOD_SPAN_TOL = 1e-9;
/** Relative tolerance of the 'auto' row/column count (same as core/lattice.js). */
const COUNT_TOL = 1e-9;
const UNEVEN_KEYS = ['rowPitches', 'colPitches', 'rowShifts'];
const KEY_SCALE = 1e6;

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  return renderGrid(lattice, layer, ctx);
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3). Null also when the reference
 * layer of `relation` is not yet in ctx.results, and when the two colPitches parity lists span
 * different widths over the column period.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  if (layer.relation && !ctx.results?.[layer.relation.to]) return null;
  const pitch = pitchOf(layer, ctx, []);
  const n = motifsOf(layer).length;
  const t = tileOf(layer.params, pitch, rowOffsetPt(layer.params.rowOffset, pitch.pitchX, pitch.fitX), n);
  return t.w === null ? null : { w: t.w, h: t.h };
}

/**
 * Draw a grid layer with the given lattice functions. `lat` provides latticePoints and cycleIndex
 * with the contract of core/lattice.js.
 * @param {{latticePoints: Function, cycleIndex: Function}} lat
 * @param {object} layer @param {object} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function renderGrid(lat, layer, ctx) {
  const p = layer.params;
  const warnings = [];
  const motifs = motifsOf(layer);
  const n = motifs.length;
  const base = motifs.map((m) => ctx.buildMotif(m));
  const exts = motifs.map((m) => ctx.motifExtent(m));
  const pitch = pitchOf(layer, ctx, warnings);
  const ro = rowOffsetPt(p.rowOffset, pitch.pitchX, pitch.fitX);
  const ext = { w: Math.max(...exts.map((e) => e.w)), h: Math.max(...exts.map((e) => e.h)) };
  const minGapX = pitch.colGaps ? Math.min(...pitch.colGaps.flat()) : pitch.pitchX;
  const minGapY = pitch.rowGaps ? Math.min(...pitch.rowGaps) : pitch.pitchY;
  const ow = overlapWarning({ extent: ext, pitchX: minGapX, pitchY: minGapY, strokeWidth: ctx.strokeWidth, layerId: layer.id });
  if (ow) warnings.push(ow);
  const plan = { lat, layer, p, n, base, pitch, ro, warnings, ctx };
  return ctx.tileMode === 'period' ? drawPeriod(plan) : drawFrame(plan);
}

// ---------------------------------------------------------------------------
// frame / fit: one picture of the region
// ---------------------------------------------------------------------------

function drawFrame({ lat, layer, p, n, base, pitch, ro, warnings, ctx }) {
  const region = ctx.region;
  const cells = cellsOf(lat, {
    region, pitchX: pitch.pitchX, pitchY: pitch.pitchY, rowOffsetPt: ro,
    rows: p.rows, cols: p.cols, origin: ctx.origin, tileMode: ctx.tileMode,
  }, pitch);
  const avoid = avoidAnchors(layer, ctx);
  const primitives = [];
  const anchors = [];
  let skipped = 0;
  for (const c of cells) {
    const [x, y] = offsetAndJitter(c.x, c.y, layer, pitch, ctx);
    const k = lat.cycleIndex(c.row, c.col, n, p.assign, p.phase);
    const prims = place(base[k], x, y, rotationOf(p, c.row, c.col), isMirrored(p, c.row));
    const bb = bboxOf(prims);
    const inside = p.edgeMode === 'whole' ? bboxInside(bb, region) : bboxIntersects(bb, region);
    if (!inside || blocked(bb, avoid)) {
      skipped++;
      continue;
    }
    for (const q of prims) primitives.push(q);
    anchors.push({ x, y, row: c.row, col: c.col });
  }
  return finish(layer, { primitives, anchors, skipped, candidates: cells.length, warnings, pitch });
}

// ---------------------------------------------------------------------------
// period: one seamless tile, instances wrapped across the border
// ---------------------------------------------------------------------------

function drawPeriod({ lat, layer, p, n, base, pitch, ro, warnings, ctx }) {
  const t = tileOf(p, pitch, ro, n);
  if (t.w === null) {
    throw new GeometryError(`grid layer ${layer.id}: no period: ${t.reason}`);
  }
  const { w, h } = t;
  const tile = { x: 0, y: 0, width: w, height: h };
  const cells = cellsOf(lat, {
    region: tile, pitchX: pitch.pitchX, pitchY: pitch.pitchY, rowOffsetPt: ro,
    rows: t.rowPeriod, cols: t.colPeriod, origin: 'topLeft', tileMode: 'period',
  }, pitch);
  if (cells.length !== t.colPeriod * t.rowPeriod) {
    throw new GeometryError(`grid layer ${layer.id}: lattice gave ${cells.length} cells for a ${t.colPeriod} x ${t.rowPeriod} period tile`);
  }
  const seen = new Set();
  const unique = [];
  for (const c of cells) {
    const x = wrap(c.x + layerOffsetX(layer) + pitch.shiftX, w);
    const y = wrap(c.y + layerOffsetY(layer), h);
    const key = `${Math.round(x * KEY_SCALE)},${Math.round(y * KEY_SCALE)}`;
    if (seen.has(key)) {
      throw new GeometryError(`grid layer ${layer.id}: two lattice cells fall on the same place in the ${w} x ${h} pt period tile; check pitch and rowOffset`);
    }
    seen.add(key);
    unique.push({ x, y, row: c.row, col: c.col });
  }
  const avoid = avoidAnchors(layer, ctx);
  const expandedAvoid = avoid ? expandAnchors(avoid, w, h) : null;
  const primitives = [];
  const anchors = [];
  let skipped = 0;
  for (const c of unique) {
    const [x, y] = jitter(c.x, c.y, ctx);
    const k = lat.cycleIndex(c.row, c.col, n, p.assign, p.phase);
    const rot = rotationOf(p, c.row, c.col);
    const mirror = isMirrored(p, c.row);
    const own = bboxOf(place(base[k], x, y, rot, mirror));
    if (blocked(own, expandedAvoid)) {
      skipped++;
      continue;
    }
    anchors.push({ x, y, row: c.row, col: c.col });
    // once per cell; the renderer adds the copies across the tile edges (CONVENTIONS §3.3)
    for (const q of place(base[k], x, y, rot, mirror)) primitives.push(q);
  }
  return finish(layer, { primitives, anchors, skipped, candidates: cells.length, warnings, pitch });
}

/**
 * Period of the lattice: colPeriod × rowPeriod cells (conservative lcm over every cycle source).
 * w is null (with a reason) when the two colPitches parity lists span different widths.
 */
function tileOf(p, pitch, ro, n) {
  let colPeriod = 1;
  for (const list of p.rotations ?? []) colPeriod = lcm(colPeriod, list.length);
  for (const list of pitch.colGaps ?? []) colPeriod = lcm(colPeriod, list.length);
  if (p.assign === 'col' || p.assign === 'rowcol') colPeriod = lcm(colPeriod, n);
  const needParity = ro !== 0 || p.flipRows === true || p.rotations?.length === 2 || p.assign === 'rowcol' || pitch.colGaps?.length === 2;
  let rowPeriod = needParity ? 2 : 1;
  if (p.assign === 'col' || p.assign === 'row') rowPeriod = lcm(rowPeriod, n);
  if (pitch.rowGaps) rowPeriod = lcm(rowPeriod, pitch.rowGaps.length);
  if (pitch.shifts) rowPeriod = lcm(rowPeriod, pitch.shifts.length);
  const h = pitch.rowGaps ? sumCycled(pitch.rowGaps, rowPeriod) : rowPeriod * pitch.pitchY;
  let w = colPeriod * pitch.pitchX;
  if (pitch.colGaps) {
    const spans = pitch.colGaps.map((list) => sumCycled(list, colPeriod));
    if (spans.length === 2 && Math.abs(spans[0] - spans[1]) > PERIOD_SPAN_TOL) {
      return { colPeriod, rowPeriod, w: null, h, reason: `colPitches even/odd lists span ${spans[0]} / ${spans[1]} pt over ${colPeriod} columns (must be equal)` };
    }
    w = spans[0];
  }
  return { colPeriod, rowPeriod, w, h };
}

/** Σ_{i<count} list[i mod list.length] (count is a multiple of the length in tileOf). */
function sumCycled(list, count) {
  let s = 0;
  for (let i = 0; i < count; i++) s += list[i % list.length];
  return s;
}

function isUneven(pitch) {
  return Boolean(pitch.rowGaps || pitch.colGaps || pitch.shifts);
}

/** Lattice cells: core/lattice.js for the regular lattice, unevenCells() when an uneven key is given. */
function cellsOf(lat, o, pitch) {
  return isUneven(pitch) ? unevenCells(o, pitch) : lat.latticePoints(o);
}

/**
 * Cells of the uneven lattice (formula in the header). Same contract as latticePoints: row-major,
 * not filtered by the region, rows/cols 'auto' from the closed region.
 */
function unevenCells(o, pitch) {
  const { region, rowOffsetPt: ro } = o;
  const W = region.width;
  const H = region.height;
  const yAt = (r) => (pitch.rowGaps ? sumCycled(pitch.rowGaps, r) : r * pitch.pitchY);
  const listOf = (r) => (pitch.colGaps ? pitch.colGaps[pitch.colGaps.length === 2 ? mod(r, 2) : 0] : null);
  const xAt = (r, c) => {
    const list = listOf(r);
    return list ? sumCycled(list, c) : c * pitch.pitchX;
  };
  const shiftOf = (r) => (pitch.shifts ? pitch.shifts[mod(r, pitch.shifts.length)] : 0);
  const countAuto = (at, L, nominal) => {
    let n = 1;
    while (at(n) <= L + COUNT_TOL * nominal) n++;
    return n;
  };
  const rows = o.rows === 'auto' ? countAuto(yAt, H, pitch.pitchY) : o.rows;
  const cols = o.cols === 'auto'
    ? Math.max(countAuto((c) => xAt(0, c), W, pitch.pitchX), countAuto((c) => xAt(1, c), W, pitch.pitchX))
    : o.cols;
  let x0;
  let y0;
  if (o.origin === 'center') {
    x0 = region.x + W / 2 - xAt(0, cols - 1) / 2;
    y0 = region.y + H / 2 - yAt(rows - 1) / 2;
  } else if (o.origin === 'topLeft') {
    x0 = region.x + pitch.pitchX / 2;
    y0 = region.y + pitch.pitchY / 2;
  } else if (o.origin && typeof o.origin === 'object' && Number.isFinite(o.origin.x) && Number.isFinite(o.origin.y)) {
    x0 = o.origin.x;
    y0 = o.origin.y;
  } else {
    throw new GeometryError(`grid: origin must be 'center', 'topLeft' or {x, y}, got ${JSON.stringify(o.origin)}`);
  }
  const out = [];
  for (let r = 0; r < rows; r++) {
    const y = y0 + yAt(r);
    const dx = (r % 2 === 1 ? ro : 0) + shiftOf(r);
    for (let c = 0; c < cols; c++) out.push({ x: x0 + xAt(r, c) + dx, y, row: r, col: c });
  }
  return out;
}

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

function motifsOf(layer) {
  const hasLayerMotif = layer.motif !== undefined && layer.motif !== null;
  const hasCycle = layer.params.cycle !== undefined;
  if (hasLayerMotif === hasCycle) {
    throw new GeometryError(`grid layer ${layer.id}: give exactly one of layer.motif or params.cycle (got ${hasLayerMotif ? 'both' : 'neither'})`);
  }
  return hasLayerMotif ? [layer.motif] : layer.params.cycle;
}

/** Pitch used by this layer: its own params, or pitchRatio × the pitch of relation.to. */
function pitchOf(layer, ctx, warnings) {
  const p = layer.params;
  const rel = layer.relation;
  const fit = ctx.fit ?? { x: 1, y: 1 };
  if (!rel) {
    return {
      pitchX: p.pitchX * fit.x,
      pitchY: p.pitchY * fit.y,
      shiftX: 0,
      fitX: fit.x,
      rowGaps: p.rowPitches ? p.rowPitches.map((v) => v * fit.y) : null,
      colGaps: p.colPitches ? p.colPitches.map((list) => list.map((v) => v * fit.x)) : null,
      shifts: p.rowShifts ? p.rowShifts.map((v) => v * fit.x) : null,
    };
  }
  for (const k of UNEVEN_KEYS) {
    if (p[k] !== undefined) throw new GeometryError(`grid layer ${layer.id}: params.${k} cannot be combined with relation (the pitch comes from "${rel.to}")`);
  }
  const ref = ctx.results?.[rel.to];
  if (!ref) throw new GeometryError(`grid layer ${layer.id}: relation.to "${rel.to}" is not an earlier layer`);
  if (!ref.pitch) throw new GeometryError(`grid layer ${layer.id}: relation.to "${rel.to}" exposes no lattice pitch (it must be a grid layer)`);
  if (!(Number.isFinite(rel.pitchRatio) && rel.pitchRatio > 0)) throw new GeometryError(`grid layer ${layer.id}: relation.pitchRatio must be > 0, got ${rel.pitchRatio}`);
  const pitchX = rel.pitchRatio * ref.pitch.x;
  const pitchY = rel.pitchRatio * ref.pitch.y;
  if (Math.abs(p.pitchX - pitchX) > 1e-3 || Math.abs(p.pitchY - pitchY) > 1e-3) {
    warnings.push(`params pitch (${p.pitchX}, ${p.pitchY}) ignored; relation to "${rel.to}" gives (${pitchX.toFixed(3)}, ${pitchY.toFixed(3)})`);
  }
  return { pitchX, pitchY, shiftX: (rel.phase ?? 0) * ref.pitch.x, fitX: 1, rowGaps: null, colGaps: null, shifts: null };
}

/** Odd-row shift in pt: a ratio of the (fitted) pitchX, or a pt value scaled by the x fit. */
function rowOffsetPt(ro, pitchX, fitX = 1) {
  if (typeof ro === 'number') return ro * pitchX;
  if (ro && typeof ro === 'object' && typeof ro.pt === 'number') return ro.pt * fitX;
  throw new GeometryError(`grid: rowOffset must be a ratio or {pt}, got ${JSON.stringify(ro)}`);
}

/** Rotation (deg) of the instance at (row, col). */
function rotationOf(p, row, col) {
  if (!p.rotations) return 0;
  const list = p.rotations.length === 2 ? p.rotations[mod(row, 2)] : p.rotations[0];
  return list[mod(col, list.length)];
}

function isMirrored(p, row) {
  return p.flipRows === true && mod(row, 2) === 1;
}

/** Place a local motif: rotate by rot, then (if mirrored) mirror the final arrangement in y. */
function place(base, x, y, rot, mirror) {
  const t = mirror ? { mirrorY: true, rotate: -rot, x, y } : { rotate: rot, x, y };
  return base.map((q) => transformPrimitive(q, t));
}

function layerOffsetX(layer) {
  return layer.offset ? layer.offset.x : 0;
}

function layerOffsetY(layer) {
  return layer.offset ? layer.offset.y : 0;
}

function offsetAndJitter(x, y, layer, pitch, ctx) {
  return jitter(x + layerOffsetX(layer) + pitch.shiftX, y + layerOffsetY(layer), ctx);
}

function jitter(x, y, ctx) {
  const j = ctx.jitter;
  if (!(j > 0)) return [x, y];
  return [x + ctx.rng.uniform(-j, j), y + ctx.rng.uniform(-j, j)];
}

/** Anchors of the avoided layer, or null when no avoid is given. */
function avoidAnchors(layer, ctx) {
  const id = layer.params.avoid;
  if (id === undefined) return null;
  const ref = ctx.results?.[id];
  if (!ref) throw new GeometryError(`grid layer ${layer.id}: avoid "${id}" is not an earlier layer`);
  if (!Array.isArray(ref.anchors)) throw new GeometryError(`grid layer ${layer.id}: avoid "${id}" exposes no anchors`);
  return ref.anchors;
}

/** True when an avoided anchor lies inside the geometric bbox of the candidate instance. */
function blocked(bb, anchors) {
  if (!anchors) return false;
  return anchors.some((a) => a.x >= bb.minX - EPS && a.x <= bb.maxX + EPS && a.y >= bb.minY - EPS && a.y <= bb.maxY + EPS);
}

function expandAnchors(anchors, w, h) {
  const out = [];
  for (const a of anchors) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) out.push({ x: a.x + i * w, y: a.y + j * h });
    }
  }
  return out;
}

function finish(layer, r) {
  const placed = r.anchors.length;
  if (placed === 0) {
    throw new GeometryError(`grid layer ${layer.id}: no instance was drawn (${r.candidates} candidates, ${r.skipped} skipped); the motif or pitch does not fit the region`);
  }
  return {
    primitives: r.primitives,
    placed,
    skipped: r.skipped,
    warnings: r.warnings,
    anchors: r.anchors,
    pitch: { x: r.pitch.pitchX, y: r.pitch.pitchY },
  };
}

function wrap(v, L) {
  let r = v - Math.floor(v / L) * L;
  if (L - r < PERIOD_EPS) r = 0;
  return r;
}

function mod(a, n) {
  return ((a % n) + n) % n;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}
