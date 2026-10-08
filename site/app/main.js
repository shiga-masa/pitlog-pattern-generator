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
import { formatSettings, parseSettings } from './ui/settingsJson.js';

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
const settingsText = el('textarea', { id: 'settings-json', rows: '16', spellcheck: 'false', 'aria-label': '設定 JSON' });
const settingsRevert = el('button', { id: 'settings-revert', type: 'button', text: '現在の値に戻す' });
const settingsStatus = el('p', { id: 'settings-status', class: 'hint', 'aria-live': 'polite' });
const settingsLong = el('p', { id: 'settings-long', class: 'hint settings-long', hidden: '' });
const settingsBox = el('section', { id: 'settings-json-block', class: 'block' }, [
  el('h3', { text: '設定 JSON' }),
  el('p', {
    class: 'hint',
    text: '今の指定(模様の ID、共通変数、上の欄で変えた層の値)です。上の欄を動かすとすぐに書き換わります。'
      + 'この欄を直接書き換えると、その場で模様と上の欄に反映します(JSON として正しくない間は、最後に正しかった指定のまま描きます)。'
      + 'コピーして保存しておけば、貼り付けるだけで復元できます。'
      + 'ライブラリでは renderSVG(preset, options) にそのまま渡せます。',
  }),
  settingsLong,
  settingsText,
  el('div', { class: 'share-row' }, [settingsRevert]),
  settingsStatus,
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
  el('div', { class: 'settings-body' }, [paramBox, settingsBox]),
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
let scrollToDetail = initial.presetId !== null; // only when opened from a share link; tile clicks never scroll

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

/* ---------- share link, URL write-back, settings JSON ---------- */

const base = location.href.split(/[?#]/)[0];

/* Settings JSON (CONTRACT.md §2.1). Two-way and immediate:
 * - every state change rewrites the text, except while the field has focus (the caret and the
 *   user's text stay as they are);
 * - every edit of the text is checked as a whole (parseSettings) and, when valid, applied at once;
 *   while it is invalid the last valid settings stay and the reason is shown in Japanese. */
let settingsInvalid = false;

function showSettingsStatus(kind, text) {
  settingsStatus.textContent = text;
  settingsStatus.classList.toggle('settings-error', kind === 'error');
}

function syncSettings(state) {
  if (document.activeElement === settingsText) return;
  const text = formatSettings(state);
  if (settingsText.value === text) return;
  settingsText.value = text;
  if (settingsInvalid) {
    // An unfinished invalid text is replaced by the current settings once the state moves on.
    settingsInvalid = false;
    showSettingsStatus('none', '');
  }
}

/** Applies a checked settings object to the state; only the keys that differ are written. */
function applySettings(r) {
  const cur = getState();
  if (r.presetId !== cur.presetId) {
    chosenRowId = null;
    selectPreset(r.presetId);
  }
  const now = getState().overrides;
  for (const k of Object.keys(now)) if (!(k in r.overrides)) setOverride(k, undefined);
  for (const [k, v] of Object.entries(r.overrides)) {
    if (JSON.stringify(now[k]) !== JSON.stringify(v)) setOverride(k, v);
  }
  const opts = getState().options;
  for (const [k, v] of Object.entries(r.options)) if (opts[k] !== v) setOption(k, v);
}

settingsText.addEventListener('input', () => {
  const r = parseSettings(settingsText.value, { currentPresetId: getState().presetId });
  if (!r.ok) {
    settingsInvalid = true;
    showSettingsStatus('error', `反映できません: ${r.error}。直前の正しい指定のまま描いています。`);
    return;
  }
  try {
    applySettings(r);
  } catch (e) {
    // parseSettings checked everything, so this is a bug; show it, never swallow it.
    settingsInvalid = true;
    showSettingsStatus('error', `反映の途中で失敗しました: ${e.message}`);
    return;
  }
  settingsInvalid = false;
  showSettingsStatus('none', '反映しました。');
});

// Leaving the field: a valid text is rewritten in the standard form; an invalid one is kept so
// the user can fix it ("現在の値に戻す" discards it).
settingsText.addEventListener('blur', () => {
  if (!settingsInvalid) syncSettings(getState());
});

settingsRevert.addEventListener('click', () => {
  settingsInvalid = false;
  settingsText.value = formatSettings(getState());
  showSettingsStatus('none', '');
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

  settingsLong.hidden = !overridesTooLong;
  settingsLong.textContent = overridesTooLong
    ? '層の変更が多く、共有リンクに載せきれません(リンクには模様と共通変数だけが入ります)。下の設定 JSON をコピーして保存してください。'
    : '';
  syncSettings(state);

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
  if (scrollToDetail) {
    scrollToDetail = false;
    detail.scrollIntoView({ block: 'start' });
  }
}

/* ---------- render loop ---------- */

function render(state) {
  for (const m of mounts) m.update(state);
  renderDetail(state);
  writeBack(state);
}

subscribe(render);
render(getState());
