/**
 * Line glyph motifs: lineGlyph (+, ╪, #, ⊥, T, 卄, ×), L, chevron (V/^/</>),
 * splitChevron (Λ with a gap), parallelPair (＝), pairVline (‖).
 * Owner: motif-1 (stage 1). Builder contract: see src/motifs/basic.js header and CONVENTIONS §7.3.
 *
 * Gap convention: gap values (hGap, vGap, apexGap, gap) are the distance between the
 * centre lines of adjacent strokes (strokes have no width in geometry).
 */

import { GeometryError } from '../core/errors.js';
import { obj, size, angle, enumOf, count } from '../core/schema.js';
import { line, polyline } from '../core/primitives.js';
import { rotatePoint } from '../core/geom.js';
import {
  LINE_STYLE, centred, extentOfPrimitives, needPositive, needFinite,
} from './basic.js';

const OPEN = (desc, extra) => enumOf(['up', 'down', 'left', 'right'], desc, extra);

export const KINDS = {
  lineGlyph: obj({
    hLines: count('number of horizontal strokes (0..3)', { max: 3, default: 0 }),
    hLen: size('horizontal stroke length (pt); required when hLines > 0'),
    hGap: size('gap between horizontal strokes (pt)', { exclusiveMin: undefined, min: 0, default: 0 }),
    vLines: count('number of vertical strokes (0..3)', { max: 3, default: 0 }),
    vLen: size('vertical stroke length (pt); required when vLines > 0'),
    vGap: size('gap between vertical strokes (pt)', { exclusiveMin: undefined, min: 0, default: 0 }),
    vAnchor: enumOf(['center', 'top', 'bottom'], 'where vertical strokes meet the horizontal ones (⊥ = bottom, T = top)', { default: 'center' }),
    rotation: angle('rotation of the whole glyph (deg, CCW); 45 gives ×', { default: 0 }),
  }, 'cross-type glyph (R1 §3.1–3.12, R2 §42, §50, §51)'),
  L: obj({
    vLen: size('vertical arm (pt)', { required: true }),
    hLen: size('horizontal arm (pt)', { required: true }),
    corner: enumOf(['bottomLeft', 'bottomRight', 'topLeft', 'topRight'], 'corner where arms meet', { default: 'bottomLeft' }),
  }, 'L glyph (R1 §3.13)'),
  chevron: obj({
    width: size('opening width (pt)', { required: true }),
    depth: size('apex depth (pt)', { required: true }),
    open: OPEN('side the chevron opens to (V = up, ^ = down, > = left)', { required: true }),
  }, 'chevron with joined apex (R1 §3.16, R2 §25, §40)'),
  splitChevron: obj({
    legLength: size('leg length (pt)', { required: true }),
    legAngle: angle('leg angle from the horizontal (deg)', { required: true }),
    apexGap: size('gap between the legs at the apex (pt)', { exclusiveMin: undefined, min: 0, required: true }),
    open: OPEN('side the chevron opens to (Λ = down)', { required: true }),
  }, 'chevron with separated legs (R2 §9, §15, R3 Kanto loam)'),
  parallelPair: obj({
    length: size('stroke length (pt)', { required: true }),
    gap: size('distance between the strokes (pt)', { required: true }),
    rotation: angle('rotation (deg, CCW); 0 = horizontal ＝', { default: 0 }),
  }, '＝ (R2 §47)'),
  pairVline: obj({
    length: size('stroke length (pt)', { required: true }),
    gap: size('distance between the strokes (pt)', { required: true }),
  }, '‖ (R3 organic soil)'),
};

/** Offsets of n strokes centred on 0 with centre-to-centre spacing gap. */
function offsets(n, gap) {
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * gap);
}

function checkGap(v, name) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new GeometryError(`motif: ${name} must be a finite number >= 0, got ${v}`);
  }
  return v;
}

function checkCount(v, name) {
  if (!Number.isInteger(v) || v < 0 || v > 3) {
    throw new GeometryError(`motif lineGlyph: ${name} must be an integer 0..3, got ${v}`);
  }
  return v;
}

/** Stroke list [x1, y1, x2, y2] in local coordinates, before rotation. */
function lineGlyphSegments(m) {
  const nh = checkCount(m.hLines, 'hLines');
  const nv = checkCount(m.vLines, 'vLines');
  if (nh === 0 && nv === 0) throw new GeometryError('motif lineGlyph: no strokes (hLines = vLines = 0)');
  if (m.vAnchor !== 'center' && m.vAnchor !== 'top' && m.vAnchor !== 'bottom') {
    throw new GeometryError(`motif lineGlyph: vAnchor must be center, top or bottom, got ${m.vAnchor}`);
  }
  if (m.vAnchor !== 'center' && nh === 0) {
    throw new GeometryError(`motif lineGlyph: vAnchor ${m.vAnchor} needs horizontal strokes (hLines > 0)`);
  }
  const segs = [];
  let yTop = 0;
  let yBot = 0;
  if (nh > 0) {
    const hLen = needPositive(m.hLen, 'lineGlyph hLen') / 2;
    const hGap = checkGap(m.hGap, 'hGap');
    const ys = offsets(nh, hGap);
    for (const y of ys) segs.push([-hLen, y, hLen, y]);
    yTop = Math.min(...ys);
    yBot = Math.max(...ys);
  }
  if (nv > 0) {
    const vLen = needPositive(m.vLen, 'lineGlyph vLen');
    const vGap = checkGap(m.vGap, 'vGap');
    for (const x of offsets(nv, vGap)) {
      if (m.vAnchor === 'center') {
        segs.push([x, -vLen / 2, x, vLen / 2]);
      } else if (m.vAnchor === 'top') {
        // T: the vertical stroke hangs down from the topmost horizontal stroke.
        segs.push([x, yTop, x, yTop + vLen]);
      } else {
        // ⊥: the vertical stroke rises up to the bottommost horizontal stroke.
        segs.push([x, yBot - vLen, x, yBot]);
      }
    }
  }
  return segs;
}

/** Rotate stroke endpoints about (0, 0) and emit centred line primitives. */
function strokesToPrimitives(segs, rotation) {
  const deg = needFinite(rotation, 'rotation');
  return centred(segs.map(([x1, y1, x2, y2]) => {
    const [ax, ay] = rotatePoint(x1, y1, deg);
    const [bx, by] = rotatePoint(x2, y2, deg);
    return line(ax, ay, bx, by, LINE_STYLE);
  }));
}

function buildLineGlyph(m) {
  return strokesToPrimitives(lineGlyphSegments(m), m.rotation);
}

const L_CORNERS = {
  // [sx, sy]: horizontal arm goes to x = sx * hLen, vertical arm goes to y = sy * vLen
  bottomLeft: [1, -1],
  bottomRight: [-1, -1],
  topLeft: [1, 1],
  topRight: [-1, 1],
};

function buildL(m) {
  const vLen = needPositive(m.vLen, 'L vLen');
  const hLen = needPositive(m.hLen, 'L hLen');
  const s = L_CORNERS[m.corner];
  if (!s) throw new GeometryError(`motif L: corner must be one of ${Object.keys(L_CORNERS).join(', ')}, got ${m.corner}`);
  return centred([polyline([[0, s[1] * vLen], [0, 0], [s[0] * hLen, 0]], { stroke: 'ink', fill: 'none' })]);
}

/**
 * Chevron: apex depth along the opening axis, opening width across it.
 * open 'up' = V (apex at the bottom), 'down' = ^, 'left' = >, 'right' = <.
 */
function buildChevron(m) {
  const w = needPositive(m.width, 'chevron width');
  const d = needPositive(m.depth, 'chevron depth');
  let pts;
  switch (m.open) {
    case 'up': pts = [[-w / 2, -d / 2], [0, d / 2], [w / 2, -d / 2]]; break;
    case 'down': pts = [[-w / 2, d / 2], [0, -d / 2], [w / 2, d / 2]]; break;
    case 'left': pts = [[-d / 2, -w / 2], [d / 2, 0], [-d / 2, w / 2]]; break;
    case 'right': pts = [[d / 2, -w / 2], [-d / 2, 0], [d / 2, w / 2]]; break;
    default: throw new GeometryError(`motif chevron: open must be up, down, left or right, got ${m.open}`);
  }
  return centred([polyline(pts, { stroke: 'ink', fill: 'none' })]);
}

/**
 * splitChevron: each leg starts at the apex end (apexGap apart, centred on the axis)
 * and runs legLength at legAngle to the SCREEN horizontal, whatever the opening.
 * open 'down' = Λ, 'up' = V, 'left' = > (apex on the right), 'right' = < (apex on the left).
 */
function buildSplitChevron(m) {
  const L = needPositive(m.legLength, 'splitChevron legLength');
  const a = needFinite(m.legAngle, 'splitChevron legAngle');
  if (!(a > 0 && a < 90)) {
    throw new GeometryError(`motif splitChevron: legAngle must be in (0, 90) degrees from the horizontal, got ${a}`);
  }
  const g = checkGap(m.apexGap, 'apexGap');
  const c = L * Math.cos((a * Math.PI) / 180);
  const s = L * Math.sin((a * Math.PI) / 180);
  let legs;
  switch (m.open) {
    case 'down': legs = [[[-g / 2, 0], [-g / 2 - c, s]], [[g / 2, 0], [g / 2 + c, s]]]; break;
    case 'up': legs = [[[-g / 2, 0], [-g / 2 - c, -s]], [[g / 2, 0], [g / 2 + c, -s]]]; break;
    case 'left': legs = [[[0, -g / 2], [-c, -g / 2 - s]], [[0, g / 2], [-c, g / 2 + s]]]; break;
    case 'right': legs = [[[0, -g / 2], [c, -g / 2 - s]], [[0, g / 2], [c, g / 2 + s]]]; break;
    default: throw new GeometryError(`motif splitChevron: open must be up, down, left or right, got ${m.open}`);
  }
  return centred(legs.map(([p, q]) => polyline([p, q], { stroke: 'ink', fill: 'none' })));
}

function buildParallelPair(m) {
  const h = needPositive(m.length, 'parallelPair length') / 2;
  const g = needPositive(m.gap, 'parallelPair gap') / 2;
  return strokesToPrimitives([[-h, -g, h, -g], [-h, g, h, g]], m.rotation);
}

function buildPairVline(m) {
  const h = needPositive(m.length, 'pairVline length') / 2;
  const g = needPositive(m.gap, 'pairVline gap') / 2;
  return centred([line(-g, -h, -g, h, LINE_STYLE), line(g, -h, g, h, LINE_STYLE)]);
}

export const BUILDERS = {
  lineGlyph: buildLineGlyph,
  L: buildL,
  chevron: buildChevron,
  splitChevron: buildSplitChevron,
  parallelPair: buildParallelPair,
  pairVline: buildPairVline,
};

const LOCAL_CTX = Object.freeze({ strokeWidth: 0, rng: null });

export const EXTENTS = Object.fromEntries(Object.keys(KINDS).map((k) => [k, (motif) => (
  extentOfPrimitives(BUILDERS[k](motif, LOCAL_CTX))
)]));
