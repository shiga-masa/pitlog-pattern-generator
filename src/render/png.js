/**
 * PNG export in the browser (design §5.6, §5.7). Owner: render-2 (stage 1).
 * Pixel limits: core/defaults.js LIMITS (8192 px per side, 5e7 px total) -> LimitError with
 * candidate dpi / size values; never shrink silently.
 */

import { NotImplementedError } from '../core/errors.js';

const OWNER = 'render-2';

/**
 * @param {string|object} input preset id/query or full spec
 * @param {object} [options] render options (dpi default 300 in the site UI)
 * @returns {Promise<Blob>}
 */
export async function renderPNG(input, options = {}) {
  throw new NotImplementedError('renderPNG()', OWNER);
}
