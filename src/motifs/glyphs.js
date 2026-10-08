/**
 * Free-form glyph motifs rebuilt parametrically (design §1.4 b2): ptGlyph, vein, blob,
 * plus user-supplied `path` (design §1.4 b3).
 * Owner: motif-2 (stage 1). Builder contract: CONVENTIONS §7.3.
 *
 * Source vertex lists are NOT shipped and must not be used: only the dimensions listed here.
 * Every build() returns local coordinates centred on the exact geometric bbox (0, 0).
 * `blob` draws from ctx.rng.fork('blob'): fork() depends only on the layer seed, so every
 * blob in one layer has the same radial pattern (the source copies are identical), and
 * nothing here calls Math.random().
 */

import { GeometryError } from '../core/errors.js';
import { createRng } from '../core/rng.js';
import { rotatePoint } from '../core/geom.js';
import { obj, size, angle, vec, count, ratio, PAINT } from '../core/schema.js';
import { line, makeStyle, parsePathData, path as makePath, polygon } from '../core/primitives.js';
import { centred, cubicAt, extentOf, MEASURE_CTX } from './curves.js';

const INK_LINE = makeStyle({ stroke: 'ink', fill: 'none' });

/**
 * ptGlyph: base x as a fraction of the glyph width. Source R3 t4_1 r38: base x 1.79 pt
 * from the left edge, glyph width 5.56 pt, giving 0.32. Reconstruction constant, not a parameter.
 */
const PT_BASE_RATIO = 0.32;

export const KINDS = {
  ptGlyph: obj({
    stemLen: size('stem height (pt)', { required: true }),
    armLen: size('right arm width (pt)', { required: true }),
  }, 'highly-organic-soil glyph (R3)'),
  vein: obj({
    chord: size('chord length of each S curve, x extent (pt)', { required: true }),
    height: size('extent across the chord, y extent of the first curve (pt)', { required: true }),
    secondOffset: vec('motif', 'translation of the second curve (pt)', { required: true }),
    rungs: count('number of cross strokes', { min: 0, required: true }),
    rungLengthMin: size('shortest cross stroke (pt)', { required: true }),
    rungLengthMax: size('longest cross stroke (pt)', { required: true }),
  }, 'mineral vein (R2 §59)'),
  blob: obj({
    w: size('bbox full width (pt)', { required: true }),
    h: size('bbox full height (pt)', { required: true }),
    vertices: count('vertex count', { min: 3, default: 17 }),
    irregularity: ratio('radial perturbation as a fraction of the radius; unmeasured (null) must be set by the preset', { min: 0, max: 1, nullable: true, default: null }),
    rotation: angle('rotation (deg); unmeasured in R1 §4.6', { nullable: true, default: null }),
    fill: PAINT('fill paint', { required: true }),
  }, 'irregular polygon for breccia (R1 §1.3)'),
  path: obj({
    d: { type: 'string', pattern: /\S/, required: true, desc: 'SVG path data, local coordinates in pt (M L H V C Q Z)' },
    fill: PAINT('fill paint', { default: 'none' }),
  }, 'user-supplied path (design §1.4 b3)'),
};

function buildPtGlyph(m) {
  const H = m.stemLen;
  const W = m.armLen;
  const bx = PT_BASE_RATIO * W;
  return centred([makePath([
    { op: 'M', x: 0, y: 0 },
    { op: 'C', x1: 0, y1: H * 0.5, x2: bx * 0.6, y2: H, x: bx, y: H },
    { op: 'L', x: bx, y: 0 },
    { op: 'L', x: W, y: 0 },
  ], INK_LINE)]);
}

/**
 * Vein: two S curves from bottom-left (0, height) to top-right (chord, 0); the second is
 * the first translated by secondOffset. Cross strokes run along the chord normal from the
 * first curve. Their positions (evenly spaced in the curve parameter) and their lengths
 * (linear from min to max, first to last) are NOT in the report; see the stage-1 report.
 */
function buildVein(m) {
  const c = m.chord;
  const h = m.height;
  const first = [[0, h], [0.4 * c, h], [0.6 * c, 0], [c, 0]];
  const ox = m.secondOffset.x;
  const oy = m.secondOffset.y;
  const second = first.map(([x, y]) => [x + ox, y + oy]);
  const curve = (p) => makePath([
    { op: 'M', x: p[0][0], y: p[0][1] },
    { op: 'C', x1: p[1][0], y1: p[1][1], x2: p[2][0], y2: p[2][1], x: p[3][0], y: p[3][1] },
  ], INK_LINE);
  const prims = [curve(first), curve(second)];
  // Unit normal of the chord vector (c, -h), pointing towards the second curve.
  const len = Math.hypot(c, h);
  const nx = h / len;
  const ny = c / len;
  const n = m.rungs;
  for (let i = 0; i < n; i++) {
    const [px, py] = cubicAt(first, (i + 1) / (n + 1));
    const L = n === 1 ? (m.rungLengthMin + m.rungLengthMax) / 2 : m.rungLengthMin + ((m.rungLengthMax - m.rungLengthMin) * i) / (n - 1);
    prims.push(line(px, py, px + L * nx, py + L * ny, INK_LINE));
  }
  return centred(prims);
}

/**
 * Blob: polygon of `vertices` points on the w x h ellipse, each radius scaled by
 * 1 + irregularity * u with u uniform in [-1, 1]. Rotated by `rotation`, then the bbox is
 * mapped to exactly w x h (per axis), so extent() equals the declared size.
 */
function buildBlob(m, ctx) {
  if (m.irregularity === null) throw new GeometryError('motif blob: irregularity is unmeasured (null); the preset must set it');
  if (m.rotation === null) throw new GeometryError('motif blob: rotation is unmeasured (null); the preset must set it');
  if (!ctx || !ctx.rng) throw new GeometryError('motif blob: needs ctx.rng (seeded layer stream)');
  const rng = ctx.rng.fork('blob');
  const pts = [];
  for (let i = 0; i < m.vertices; i++) {
    const th = (2 * Math.PI * i) / m.vertices;
    const r = 1 + m.irregularity * rng.uniform(-1, 1);
    pts.push(rotatePoint((Math.cos(th) * m.w * r) / 2, (-Math.sin(th) * m.h * r) / 2, m.rotation));
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!(maxX - minX > 0 && maxY - minY > 0)) throw new GeometryError('motif blob: degenerate outline');
  const sx = m.w / (maxX - minX);
  const sy = m.h / (maxY - minY);
  const fitted = pts.map(([x, y]) => [(x - minX) * sx, (y - minY) * sy]);
  return centred([polygon(fitted, { stroke: 'ink', fill: m.fill })]);
}

function buildPath(m) {
  return centred([makePath(parsePathData(m.d), { stroke: 'ink', fill: m.fill })]);
}

export const BUILDERS = {
  ptGlyph: buildPtGlyph,
  vein: buildVein,
  blob: buildBlob,
  path: buildPath,
};

export const EXTENTS = {
  ptGlyph: (m) => extentOf(BUILDERS.ptGlyph(m, MEASURE_CTX)),
  vein: (m) => extentOf(BUILDERS.vein(m, MEASURE_CTX)),
  blob: (m) => extentOf(BUILDERS.blob(m, { strokeWidth: 0, rng: createRng(0) })),
  path: (m) => extentOf(BUILDERS.path(m, MEASURE_CTX)),
};
