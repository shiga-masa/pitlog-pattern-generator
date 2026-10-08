/**
 * Bulk export (site/app/ui). Contract: site/app/ui/CONTRACT.md §4.5.
 *
 * One button above the catalogue saves every catalogue tile (all of them, not only the tiles the
 * search box currently shows) as one ZIP with the default settings. The ZIP holds the images only:
 *   svg/<code>_<name>.svg      renderSVG(id, {ink, paper})            = preset frame
 *   png/<code>_<name>.png      renderPNG(id, {ink, paper, dpi: 300})  = preset frame at 300 dpi
 * Patterns are drawn one at a time with an await and a yield to the event loop in between, so the
 * page stays responsive; progress (n / total) is shown next to the button and the run can be
 * cancelled. A failure is never skipped silently: the counts (processed / skipped / failed) and
 * every failed id with its reason are shown on the page and written to the console; nothing about
 * them goes into the ZIP.
 *
 * The top level touches no DOM, so the pure helpers can be imported from node.
 */

import { renderSVG, renderPNG } from '../../../src/index.js';
import { codeLabelOf } from './catalog.js';
import { createZipParts } from '../zip.js';

/** Settings of the bulk export: the library defaults for colour, the site default for dpi. */
export const BULK_SETTINGS = Object.freeze({ ink: '#000000', paper: '#ffffff', dpi: 300 });

/** Characters that Windows / macOS / Linux file systems refuse in a file name, plus control characters. */
const UNSAFE_CHARS = /[/\\:*?"<>|\u0000-\u001f\u007f]/g;

/**
 * Make one file-name component safe: unsafe characters become '_', trailing dots and spaces
 * (refused by Windows) are removed, and an empty result becomes '_'.
 * @param {unknown} s
 * @returns {string}
 */
export function safeNamePart(s) {
  const t = String(s ?? '').normalize('NFC').replace(UNSAFE_CHARS, '_').replace(/[. ]+$/u, '');
  return t === '' ? '_' : t;
}

/**
 * File stem of one catalogue row: `<code>_<name>`. The code is codeLabelOf(row) with ':' replaced
 * by '-' ('zc:t3-9:2' -> 't3-9-2'); the name is names.ja (the id when it has none). Both parts go
 * through safeNamePart.
 * @param {{id: string, names?: {ja?: string}}} row
 * @returns {string}
 */
export function fileStemOf(row) {
  const code = safeNamePart(codeLabelOf(row).replace(/:/g, '-'));
  const name = safeNamePart(row?.names?.ja ?? row?.id);
  return `${code}_${name}`;
}

/**
 * Unique file stems for rows, in row order. Names are compared case-insensitively (as on Windows
 * and macOS); a later row whose stem is taken gets `_2`, `_3`, ... and is listed in `renamed`.
 * @param {Array<{id: string, names?: {ja?: string}}>} rows
 * @returns {{stems: Map<string, string>, renamed: Array<{id: string, stem: string, base: string}>}}
 */
export function assignFileStems(rows) {
  const stems = new Map();
  const taken = new Set();
  const renamed = [];
  for (const r of rows) {
    if (stems.has(r.id)) throw new Error(`assignFileStems: duplicate row id ${r.id}`);
    const base = fileStemOf(r);
    let stem = base;
    for (let k = 2; taken.has(stem.toLowerCase()); k++) stem = `${base}_${k}`;
    if (stem !== base) renamed.push({ id: r.id, stem, base });
    taken.add(stem.toLowerCase());
    stems.set(r.id, stem);
  }
  return { stems, renamed };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** ZIP file name: `borehole-patterns_default_YYYYMMDD-HHMM.zip` (local time). */
export function zipFileName(d) {
  return `borehole-patterns_default_${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}.zip`;
}

function errorMessage(err) {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}

const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Draw every row in SVG and PNG, one at a time, and collect ZIP entries. Renderers are injected so
 * that node tests can run it without a canvas.
 * @param {Array<object>} rows catalogue rows
 * @param {{
 *   renderSVG: (id: string, options: object) => Promise<{svg: string}>,
 *   renderPNG: (id: string, options: object) => Promise<Blob|Uint8Array|ArrayBuffer>,
 *   onProgress?: (done: number, total: number, row: object) => void,
 *   signal?: AbortSignal,
 * }} deps
 * @returns {Promise<{cancelled: boolean, counts: {processed: number, skipped: number, failed: number},
 *   failures: Array<{id: string, format: string, message: string}>, renamed: Array<{id: string, stem: string, base: string}>,
 *   entries: Array<{name: string, data: Uint8Array|string}>, svgFiles: number, pngFiles: number}>}
 *   `entries` is the archive content (svg/ entries, then png/ entries, each in row order); it is
 *   empty when the run was cancelled.
 */
export async function collectBulkEntries(rows, deps) {
  const total = rows.length;
  const { stems, renamed } = assignFileStems(rows);
  const svgEntries = [];
  const pngEntries = [];
  const failures = [];
  const counts = { processed: 0, skipped: 0, failed: 0 };
  let done = 0;
  let cancelled = false;

  for (const row of rows) {
    if (deps.signal?.aborted) {
      cancelled = true;
      break;
    }
    const stem = stems.get(row.id);
    let ok = true;
    try {
      const { svg } = await deps.renderSVG(row.id, { ink: BULK_SETTINGS.ink, paper: BULK_SETTINGS.paper });
      if (typeof svg !== 'string' || svg === '') throw new Error('renderSVG returned no SVG text');
      svgEntries.push({ name: `svg/${stem}.svg`, data: svg });
    } catch (err) {
      ok = false;
      failures.push({ id: row.id, format: 'svg', message: errorMessage(err) });
    }
    try {
      const png = await deps.renderPNG(row.id, { ...BULK_SETTINGS });
      const bytes = png instanceof Uint8Array
        ? png
        : new Uint8Array(png instanceof ArrayBuffer ? png : await png.arrayBuffer());
      if (bytes.length === 0) throw new Error('renderPNG returned an empty PNG');
      pngEntries.push({ name: `png/${stem}.png`, data: bytes });
    } catch (err) {
      ok = false;
      failures.push({ id: row.id, format: 'png', message: errorMessage(err) });
    }
    if (ok) counts.processed++;
    else counts.failed++;
    done++;
    deps.onProgress?.(done, total, row);
    await yieldToEventLoop();
  }
  counts.skipped = total - done;

  const result = {
    cancelled, counts, failures, renamed, svgFiles: svgEntries.length, pngFiles: pngEntries.length, entries: [],
  };
  if (!cancelled) result.entries = [...svgEntries, ...pngEntries];
  return result;
}

/* ---------------------------------------------------------------------- DOM */

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
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
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Mount the bulk-export button, progress line and result line.
 * @param {HTMLElement} container
 * @param {{rows: Array<object>}} props every catalogue row (not the filtered list)
 * @returns {{destroy: () => void}}
 */
export function mountBulkExport(container, props) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountBulkExport: container must be an HTMLElement');
  const rows = props?.rows;
  if (!Array.isArray(rows)) throw new TypeError('mountBulkExport: rows must be an array');
  const total = rows.length;

  const root = el('div', 'bulk');
  const buttons = el('div', 'bulk-buttons');
  const start = el('button', 'bulk-start', `全 ${total} 件を ZIP で保存(SVG と PNG、既定設定)`);
  start.type = 'button';
  start.title = `検索の絞り込みに関係なく、カタログの全 ${total} 件を既定色 ${BULK_SETTINGS.ink} / ${BULK_SETTINGS.paper}、プリセット枠、PNG ${BULK_SETTINGS.dpi} dpi で書き出します`;
  const cancel = el('button', 'bulk-cancel', 'キャンセル');
  cancel.type = 'button';
  cancel.hidden = true;
  buttons.append(start, cancel);
  const progress = el('p', 'bulk-progress');
  progress.setAttribute('role', 'status');
  progress.hidden = true;
  const result = el('p', 'bulk-result');
  result.setAttribute('aria-live', 'polite');
  result.hidden = true;
  const failList = el('ul', 'bulk-failures');
  failList.hidden = true;
  root.append(buttons, progress, result, failList);
  container.replaceChildren(root);

  let controller = null;

  function show(node, text) {
    node.textContent = text;
    node.hidden = text === '';
  }

  async function run() {
    if (controller) return;
    controller = new AbortController();
    const date = new Date();
    const t0 = performance.now();
    start.disabled = true;
    cancel.hidden = false;
    cancel.disabled = false;
    show(result, '');
    failList.replaceChildren();
    failList.hidden = true;
    show(progress, `書き出し中 0 / ${total}`);
    try {
      const out = await collectBulkEntries(rows, {
        renderSVG,
        renderPNG,
        signal: controller.signal,
        onProgress: (done, n, row) => show(progress, `書き出し中 ${done} / ${n}(${row.names?.ja ?? row.id})`),
      });
      const c = out.counts;
      const tally = `処理 ${c.processed} 件 / スキップ ${c.skipped} 件 / 失敗 ${c.failed} 件`;
      for (const f of out.failures) console.error(`bulk export: ${f.id} (${f.format}) failed: ${f.message}`);
      if (c.skipped > 0) console.warn(`bulk export: ${c.skipped} pattern(s) skipped (cancelled before drawing)`);
      for (const r of out.renamed) console.warn(`bulk export: ${r.id} renamed ${r.base} -> ${r.stem} (name taken)`);
      const lines = [
        ...out.failures.map((f) => `失敗 ${f.id}(${f.format.toUpperCase()}): ${f.message}`),
        ...out.renamed.map((r) => `名前の重複のため番号を付けました ${r.id}: ${r.base} → ${r.stem}`),
      ];
      failList.replaceChildren(...lines.map((s) => el('li', '', s)));
      failList.hidden = lines.length === 0;
      if (out.cancelled) {
        show(progress, '');
        show(result, `キャンセルしました。ZIP は作っていません。${tally}`);
        return;
      }
      show(progress, `ZIP を作成中(${out.entries.length} ファイル)`);
      const blob = new Blob(createZipParts(out.entries, { date }), { type: 'application/zip' });
      const name = zipFileName(date);
      download(blob, name);
      const sec = ((performance.now() - t0) / 1000).toFixed(1);
      const failNote = c.failed > 0 ? ' 失敗した模様と理由は下の一覧にあります(ZIP には入っていません)。' : '';
      show(progress, '');
      show(result, `保存しました: ${name}(${(blob.size / 1048576).toFixed(1)} MB、${sec} 秒)。${tally}。SVG ${out.svgFiles} / PNG ${out.pngFiles} ファイル。${failNote}`);
    } catch (err) {
      show(progress, '');
      show(result, `ZIP を作れませんでした: ${errorMessage(err)}`);
      console.error('bulk export failed:', err);
    } finally {
      controller = null;
      start.disabled = false;
      cancel.hidden = true;
    }
  }

  start.addEventListener('click', () => { run(); });
  cancel.addEventListener('click', () => {
    if (!controller) return;
    controller.abort();
    cancel.disabled = true;
    show(progress, `${progress.textContent}: キャンセルしています`);
  });

  return {
    destroy() {
      controller?.abort();
      container.replaceChildren();
    },
  };
}
