/**
 * Pattern catalogue (site/app/ui). Contract: site/app/ui/CONTRACT.md §4.1.
 *
 * One flat grid of tiles, one tile per preset that draws something, ordered by the reading
 * (hiragana) of its name from src/presets/yomi.js. No table tabs and no table headings.
 *   - Excluded: presets whose archetypes are all 'empty' (the drawing is blank) and aliases that
 *     point at such a preset. An alias that draws a pattern is shown under its own name.
 *   - A preset without a reading is not dropped: it is warned about on the console and placed
 *     at the end (ordered by id).
 *   - The search box narrows the tiles by name, reading, symbol, code and id; katakana and
 *     hiragana match each other.
 *   - Each tile has a small preview drawn lazily (IntersectionObserver) with the default
 *     ink #000000 / paper #ffffff, and the name.
 * Styles: site/assets/ui/catalog.css. UI colours are the two CSS variables only.
 *
 * The top level touches no DOM, so the pure helpers can be imported from node.
 */

import { listPresets, resolveId, renderSVG } from '../../../src/index.js';
import { YOMI } from '../../../src/presets/yomi.js';

/**
 * Fold text for matching: NFKC, lower case, and katakana folded to hiragana,
 * so that a search in either kana matches.
 * @param {unknown} s
 * @returns {string}
 */
export function foldText(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** True when a row draws nothing (no archetypes, or every archetype is 'empty'). */
export function isBlankRow(row) {
  const a = row?.archetypes;
  return !Array.isArray(a) || a.length === 0 || a.every((t) => t === 'empty');
}

/**
 * Split listPresets() rows into the shown ones and the excluded ones.
 * An alias is excluded when its own row or the row it points at is blank.
 * @param {Array<object>} rows
 * @returns {{shown: object[], excluded: object[]}}
 */
export function partitionRows(rows) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const shown = [];
  const excluded = [];
  for (const r of rows) {
    let blank = isBlankRow(r);
    if (!blank && r.aliasOf) {
      const target = byId.get(r.aliasOf);
      if (target && isBlankRow(target)) blank = true;
    }
    (blank ? excluded : shown).push(r);
  }
  return { shown, excluded };
}

/**
 * Order rows by reading. Readings are compared as hiragana strings (code-point order,
 * katakana folded to hiragana); equal readings fall back to the id. Rows without a reading
 * go to the end, ordered by id, and are returned in `missing`.
 * @param {Array<object>} rows
 * @param {Record<string, string>} yomi presetId -> reading
 * @returns {{sorted: object[], missing: string[]}}
 */
export function sortByYomi(rows, yomi) {
  const key = (r) => {
    const y = Object.prototype.hasOwnProperty.call(yomi, r.id) ? yomi[r.id] : undefined;
    return typeof y === 'string' && y !== '' ? foldText(y) : null;
  };
  const withY = [];
  const without = [];
  for (const r of rows) {
    const k = key(r);
    if (k === null) without.push(r);
    else withY.push({ r, k });
  }
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  withY.sort((a, b) => cmp(a.k, b.k) || cmp(a.r.id, b.r.id));
  without.sort((a, b) => cmp(a.id, b.id));
  return { sorted: [...withY.map((x) => x.r), ...without], missing: without.map((r) => r.id) };
}

/** Text searched for one row: names, reading, symbol, code and id. */
export function searchTextOf(row, yomi = {}) {
  const y = Object.prototype.hasOwnProperty.call(yomi, row.id) ? yomi[row.id] : '';
  return [row.names?.ja, row.names?.en, y, row.symbol, row.code, row.id].filter(Boolean).join(' ');
}

/**
 * Rows matching a query. The query is split on whitespace; every token must occur
 * in the row's search text (AND). An empty query keeps every row. Order is kept.
 * @param {Array<object>} rows
 * @param {string} query
 * @param {Record<string, string>} [yomi]
 * @returns {Array<object>}
 */
export function filterCatalog(rows, query, yomi = {}) {
  const tokens = foldText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return rows.slice();
  return rows.filter((r) => {
    const hay = foldText(searchTextOf(r, yomi));
    return tokens.every((t) => hay.includes(t));
  });
}

/**
 * The full catalogue model: shown rows in reading order, plus counts.
 * @param {Array<object>} rows listPresets()
 * @param {Record<string, string>} yomi
 * @returns {{rows: object[], excluded: number, missingYomi: string[]}}
 */
export function buildCatalog(rows, yomi) {
  const { shown, excluded } = partitionRows(rows);
  const { sorted, missing } = sortByYomi(shown, yomi);
  return { rows: sorted, excluded: excluded.length, missingYomi: missing };
}

/* ---------------------------------------------------------------------- DOM */

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Mount the catalogue. Called once; afterwards call update(state).
 * @param {HTMLElement} container
 * @param {{state?: {presetId: string|null}, onSelect?: (canonicalId: string, rowId: string) => void}} props
 *   onSelect gets the canonical id (resolveId) and the id of the tile that was chosen
 *   (an alias tile gives its own id here, its target as the canonical id).
 * @returns {{update: (state: {presetId: string|null}) => void, destroy: () => void, rowOf: (id: string) => object|undefined}}
 */
export function mountCatalog(container, props = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountCatalog: container must be an HTMLElement');
  const onSelect = typeof props.onSelect === 'function' ? props.onSelect : () => {};

  const all = listPresets();
  const model = buildCatalog(all, YOMI);
  if (model.missingYomi.length > 0) {
    console.warn(`catalog: ${model.missingYomi.length} preset(s) have no reading in src/presets/yomi.js and are placed at the end: ${model.missingYomi.join(', ')}`);
  }
  const rowById = new Map(all.map((r) => [r.id, r]));

  let selectedId = props.state?.presetId ?? null;
  let chosenRowId = null; // tile the user clicked
  let chosenCanonical = null; // resolveId() of that tile
  let query = '';

  const root = el('div', 'cat');
  const searchLabel = el('label', 'cat-label', '検索(名称・読み・記号・コード)');
  const search = el('input', 'cat-search');
  search.type = 'search';
  search.autocomplete = 'off';
  search.setAttribute('aria-label', '模様を検索');
  search.addEventListener('input', () => {
    query = search.value;
    renderGrid();
  });
  searchLabel.append(search);
  const count = el('p', 'cat-count');
  count.setAttribute('role', 'status');
  const grid = el('ul', 'cat-grid');
  const empty = el('p', 'cat-empty', '該当する模様はありません。');
  empty.hidden = true;
  const notice = el('p', 'cat-error');
  notice.hidden = true;
  root.append(searchLabel, count, grid, empty, notice);
  container.replaceChildren(root);

  /* lazy thumbnails */
  const thumbCache = new Map(); // id -> svg text or Error
  const pending = new WeakMap(); // box -> row id
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        drawThumb(e.target, pending.get(e.target));
      }
    }, { rootMargin: '200px 0px' })
    : null;

  async function drawThumb(box, id) {
    if (!id) return;
    let result = thumbCache.get(id);
    if (result === undefined) {
      try {
        result = (await renderSVG(id, {})).svg;
      } catch (err) {
        result = err instanceof Error ? err : new Error(String(err));
        console.error(`catalog: preview of ${id} failed:`, result);
      }
      thumbCache.set(id, result);
    }
    if (result instanceof Error) {
      box.replaceChildren(el('span', 'cat-thumb-error', `描画できません: ${result.message}`));
      return;
    }
    box.innerHTML = result; // generated by the library from numbers and ink/paper only
    const svg = box.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  }

  function highlightedId() {
    if (chosenRowId !== null && chosenCanonical === selectedId) return chosenRowId;
    return selectedId;
  }

  function markSelected() {
    const hid = highlightedId();
    for (const b of grid.querySelectorAll('.cat-tile')) {
      b.setAttribute('aria-pressed', String(b.dataset.id === hid));
    }
  }

  function choose(r) {
    notice.hidden = true;
    let canonical;
    try {
      canonical = resolveId(r.id);
    } catch (e) {
      notice.textContent = `模様を解決できません: ${e.message}`;
      notice.hidden = false;
      return;
    }
    chosenRowId = r.id;
    chosenCanonical = canonical;
    onSelect(canonical, r.id);
  }

  const tiles = new Map(); // id -> li (built once, reused when filtering)
  function tileFor(r) {
    let li = tiles.get(r.id);
    if (li) return li;
    li = el('li', 'cat-cell');
    const b = el('button', 'cat-tile');
    b.type = 'button';
    b.dataset.id = r.id;
    const name = r.names?.ja ?? r.id;
    b.title = [name, r.symbol ? `記号 ${r.symbol}` : '', r.code ? `コード ${r.code}` : ''].filter(Boolean).join(' / ');
    const box = el('span', 'cat-thumb');
    pending.set(box, r.id);
    b.append(box, el('span', 'cat-name', name));
    b.addEventListener('click', () => choose(r));
    li.append(b);
    tiles.set(r.id, li);
    if (io) io.observe(box);
    else drawThumb(box, r.id);
    return li;
  }

  function renderGrid() {
    const hits = filterCatalog(model.rows, query, YOMI);
    count.textContent = `表示 ${hits.length} 件`;
    grid.replaceChildren(...hits.map(tileFor));
    grid.hidden = hits.length === 0;
    empty.hidden = hits.length !== 0;
    markSelected();
  }

  renderGrid();

  return {
    update(state) {
      const next = state?.presetId ?? null;
      if (next === selectedId) return;
      selectedId = next;
      if (chosenRowId !== null && chosenCanonical !== selectedId) chosenRowId = null;
      markSelected();
    },
    destroy() {
      if (io) io.disconnect();
      container.replaceChildren();
    },
    /** listPresets() row for an id (shown or not). */
    rowOf(id) {
      return rowById.get(id);
    },
  };
}
