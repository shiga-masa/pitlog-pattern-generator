/**
 * Curve motifs: waveUnit (~), shell, lens, hook, X.
 * Owner: motif-2 (stage 1). Builder contract: CONVENTIONS §7.3.
 *
 * Every build() returns primitives in local coordinates whose exact geometric bbox
 * (stroke width excluded) is centred on (0, 0). extent() is that bbox size.
 * Dimensions come from the motif (already density-scaled) and are used as given.
 *
 * Open points (see the stage-1 report): the waveUnit height is read as the full
 * crest-to-trough height; the hook needs a horizontal `jog` (the S-curve span between
 * the two strokes), which design §1.3 does not list.
 */

import { obj, size, count, vec } from '../core/schema.js';
import { bbox, ellipse, line, makeStyle, path, transformPrimitive } from '../core/primitives.js';

const SAMPLES = 64;
const INK_LINE = makeStyle({ stroke: 'ink', fill: 'none' });

export const KINDS = {
  waveUnit: obj({
    halfWidth: size('half of the unit width (pt); unit width = 2 * halfWidth; one arch per half', { required: true }),
    height: size('full height, crest to trough (pt); each arch peaks at height / 2 from the zero line', { required: true }),
  }, 'one "~" unit (R3 volcanic-ash symbols; also table 3-9 band (1))'),
  shell: obj({
    paperW: size('paper ellipse full width (pt)', { required: true }),
    paperH: size('paper ellipse full height (pt)', { required: true }),
    inkW: size('ink ellipse full width (pt)', { required: true }),
    inkH: size('ink ellipse full height (pt)', { required: true }),
    inkOffset: vec('motif', 'ink ellipse centre relative to the paper ellipse centre (pt)', { required: true }),
  }, 'shell = paper ellipse + ink ellipse (R3 shell-bearing)'),
  lens: obj({
    arcWidth: size('arc chord (pt)', { required: true }),
    arcHeight: size('arc sagitta, i.e. bulge height above the chord (pt)', { required: true }),
    arcs: count('number of arcs; even arcs bulge up, odd arcs bulge down', { min: 1, default: 2 }),
    shift: vec('motif', 'translation from one arc to the next (pt)', { required: true }),
  }, 'lens arcs (R2 §63)'),
  hook: obj({
    outerLen: size('stroke from the outer edge (pt)', { required: true }),
    innerLen: size('stroke from the inner edge (pt)', { required: true }),
    drop: size('vertical drop between the two strokes (pt)', { required: true }),
    jog: size('horizontal span of the S curve joining the two strokes (pt); not in design 1.3, see report', { required: true }),
  }, 'hook joined by an S curve (R2 §64)'),
  X: obj({
    width: size('full width (pt)', { required: true }),
    height: size('full height (pt)', { required: true }),
  }, 'X spanning a box (R2 §65)'),
};

// ---------------------------------------------------------------------------
// Shared geometry helpers (also used by glyphs.js)
// ---------------------------------------------------------------------------

/** Point on a cubic Bezier at parameter t. @param {number[][]} p four [x,y] control points */
export function cubicAt(p, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
    a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
  ];
}

/**
 * Exact bbox of a primitive list. Paths are sampled along their curves (primitives.bbox
 * uses control points, which overestimate Bezier extents).
 * @returns {{minX:number, minY:number, maxX:number, maxY:number}}
 */
export function exactBBox(prims) {
  if (!prims.length) throw new RangeError('exactBBox: empty primitive list');
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const add = (x, y) => {
    if (x < b.minX) b.minX = x;
    if (y < b.minY) b.minY = y;
    if (x > b.maxX) b.maxX = x;
    if (y > b.maxY) b.maxY = y;
  };
  for (const p of prims) {
    if (p.type !== 'path') {
      const q = bbox(p);
      add(q.minX, q.minY);
      add(q.maxX, q.maxY);
      continue;
    }
    let cx = 0;
    let cy = 0;
    let sx = 0;
    let sy = 0;
    for (const c of p.cmds) {
      if (c.op === 'M' || c.op === 'L') {
        cx = c.x;
        cy = c.y;
        add(cx, cy);
        if (c.op === 'M') {
          sx = cx;
          sy = cy;
        }
      } else if (c.op === 'C') {
        const pts = [[cx, cy], [c.x1, c.y1], [c.x2, c.y2], [c.x, c.y]];
        for (let i = 0; i <= SAMPLES; i++) add(...cubicAt(pts, i / SAMPLES));
        cx = c.x;
        cy = c.y;
      } else if (c.op === 'Q') {
        // quadratic -> cubic degree elevation, then sample
        const pts = [
          [cx, cy],
          [cx + (2 / 3) * (c.x1 - cx), cy + (2 / 3) * (c.y1 - cy)],
          [c.x + (2 / 3) * (c.x1 - c.x), c.y + (2 / 3) * (c.y1 - c.y)],
          [c.x, c.y],
        ];
        for (let i = 0; i <= SAMPLES; i++) add(...cubicAt(pts, i / SAMPLES));
        cx = c.x;
        cy = c.y;
      } else if (c.op === 'Z') {
        cx = sx;
        cy = sy;
      }
    }
  }
  return b;
}

/** Translate primitives so that their exact bbox centre is (0, 0). */
export function centred(prims) {
  const b = exactBBox(prims);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return prims.map((p) => transformPrimitive(p, { x: -cx, y: -cy }));
}

/** Exact {w, h} of a primitive list. */
export function extentOf(prims) {
  const b = exactBBox(prims);
  return { w: b.maxX - b.minX, h: b.maxY - b.minY };
}

/** ctx used when a builder is called only to measure its extent (no randomness involved). */
export const MEASURE_CTX = Object.freeze({ strokeWidth: 0, rng: null });

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * "~": two cubic arches, the first above and the second below the zero line.
 * A cubic with control offset c peaks at 0.75 c, so c = (height / 2) / 0.75.
 */
function buildWaveUnit(m) {
  const hw = m.halfWidth;
  const c = (m.height / 2) / 0.75;
  return centred([path([
    { op: 'M', x: 0, y: 0 },
    { op: 'C', x1: 0, y1: -c, x2: hw, y2: -c, x: hw, y: 0 },
    { op: 'C', x1: hw, y1: c, x2: 2 * hw, y2: c, x: 2 * hw, y: 0 },
  ], INK_LINE)]);
}

/** Paper ellipse (outlined in ink) with a solid ink ellipse offset from its centre. */
function buildShell(m) {
  return centred([
    ellipse(0, 0, m.paperW / 2, m.paperH / 2, 0, { stroke: 'ink', fill: 'paper' }),
    ellipse(m.inkOffset.x, m.inkOffset.y, m.inkW / 2, m.inkH / 2, 0, { stroke: 'ink', fill: 'ink' }),
  ]);
}

/**
 * Lens: arc k starts at k * shift. Each arc is a quadratic whose midpoint lies
 * `arcHeight` from its chord (sagitta = arcHeight). Even arcs bulge up (negative y),
 * odd arcs bulge down.
 */
function buildLens(m) {
  const prims = [];
  for (let k = 0; k < m.arcs; k++) {
    const ox = k * m.shift.x;
    const oy = k * m.shift.y;
    const sign = k % 2 === 0 ? -1 : 1;
    prims.push(path([
      { op: 'M', x: ox, y: oy },
      { op: 'Q', x1: ox + m.arcWidth / 2, y1: oy + sign * 2 * m.arcHeight, x: ox + m.arcWidth, y: oy },
    ], INK_LINE));
  }
  return centred(prims);
}

/** Hook: outer stroke, S curve over `jog`, inner stroke, as one open path. */
function buildHook(m) {
  const a = m.outerLen;
  const j = m.jog;
  const d = m.drop;
  return centred([path([
    { op: 'M', x: 0, y: 0 },
    { op: 'L', x: a, y: 0 },
    { op: 'C', x1: a + j / 2, y1: 0, x2: a + j / 2, y2: d, x: a + j, y: d },
    { op: 'L', x: a + j + m.innerLen, y: d },
  ], INK_LINE)]);
}

/** X: the two diagonals of a width x height box. */
function buildX(m) {
  const w = m.width / 2;
  const h = m.height / 2;
  return centred([
    line(-w, -h, w, h, INK_LINE),
    line(-w, h, w, -h, INK_LINE),
  ]);
}

export const BUILDERS = {
  waveUnit: buildWaveUnit,
  shell: buildShell,
  lens: buildLens,
  hook: buildHook,
  X: buildX,
};

export const EXTENTS = Object.fromEntries(Object.keys(BUILDERS).map((k) => [k, (m) => extentOf(BUILDERS[k](m, MEASURE_CTX))]));
