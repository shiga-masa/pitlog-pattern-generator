/**
 * Basic motifs: circle, dot, ellipse, triangle, hline, seg.
 * Owner: motif-1 (stage 1). Contract: docs/CONVENTIONS.md §7.3.
 *
 * Builder contract (all motif files):
 *   build(motif, ctx) -> Primitive[] in LOCAL coordinates, centred on the motif's
 *   geometric bounding-box centre (0, 0), unrotated except by the motif's own rotation field.
 *   Sizes in `motif` are already density-scaled; do not scale again.
 *   ctx = { strokeWidth:number, rng:Rng }   (rng only for motifs that need randomness)
 *   extent(motif) -> { w, h }  geometric bbox size (without stroke).
 *   Never return []: throw GeometryError if a parameter set cannot be drawn.
 */

import { GeometryError } from '../core/errors.js';
import { obj, size, angle, enumOf, PAINT } from '../core/schema.js';
import {
  line, polygon, circle, ellipse, circlePolygonPoints, bboxOf, transformPrimitive,
} from '../core/primitives.js';
import { dir } from '../core/geom.js';

/** Field descriptors per kind (the `kind` key itself is added by motifs/index.js). */
export const KINDS = {
  circle: obj({
    d: size('diameter (pt)', { required: true }),
    fill: PAINT('ink = filled, paper = paper-filled with ink outline, none = outline only', { required: true }),
    polygonSides: { type: 'integer', unit: 'count', density: 'none', min: 3, nullable: true, default: null, desc: 'null = true circle (design §2.3); n = regular n-gon' },
  }, 'circle (R1 §1.1, R3 gravel)'),
  dot: obj({
    d: size('diameter (pt); always ink-filled', { required: true }),
  }, 'dot = circle filled with ink (R1 §1.4)'),
  ellipse: obj({
    w: size('full width before rotation (pt)', { required: true }),
    h: size('full height before rotation (pt)', { required: true }),
    rotation: angle('rotation (deg, CCW)', { default: 0 }),
    fill: PAINT('fill paint', { required: true }),
  }, 'ellipse (R3 boulders)'),
  triangle: obj({
    base: size('base width (pt)', { required: true }),
    height: size('height (pt)', { required: true }),
    fill: PAINT('fill paint', { required: true }),
    apex: enumOf(['up', 'down'], 'apex direction', { default: 'up' }),
  }, 'isosceles triangle (R1 §2.1, R2 §1)'),
  hline: obj({
    length: size('length (pt)', { required: true }),
  }, 'horizontal segment (R1 §1.6)'),
  seg: obj({
    length: size('length (pt)', { required: true }),
    angle: angle('direction (deg, CCW)', { default: 0 }),
  }, 'straight segment at an angle'),
};

/** Strictly positive finite number. No silent defaults: the schema has already applied them. */
export function needPositive(v, name) {
  if (typeof v !== 'number' || !Number.isFinite(v) || !(v > 0)) {
    throw new GeometryError(`motif: ${name} must be a positive number, got ${v}`);
  }
  return v;
}

/** Finite number (zero and negative allowed). No silent defaults. */
export function needFinite(v, name) {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new GeometryError(`motif: ${name} must be a finite number, got ${v}`);
  }
  return v;
}

/** Filled-shape style: ink outline, fill from the paint token (CONVENTIONS §5). */
export function paintedStyle(fill) {
  return { stroke: 'ink', fill };
}

/** Line style: ink stroke, no fill. */
export const LINE_STYLE = Object.freeze({ stroke: 'ink', fill: 'none' });

/**
 * Translate primitives so that the centre of their union bbox is at (0, 0).
 * Shared with lineGlyph.js.
 * @param {object[]} prims @returns {object[]}
 */
export function centred(prims) {
  const b = bboxOf(prims);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return prims.map((p) => transformPrimitive(p, { x: -cx, y: -cy }));
}

/**
 * Geometric extent {w, h} of a primitive list (stroke excluded). Shared with lineGlyph.js.
 * @param {object[]} prims @returns {{w:number, h:number}}
 */
export function extentOfPrimitives(prims) {
  const b = bboxOf(prims);
  return { w: b.maxX - b.minX, h: b.maxY - b.minY };
}

function buildCircle(m) {
  const r = needPositive(m.d, 'circle d') / 2;
  if (m.polygonSides === null) {
    return [circle(0, 0, r, paintedStyle(m.fill))];
  }
  if (!Number.isInteger(m.polygonSides) || m.polygonSides < 3) {
    throw new GeometryError(`motif circle: polygonSides must be null or an integer >= 3, got ${m.polygonSides}`);
  }
  // d is the diameter of the circumscribed circle; first vertex at the top (startDeg 90).
  return centred([polygon(circlePolygonPoints(0, 0, r, m.polygonSides, 90), paintedStyle(m.fill))]);
}

function buildDot(m) {
  const r = needPositive(m.d, 'dot d') / 2;
  return [circle(0, 0, r, paintedStyle('ink'))];
}

function buildEllipse(m) {
  const rx = needPositive(m.w, 'ellipse w') / 2;
  const ry = needPositive(m.h, 'ellipse h') / 2;
  return [ellipse(0, 0, rx, ry, needFinite(m.rotation, 'ellipse rotation'), paintedStyle(m.fill))];
}

function buildTriangle(m) {
  const b = needPositive(m.base, 'triangle base') / 2;
  const h = needPositive(m.height, 'triangle height') / 2;
  let pts;
  if (m.apex === 'up') pts = [[-b, h], [b, h], [0, -h]];
  else if (m.apex === 'down') pts = [[-b, -h], [b, -h], [0, h]];
  else throw new GeometryError(`motif triangle: apex must be "up" or "down", got ${m.apex}`);
  return centred([polygon(pts, paintedStyle(m.fill))]);
}

function buildHline(m) {
  const h = needPositive(m.length, 'hline length') / 2;
  return [line(-h, 0, h, 0, LINE_STYLE)];
}

function buildSeg(m) {
  const h = needPositive(m.length, 'seg length') / 2;
  const u = dir(needFinite(m.angle, 'seg angle'));
  return centred([line(-h * u.x, -h * u.y, h * u.x, h * u.y, LINE_STYLE)]);
}

export const BUILDERS = {
  circle: buildCircle,
  dot: buildDot,
  ellipse: buildEllipse,
  triangle: buildTriangle,
  hline: buildHline,
  seg: buildSeg,
};

const LOCAL_CTX = Object.freeze({ strokeWidth: 0, rng: null });

export const EXTENTS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif) => (
  extentOfPrimitives(BUILDERS[k](motif, LOCAL_CTX))
)]));
