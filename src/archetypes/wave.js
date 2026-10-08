/**
 * Archetype `wave`. Owner: arch-3 (stage 1). Contract: docs/CONVENTIONS.md §7.
 *
 * Edit only this file (and test/archetypes/wave.test.js). PARAMS is the single source of truth for
 * this archetype's parameters: validation, defaults and density scaling all read it.
 *
 * Geometry (CONVENTIONS §2): the wave lines run along the direction u = dir(angle); the displacement
 * is along the normal n = dir(angle - 90). Every line is a translate of one curve by k * lineSpacing * n,
 * so the picture is invariant under wavelength * u and lineSpacing * n (period()).
 * amplitude is the HALF crest-to-trough height (PARAMS). The trapezoid's full rise is therefore 2 * amplitude.
 */

import { GeometryError } from '../core/errors.js';
import { EPS } from '../core/defaults.js';
import { dir } from '../core/geom.js';
import { polyline } from '../core/primitives.js';
import { clipPolyline } from '../core/clip.js';
import { angle, autoCount, enumOf, len, margin, obj, ratio, size } from '../core/schema.js';

const OWNER = 'arch-3';

export const ARCHETYPE = 'wave';

/** Motif policy: 'required' | 'forbidden' | 'motifOrCycle' (grid: layer.motif XOR params.cycle). */
export const MOTIF = 'forbidden';

/** Whether density scales params / motif of this archetype (design §3.2). */
export const DENSITY = Object.freeze({ params: true, motif: true });

export const PARAMS = obj({
  angle: angle('direction of the wave lines (deg, CCW)', { default: 0 }),
  wavelength: len('wavelength along the line (pt)', { required: true }),
  amplitude: size('half crest-to-trough height (pt)', { required: true }),
  lineSpacing: len('distance between wave lines, PERPENDICULAR to them (pt)', { required: true }),
  lines: autoCount('number of wave lines; auto = fill the region', { default: 'auto' }),
  waveform: enumOf(['sine', 'trapezoid'], 'wave shape', { default: 'sine' }),
  flat: len('trapezoid: flat part length (pt) (R2 §35: 7.0)'),
  rampDx: len('trapezoid: ramp horizontal length (pt)'),
  rampDy: size('trapezoid: ramp vertical rise (pt)'),
  doubleGap: { type: 'number', unit: 'pt', density: 'motif', min: 0, default: 0, desc: 'distance of the second parallel line; 0 = single line (R2 §33: 0.93)' },
  phase: ratio('phase as a fraction of the wavelength', { min: 0, max: 1, default: 0 }),
  margin: margin('distance kept from the region edges (pt)', { default: 0 }),
}, 'wave parameters (design §2.2)');

/** Samples per wavelength for the sine (chord error ~ A * (2 pi / 96)^2 / 8 < 0.001 pt for A = 1 pt). */
const SINE_SAMPLES_PER_WAVELENGTH = 96;
/**
 * Search bound for the integer combinations a * wavelength * u + b * lineSpacing * n in period():
 * a tile may span at most this many wavelengths or line spacings. Larger exact matches exist for
 * decimal values (8.5 and 13.75 meet at 55 / 34), but such a tile is useless, so period() returns null.
 */
const PERIOD_SEARCH_LIMIT = 8;
/** Trapezoid: `flat` must equal wavelength/2 - rampDx within this fraction of the wavelength. */
const FLAT_TOLERANCE_RATIO = 0.01;
const STYLE = Object.freeze({ stroke: 'ink', fill: 'none' });

/**
 * Draw one layer.
 * @param {import('../core/types.js').ResolvedLayer} layer  defaults applied, density applied
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {import('../core/types.js').LayerResult}
 */
export function render(layer, ctx) {
  const p = layer.params;
  const region = ctx.region;
  if (!(region.width > 0 && region.height > 0)) throw new GeometryError(`wave ${layer.id}: region must have positive size`);
  const warnings = [];
  const g = waveGeometry(p, layer.id);
  const inset = insetRect(region, p.margin, layer.id);

  if (ctx.jitter) warnings.push(`layer ${layer.id}: jitter is not applied to wave (no jitter parameter in PARAMS)`);
  if (ctx.tileMode === 'period' && p.lines !== 'auto') {
    warnings.push(`layer ${layer.id}: lines=${p.lines} is a finite count, so the period tile is not seamless (the period assumes infinitely many lines)`);
  }

  const R = anchorPoint(ctx.origin, region);
  const u = dir(p.angle);
  const n = dir(p.angle - 90);
  const s = p.lineSpacing;
  const d = p.doubleGap;

  // Extent of the region in the along-line (t) and normal (q) coordinates, measured from R.
  const corners = [
    [region.x, region.y], [region.x + region.width, region.y],
    [region.x, region.y + region.height], [region.x + region.width, region.y + region.height],
  ].map(([x, y]) => [(x - R.x) * u.x + (y - R.y) * u.y, (x - R.x) * n.x + (y - R.y) * n.y]);
  const tMin = Math.min(...corners.map((c) => c[0])) - p.wavelength;
  const tMax = Math.max(...corners.map((c) => c[0])) + p.wavelength;
  const qMin = Math.min(...corners.map((c) => c[1]));
  const qMax = Math.max(...corners.map((c) => c[1]));

  const offsets = lineOffsets(p, ctx.origin, qMin, qMax, s, d);

  const primitives = [];
  let placed = 0;
  let skipped = 0;
  for (const q of offsets) {
    const curves = d > 0 ? [q, q + d] : [q];
    let pieces = 0;
    for (const qc of curves) {
      const pts = curvePoints(g, R, u, n, qc, tMin, tMax);
      for (const piece of clipPolyline(pts, inset)) {
        if (piece.length < 2) continue;
        primitives.push(polyline(piece, STYLE));
        pieces++;
      }
    }
    if (pieces > 0) placed++;
    else skipped++;
  }

  const warn = lineSpacingWarning(layer.id, g, s, d, ctx.strokeWidth);
  if (warn) warnings.push(warn);

  return { primitives, placed, skipped, warnings };
}

/**
 * Smallest seamless period for tileMode 'period' (design §5.5), or null when none exists
 * (the caller then falls back as documented in CONVENTIONS §3.3).
 * The period is the smallest axis-aligned lattice vector (w, 0) and (0, h) of the lattice
 * generated by wavelength * u and lineSpacing * n. Angles where no such pair exists (e.g. 45 deg
 * with incommensurate wavelength and spacing) return null.
 * @param {import('../core/types.js').ResolvedLayer} layer
 * @param {import('../core/types.js').LayerContext} ctx
 * @returns {{w:number, h:number} | null}
 */
export function period(layer, ctx) {
  const p = layer.params;
  const u = dir(p.angle);
  const n = dir(p.angle - 90);
  const L = p.wavelength;
  const s = p.lineSpacing;
  const tol = 1e-9 * Math.max(L, s);
  let w = null;
  let h = null;
  for (let a = -PERIOD_SEARCH_LIMIT; a <= PERIOD_SEARCH_LIMIT; a++) {
    for (let b = -PERIOD_SEARCH_LIMIT; b <= PERIOD_SEARCH_LIMIT; b++) {
      if (a === 0 && b === 0) continue;
      const vx = a * L * u.x + b * s * n.x;
      const vy = a * L * u.y + b * s * n.y;
      if (Math.abs(vy) <= tol && Math.abs(vx) > tol && (w === null || Math.abs(vx) < w)) w = Math.abs(vx);
      if (Math.abs(vx) <= tol && Math.abs(vy) > tol && (h === null || Math.abs(vy) < h)) h = Math.abs(vy);
    }
  }
  return w !== null && h !== null ? { w, h } : null;
}

// ---------------------------------------------------------------------------
// helpers (file-local; geometry shared with other archetypes goes to core/)
// ---------------------------------------------------------------------------

/**
 * Waveform description in pt. For the trapezoid the flat length is derived from the wavelength,
 * because the period must close: flat = wavelength/2 - rampDx.
 */
function waveGeometry(p, id) {
  const lambda = p.wavelength;
  const A = p.amplitude;
  if (p.waveform === 'sine') {
    return { kind: 'sine', lambda, A, phase: p.phase, maxSlope: (2 * Math.PI * A) / lambda };
  }
  if (p.rampDx === undefined) throw new GeometryError(`wave ${id}: waveform trapezoid needs rampDx`);
  const rampDx = p.rampDx;
  const flat = lambda / 2 - rampDx;
  if (!(flat > 0)) throw new GeometryError(`wave ${id}: rampDx ${rampDx} leaves no flat part in wavelength ${lambda} (wavelength/2 = ${lambda / 2})`);
  if (p.flat !== undefined && Math.abs(p.flat - flat) > FLAT_TOLERANCE_RATIO * lambda) {
    throw new GeometryError(`wave ${id}: flat ${p.flat} + rampDx ${rampDx} must equal wavelength/2 = ${lambda / 2} (derived flat ${flat.toFixed(3)}, tolerance ${(FLAT_TOLERANCE_RATIO * lambda).toFixed(3)})`);
  }
  if (p.rampDy !== undefined && Math.abs(p.rampDy - 2 * A) > EPS) {
    throw new GeometryError(`wave ${id}: rampDy ${p.rampDy} must equal 2 x amplitude = ${2 * A} (amplitude is the half crest-to-trough height)`);
  }
  return {
    kind: 'trapezoid', lambda, A, phase: p.phase, flat, rampDx,
    maxSlope: (2 * A) / rampDx,
  };
}

/** Inset rectangle after the margin; throws when the margin leaves no area. */
function insetRect(region, m, id) {
  const sides = typeof m === 'number'
    ? { left: m, right: m, top: m, bottom: m }
    : { left: m.left ?? 0, right: m.right ?? 0, top: m.top ?? 0, bottom: m.bottom ?? 0 };
  const width = region.width - sides.left - sides.right;
  const height = region.height - sides.top - sides.bottom;
  if (!(width > 0 && height > 0)) throw new GeometryError(`wave ${id}: margin ${JSON.stringify(m)} leaves no drawing area in ${region.width} x ${region.height} pt`);
  return { x: region.x + sides.left, y: region.y + sides.top, width, height };
}

/** Reference point R that the lines and the phase are measured from (CONVENTIONS §3.1). */
function anchorPoint(origin, region) {
  if (origin === 'center') return { x: region.x + region.width / 2, y: region.y + region.height / 2 };
  if (origin === 'topLeft') return { x: region.x, y: region.y };
  if (origin && typeof origin === 'object' && Number.isFinite(origin.x) && Number.isFinite(origin.y)) return { x: origin.x, y: origin.y };
  throw new GeometryError(`wave: unknown origin ${JSON.stringify(origin)}`);
}

/**
 * Normal offsets q of the base lines (pt, measured from R along n).
 * auto: lattice R + k * s * n covering the region (including the amplitude and the second line).
 * explicit N: N lines, symmetric about R when origin is 'center', otherwise starting at R.
 */
function lineOffsets(p, origin, qMin, qMax, s, d) {
  if (p.lines === 'auto') {
    const A = p.amplitude;
    const kMin = Math.ceil((qMin - A - d) / s);
    const kMax = Math.floor((qMax + A) / s);
    const out = [];
    for (let k = kMin; k <= kMax; k++) out.push(k * s);
    return out;
  }
  const N = p.lines;
  const out = [];
  for (let k = 0; k < N; k++) out.push(origin === 'center' ? (k - (N - 1) / 2) * s : k * s);
  return out;
}

/**
 * Points of one curve: P(t) = R + t u + (q + disp(t)) n, sampled from tMin to tMax.
 * disp is the sine or the trapezoid displacement (pt), positive along n.
 */
function curvePoints(g, R, u, n, q, tMin, tMax) {
  const at = (t, off) => [R.x + t * u.x + (q + off) * n.x, R.y + t * u.y + (q + off) * n.y];
  if (g.kind === 'sine') {
    const N = Math.max(2, Math.ceil(((tMax - tMin) / g.lambda) * SINE_SAMPLES_PER_WAVELENGTH));
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = tMin + ((tMax - tMin) * i) / N;
      pts.push(at(t, g.A * Math.sin(2 * Math.PI * (t / g.lambda + g.phase))));
    }
    return pts;
  }
  // Trapezoid: one period in fractional phase tau = t/lambda + phase has breakpoints
  // 0 (+A), f (+A), f + r (-A), 2f + r (-A), and returns to +A at 1, with f = flat/lambda, r = rampDx/lambda.
  const f = g.flat / g.lambda;
  const r = g.rampDx / g.lambda;
  const bps = [[0, g.A], [f, g.A], [f + r, -g.A], [2 * f + r, -g.A]];
  const kMin = Math.floor(tMin / g.lambda + g.phase) - 1;
  const kMax = Math.ceil(tMax / g.lambda + g.phase) + 1;
  const pts = [];
  for (let k = kMin; k <= kMax; k++) {
    for (const [b, off] of bps) {
      const t = (k + b - g.phase) * g.lambda;
      pts.push(at(t, off));
    }
  }
  return pts;
}

/**
 * Warn when two neighbouring curves come closer than the stroke width (they merge visually).
 * For a curve translated by a distance D along n, the smallest perpendicular distance is D / sqrt(1 + S^2),
 * with S = max |slope| of the curve.
 */
function lineSpacingWarning(id, g, s, d, strokeWidth) {
  const shifts = [s];
  if (d > 0) shifts.push(d);
  if (d > 0 && Math.abs(s - d) > EPS) shifts.push(Math.abs(s - d));
  const S = g.maxSlope;
  const dmin = Math.min(...shifts.map((D) => D / Math.sqrt(1 + S * S)));
  if (dmin < strokeWidth) {
    return `layer ${id}: wave lines come within ${dmin.toFixed(3)} pt of each other (stroke width ${strokeWidth.toFixed(3)} pt); they merge visually`;
  }
  return null;
}
