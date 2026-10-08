/**
 * blend 'knockout' (design §4, CONVENTIONS §3.4): a layer with blend 'knockout' removes every
 * primitive of the layers drawn BELOW it (earlier in z order) that intersects one of its own
 * primitives. Used when the ground is transparent and paper-filled shapes cannot hide what is under
 * them. Shared by the SVG, <pattern> and Canvas backends through render/svg.js buildScene().
 *
 * Intersection is geometric (stroke width not included, like every bbox in CONVENTIONS §3.2):
 *  - every primitive is flattened to line segments (circle / ellipse: 64-gon, Bézier: 16 chords);
 *  - closed shapes (polygon, circle, ellipse, a path that closes with Z, or any shape with a fill)
 *    also count their interior, so a short line wholly inside a white triangle is removed;
 *  - two primitives intersect when a segment of one crosses or touches a segment of the other, or
 *    a vertex of one lies inside the interior of a closed other.
 * The flattening error is below 0.13 % of the radius (64-gon) — far below the 0.001 pt SVG precision
 * for the sizes used here (r <= 7 pt gives <= 0.009 pt).
 */

import { bbox } from '../core/primitives.js';
import { bboxIntersects, rotatePoint } from '../core/geom.js';

const CIRCLE_SEGMENTS = 64;
const CURVE_SEGMENTS = 16;
const EPS = 1e-9;

/** Flatten one primitive: {rings: [[x,y]...][], closed: boolean, box}. */
export function flatten(p) {
  const rings = [];
  let closed = p.style?.fill !== undefined && p.style.fill !== 'none';
  switch (p.type) {
    case 'line':
      rings.push([[p.x1, p.y1], [p.x2, p.y2]]);
      break;
    case 'polyline':
      rings.push(p.points.map(([x, y]) => [x, y]));
      break;
    case 'polygon':
      rings.push([...p.points.map(([x, y]) => [x, y]), [p.points[0][0], p.points[0][1]]]);
      closed = true;
      break;
    case 'circle':
    case 'ellipse': {
      const rx = p.type === 'circle' ? p.r : p.rx;
      const ry = p.type === 'circle' ? p.r : p.ry;
      const rot = p.type === 'ellipse' ? p.rotation : 0;
      const ring = [];
      for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
        const t = (2 * Math.PI * i) / CIRCLE_SEGMENTS;
        ring.push(rotatePoint(p.cx + rx * Math.cos(t), p.cy - ry * Math.sin(t), rot, p.cx, p.cy));
      }
      rings.push(ring);
      closed = true;
      break;
    }
    case 'path': {
      let ring = null;
      let start = null;
      let cur = null;
      for (const c of p.cmds) {
        if (c.op === 'M') {
          if (ring && ring.length > 1) rings.push(ring);
          ring = [[c.x, c.y]];
          start = [c.x, c.y];
          cur = [c.x, c.y];
        } else if (c.op === 'L') {
          ring.push([c.x, c.y]);
          cur = [c.x, c.y];
        } else if (c.op === 'Q' || c.op === 'C') {
          for (let i = 1; i <= CURVE_SEGMENTS; i++) {
            const t = i / CURVE_SEGMENTS;
            const u = 1 - t;
            if (c.op === 'Q') {
              ring.push([u * u * cur[0] + 2 * u * t * c.x1 + t * t * c.x, u * u * cur[1] + 2 * u * t * c.y1 + t * t * c.y]);
            } else {
              ring.push([
                u * u * u * cur[0] + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
                u * u * u * cur[1] + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y,
              ]);
            }
          }
          cur = [c.x, c.y];
        } else if (c.op === 'Z') {
          ring.push([start[0], start[1]]);
          cur = [start[0], start[1]];
          closed = true;
        }
      }
      if (ring && ring.length > 1) rings.push(ring);
      break;
    }
    default:
      throw new TypeError(`knockout: unknown primitive type ${p.type}`);
  }
  return { rings, closed, box: bbox(p) };
}

function orient(ax, ay, bx, by, cx, cy) {
  const v = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  return Math.abs(v) <= EPS ? 0 : Math.sign(v);
}

function onSegment(ax, ay, bx, by, px, py) {
  return Math.min(ax, bx) - EPS <= px && px <= Math.max(ax, bx) + EPS && Math.min(ay, by) - EPS <= py && py <= Math.max(ay, by) + EPS;
}

/** Closed segments ab and cd share a point. */
export function segmentsIntersect(a, b, c, d) {
  const o1 = orient(a[0], a[1], b[0], b[1], c[0], c[1]);
  const o2 = orient(a[0], a[1], b[0], b[1], d[0], d[1]);
  const o3 = orient(c[0], c[1], d[0], d[1], a[0], a[1]);
  const o4 = orient(c[0], c[1], d[0], d[1], b[0], b[1]);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a[0], a[1], b[0], b[1], c[0], c[1])) return true;
  if (o2 === 0 && onSegment(a[0], a[1], b[0], b[1], d[0], d[1])) return true;
  if (o3 === 0 && onSegment(c[0], c[1], d[0], d[1], a[0], a[1])) return true;
  if (o4 === 0 && onSegment(c[0], c[1], d[0], d[1], b[0], b[1])) return true;
  return false;
}

/** Even-odd point-in-ring test (ring closed: last point = first point). */
function insideRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Flattened shapes a and b intersect (boundary crossing, or one inside the closed other). */
export function shapesIntersect(a, b) {
  if (!bboxIntersects(a.box, { x: b.box.minX, y: b.box.minY, width: b.box.maxX - b.box.minX, height: b.box.maxY - b.box.minY })) return false;
  for (const ra of a.rings) {
    for (let i = 0; i + 1 < ra.length; i++) {
      for (const rb of b.rings) {
        for (let j = 0; j + 1 < rb.length; j++) {
          if (segmentsIntersect(ra[i], ra[i + 1], rb[j], rb[j + 1])) return true;
        }
      }
    }
  }
  if (b.closed && a.rings.some((r) => b.rings.some((rb) => insideRing(r[0], rb)))) return true;
  if (a.closed && b.rings.some((r) => a.rings.some((ra) => insideRing(r[0], ra)))) return true;
  return false;
}

/**
 * Apply knockout in place of nothing: returns new primitive lists.
 * @param {object[]} layersInZOrder resolved layers (blend read from each)
 * @param {Record<string, object[]>} prims primitives per layer id (final, after periodic copies)
 * @returns {{prims: Record<string, object[]>, removed: Record<string, number>}} removed = count per lower layer
 */
export function applyKnockout(layersInZOrder, prims) {
  const out = {};
  for (const l of layersInZOrder) out[l.id] = prims[l.id];
  const removed = {};
  layersInZOrder.forEach((top, k) => {
    if (top.blend !== 'knockout' || k === 0) return;
    const cutters = out[top.id].map(flatten);
    if (cutters.length === 0) return;
    for (const below of layersInZOrder.slice(0, k)) {
      const before = out[below.id].length;
      out[below.id] = out[below.id].filter((p) => {
        const f = flatten(p);
        return !cutters.some((c) => shapesIntersect(f, c));
      });
      removed[below.id] = (removed[below.id] ?? 0) + before - out[below.id].length;
    }
  });
  return { prims: out, removed };
}
