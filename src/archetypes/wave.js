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
 * phaseStep (stage 3) adds k * phaseStep to the phase of line k, so line k+1 is line k translated by
 * lineSpacing * n - phaseStep * wavelength * u (the lines of R2 §33-§39 are copies shifted horizontally).
 * ends 'halfWave' (stage 3) keeps only whole half waves (zero crossing to zero crossing) inside the inset region
 * (R2 §33/§39: the original lines stop at the last whole arc rather than at the frame edge).
 * chords (stage 3) draws the sine as straight chords between samples at fixed phases (R3 4-1 V: 5 per half wave).
 * Stage 2: layer.offset shifts the reference point R; ctx.fit is honoured by drawing unfitted and
 * stretching (core/fit.js drawStretched); period() is scaled by the fit and is null when the lines do
 * not repeat (a margin, or a finite `lines` count), as for hatch.
 */

import { GeometryError } from '../core/errors.js';
import { EPS } from '../core/defaults.js';
import { dir } from '../core/geom.js';
import { polyline } from '../core/primitives.js';
import { clipPolyline } from '../core/clip.js';
import { angle, autoCount, count, enumOf, fixed, len, margin, obj, ratio, size } from '../core/schema.js';
import { drawStretched, fitPeriod, offsetOf } from '../core/fit.js';

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
  phaseStep: ratio('phase added per line: line k (k = normal offset from R / lineSpacing) is drawn with phase + k * phaseStep; 0 = all lines in phase', { min: 0, max: 1, default: 0 }),
  chords: count('sine only: straight chords per half wavelength between samples at phase multiples of 1/(2 chords), anchored at the zero crossings; 0 = smooth curve', { default: 0 }),
  margin: margin('distance kept from the region edges (pt)', { default: 0 }),
  ends: enumOf(['clip', 'halfWave'], "line ends: 'clip' cuts the curve at the inset edge; 'halfWave' keeps only whole half waves (zero crossing to zero crossing) that lie inside the inset", { default: 'clip' }),
  endSlack: fixed("ends 'halfWave': a half wave may overrun the inset by this much and is then clipped (pt)", { min: 0, default: 0 }),
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
  return drawStretched(ctx, (c) => renderUnfitted(layer, c));
}

function renderUnfitted(layer, ctx) {
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

  const R0 = anchorPoint(ctx.origin, region);
  const off = offsetOf(layer);
  const R = { x: R0.x + off.x, y: R0.y + off.y };
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
  for (const { q, k } of offsets) {
    const curves = d > 0 ? [q, q + d] : [q];
    const lineGeom = p.phaseStep === 0 ? g : { ...g, phase: g.phase + k * p.phaseStep };
    let pieces = 0;
    for (const qc of curves) {
      const runs = p.ends === 'halfWave'
        ? wholeHalfWaveRuns(lineGeom, R, u, n, qc, tMin, tMax, inset, p.endSlack)
        : [curvePoints(lineGeom, R, u, n, qc, tMin, tMax)];
      for (const piece of runs.flatMap((pts) => clipPolyline(pts, inset))) {
        if (piece.length < 2) continue;
        primitives.push(polyline(piece, STYLE));
        pieces++;
      }
    }
    if (pieces > 0) placed++;
    else skipped++;
  }

  const warn = lineSpacingWarning(layer.id, g, s, d, ctx.strokeWidth, p.phaseStep);
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
  return fitPeriod(unfittedPeriod(layer), ctx);
}

function unfittedPeriod(layer) {
  const p = layer.params;
  const m = p.margin;
  const hasMargin = typeof m === 'number' ? m !== 0 : Boolean(m && (m.left || m.right || m.top || m.bottom));
  if (hasMargin || p.lines !== 'auto') return null; // a margin or a finite line count does not repeat
  const u = dir(p.angle);
  const n = dir(p.angle - 90);
  const L = p.wavelength;
  const s = p.lineSpacing;
  const tol = 1e-9 * Math.max(L, s);
  // Lattice of the picture: a * (L u) + b * (s n - phaseStep L u) (line k+1 = line k moved by the second vector).
  const sh = -p.phaseStep * L;
  let w = null;
  let h = null;
  for (let a = -PERIOD_SEARCH_LIMIT; a <= PERIOD_SEARCH_LIMIT; a++) {
    for (let b = -PERIOD_SEARCH_LIMIT; b <= PERIOD_SEARCH_LIMIT; b++) {
      if (a === 0 && b === 0) continue;
      const vx = (a * L + b * sh) * u.x + b * s * n.x;
      const vy = (a * L + b * sh) * u.y + b * s * n.y;
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
    const c = p.chords;
    // A chord between samples 1/(2c) of the wavelength apart is steepest across a zero crossing.
    const maxSlope = c > 0 ? (A * Math.sin(Math.PI / (2 * c))) / (lambda / (2 * c)) : (2 * Math.PI * A) / lambda;
    return { kind: 'sine', lambda, A, phase: p.phase, chords: c, maxSlope };
  }
  if (p.chords > 0) throw new GeometryError(`wave ${id}: chords ${p.chords} applies to waveform 'sine' only (got '${p.waveform}'); use 0 for the trapezoid`);
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
 * Base lines: normal offset q (pt, measured from R along n) and line index k = q / s (phaseStep multiplier).
 * auto: lattice R + k * s * n covering the region (including the amplitude and the second line).
 * explicit N: N lines, symmetric about R when origin is 'center' (half-integer k for even N), otherwise starting at R.
 */
function lineOffsets(p, origin, qMin, qMax, s, d) {
  if (p.lines === 'auto') {
    const A = p.amplitude;
    const kMin = Math.ceil((qMin - A - d) / s);
    const kMax = Math.floor((qMax + A) / s);
    const out = [];
    for (let k = kMin; k <= kMax; k++) out.push({ q: k * s, k });
    return out;
  }
  const N = p.lines;
  const out = [];
  for (let i = 0; i < N; i++) {
    const k = origin === 'center' ? i - (N - 1) / 2 : i;
    out.push({ q: k * s, k });
  }
  return out;
}

/**
 * Points of one curve: P(t) = R + t u + (q + disp(t)) n, sampled from tMin to tMax.
 * disp is the sine or the trapezoid displacement (pt), positive along n.
 */
function curvePoints(g, R, u, n, q, tMin, tMax) {
  const at = (t, off) => [R.x + t * u.x + (q + off) * n.x, R.y + t * u.y + (q + off) * n.y];
  if (g.kind === 'sine' && g.chords > 0) {
    // Vertices at the phases j / (2 chords): t = (j / (2 chords) - phase) * lambda.
    const m = 2 * g.chords;
    const jMin = Math.floor((tMin / g.lambda + g.phase) * m) - 1;
    const jMax = Math.ceil((tMax / g.lambda + g.phase) * m) + 1;
    const pts = [];
    for (let j = jMin; j <= jMax; j++) {
      const tau = j / m;
      pts.push(at((tau - g.phase) * g.lambda, g.A * Math.sin(2 * Math.PI * tau)));
    }
    return pts;
  }
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

/** Phase (fraction of the wavelength) of the first zero crossing: sine 0; trapezoid mid-ramp f + r/2 (mod 1/2). */
function zeroCrossingPhase(g) {
  if (g.kind === 'sine') return 0;
  const half = (g.flat + g.rampDx / 2) / g.lambda;
  return half - Math.floor(half * 2) / 2;
}

/** Part of a polyline (a graph over t) with t in [ta, tb]; boundary points interpolated. */
function trimToT(pts, R, u, ta, tb) {
  const tOf = ([x, y]) => (x - R.x) * u.x + (y - R.y) * u.y;
  const lerp = (a, b, w) => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const t = tOf(pts[i]);
    if (i > 0) {
      const t0 = tOf(pts[i - 1]);
      for (const tc of [ta, tb]) {
        if ((t0 < tc && t > tc) || (t0 > tc && t < tc)) out.push(lerp(pts[i - 1], pts[i], (tc - t0) / (t - t0)));
      }
    }
    if (t >= ta - EPS && t <= tb + EPS) out.push(pts[i]);
  }
  return out;
}

/**
 * ends 'halfWave': the curve cut into half waves at its zero crossings; a half wave is kept when all of its
 * vertices lie inside the inset grown by `slack`. Consecutive kept half waves are joined into one run.
 */
function wholeHalfWaveRuns(g, R, u, n, q, tMin, tMax, inset, slack) {
  const lam = g.lambda;
  const z0 = zeroCrossingPhase(g);
  const jMin = Math.floor(((tMin / lam + g.phase) - z0) * 2) - 1;
  const jMax = Math.ceil(((tMax / lam + g.phase) - z0) * 2) + 1;
  const x0 = inset.x - slack - EPS;
  const x1 = inset.x + inset.width + slack + EPS;
  const y0 = inset.y - slack - EPS;
  const y1 = inset.y + inset.height + slack + EPS;
  const runs = [];
  let cur = null;
  for (let j = jMin; j <= jMax; j++) {
    const ta = (z0 + j / 2 - g.phase) * lam;
    const tb = ta + lam / 2;
    const piece = trimToT(curvePoints(g, R, u, n, q, ta, tb), R, u, ta, tb);
    const inside = piece.length >= 2 && piece.every(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
    if (!inside) { cur = null; continue; }
    if (cur) cur.push(...piece.slice(1));
    else { cur = [...piece]; runs.push(cur); }
  }
  return runs;
}

/**
 * Warn when two neighbouring curves come closer than the stroke width (they merge visually).
 * For a curve translated by a distance D along n, the smallest perpendicular distance is D / sqrt(1 + S^2),
 * with S = max |slope| of the curve. With a phase step, neighbouring base lines differ in displacement by up to
 * 2A sin(pi phaseStep) (sine) or min(2A, S * along-line shift) (trapezoid, chords), which is taken off D.
 */
function lineSpacingWarning(id, g, s, d, strokeWidth, phaseStep = 0) {
  const ps = Math.min(phaseStep, 1 - phaseStep);
  const drift = ps === 0 ? 0 : g.kind === 'sine' && !g.chords
    ? 2 * g.A * Math.sin(Math.PI * ps)
    : Math.min(2 * g.A, g.maxSlope * ps * g.lambda);
  const shifts = [s - drift];
  if (d > 0) shifts.push(d);
  if (d > 0 && Math.abs(s - d) > EPS) shifts.push(Math.abs(s - d) - drift);
  const S = g.maxSlope;
  const dmin = Math.min(...shifts.map((D) => D / Math.sqrt(1 + S * S)));
  if (dmin < strokeWidth) {
    return `layer ${id}: wave lines come within ${dmin.toFixed(3)} pt of each other (stroke width ${strokeWidth.toFixed(3)} pt); they merge visually`;
  }
  return null;
}
