/**
 * Preview pane (CONTRACT 4.3, design 6.4): one tile or a repeated tile, boundary toggle,
 * 10 mm scale bar, zoom, and warnings. Owner: app-3.
 * Colours: only --earth and --white in the UI (CONVENTIONS 12); the pattern itself is ink/paper.
 */

import { renderSVG, renderSVGPattern } from '../../../src/index.js';
import { PT_PER_MM } from '../../../src/core/units.js';
import { buildRenderOptions } from '../state.js';

const DEBOUNCE_MS = 100;
const PT_PER_CSS_PX = 0.75; // 96 dpi screen
const ZOOM_STEPS = [0.5, 1, 1.5, 2, 3, 4];
const TILE_COLS = 3;
const TILE_ROWS = 2;
const INITIAL_ZOOM = 3; // detail area shows a large preview; the 10 mm bar follows the zoom

/**
 * @param {HTMLElement} container
 * @param {{ state: object }} props  state is the read-only State copy; only its first update matters for mounting
 * @returns {{ update(state: object): void, destroy(): void }}
 */
export function mountPreview(container, props) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountPreview: container must be an HTMLElement');

  // Display settings of this pane only (not application state).
  const ui = { view: 'single', zoom: INITIAL_ZOOM, boundary: true };

  let latest = props?.state ?? null;
  let lastKey = null;
  let timer = null;
  let token = 0;

  container.textContent = '';
  container.style.cssText = 'display:flex;flex-direction:column;gap:12px;width:100%;max-width:100%;box-sizing:border-box;';

  const toolbar = el('div', 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;');
  const viewBtns = {
    single: button('1 枚'),
    tile: button('タイル繰り返し'),
  };
  const boundaryLabel = el('label', 'display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--earth);min-height:44px;');
  const boundaryBox = document.createElement('input');
  boundaryBox.type = 'checkbox';
  boundaryBox.checked = ui.boundary;
  boundaryBox.style.cssText = 'width:20px;height:20px;margin:0;';
  boundaryLabel.append(boundaryBox, '境界線を表示');
  const zoomOut = button('−');
  const zoomValue = el('span', 'font-size:14px;font-weight:700;color:var(--earth);min-width:4.5em;text-align:center;');
  const zoomIn = button('+');
  toolbar.append(viewBtns.single, viewBtns.tile, boundaryLabel, zoomOut, zoomValue, zoomIn);

  const stage = el('div', 'width:100%;max-width:100%;overflow:auto;border:1px solid var(--earth);background:var(--white);box-sizing:border-box;min-height:44px;');
  const scaleWrap = el('div', 'display:flex;flex-direction:column;gap:4px;align-items:flex-start;');
  const scaleBar = el('div', 'height:0;border-top:2px solid var(--earth);');
  const scaleText = el('span', 'font-size:14px;color:var(--earth);', '10 mm');
  scaleWrap.append(scaleBar, scaleText);
  const status = el('p', 'margin:0;font-size:14px;color:var(--earth);');
  const warningList = el('ul', 'margin:0;padding:0 0 0 1.2em;font-size:14px;color:var(--earth);');
  container.append(toolbar, stage, scaleWrap, status, warningList);

  viewBtns.single.addEventListener('click', () => setView('single'));
  viewBtns.tile.addEventListener('click', () => setView('tile'));
  boundaryBox.addEventListener('change', () => {
    ui.boundary = boundaryBox.checked;
    lastKey = null;
    scheduleDraw(0);
  });
  zoomOut.addEventListener('click', () => setZoom(stepZoom(-1)));
  zoomIn.addEventListener('click', () => setZoom(stepZoom(1)));

  function setView(view) {
    ui.view = view;
    markPressed(viewBtns.single, view === 'single');
    markPressed(viewBtns.tile, view === 'tile');
    lastKey = null;
    scheduleDraw(0);
  }

  function stepZoom(dir) {
    const i = ZOOM_STEPS.indexOf(ui.zoom);
    const idx = i < 0 ? ZOOM_STEPS.indexOf(1) : i;
    return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, idx + dir))];
  }

  function setZoom(zoom) {
    ui.zoom = zoom;
    zoomValue.textContent = `${Math.round(zoom * 100)} %`;
    applyZoom();
  }

  function applyZoom() {
    const svgEl = stage.querySelector('svg');
    if (svgEl) {
      const vb = svgEl.viewBox.baseVal;
      svgEl.setAttribute('width', String(vb.width / PT_PER_CSS_PX * ui.zoom));
      svgEl.setAttribute('height', String(vb.height / PT_PER_CSS_PX * ui.zoom));
    }
    // 10 mm at 100 % is a true 10 mm on a 96 dpi screen
    scaleBar.style.width = `${10 * PT_PER_MM / PT_PER_CSS_PX * ui.zoom}px`;
  }

  function scheduleDraw(delay) {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; draw(); }, delay);
  }

  function keyOf(state) {
    if (!state || state.presetId === null) return 'none';
    return JSON.stringify([state.presetId, ui.view, ui.boundary, buildRenderOptions(state)]);
  }

  async function draw() {
    const myToken = ++token;
    warningList.textContent = '';
    if (!latest || latest.presetId === null) {
      stage.textContent = '';
      status.textContent = 'プリセットを選んでください';
      return;
    }
    status.textContent = '描画中…';
    try {
      const options = buildRenderOptions(latest);
      const built = ui.view === 'tile'
        ? await buildTile(latest.presetId, options)
        : await buildSingle(latest.presetId, options);
      if (myToken !== token) return;
      stage.innerHTML = built.svg; // generated by the library from ink/paper and numbers only
      applyZoom();
      const warnings = built.warnings;
      status.textContent = warnings.length === 0
        ? `描画しました(${built.label})`
        : `描画しました(${built.label})。警告 ${warnings.length} 件`;
      for (const w of warnings) warningList.append(el('li', 'margin:0 0 4px 0;', String(w)));
    } catch (err) {
      if (myToken !== token) return;
      stage.textContent = '';
      status.textContent = `描画できません: ${err.name}: ${err.message}`;
    }
  }

  async function buildSingle(id, options) {
    const { svg, meta } = await renderSVG(id, options);
    const svgText = ui.boundary ? addOutline(svg) : svg;
    return { svg: svgText, warnings: meta.warnings ?? [], label: '1 枚' };
  }

  async function buildTile(id, options) {
    const pat = await renderSVGPattern(id, options);
    const tw = pat.tile.w;
    const th = pat.tile.h;
    const W = tw * TILE_COLS;
    const H = th * TILE_ROWS;
    let rules = '';
    if (ui.boundary) {
      const lines = [];
      for (let c = 1; c < TILE_COLS; c++) lines.push(`<line x1="${c * tw}" y1="0" x2="${c * tw}" y2="${H}"/>`);
      for (let r = 1; r < TILE_ROWS; r++) lines.push(`<line x1="0" y1="${r * th}" x2="${W}" y2="${r * th}"/>`);
      lines.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="none"/>`);
      rules = `<g fill="none" style="stroke:var(--earth)" stroke-width="0.5" stroke-dasharray="3 2">${lines.join('')}</g>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
      + `<defs>${pat.defs}</defs>`
      + `<rect x="0" y="0" width="${W}" height="${H}" fill="${pat.ref}" stroke="none"/>`
      + rules
      + `</svg>`;
    return { svg, warnings: pat.warnings ?? [], label: `タイル ${round(tw)} × ${round(th)} pt` };
  }

  /** Outline the region with --earth (inside the SVG root, so it follows the zoom). */
  function addOutline(svgText) {
    return svgText.replace('<svg ', '<svg style="outline:1px solid var(--earth);outline-offset:-1px;" ');
  }

  function update(state) {
    latest = state;
    const key = keyOf(state);
    if (key === lastKey) return;
    lastKey = key;
    scheduleDraw(DEBOUNCE_MS);
  }

  function destroy() {
    clearTimeout(timer);
    token++;
    container.textContent = '';
  }

  markPressed(viewBtns.single, true);
  markPressed(viewBtns.tile, false);
  setZoom(INITIAL_ZOOM);
  update(latest);

  return { update, destroy };
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function el(tag, style, text) {
  const e = document.createElement(tag);
  if (style) e.style.cssText = style;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(label) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = 'font-size:16px;font-weight:700;color:var(--earth);background:var(--white);border:1px solid var(--earth);border-radius:0;padding:6px 12px;min-height:44px;min-width:44px;width:auto;cursor:pointer;box-shadow:none;';
  return b;
}

function markPressed(b, on) {
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.style.background = on ? 'var(--earth)' : 'var(--white)';
  b.style.color = on ? 'var(--white)' : 'var(--earth)';
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
