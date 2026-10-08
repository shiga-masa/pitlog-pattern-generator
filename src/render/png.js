/**
 * PNG export in the browser (design §5.6, §5.7). Owner: render-2 (stage 1).
 * Pixel limits: core/defaults.js LIMITS (8192 px per side, 5e7 px total) -> LimitError with
 * candidate dpi / size values; never shrink silently.
 *
 * Pixel size = region (pt) * dpi / 72, rounded up. Limits are checked before any drawing, so an
 * oversized request fails in Node too. The bitmap itself needs OffscreenCanvas or a DOM canvas.
 */

import { LIMITS } from '../core/defaults.js';
import { LimitError, ZcError } from '../core/errors.js';
import { PT_PER_INCH, MM_PER_INCH, ptToPixels } from '../core/units.js';
import { planSpec, resolveInput, buildInstructions, drawInstructions } from './canvas.js';

/** Pixel size of a region (pt) at dpi. */
export function pixelSize(regionPt, dpi) {
  return {
    width: ptToPixels(regionPt.width, dpi),
    height: ptToPixels(regionPt.height, dpi),
  };
}

/** True when a pixel size is inside LIMITS (per side and in total). */
export function withinPixelLimits(px) {
  return px.width <= LIMITS.maxSidePx && px.height <= LIMITS.maxSidePx && px.width * px.height <= LIMITS.maxPixels;
}

/**
 * Largest integer dpi whose pixel size stays inside LIMITS for this region, or null when even
 * 1 dpi does not fit. Used to build the candidate list in LimitError messages.
 * @param {{width:number, height:number}} regionPt
 * @returns {number|null}
 */
export function maxDpiFor(regionPt) {
  const bySide = Math.min(
    (LIMITS.maxSidePx * PT_PER_INCH) / regionPt.width,
    (LIMITS.maxSidePx * PT_PER_INCH) / regionPt.height,
  );
  const byTotal = PT_PER_INCH * Math.sqrt(LIMITS.maxPixels / (regionPt.width * regionPt.height));
  let dpi = Math.floor(Math.min(bySide, byTotal));
  // ceil() in pixelSize can add one pixel; step down until the candidate really fits
  while (dpi >= 1 && !withinPixelLimits(pixelSize(regionPt, dpi))) dpi--;
  return dpi >= 1 ? dpi : null;
}

function limitMessage(regionPt, dpi, px) {
  const mm = { width: (regionPt.width * MM_PER_INCH) / PT_PER_INCH, height: (regionPt.height * MM_PER_INCH) / PT_PER_INCH };
  const maxDpi = maxDpiFor(regionPt);
  const maxSideMm = (LIMITS.maxSidePx * MM_PER_INCH) / dpi;
  const lines = [
    `PNG at ${dpi} dpi would be ${px.width} x ${px.height} px (${px.width * px.height} px in total).`,
    `Limits: ${LIMITS.maxSidePx} px per side, ${LIMITS.maxPixels} px in total.`,
    `Requested size: ${mm.width.toFixed(2)} x ${mm.height.toFixed(2)} mm.`,
    maxDpi !== null
      ? `candidate: dpi <= ${maxDpi} at this size (${maxDpi} is the largest integer dpi that fits).`
      : 'candidate: no integer dpi fits at this size; reduce the size.',
    `candidate: at ${dpi} dpi each side must be <= ${maxSideMm.toFixed(2)} mm.`,
    'Nothing was shrunk. Choose a smaller size or a lower dpi.',
  ];
  return lines.join('\n  ');
}

async function canvasToPngBlob(canvas) {
  if (typeof canvas.convertToBlob === 'function') return canvas.convertToBlob({ type: 'image/png' });
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ZcError('renderPNG: canvas.toBlob returned null'))), 'image/png');
  });
}

function makeBitmapCanvas(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }
  throw new ZcError('renderPNG needs a browser canvas (OffscreenCanvas or document.createElement("canvas")); neither exists in this environment.');
}

/**
 * @param {string|object} input preset id/query or full spec
 * @param {object} [options] render options (dpi defaults to RENDER_DEFAULTS.dpi = 96, the site UI passes 300)
 * @param {{env?:object, registry?:object}} [deps]
 * @returns {Promise<Blob>}
 */
export async function renderPNG(input, options = {}, deps = {}) {
  const spec = await resolveInput(input, deps);
  const plan = planSpec(spec, options, deps);
  for (const w of plan.meta.warnings) console.warn(`renderPNG: ${w}`);
  const dpi = plan.dpi;
  const px = pixelSize(plan.region, dpi);
  if (!withinPixelLimits(px)) throw new LimitError(limitMessage(plan.region, dpi, px));
  const canvas = makeBitmapCanvas(px.width, px.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ZcError('renderPNG: canvas.getContext("2d") returned null');
  drawInstructions(ctx, buildInstructions(plan, { x: 0, y: 0, scale: dpi / PT_PER_INCH }));
  return canvasToPngBlob(canvas);
}
