/**
 * Unit conversion (design §5.6). Internal unit is pt (1/72 inch).
 */

export const PT_PER_INCH = 72;
export const MM_PER_INCH = 25.4;
export const PT_PER_MM = PT_PER_INCH / MM_PER_INCH; // 2.834645669...

const UNITS = ['pt', 'mm', 'px'];

function assertUnit(unit) {
  if (!UNITS.includes(unit)) throw new RangeError(`unknown unit ${JSON.stringify(unit)}; known: ${UNITS.join(', ')}`);
}
function assertDpi(unit, dpi) {
  if (unit === 'px' && !(Number.isFinite(dpi) && dpi > 0)) throw new RangeError(`unit px needs dpi > 0, got ${dpi}`);
}

/** @param {number} value @param {'pt'|'mm'|'px'} unit @param {number} [dpi] @returns {number} pt */
export function toPt(value, unit, dpi) {
  assertUnit(unit);
  assertDpi(unit, dpi);
  if (unit === 'pt') return value;
  if (unit === 'mm') return value * PT_PER_MM;
  return (value * PT_PER_INCH) / dpi;
}

/** @param {number} pt @param {'pt'|'mm'|'px'} unit @param {number} [dpi] */
export function fromPt(pt, unit, dpi) {
  assertUnit(unit);
  assertDpi(unit, dpi);
  if (unit === 'pt') return pt;
  if (unit === 'mm') return pt / PT_PER_MM;
  return (pt * dpi) / PT_PER_INCH;
}

/** Pixel count for a length in pt at `dpi` (rounded up, at least 1). */
export function ptToPixels(pt, dpi) {
  if (!(Number.isFinite(dpi) && dpi > 0)) throw new RangeError(`dpi must be > 0, got ${dpi}`);
  return Math.max(1, Math.ceil((pt * dpi) / PT_PER_INCH - 1e-9));
}
