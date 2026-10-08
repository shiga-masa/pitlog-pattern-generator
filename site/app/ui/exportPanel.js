/**
 * Export panel (CONTRACT 4.4, design 5.6, 5.7): unit, size, dpi, format; downloads SVG or PNG.
 * Owner: app-3. Colours: only --earth and --white in the UI (CONVENTIONS 12).
 * A PNG request over the pixel limit is refused with the reason and candidate values (CONVENTIONS 9).
 */

import { renderSVG, renderPNG, toSpec } from '../../../src/index.js';
import { toPt, fromPt, ptToPixels } from '../../../src/core/units.js';
import { LIMITS } from '../../../src/core/defaults.js';
import { buildRenderOptions } from '../state.js';

const UNITS = ['mm', 'pt', 'px'];
const FORMATS = ['svg', 'png'];
const UNIT_LABEL = { mm: 'mm', pt: 'pt', px: 'px' };
const FORMAT_LABEL = { svg: 'SVG(ベクタ)', png: 'PNG(ラスタ)' };
const PT_PER_INCH = 72;

/**
 * @param {HTMLElement} container
 * @param {{ state: object, onOutputChange: (patch: object) => void }} props
 * @returns {{ update(state: object): void, destroy(): void }}
 */
export function mountExportPanel(container, props) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountExportPanel: container must be an HTMLElement');
  if (typeof props?.onOutputChange !== 'function') throw new TypeError('mountExportPanel: onOutputChange must be a function');
  const onOutputChange = props.onOutputChange;

  let latest = props.state ?? null;
  let busy = false;

  container.textContent = '';
  container.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;max-width:100%;box-sizing:border-box;';

  const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;');
  const unitField = selectField('単位', UNITS, UNIT_LABEL);
  const widthField = numberField('幅');
  const heightField = numberField('高さ');
  const dpiField = numberField('解像度 (dpi)');
  const formatField = selectField('形式', FORMATS, FORMAT_LABEL);
  grid.append(unitField.wrap, widthField.wrap, heightField.wrap, dpiField.wrap, formatField.wrap);

  const hint = el('p', 'margin:0;font-size:14px;color:var(--earth);');
  const problems = el('ul', 'margin:0;padding:0 0 0 1.2em;font-size:14px;color:var(--earth);');
  const result = el('p', 'margin:0;font-size:14px;font-weight:700;color:var(--earth);');

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.textContent = '書き出す';
  exportBtn.style.cssText = 'font-size:16px;font-weight:700;color:var(--white);background:var(--earth);border:1px solid var(--earth);border-radius:0;padding:10px 16px;min-height:44px;cursor:pointer;box-shadow:none;align-self:flex-start;';

  container.append(grid, hint, problems, exportBtn, result);

  unitField.input.addEventListener('change', () => onUnitChange(unitField.input.value));
  formatField.input.addEventListener('change', () => onOutputChange({ format: formatField.input.value }));
  widthField.input.addEventListener('change', () => onSizeInput('width', widthField));
  heightField.input.addEventListener('change', () => onSizeInput('height', heightField));
  dpiField.input.addEventListener('change', () => {
    const v = parsePositive(dpiField.input.value);
    if (v === null) {
      setProblems(['解像度 (dpi) は 0 より大きい数値で入力してください']);
      return;
    }
    setProblems([]);
    onOutputChange({ dpi: v });
  });
  exportBtn.addEventListener('click', () => { runExport(); });

  /**
   * Frame of the current preset in pt, or null when no preset is selected. The frame is optional in
   * a preset (table defaults fill it), so it is read from the resolved spec (toSpec), not getPreset.
   */
  function presetFramePt(presetId) {
    if (presetId === null || presetId === undefined) return null;
    const spec = toSpec(presetId);
    return { width: spec.frame.width, height: spec.frame.height };
  }

  /** Effective size in pt for the current output (explicit width/height, else preset frame). */
  function effectiveSizePt(s) {
    const out = s.output;
    const frame = presetFramePt(s.presetId);
    const dpi = out.dpi;
    const wpt = out.width !== null ? toPt(out.width, out.unit, dpi) : frame?.width;
    const hpt = out.height !== null ? toPt(out.height, out.unit, dpi) : frame?.height;
    return { wpt, hpt };
  }

  function onUnitChange(next) {
    const s = latest;
    const from = s.output.unit;
    const dpi = s.output.dpi;
    const patch = { unit: next };
    if (s.output.width !== null) patch.width = roundN(fromPt(toPt(s.output.width, from, dpi), next, dpi));
    if (s.output.height !== null) patch.height = roundN(fromPt(toPt(s.output.height, from, dpi), next, dpi));
    setProblems([]);
    onOutputChange(patch);
  }

  function onSizeInput(key, field) {
    const v = parsePositive(field.input.value);
    if (v === null) {
      setProblems([`${key === 'width' ? '幅' : '高さ'}は 0 より大きい数値で入力してください`]);
      return;
    }
    setProblems([]);
    onOutputChange({ [key]: v });
  }

  function setProblems(list) {
    problems.textContent = '';
    for (const p of list) problems.append(el('li', 'margin:0 0 4px 0;', p));
  }

  /** Pixel size and limit check for PNG. Returns {pw, ph, over: string[], maxDpi, maxSize}. */
  function pixelCheck(wpt, hpt, dpi) {
    const pw = ptToPixels(wpt, dpi);
    const ph = ptToPixels(hpt, dpi);
    const over = [];
    if (pw > LIMITS.maxSidePx) over.push(`幅 ${pw} px が 1 辺の上限 ${LIMITS.maxSidePx} px を超えています`);
    if (ph > LIMITS.maxSidePx) over.push(`高さ ${ph} px が 1 辺の上限 ${LIMITS.maxSidePx} px を超えています`);
    if (pw * ph > LIMITS.maxPixels) over.push(`総画素 ${pw * ph} が上限 ${LIMITS.maxPixels} を超えています`);
    const wIn = wpt / PT_PER_INCH;
    const hIn = hpt / PT_PER_INCH;
    const maxDpi = Math.floor(Math.min(
      LIMITS.maxSidePx / wIn,
      LIMITS.maxSidePx / hIn,
      Math.sqrt(LIMITS.maxPixels / (wIn * hIn)),
    ));
    // largest size at the requested dpi, keeping the requested aspect ratio
    const scale = Math.min(
      LIMITS.maxSidePx / (dpi * wIn),
      LIMITS.maxSidePx / (dpi * hIn),
      Math.sqrt(LIMITS.maxPixels / (dpi * dpi * wIn * hIn)),
    );
    return { pw, ph, over, maxDpi, maxWpt: wpt * scale, maxHpt: hpt * scale };
  }

  function refreshView(s) {
    const out = s.output;
    setIfIdle(unitField.input, out.unit);
    setIfIdle(formatField.input, out.format);
    setIfIdle(dpiField.input, String(out.dpi));

    const frame = presetFramePt(s.presetId);
    if (out.width !== null) setIfIdle(widthField.input, String(out.width));
    else if (frame) setIfIdle(widthField.input, String(roundN(fromPt(frame.width, out.unit, out.dpi))));
    else setIfIdle(widthField.input, '');
    if (out.height !== null) setIfIdle(heightField.input, String(out.height));
    else if (frame) setIfIdle(heightField.input, String(roundN(fromPt(frame.height, out.unit, out.dpi))));
    else setIfIdle(heightField.input, '');

    if (s.presetId === null) {
      hint.textContent = 'プリセットを選ぶと書き出せます';
      return;
    }
    if (out.format === 'png') {
      const { wpt, hpt } = effectiveSizePt(s);
      const pc = pixelCheck(wpt, hpt, out.dpi);
      hint.textContent = `画素: ${pc.pw} × ${pc.ph} px(1 辺の上限 ${LIMITS.maxSidePx} px、総画素の上限 ${LIMITS.maxPixels.toExponential(0)})`;
    } else {
      hint.textContent = 'SVG はベクタのため画素の上限はありません。';
    }
  }

  function setIfIdle(input, value) {
    if (document.activeElement === input) return;
    if (input.value !== value) input.value = value;
  }

  async function runExport() {
    if (busy) return;
    result.textContent = '';
    const s = latest;
    if (!s || s.presetId === null) {
      result.textContent = '書き出せません: プリセットを選んでください';
      return;
    }
    const out = s.output;
    const { wpt, hpt } = effectiveSizePt(s);
    if (out.format === 'png') {
      const pc = pixelCheck(wpt, hpt, out.dpi);
      if (pc.over.length > 0) {
        setProblems(pc.over.concat([
          `候補: 解像度 ${pc.maxDpi} dpi 以下、または ${fmtNum(fromPt(pc.maxWpt, out.unit, out.dpi))} × ${fmtNum(fromPt(pc.maxHpt, out.unit, out.dpi))} ${out.unit} 以下(現在の解像度の場合)`,
        ]));
        result.textContent = 'PNG は画素の上限を超えるため書き出しを拒否しました(縮小は行いません)';
        return;
      }
    }
    // Size exactly as shown in the fields: a null side is the preset frame in the current unit.
    // buildRenderOptions omits size unless both sides are set, so size is always given here.
    const sizeW = fromPt(wpt, out.unit, out.dpi);
    const sizeH = fromPt(hpt, out.unit, out.dpi);
    let options;
    try {
      options = {
        ...buildRenderOptions(s, { forExport: true }),
        dpi: out.dpi,
        size: { width: sizeW, height: sizeH, unit: out.unit },
      };
    } catch (err) {
      result.textContent = `書き出せません: ${err.name}: ${err.message}`;
      return;
    }
    busy = true;
    exportBtn.disabled = true;
    result.textContent = '書き出し中…';
    try {
      const name = fileName(s, roundN(sizeW), roundN(sizeH));
      let blob;
      if (out.format === 'svg') {
        const { svg, meta } = await renderSVG(s.presetId, options);
        setProblems((meta.warnings ?? []).map(String));
        blob = new Blob([svg], { type: 'image/svg+xml' });
      } else {
        blob = await renderPNG(s.presetId, options);
      }
      download(blob, name);
      result.textContent = `書き出しました: ${name}`;
    } catch (err) {
      result.textContent = `書き出せません: ${err.name}: ${err.message}`;
    } finally {
      busy = false;
      exportBtn.disabled = false;
    }
  }

  /** `<id>_<density>_<w>x<h><unit>_<dpi>dpi.<ext>`; characters other than [A-Za-z0-9._-] become "_". */
  function fileName(s, w, h) {
    const safe = (v) => String(v).replace(/[^A-Za-z0-9._-]/g, '_');
    const density = s.options.density ?? 1;
    return `${safe(s.presetId)}_${safe(density)}_${safe(fmtNum(w))}x${safe(fmtNum(h))}${s.output.unit}_${safe(s.output.dpi)}dpi.${s.output.format}`;
  }

  function update(state) {
    latest = state;
    refreshView(state);
  }

  function destroy() {
    container.textContent = '';
    latest = null;
  }

  update(latest);

  return { update, destroy };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** A positive finite number, or null. Empty and non-numeric input are rejected, not defaulted. */
function parsePositive(text) {
  const t = String(text).trim();
  if (t === '') return null;
  const v = Number(t);
  return Number.isFinite(v) && v > 0 ? v : null;
}

function roundN(n) {
  return Math.round(n * 1000) / 1000;
}

function fmtNum(n) {
  return String(roundN(n));
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function el(tag, style, text) {
  const e = document.createElement(tag);
  if (style) e.style.cssText = style;
  if (text !== undefined) e.textContent = text;
  return e;
}

function labelWrap(text) {
  const wrap = el('label', 'display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:700;color:var(--earth);');
  wrap.append(text);
  return wrap;
}

const CONTROL_STYLE = 'font-size:16px;font-weight:400;color:var(--earth);background:var(--white);border:1px solid var(--earth);border-radius:0;padding:8px;min-height:44px;box-sizing:border-box;width:100%;';

function numberField(text) {
  const wrap = labelWrap(text);
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = 'any';
  input.inputMode = 'decimal';
  input.style.cssText = CONTROL_STYLE;
  wrap.append(input);
  return { wrap, input };
}

function selectField(text, values, labels) {
  const wrap = labelWrap(text);
  const input = document.createElement('select');
  input.style.cssText = CONTROL_STYLE;
  for (const v of values) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = labels[v];
    input.append(o);
  }
  wrap.append(input);
  return { wrap, input };
}
