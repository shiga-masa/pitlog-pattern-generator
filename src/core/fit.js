/**
 * tileMode 'fit' helpers shared by the archetypes (CONVENTIONS §3.3). Stage 2 (integration).
 *
 * ctx.fit = {x, y} is the factor by which the renderer rounds the period on each axis so that an
 * integer number of tiles fills the requested size (|fit - 1| <= 5 %). It is {x: 1, y: 1} in
 * 'frame' and 'period' modes. An archetype honours it in one of two ways:
 *  - lattice archetypes (grid, edgeBand) multiply their pitches by fit and keep the motif size;
 *  - line archetypes (hatch, brick, wave) draw in unfitted coordinates and stretch the resulting
 *    lines by (fit.x, fit.y) with drawStretched(); angles and amplitudes change by the same <= 5 %.
 * In both cases period(layer, ctx) returns the unfitted period multiplied by fit (fitPeriod()).
 */

export const UNIT_FIT = Object.freeze({ x: 1, y: 1 });

/** The fit of a context, validated. */
export function fitOf(ctx) {
  const f = ctx?.fit ?? UNIT_FIT;
  if (!(Number.isFinite(f.x) && f.x > 0 && Number.isFinite(f.y) && f.y > 0)) {
    throw new RangeError(`ctx.fit must be {x, y} with finite factors > 0, got ${JSON.stringify(f)}`);
  }
  return f;
}

export function isUnitFit(f) {
  return f.x === 1 && f.y === 1;
}

/** Period {w, h} scaled by the fit of ctx (null stays null). */
export function fitPeriod(period, ctx) {
  if (period === null) return null;
  const f = fitOf(ctx);
  return { w: period.w * f.x, h: period.h * f.y };
}

/** Stretch one line-like primitive by (fx, fy). Circles and ellipses are not stretched (they would stop being round). */
export function stretchPrimitive(p, f) {
  const P = ([x, y]) => [x * f.x, y * f.y];
  switch (p.type) {
    case 'line': return { ...p, x1: p.x1 * f.x, y1: p.y1 * f.y, x2: p.x2 * f.x, y2: p.y2 * f.y };
    case 'polyline':
    case 'polygon': return { ...p, points: p.points.map(P) };
    case 'path': return {
      ...p,
      cmds: p.cmds.map((c) => {
        const o = { op: c.op };
        if ('x1' in c) [o.x1, o.y1] = P([c.x1, c.y1]);
        if ('x2' in c) [o.x2, o.y2] = P([c.x2, c.y2]);
        if ('x' in c) [o.x, o.y] = P([c.x, c.y]);
        return o;
      }),
    };
    default:
      throw new TypeError(`stretchPrimitive: ${p.type} cannot be stretched (only lines, polylines, polygons and paths)`);
  }
}

/**
 * Run `draw(ctx0)` in unfitted coordinates (region and an explicit origin divided by fit) and stretch
 * the result back. With a unit fit this is just draw(ctx).
 * @param {object} ctx LayerContext @param {(ctx:object)=>object} draw returns a LayerResult
 */
export function drawStretched(ctx, draw) {
  const f = fitOf(ctx);
  if (isUnitFit(f)) return draw(ctx);
  const r = ctx.region;
  const o = ctx.origin;
  const origin = o && typeof o === 'object' ? { x: o.x / f.x, y: o.y / f.y } : o;
  const res = draw({
    ...ctx,
    fit: UNIT_FIT,
    origin,
    region: { x: r.x / f.x, y: r.y / f.y, width: r.width / f.x, height: r.height / f.y },
  });
  return {
    ...res,
    primitives: res.primitives.map((p) => stretchPrimitive(p, f)),
    ...(res.anchors ? { anchors: res.anchors.map((a) => ({ ...a, x: a.x * f.x, y: a.y * f.y })) } : {}),
  };
}

/** Layer offset {x, y} in pt (absent = zero). */
export function offsetOf(layer) {
  const o = layer.offset;
  return o ? { x: o.x, y: o.y } : { x: 0, y: 0 };
}
