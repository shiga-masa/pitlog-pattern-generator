/**
 * Two-colour rule (docs/CONVENTIONS.md §5).
 *
 * A pattern uses at most two colours: `ink` (lines and filled shapes) and
 * `paper` (ground and "white" shapes). Both are '#rrggbb'. No other colour,
 * gradient, opacity or per-shape / per-layer colour is accepted anywhere.
 */

/** Default ink: pure black. (The site's earth colour is UI-only and never a pattern default.) */
export const DEFAULT_INK = '#000000';
/** Default paper: pure white. */
export const DEFAULT_PAPER = '#ffffff';

export const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Paint tokens a primitive / motif may use. These are the only way to name a colour inside a pattern. */
export const PAINT_TOKENS = Object.freeze(['ink', 'paper', 'none']);

/** Keys that would introduce a colour other than ink/paper. Any of them anywhere in a spec is rejected. */
export const FORBIDDEN_COLOR_KEYS = Object.freeze([
  'color', 'colour', 'background', 'opacity', 'fillOpacity', 'strokeOpacity', 'alpha',
  'gradient', 'stopColor', 'tint', 'shade', 'rgba', 'hsl',
]);

/** Value shapes that look like a colour (hex of any length, rgb()/hsl(), url(), named transparency). */
const COLORISH = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|url\(|transparent$|currentcolor$|(linear|radial|conic)-gradient\()/i;

/** @param {unknown} v @returns {boolean} */
export function isColor(v) {
  return typeof v === 'string' && COLOR_PATTERN.test(v);
}

/** Lower-case '#rrggbb'. Throws on anything else. */
export function normalizeColor(v) {
  if (!isColor(v)) throw new TypeError(`colour must be '#rrggbb', got ${JSON.stringify(v)}`);
  return v.toLowerCase();
}

function pointer(path, key) {
  return `${path}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`;
}

/**
 * Check the two-colour rule on a spec or options object.
 * Root keys `ink` / `paper` must be '#rrggbb'. Anywhere else: forbidden colour keys
 * and colour-looking string values are errors (a third colour, gradient or transparency).
 * @param {object} obj spec or options
 * @param {string} [path]
 * @returns {{errors:Array<{path:string,message:string,candidates?:string[]}>, warnings:Array<{path:string,message:string}>}}
 */
export function checkColors(obj, path = '') {
  const errors = [];
  const warnings = [];
  if (obj === null || typeof obj !== 'object') return { errors, warnings };
  for (const k of ['ink', 'paper']) {
    if (k in obj && !isColor(obj[k])) {
      errors.push({ path: pointer(path, k), message: `${k} must be '#rrggbb' (6 hex digits, no alpha), got ${JSON.stringify(obj[k])}` });
    }
  }
  if (isColor(obj.ink) && isColor(obj.paper) && obj.ink.toLowerCase() === obj.paper.toLowerCase()) {
    warnings.push({ path: pointer(path, 'paper'), message: 'ink and paper are the same colour; the pattern will be invisible' });
  }
  const walk = (v, p, isRoot) => {
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, pointer(p, i), false));
      return;
    }
    if (v !== null && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        const kp = pointer(p, k);
        if (isRoot && (k === 'ink' || k === 'paper')) continue;
        if (FORBIDDEN_COLOR_KEYS.includes(k)) {
          errors.push({
            path: kp,
            message: `key "${k}" would add a colour/gradient/transparency; only the two root colours ink and paper are allowed`,
            candidates: ['ink', 'paper'],
          });
          continue;
        }
        walk(x, kp, false);
      }
      return;
    }
    if (typeof v === 'string' && COLORISH.test(v.trim())) {
      errors.push({
        path: p,
        message: `colour value ${JSON.stringify(v)} is not allowed here; patterns use only ink and paper (paint tokens: ${PAINT_TOKENS.join(', ')})`,
        candidates: [...PAINT_TOKENS],
      });
    }
  };
  walk(obj, path, true);
  return { errors, warnings };
}
