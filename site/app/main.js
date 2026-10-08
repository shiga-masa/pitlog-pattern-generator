/**
 * Site entry point (CONTRACT.md §2). Builds the layout, restores the state
 * from the URL, wires the UI modules to the state, and writes the state back
 * to the URL and to the share link.
 *
 * Layout, top to bottom: warnings, the pattern catalogue, and (once a pattern is
 * selected) the detail area: name + preview, the folded "詳細設定" panel, the SVG/PNG
 * download buttons, and the share link.
 */

import {
  getState,
  subscribe,
  selectPreset,
  setOption,
  setOverride,
  setOutput,
  decodeShareQuery,
  encodeShareQuery,
} from './state.js';
import { resolveId } from '../../src/index.js';
import { mountCatalog } from './ui/catalog.js';
import { mountParamPanel } from './ui/paramPanel.js';
import { mountPreview } from './ui/preview.js';
import { mountExportPanel } from './ui/exportPanel.js';

const app = document.getElementById('app');

/* ---------- layout ---------- */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

const warningBox = el('section', { id: 'warnings', class: 'notice', 'aria-live': 'polite', hidden: '' });
const linkField = el('input', { id: 'share-link', type: 'text', readonly: '', 'aria-label': '共有リンク' });
const copyButton = el('button', { id: 'copy-link', type: 'button', text: 'リンクをコピー' });
const shareBar = el('div', { class: 'share' }, [
  el('p', { class: 'share-label', text: '共有リンク(設定を含む)' }),
  el('div', { class: 'share-row' }, [linkField, copyButton]),
]);
const overridesBox = el('section', { id: 'overrides-json', class: 'block' }, [
  el('h3', { text: '設定 JSON' }),
  el('p', {
    class: 'hint',
    text: '層の変更が多く共有リンクに載せきれないときは、下の欄の JSON をコピーして保存してください。保存した JSON は下の入力欄に貼って「読み込む」で復元できます。',
  }),
  el('textarea', { id: 'overrides-export', rows: '6', readonly: '', 'aria-label': '設定 JSON(出力)', hidden: '' }),
  el('textarea', { id: 'overrides-input', rows: '4', 'aria-label': '設定 JSON(読み込み)' }),
  el('div', { class: 'share-row' }, [
    el('button', { id: 'overrides-load', type: 'button', text: '読み込む' }),
  ]),
  el('p', { id: 'overrides-status', class: 'hint' }),
]);

const catalogBox = el('section', { id: 'catalog', class: 'catalog-block', 'aria-label': '模様の一覧' });
const selectHint = el('p', { class: 'hint', text: '模様を選ぶと、下に詳細設定とダウンロードが出ます。' });

const detailName = el('h2', { id: 'detail-name' });
const detailMeta = el('p', { class: 'detail-meta' });
const backButton = el('button', { type: 'button', class: 'detail-back', text: '一覧へ戻る' });
const previewBox = el('div', { id: 'preview' });
const paramBox = el('div', { id: 'param-panel' });
const exportBox = el('div', { id: 'export-panel' });
const settings = el('details', { class: 'settings' }, [
  el('summary', { text: '詳細設定' }),
  el('div', { class: 'settings-body' }, [paramBox, overridesBox]),
]);
const detail = el('section', { id: 'detail', class: 'detail block', 'aria-labelledby': 'detail-name', hidden: '' }, [
  el('div', { class: 'detail-head' }, [
    el('div', { class: 'detail-title' }, [detailName, detailMeta]),
    backButton,
  ]),
  el('div', { class: 'detail-body' }, [previewBox, settings, exportBox, shareBar]),
]);

app.append(warningBox, catalogBox, selectHint, detail);

backButton.addEventListener('click', () => {
  catalogBox.scrollIntoView({ block: 'start' });
});

/* ---------- warnings ---------- */

const warnings = new Map(); // source -> message

function setWarning(source, message) {
  warnings.set(source, message);
  renderWarnings();
}

function clearWarning(source) {
  if (warnings.delete(source)) renderWarnings();
}

function renderWarnings() {
  warningBox.replaceChildren(...[...warnings.values()].map((m) => el('p', { text: m })));
  warningBox.hidden = warnings.size === 0;
}

/** Runs a state change; a failure is shown as a warning, never swallowed. */
function guard(source, fn) {
  try {
    fn();
    clearWarning(source);
  } catch (e) {
    setWarning(source, `${e.message}`);
  }
}

/* ---------- restore from the URL (CONTRACT.md §1.2) ---------- */

const decoded = decodeShareQuery(location.search);
decoded.warnings.forEach((w, i) => setWarning(`url:${i}`, w));

const initial = decoded.state;
if (initial.presetId !== null) {
  try {
    initial.presetId = resolveId(initial.presetId);
  } catch (e) {
    setWarning('url:preset', `プリセットを解決できません: ${e.message}`);
    initial.presetId = null;
  }
}
// Order matters: selectPreset clears overrides, so it goes first.
selectPreset(initial.presetId);
for (const [pointer, value] of Object.entries(initial.overrides)) setOverride(pointer, value);
for (const [key, value] of Object.entries(initial.options)) setOption(key, value);
setOutput(initial.output);

/* ---------- mount the UI modules ---------- */

let chosenRowId = null; // tile id the user clicked
let chosenCanonical = null; // resolveId() of that tile

const catalog = mountCatalog(catalogBox, {
  state: getState(),
  onSelect: (canonicalId, rowId) => {
    chosenRowId = rowId;
    chosenCanonical = canonicalId;
    if (canonicalId === getState().presetId) render(getState());
    else guard('input', () => selectPreset(canonicalId));
  },
});

const mounts = [
  catalog,
  mountParamPanel(paramBox, {
    state: getState(),
    onOptionChange: (key, value) => guard('input', () => setOption(key, value)),
    onOverrideChange: (pointer, value) => guard('input', () => setOverride(pointer, value)),
  }),
  mountPreview(previewBox, { state: getState() }),
  mountExportPanel(exportBox, {
    state: getState(),
    onOutputChange: (patch) => guard('input', () => setOutput(patch)),
  }),
];

/* ---------- share link, URL write-back, overrides JSON ---------- */

const overridesExport = overridesBox.querySelector('#overrides-export');
const overridesInput = overridesBox.querySelector('#overrides-input');
const overridesStatus = overridesBox.querySelector('#overrides-status');
const base = location.href.split(/[?#]/)[0];

/** Replaces all overrides with the JSON object in `text`. Throws on bad input. */
function importOverrides(text) {
  const parsed = JSON.parse(text);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('設定 JSON はオブジェクトである必要があります');
  }
  const bad = Object.keys(parsed).filter((k) => !/^\/./.test(k));
  if (bad.length > 0) throw new Error(`設定 JSON のキーは "/" で始まる JSON Pointer にしてください: ${bad.join(', ')}`);
  for (const k of Object.keys(getState().overrides)) setOverride(k, undefined);
  for (const [k, v] of Object.entries(parsed)) setOverride(k, v);
}

overridesBox.querySelector('#overrides-load').addEventListener('click', () => {
  try {
    importOverrides(overridesInput.value);
    overridesStatus.textContent = '読み込みました。';
    clearWarning('overrides-json');
  } catch (e) {
    setWarning('overrides-json', `設定 JSON を読み込めません: ${e.message}`);
    overridesStatus.textContent = '';
  }
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(linkField.value);
    copyButton.textContent = 'コピーしました';
    clearWarning('copy');
  } catch (e) {
    linkField.select();
    setWarning('copy', `クリップボードへコピーできませんでした (${e.message})。共有リンクの欄を選んで手動でコピーしてください。`);
  }
});

function writeBack(state) {
  const { query, overridesTooLong } = encodeShareQuery(state);
  const search = query ? `?${query}` : '';
  linkField.value = `${base}${search}`;
  copyButton.textContent = 'リンクをコピー';

  overridesExport.hidden = !overridesTooLong;
  if (overridesTooLong) {
    overridesExport.value = JSON.stringify(state.overrides, null, 2);
  }

  try {
    history.replaceState(null, '', `${location.pathname}${search}`);
    clearWarning('url-write');
  } catch (e) {
    setWarning('url-write', `URL を更新できませんでした (${e.message})`);
  }
}

/* ---------- detail heading ---------- */

function describe(row) {
  const parts = [];
  if (row.symbol) parts.push(`記号 ${row.symbol}`);
  if (row.code) parts.push(`コード ${row.code}`);
  return parts;
}

function renderDetail(state) {
  const id = state.presetId;
  detail.hidden = id === null;
  selectHint.hidden = id !== null;
  if (id === null) {
    chosenRowId = null;
    return;
  }
  const chosen = chosenRowId !== null ? catalog.rowOf(chosenRowId) : undefined;
  const row = chosen && chosenCanonical === id ? chosen : catalog.rowOf(id);
  if (!row) {
    detailName.textContent = id;
    detailMeta.textContent = '';
    return;
  }
  detailName.textContent = row.names?.ja ?? row.id;
  const parts = describe(row);
  if (row.aliasOf) {
    const target = catalog.rowOf(row.aliasOf);
    parts.push(`別名(= ${target?.names?.ja ?? row.aliasOf})`);
  }
  detailMeta.textContent = parts.join(' · ');
}

/* ---------- render loop ---------- */

function render(state) {
  for (const m of mounts) m.update(state);
  renderDetail(state);
  writeBack(state);
}

subscribe(render);
render(getState());
