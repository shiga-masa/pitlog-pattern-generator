/**
 * Preset picker (site/app/ui). Owner: app-2. Contract: site/app/ui/CONTRACT.md §4.1.
 *
 * Lists the rows of listPresets(), narrows them by table tab and free text (Japanese name,
 * English name, letter symbol, code, id), and reports the chosen preset through onSelect
 * as its canonical id (resolveId). Alias rows show "= <reference name>".
 * Styles: site/assets/ui/presetPicker.css. Colours are the two CSS variables only.
 *
 * The top level touches no DOM, so the pure helpers can be imported from node.
 */

import { listPresets, resolveId } from '../../../src/index.js';

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

/** Text searched for one row: Japanese and English names, symbol, code and id. */
export function searchTextOf(row) {
  return [row.names?.ja, row.names?.en, row.symbol, row.code, row.id].filter(Boolean).join(' ');
}

/**
 * Table ids in reading order: "3-1" < "3-9" < "4-1" < "5-2".
 * @param {Array<{table: string}>} rows
 * @returns {string[]}
 */
export function tablesOf(rows) {
  const set = new Set(rows.map((r) => r.table));
  return [...set].sort((a, b) => {
    const pa = String(a).split('-').map(Number);
    const pb = String(b).split('-').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      const d = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (d !== 0) return d;
    }
    return 0;
  });
}

/**
 * Rows matching a table (null = all tables) and a query. The query is split on whitespace;
 * every token must occur in the row's search text (AND).
 * @param {Array<object>} rows
 * @param {{table?: string|null, query?: string}} [filter]
 * @returns {Array<object>}
 */
export function filterPresetRows(rows, { table = null, query = '' } = {}) {
  const tokens = String(query).normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean).map(foldText);
  return rows.filter((r) => {
    if (table !== null && table !== undefined && r.table !== table) return false;
    if (tokens.length === 0) return true;
    const hay = foldText(searchTextOf(r));
    return tokens.every((t) => hay.includes(t));
  });
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Mount the preset picker. Called once; afterwards call update(state).
 * @param {HTMLElement} container
 * @param {{state?: {presetId: string|null}, onSelect?: (canonicalId: string) => void}} props
 * @returns {{update: (state: {presetId: string|null}) => void, destroy: () => void}}
 */
export function mountPresetPicker(container, props = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountPresetPicker: container must be an HTMLElement');
  const onSelect = typeof props.onSelect === 'function' ? props.onSelect : () => {};

  const rows = listPresets();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const tables = tablesOf(rows);
  let table = null;
  let query = '';
  let selectedId = props.state?.presetId ?? null;

  const root = el('div', 'pk');

  const tabLabel = el('p', 'pk-label', '表');
  const tabs = el('div', 'pk-tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '表で絞り込む');
  const tabButtons = new Map();
  const addTab = (value, text) => {
    const b = el('button', 'pk-tab', text);
    b.type = 'button';
    b.addEventListener('click', () => {
      table = value;
      markTabs();
      renderList();
    });
    tabButtons.set(value, b);
    tabs.append(b);
  };
  addTab(null, '全て');
  for (const t of tables) addTab(t, `表 ${t}`);
  const markTabs = () => {
    for (const [value, b] of tabButtons) b.setAttribute('aria-pressed', String(value === table));
  };
  markTabs();

  const searchLabel = el('label', 'pk-label', '検索');
  const search = el('input', 'pk-search');
  search.type = 'search';
  search.setAttribute('aria-label', 'プリセットを検索');
  search.autocomplete = 'off';
  search.addEventListener('input', () => {
    query = search.value;
    renderList();
  });
  searchLabel.append(search);

  const hint = el('p', 'hint', '日本語名・英字の記号・コード(9 桁)・ID で検索します。空白で区切ると、すべての語を含む行に絞ります。');
  const count = el('p', 'pk-count');
  count.setAttribute('role', 'status');
  const list = el('ul', 'pk-list');
  const empty = el('p', 'pk-empty', '該当するプリセットはありません。');
  empty.hidden = true;
  const notice = el('p', 'pk-error');
  notice.hidden = true;

  root.append(tabLabel, tabs, searchLabel, hint, count, list, empty, notice);
  container.replaceChildren(root);

  function targetName(id) {
    const r = byId.get(id);
    return r ? (r.names?.ja ?? r.id) : id;
  }

  function metaText(r) {
    const parts = [`表 ${r.table}`];
    if (r.code) parts.push(`コード ${r.code}`);
    if (r.symbol) parts.push(`記号 ${r.symbol}`);
    if (r.aliasOf) parts.push(`= ${targetName(r.aliasOf)}`);
    return parts.join(' · ');
  }

  function markSelected() {
    for (const b of list.querySelectorAll('.pk-item')) {
      b.setAttribute('aria-pressed', String(b.dataset.id === selectedId));
    }
    if (selectedId !== null && !byId.has(selectedId)) {
      notice.textContent = `選択中の ID が一覧にありません: ${selectedId}`;
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }
  }

  function choose(r) {
    notice.hidden = true;
    let canonical;
    try {
      canonical = resolveId(r.id);
    } catch (e) {
      notice.textContent = `プリセットを解決できません: ${e.message}`;
      notice.hidden = false;
      return;
    }
    onSelect(canonical);
  }

  function itemFor(r) {
    const li = el('li');
    const b = el('button', 'pk-item');
    b.type = 'button';
    b.dataset.id = r.id;
    b.setAttribute('aria-pressed', String(r.id === selectedId));
    b.append(el('span', 'pk-name', r.names?.ja ?? r.id), el('span', 'pk-meta', metaText(r)));
    b.addEventListener('click', () => {
      choose(r);
    });
    li.append(b);
    return li;
  }

  function renderList() {
    const hits = filterPresetRows(rows, { table, query });
    count.textContent = `該当 ${hits.length} 件 / 全 ${rows.length} 件`;
    list.replaceChildren(...hits.map(itemFor));
    list.hidden = hits.length === 0;
    empty.hidden = hits.length !== 0;
    markSelected();
  }

  renderList();

  return {
    update(state) {
      const next = state?.presetId ?? null;
      if (next === selectedId) return;
      selectedId = next;
      markSelected();
    },
    destroy() {
      container.replaceChildren();
    },
  };
}
