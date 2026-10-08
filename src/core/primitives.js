/**
 * Internal primitive list (design §5.1): the only thing archetypes and motifs produce,
 * and the only thing renderers consume. CONVENTIONS §7.
 *
 *   { type:'line',     x1, y1, x2, y2, style }
 *   { type:'polyline', points:[[x,y],...] (>=2), style }
 *   { type:'polygon',  points:[[x,y],...] (>=3, implicitly closed), style }
 *   { type:'circle',   cx, cy, r, style }                  r = radius
 *   { type:'ellipse',  cx, cy, rx, ry, rotation, style }   rx, ry = radii; rotation deg, math convention
 *   { type:'path',     cmds:[{op:'M',x,y}|{op:'L',x,y}|{op:'C',x1,y1,x2,y2,x,y}|{op:'Q',x1,y1,x,y}|{op:'Z'}], style }
 *
 *   style = { stroke:'ink'|'paper'|'none', fill:'ink'|'paper'|'none', dash:[on,off]|null, dashOffset:number }
 *
 * Coordinates are pt, y-down. Geometry uses radii (SVG semantics); motif PARAMETERS use full extents.
 * Colours never appear here: only the paint tokens ink/paper/none.
 */

import { rotatePoint } from './geom.js';

export const PRIMITIVE_TYPES = Object.freeze(['line', 'polyline', 'polygon', 'circle', 'ellipse', 'path']);
export const STROKE_TOKENS = Object.freeze(['ink', 'paper', 'none']);
export const FILL_TOKENS = Object.freeze(['ink', 'paper', 'none']);
const STYLE_KEYS = ['stroke', 'fill', 'dash', 'dashOffset'];

export const DEFAULT_STYLE = Object.freeze({ stroke: 'ink', fill: 'none', dash: null, dashOffset: 0 });

function fin(v, name) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`primitive: ${name} must be a finite number, got ${v}`);
  return v;
}

/**
 * Normalise a style object; unknown keys and colour values are errors.
 * @param {object} [s] @returns {{stroke:string, fill:string, dash:number[]|null, dashOffset:number}}
 */
export function makeStyle(s = {}) {
  for (const k of Object.keys(s)) {
    if (!STYLE_KEYS.includes(k)) throw new TypeError(`style: unknown key "${k}"; allowed: ${STYLE_KEYS.join(', ')} (colours come only from ink/paper)`);
  }
  const st = { ...DEFAULT_STYLE, ...s };
  if (!STROKE_TOKENS.includes(st.stroke)) throw new TypeError(`style.stroke must be one of ${STROKE_TOKENS.join(', ')}, got ${JSON.stringify(st.stroke)}`);
  if (!FILL_TOKENS.includes(st.fill)) throw new TypeError(`style.fill must be one of ${FILL_TOKENS.join(', ')}, got ${JSON.stringify(st.fill)}`);
  if (st.dash !== null) {
    if (!Array.isArray(st.dash) || st.dash.length !== 2 || !st.dash.every((d) => Number.isFinite(d) && d > 0)) {
      throw new TypeError(`style.dash must be null or [on, off] with positive numbers, got ${JSON.stringify(st.dash)}`);
    }
    st.dash = [...st.dash];
  }
  fin(st.dashOffset, 'style.dashOffset');
  if (st.stroke === 'none' && st.fill === 'none') throw new TypeError('style: stroke and fill are both "none" (invisible primitive)');
  return st;
}

const pts = (points, min, name) => {
  if (!Array.isArray(points) || points.length < min) throw new TypeError(`${name}: needs >= ${min} points`);
  return points.map((p, i) => {
    if (!Array.isArray(p) || p.length !== 2) throw new TypeError(`${name}: point ${i} must be [x, y]`);
    return [fin(p[0], `${name}[${i}].x`), fin(p[1], `${name}[${i}].y`)];
  });
};

export const line = (x1, y1, x2, y2, style) => ({ type: 'line', x1: fin(x1, 'x1'), y1: fin(y1, 'y1'), x2: fin(x2, 'x2'), y2: fin(y2, 'y2'), style: makeStyle(style) });
export const polyline = (points, style) => ({ type: 'polyline', points: pts(points, 2, 'polyline'), style: makeStyle(style) });
export const polygon = (points, style) => ({ type: 'polygon', points: pts(points, 3, 'polygon'), style: makeStyle(style) });
export function circle(cx, cy, r, style) {
  if (!(fin(r, 'r') > 0)) throw new RangeError(`circle: r must be > 0, got ${r}`);
  return { type: 'circle', cx: fin(cx, 'cx'), cy: fin(cy, 'cy'), r, style: makeStyle(style) };
}
export function ellipse(cx, cy, rx, ry, rotation = 0, style) {
  if (!(fin(rx, 'rx') > 0 && fin(ry, 'ry') > 0)) throw new RangeError(`ellipse: rx, ry must be > 0, got ${rx}, ${ry}`);
  return { type: 'ellipse', cx: fin(cx, 'cx'), cy: fin(cy, 'cy'), rx, ry, rotation: fin(rotation, 'rotation'), style: makeStyle(style) };
}
export function path(cmds, style) {
  return { type: 'path', cmds: checkCmds(cmds), style: makeStyle(style) };
}

const CMD_FIELDS = { M: ['x', 'y'], L: ['x', 'y'], C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'], Q: ['x1', 'y1', 'x', 'y'], Z: [] };

function checkCmds(cmds) {
  if (!Array.isArray(cmds) || cmds.length < 2) throw new TypeError('path: needs >= 2 commands');
  if (cmds[0].op !== 'M') throw new TypeError('path: first command must be M');
  return cmds.map((c, i) => {
    const f = CMD_FIELDS[c.op];
    if (!f) throw new TypeError(`path: command ${i} has unknown op ${JSON.stringify(c.op)}; allowed: ${Object.keys(CMD_FIELDS).join(', ')}`);
    const o = { op: c.op };
    for (const k of f) o[k] = fin(c[k], `path[${i}].${k}`);
    return o;
  });
}

/** Validate an arbitrary object as a primitive (used on archetype output). Throws with the reason. */
export function validatePrimitive(p) {
  if (!p || !PRIMITIVE_TYPES.includes(p.type)) throw new TypeError(`primitive: unknown type ${JSON.stringify(p?.type)}; allowed: ${PRIMITIVE_TYPES.join(', ')}`);
  switch (p.type) {
    case 'line': return line(p.x1, p.y1, p.x2, p.y2, p.style);
    case 'polyline': return polyline(p.points, p.style);
    case 'polygon': return polygon(p.points, p.style);
    case 'circle': return circle(p.cx, p.cy, p.r, p.style);
    case 'ellipse': return ellipse(p.cx, p.cy, p.rx, p.ry, p.rotation, p.style);
    default: return path(p.cmds, p.style);
  }
}

// ---------------------------------------------------------------------------
// Circle approximations (design §2.3: renderers draw true circles; these are for
// clipping, hit tests and user requests such as polygonSides)
// ---------------------------------------------------------------------------

/** Regular n-gon inscribed in the circle, first vertex at angle `startDeg` (math convention). */
export function circlePolygonPoints(cx, cy, r, n, startDeg = 90) {
  if (!Number.isInteger(n) || n < 3) throw new RangeError(`circlePolygonPoints: n must be an integer >= 3, got ${n}`);
  const out = [];
  for (let i = 0; i < n; i++) out.push(rotatePoint(cx + r, cy, startDeg + (360 * i) / n, cx, cy));
  return out;
}

/** Four-cubic Bézier circle (max radial error ≈ 0.027 % of r). Returns path commands. */
export function circleBezierCmds(cx, cy, r) {
  const k = 0.5522847498307936 * r;
  return [
    { op: 'M', x: cx + r, y: cy },
    { op: 'C', x1: cx + r, y1: cy + k, x2: cx + k, y2: cy + r, x: cx, y: cy + r },
    { op: 'C', x1: cx - k, y1: cy + r, x2: cx - r, y2: cy + k, x: cx - r, y: cy },
    { op: 'C', x1: cx - r, y1: cy - k, x2: cx - k, y2: cy - r, x: cx, y: cy - r },
    { op: 'C', x1: cx + k, y1: cy - r, x2: cx + r, y2: cy - k, x: cx + r, y: cy },
    { op: 'Z' },
  ];
}

// ---------------------------------------------------------------------------
// Transform (scale -> mirror -> rotate -> translate), used to place motifs
// ---------------------------------------------------------------------------

/**
 * @param {object} p primitive in local coordinates
 * @param {{scale?:number, mirrorY?:boolean, rotate?:number, x?:number, y?:number}} t
 *   scale: uniform factor; mirrorY: flip upside down (y -> -y); rotate: deg CCW; x, y: translation
 */
export function transformPrimitive(p, t = {}) {
  const s = t.scale ?? 1;
  const m = t.mirrorY ? -1 : 1;
  const rot = t.rotate ?? 0;
  const tx = t.x ?? 0;
  const ty = t.y ?? 0;
  if (!(Number.isFinite(s) && s > 0)) throw new RangeError(`transform: scale must be > 0, got ${s}`);
  const P = (x, y) => {
    const [rx, ry] = rotatePoint(x * s, y * s * m, rot);
    return [rx + tx, ry + ty];
  };
  const style = p.style;
  switch (p.type) {
    case 'line': {
      const [x1, y1] = P(p.x1, p.y1);
      const [x2, y2] = P(p.x2, p.y2);
      return line(x1, y1, x2, y2, style);
    }
    case 'polyline': return polyline(p.points.map(([x, y]) => P(x, y)), style);
    case 'polygon': return polygon(p.points.map(([x, y]) => P(x, y)), style);
    case 'circle': {
      const [cx, cy] = P(p.cx, p.cy);
      return circle(cx, cy, p.r * s, style);
    }
    case 'ellipse': {
      const [cx, cy] = P(p.cx, p.cy);
      return ellipse(cx, cy, p.rx * s, p.ry * s, m * p.rotation + rot, style);
    }
    case 'path':
      return path(p.cmds.map((c) => {
        const o = { op: c.op };
        if ('x1' in c) [o.x1, o.y1] = P(c.x1, c.y1);
        if ('x2' in c) [o.x2, o.y2] = P(c.x2, c.y2);
        if ('x' in c) [o.x, o.y] = P(c.x, c.y);
        return o;
      }), style);
    default:
      throw new TypeError(`transform: unknown primitive type ${p.type}`);
  }
}

/**
 * Geometric bounding box (stroke width NOT included). Ellipses are exact; paths use
 * their control points (conservative). @returns {{minX,minY,maxX,maxY}}
 */
export function bbox(p) {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const add = (x, y) => {
    if (x < b.minX) b.minX = x;
    if (y < b.minY) b.minY = y;
    if (x > b.maxX) b.maxX = x;
    if (y > b.maxY) b.maxY = y;
  };
  switch (p.type) {
    case 'line': add(p.x1, p.y1); add(p.x2, p.y2); break;
    case 'polyline':
    case 'polygon': p.points.forEach(([x, y]) => add(x, y)); break;
    case 'circle': add(p.cx - p.r, p.cy - p.r); add(p.cx + p.r, p.cy + p.r); break;
    case 'ellipse': {
      const r = (p.rotation * Math.PI) / 180;
      const hw = Math.hypot(p.rx * Math.cos(r), p.ry * Math.sin(r));
      const hh = Math.hypot(p.rx * Math.sin(r), p.ry * Math.cos(r));
      add(p.cx - hw, p.cy - hh); add(p.cx + hw, p.cy + hh); break;
    }
    case 'path': p.cmds.forEach((c) => {
      if ('x1' in c) add(c.x1, c.y1);
      if ('x2' in c) add(c.x2, c.y2);
      if ('x' in c) add(c.x, c.y);
    }); break;
    default: throw new TypeError(`bbox: unknown primitive type ${p.type}`);
  }
  return b;
}

/** Union bbox of a list; throws on an empty list (an empty motif is a bug). */
export function bboxOf(list) {
  if (!list.length) throw new RangeError('bboxOf: empty primitive list');
  return list.map(bbox).reduce((a, c) => ({
    minX: Math.min(a.minX, c.minX), minY: Math.min(a.minY, c.minY), maxX: Math.max(a.maxX, c.maxX), maxY: Math.max(a.maxY, c.maxY),
  }));
}

// ---------------------------------------------------------------------------
// SVG path data parsing (user-supplied paths, design §1.4 b3)
// ---------------------------------------------------------------------------

const PATH_OPS = 'MmLlHhVvCcQqZz';

/**
 * Parse SVG path data into absolute M/L/C/Q/Z commands. Supported: M L H V C Q Z (both cases).
 * Arcs (A), smooth curves (S, T) are rejected with the list of supported commands.
 * @param {string} d @returns {object[]}
 */
export function parsePathData(d) {
  if (typeof d !== 'string' || !d.trim()) throw new TypeError('parsePathData: empty path data');
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
  const rest = d.replace(/[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?|[\s,]/g, '');
  if (rest.length) throw new TypeError(`parsePathData: unexpected characters ${JSON.stringify(rest.slice(0, 10))}`);
  const out = [];
  let i = 0;
  let op = null;
  let cx = 0; let cy = 0; let sx = 0; let sy = 0;
  const num = () => {
    const t = tokens[i++];
    if (t === undefined || /[A-Za-z]/.test(t)) throw new TypeError(`parsePathData: missing number after ${op}`);
    return Number(t);
  };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) {
      op = tokens[i++];
      if (!PATH_OPS.includes(op)) throw new TypeError(`parsePathData: unsupported command ${op}; supported: M L H V C Q Z (absolute and relative)`);
    } else if (op === null) {
      throw new TypeError('parsePathData: path must start with M');
    }
    const rel = op === op.toLowerCase();
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;
    switch (op.toUpperCase()) {
      case 'M': {
        const x = ox + num(); const y = oy + num();
        out.push({ op: 'M', x, y }); cx = sx = x; cy = sy = y;
        op = rel ? 'l' : 'L'; // implicit lineto after the first pair
        break;
      }
      case 'L': { const x = ox + num(); const y = oy + num(); out.push({ op: 'L', x, y }); cx = x; cy = y; break; }
      case 'H': { const x = ox + num(); out.push({ op: 'L', x, y: cy }); cx = x; break; }
      case 'V': { const y = oy + num(); out.push({ op: 'L', x: cx, y }); cy = y; break; }
      case 'C': {
        const c = { op: 'C', x1: ox + num(), y1: oy + num(), x2: ox + num(), y2: oy + num(), x: ox + num(), y: oy + num() };
        out.push(c); cx = c.x; cy = c.y; break;
      }
      case 'Q': {
        const c = { op: 'Q', x1: ox + num(), y1: oy + num(), x: ox + num(), y: oy + num() };
        out.push(c); cx = c.x; cy = c.y; break;
      }
      case 'Z': out.push({ op: 'Z' }); cx = sx; cy = sy; op = null; break;
      default: throw new TypeError(`parsePathData: unsupported command ${op}`);
    }
  }
  return checkCmds(out);
}
