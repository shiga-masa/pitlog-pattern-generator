/**
 * Parameter panel (site/app/ui). Owner: app-2. Contract: site/app/ui/CONTRACT.md §4.2.
 *
 * Builds the form from schema descriptors and keeps no state of its own:
 *   - common options: the seven keys of state.options (density, motifScale, strokeScale,
 *     seed, tileMode, ink, paper), written through onOptionChange(key, value);
 *   - per layer of the selected preset: the archetype PARAMS (src/archetypes/<type>.js) and
 *     the motif fields (src/motifs/*.js), written through onOverrideChange(JSON Pointer, value).
 * An input outside the descriptor (range, candidates, type) is rejected: nothing is written,
 * the previous valid value stays, and the reason is shown in Japanese.
 * Colours: ink and paper only (docs/CONVENTIONS.md §5). Styles: site/assets/ui/paramPanel.css.
 *
 * The top level touches no DOM, so the pure helpers can be imported from node.
 */

import { getPreset } from '../../../src/index.js';
import { ARCHETYPES } from '../../../src/archetypes/index.js';
import { MOTIFS } from '../../../src/motifs/index.js';
import { OPTIONS } from '../../../src/core/schema.js';
import { DEFAULT_INK, DEFAULT_PAPER, isColor } from '../../../src/core/colors.js';

/** Descriptors of the common options (state.options), with the display defaults of CONTRACT §1. */
const COMMON = {
  density: { ...OPTIONS.fields.density, default: 1 },
  motifScale: { ...OPTIONS.fields.motifScale, default: 'follow' },
  strokeScale: { ...OPTIONS.fields.strokeScale, default: 1 },
  seed: { ...OPTIONS.fields.seed, default: 0 },
  tileMode: { ...OPTIONS.fields.tileMode, default: 'frame' },
};

/** Japanese labels by key. A key without an entry is shown as it is. */
export const LABEL_JA = Object.freeze({
  // common options
  density: '密度', motifScale: 'モチーフの倍率', strokeScale: '線幅の倍率', seed: '乱数の種 (seed)',
  tileMode: 'タイル表示', ink: '線・黒塗りの色 (ink)', paper: '地・白抜きの色 (paper)',
  // archetype parameters
  pitchX: '横ピッチ', pitchY: '縦ピッチ', rowOffset: '奇数行のずれ', rows: '行数', cols: '列数',
  cycle: 'モチーフの循環', assign: '循環の割り当て', phase: '循環・位相の開始', flipRows: '奇数行を上下反転',
  rotations: '回転角(行の偶奇別)', avoid: '避ける層の ID', edgeMode: '領域の端の扱い',
  courseHeight: '段の高さ', brickLength: 'れんがの長さ', jointAngle: '目地の角度', stagger: '段どうしのずれ',
  angle: '角度', jointInset: '目地の端の余白', courseExtent: '段線の範囲',
  spacing: '線の間隔', offset: '線群のずれ', dash: '破線の長さ', gap: '破線の間隔', dashPhase: '破線の位相',
  margin: '端からの余白', direction: '向き', wavelength: '波長', amplitude: '振幅', lineSpacing: '線の間隔',
  lines: '線の本数', waveform: '波形', flat: '平坦部の長さ', rampDx: '斜面の水平長', rampDy: '斜面の高さ',
  doubleGap: '二重線の間隔', count: '個数', length: '線分の長さ', lengthJitter: '長さのばらつき',
  angles: '方向と重み', minDistance: '最小中心間距離', sampling: '配置方法', points: '指定の線分',
  bands: '帯の本数', bandSpacing: '帯の間隔', bandOffset: '帯中心のずれ', alongPitch: '帯方向のピッチ',
  step: '帯方向の歩幅', bandShift: '帯どうしのずれ', bandPhase: '帯の位相', elementAngle: '要素の角度',
  bandWidth: '帯の幅', sides: '片側・両側', bandFrame: '帯の枠', anchor: '基準点', offsets: '配置位置',
  scale: '倍率',
  // motif fields
  fill: '塗り', polygonSides: '多角形の辺数', rotation: '回転角', base: '底辺', height: '高さ',
  apex: '頂点の向き', hLines: '横線の本数', hLen: '横線の長さ', hGap: '横線の間隔', vLines: '縦線の本数',
  vLen: '縦線の長さ', vGap: '縦線の間隔', vAnchor: '縦線の基準', corner: '角の向き', width: '幅',
  depth: '奥行', open: '開く向き', legLength: '脚の長さ', legAngle: '脚の角度', apexGap: '頂点の間隔',
  halfWidth: '半幅', paperW: '白抜きの幅', paperH: '白抜きの高さ', inkW: '黒の幅', inkH: '黒の高さ',
  inkOffset: '黒の位置のずれ', arcWidth: 'アークの幅', arcHeight: 'アークの高さ', arcs: 'アークの本数',
  shift: 'ずれ', outerLen: '外側の長さ', innerLen: '内側の長さ', drop: '下がり', jog: '段差',
  stemLen: '幹の長さ', armLen: '腕の長さ', chord: '弦の長さ', secondOffset: '2 本目のずれ',
  rungs: '横木の本数', rungLengthMin: '横木の最小長', rungLengthMax: '横木の最大長', vertices: '頂点数',
  irregularity: '不規則さ', d: '直径・パス (d)', w: '全幅', h: '全高', x: 'x', y: 'y',
  left: '左', right: '右', top: '上', bottom: '下', pt: '値 (pt)',
});

/** Labels that differ per archetype (same key, different meaning). */
const ARCH_LABEL_JA = Object.freeze({
  frameDiagonal: { count: '1 本の対角線あたりの本数', gap: '2 本の線の水平距離' },
  scatter: { count: '1 フレームあたりの線分数' },
});

const ENUM_LABEL_JA = Object.freeze({
  follow: '1/密度に追従', period: '周期タイル', frame: '1 枚の枠', fit: '整数周期に合わせる',
  whole: '収まる個体のみ', clip: '領域で切る', auto: '自動', col: '列ごとに交互', row: '行ごとに交互',
  rowcol: '行と列', full: '全幅', solid: '実線', sine: '正弦波', trapezoid: '台形波', center: '中心',
  topLeft: '左上', both: '両側', left: '左側', right: '右側', band: '帯に平行', jitteredGrid: 'ゆらぎのある格子',
  poisson: 'ポアソン分布', uniform: '一様分布', '/': '右上がり (/)', '\\': '右下がり (\\)', x: '交差 (x)',
  up: '上向き', down: '下向き', bottomLeft: '左下', bottomRight: '右下', topRight: '右上',
  top: '上', bottom: '下', ink: '黒 (ink)', paper: '白 (paper)', none: '線のみ (none)',
});

const UNIT_JA = Object.freeze({ pt: 'pt', deg: '度', ratio: '比', count: '個', factor: '倍', px: 'px', dpi: 'dpi', mm: 'mm' });

/** Copy of a JSON-like value; undefined stays undefined. */
function clone(v) {
  return v === undefined ? undefined : structuredClone(v);
}

function getAt(root, path) {
  let o = root;
  for (const k of path) {
    if (o === null || typeof o !== 'object') return undefined;
    o = o[k];
  }
  return o;
}

/** True when the descriptor can be shown on this screen. */
export function isEditable(desc) {
  if (['number', 'integer', 'enum', 'boolean', 'string'].includes(desc.type)) return true;
  if (desc.type === 'union') return desc.options.some(isEditable);
  if (desc.type === 'object') return Object.values(desc.fields).every(isEditable);
  return false;
}

/**
 * Check one value against its descriptor. `undefined` means "not given": allowed unless required.
 * Returns a reason in Japanese: `error` rejects the input, `warn` keeps it and shows a note.
 * @param {object} desc
 * @param {unknown} value
 * @returns {{error: string|null, warn: string|null}}
 */
export function checkValue(desc, value) {
  const ok = { error: null, warn: null };
  const fail = (error) => ({ error, warn: null });
  if (value === undefined) return { error: desc.required ? '必須の項目です' : null, warn: null };
  switch (desc.type) {
    case 'number':
    case 'integer': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return fail('数値を入力してください');
      if (desc.type === 'integer' && !Number.isInteger(value)) return fail('整数を入力してください');
      if (desc.min !== undefined && value < desc.min) return fail(`${desc.min} 以上にしてください`);
      if (desc.max !== undefined && value > desc.max) return fail(`${desc.max} 以下にしてください`);
      if (desc.exclusiveMin !== undefined && value <= desc.exclusiveMin) return fail(`${desc.exclusiveMin} より大きくしてください`);
      if ((desc.softMin !== undefined && value < desc.softMin) || (desc.softMax !== undefined && value > desc.softMax)) {
        return { error: null, warn: `推奨範囲 ${desc.softMin ?? '-∞'} 〜 ${desc.softMax ?? '∞'} の外です。この値のまま描きます` };
      }
      return ok;
    }
    case 'enum':
      return desc.values.includes(value) ? ok : fail('候補から選んでください');
    case 'boolean':
      return typeof value === 'boolean' ? ok : fail('オンかオフで指定してください');
    case 'string':
      if (typeof value !== 'string') return fail('文字列で入力してください');
      if (desc.pattern && !desc.pattern.test(value)) return fail('形式が合いません');
      return ok;
    case 'union':
      return desc.options.some((o) => checkValue(o, value).error === null) ? ok : fail('どの指定方法にも合いません');
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value) ? ok : fail('内訳で指定してください');
    default:
      return fail('この画面からは入力できません');
  }
}

/** Label of one alternative of a union (the way the value is specified). */
function modeLabel(opt) {
  switch (opt.type) {
    case 'enum':
      return opt.values.map((v) => ENUM_LABEL_JA[v] ?? String(v)).join(' / ');
    case 'integer':
      return '個数で指定';
    case 'number':
      if (opt.unit === 'ratio') return '比で指定';
      if (opt.unit === 'deg') return '角度で指定';
      return 'pt で指定';
    case 'object':
      return 'pt' in opt.fields ? '絶対値 (pt) で指定' : '辺ごとに指定';
    default:
      return opt.type;
  }
}

/** Tooltip text: the report section the descriptor cites (e.g. "R1 §1.16"). */
function referenceOf(desc) {
  const refs = String(desc.desc ?? '').match(/R\d\s*§[\d.]+/g);
  return refs && refs.length ? `根拠: ${refs.join(', ')}` : '根拠: 報告の節番号は記述子にありません';
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function shownValue(v) {
  if (v === undefined) return '未指定';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

function showMsg(node, kind, text) {
  node.className = `pp-msg${kind === 'error' ? ' pp-msg-error' : kind === 'warn' ? ' pp-msg-warn' : ''}`;
  node.textContent = text ?? '';
  node.hidden = !text;
}

/**
 * Mount the parameter panel. Called once; afterwards call update(state).
 * @param {HTMLElement} container
 * @param {{
 *   state?: object,
 *   onOptionChange?: (key: string, value: unknown) => void,
 *   onOverrideChange?: (pointer: string, value: unknown) => void,
 * }} props
 * @returns {{update: (state: object) => void, destroy: () => void}}
 */
export function mountParamPanel(container, props = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountParamPanel: container must be an HTMLElement');
  const onOptionChange = typeof props.onOptionChange === 'function' ? props.onOptionChange : () => {};
  const onOverrideChange = typeof props.onOverrideChange === 'function' ? props.onOverrideChange : () => {};
  const root = el('div', 'pp');
  container.replaceChildren(root);

  let state = props.state ?? { presetId: null, options: {}, overrides: {} };
  let builtFor = null;
  let syncers = [];
  let unsupported = [];
  let notes = [];
  let currentArchetype = '';

  const labelOf = (key) => ARCH_LABEL_JA[currentArchetype]?.[key] ?? LABEL_JA[key] ?? key;

  /**
   * A binding reads a value (undefined = not given) and writes one (undefined removes it).
   * Option bindings write through onOptionChange; override bindings through onOverrideChange.
   */
  const optionBinding = (key) => ({
    get: () => getAt(state, ['options', key]),
    set: (v) => onOptionChange(key, v),
  });

  const overrideBinding = (pointer, base) => ({
    get: () => (state.overrides?.[pointer] !== undefined ? state.overrides[pointer] : base),
    set: (v) => onOverrideChange(pointer, v),
  });

  /** Binding of one key inside an object-valued binding: writes the whole object back. */
  const childBinding = (parent, key) => ({
    get: () => {
      const p = parent.get();
      return p !== null && typeof p === 'object' ? p[key] : undefined;
    },
    set: (v) => {
      const p = clone(parent.get() ?? {});
      if (v === undefined) delete p[key];
      else p[key] = v;
      parent.set(Object.keys(p).length ? p : undefined);
    },
  });

  /** Title and key name, with the required mark and the reference tooltip. */
  function header(title, keyName, desc) {
    const t = el('div', 'pp-title', title);
    if (desc.required) t.append(el('span', 'pp-badge', '必須'));
    t.title = referenceOf(desc);
    return [t, el('div', 'pp-key', keyName)];
  }

  /** The one write path: check, then set; a rejected input writes nothing. */
  function commit(desc, binding, raw, msg) {
    const r = checkValue(desc, raw);
    if (r.error) {
      const prev = binding.get() ?? desc.default;
      showMsg(msg, 'error', `入力できません: ${r.error}。直前の値 (${shownValue(prev)}) を使います`);
      return false;
    }
    binding.set(raw);
    showMsg(msg, r.warn ? 'warn' : 'none', r.warn);
    return true;
  }

  /** Slider (when the range is finite and not huge) and number box for a number or integer. */
  function numberControls(desc, binding, title, msg) {
    const isInt = desc.type === 'integer';
    const range = el('input', 'pp-range');
    range.type = 'range';
    range.setAttribute('aria-label', `${title} (スライダー)`);
    const num = el('input', 'pp-num');
    num.type = 'number';
    num.step = isInt ? '1' : 'any';
    num.setAttribute('aria-label', title);
    const unit = el('span', 'pp-unit', UNIT_JA[desc.unit] ?? desc.unit ?? '');

    const boundsFor = (v) => {
      const exclusive = desc.exclusiveMin !== undefined ? desc.exclusiveMin + 0.001 : undefined;
      let lo = desc.min ?? exclusive ?? desc.softMin ?? 0;
      let hi = desc.max ?? desc.softMax ?? Math.max(lo + 1, 4 * Math.abs(desc.default ?? 1), 2 * Math.abs(v ?? 0));
      if (typeof v === 'number') {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
      if (isInt) {
        lo = Math.floor(lo);
        hi = Math.ceil(hi);
      }
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo || hi - lo > 1e6) return null;
      return { lo, hi, step: isInt ? 1 : (hi - lo) / 1000 };
    };
    const applyBounds = (v) => {
      const b = boundsFor(v);
      range.hidden = !b;
      if (b) {
        range.min = String(b.lo);
        range.max = String(b.hi);
        range.step = String(b.step);
      }
    };
    const current = () => {
      const v = binding.get() ?? desc.default;
      return typeof v === 'number' ? v : undefined;
    };

    range.addEventListener('input', () => {
      const raw = Number(range.value);
      const v = isInt ? Math.round(raw) : Math.round(raw * 1000) / 1000;
      if (commit(desc, binding, v, msg)) num.value = String(v);
    });
    num.addEventListener('input', () => {
      if (num.validity.badInput) {
        showMsg(msg, 'error', '入力できません: 数値を入力してください');
        return;
      }
      const raw = num.value.trim() === '' ? undefined : Number(num.value);
      if (commit(desc, binding, raw, msg) && typeof raw === 'number') applyBounds(raw);
    });
    syncers.push(() => {
      const v = current();
      if (document.activeElement !== num) num.value = v === undefined ? '' : String(v);
      applyBounds(v);
      if (document.activeElement !== range && v !== undefined) range.value = String(v);
    });
    return [range, num, unit];
  }

  /** Select for an enum; "未指定" (not given) is offered when the key is optional. */
  function enumControls(desc, binding, title, msg) {
    const sel = el('select', 'pp-select');
    sel.setAttribute('aria-label', title);
    if (!desc.required) sel.append(new Option('未指定', ''));
    desc.values.forEach((v, i) => sel.append(new Option(ENUM_LABEL_JA[v] ?? String(v), String(i))));
    sel.addEventListener('change', () => {
      commit(desc, binding, sel.value === '' ? undefined : desc.values[Number(sel.value)], msg);
    });
    syncers.push(() => {
      const v = binding.get() ?? desc.default;
      const i = v === undefined ? -1 : desc.values.indexOf(v);
      sel.value = i >= 0 ? String(i) : '';
      if (v !== undefined && i < 0) showMsg(msg, 'error', `候補にない値です: ${shownValue(v)}`);
    });
    return [sel];
  }

  function booleanControls(desc, binding, title, msg) {
    const cb = el('input', 'pp-check');
    cb.type = 'checkbox';
    cb.setAttribute('aria-label', title);
    const label = el('label', 'pp-inline');
    label.append(cb, el('span', 'pp-unit', 'オン'));
    cb.addEventListener('change', () => {
      commit(desc, binding, cb.checked, msg);
    });
    syncers.push(() => {
      cb.checked = (binding.get() ?? desc.default) === true;
    });
    return [label];
  }

  function stringControls(desc, binding, title, msg) {
    const input = el('input', 'pp-text');
    input.type = 'text';
    input.setAttribute('aria-label', title);
    input.addEventListener('input', () => {
      commit(desc, binding, input.value === '' ? undefined : input.value, msg);
    });
    syncers.push(() => {
      const v = binding.get() ?? desc.default;
      if (document.activeElement !== input) input.value = typeof v === 'string' ? v : '';
    });
    return [input];
  }

  /**
   * One field for a descriptor. `bare` omits the title block (used for the alternatives of a union).
   * Returns null (and records the key as unsupported) when the descriptor cannot be shown.
   */
  function fieldNode(desc, binding, keyName, title, bare = false) {
    if (!isEditable(desc)) {
      unsupported.push(keyName);
      return null;
    }
    if (desc.type === 'object') {
      const box = el('div', bare ? 'pp-bare' : 'pp-field');
      if (!bare) box.append(...header(title, keyName, desc));
      for (const [ck, cd] of Object.entries(desc.fields)) {
        const child = fieldNode(cd, childBinding(binding, ck), `${keyName}.${ck}`, labelOf(ck), false);
        if (child) box.append(child);
      }
      return box;
    }
    if (desc.type === 'union') {
      // An alternative without its own default takes the union's default when that default fits it.
      const inherit = (o) => (o.default === undefined && desc.default !== undefined && checkValue(o, desc.default).error === null
        ? { ...o, default: desc.default }
        : o);
      const opts = desc.options.filter(isEditable).map(inherit);
      const dropped = desc.options.filter((o) => !isEditable(o));
      if (dropped.length) notes.push(`${keyName} の「${dropped.map(modeLabel).join('・')}」`);
      if (opts.length === 0) {
        unsupported.push(keyName);
        return null;
      }
      if (opts.length === 1) return fieldNode(opts[0], binding, keyName, title, bare);
      const box = el('div', bare ? 'pp-bare' : 'pp-field');
      if (!bare) box.append(...header(title, keyName, desc));
      const mode = el('select', 'pp-select');
      mode.setAttribute('aria-label', `${title} の指定方法`);
      opts.forEach((o, i) => mode.append(new Option(modeLabel(o), String(i))));
      const slot = el('div', 'pp-slot');
      // A single-value enum alternative (e.g. "1/density") has no control of its own: the mode is the value.
      const single = (o) => o.type === 'enum' && o.values.length === 1;
      const renderSlot = (i) => {
        slot.replaceChildren();
        if (single(opts[i])) return;
        const n = fieldNode(opts[i], binding, keyName, title, true);
        if (n) slot.append(n);
      };
      const activeIndex = () => {
        const cur = binding.get() ?? desc.default;
        const i = opts.findIndex((o) => checkValue(o, cur).error === null);
        return i < 0 ? 0 : i;
      };
      mode.addEventListener('change', () => {
        const i = Number(mode.value);
        if (single(opts[i])) binding.set(opts[i].values[0]);
        else binding.set(opts[i].default !== undefined ? clone(opts[i].default) : undefined);
        renderSlot(i);
      });
      renderSlot(activeIndex());
      mode.value = String(activeIndex());
      syncers.push(() => {
        const i = activeIndex();
        if (document.activeElement !== mode && mode.value !== String(i)) {
          mode.value = String(i);
          renderSlot(i);
        }
      });
      const modeRow = el('div', 'pp-row');
      modeRow.append(mode);
      box.append(modeRow, slot);
      return box;
    }
    const box = el('div', bare ? 'pp-bare' : 'pp-field');
    if (!bare) box.append(...header(title, keyName, desc));
    const msg = el('p', 'pp-msg');
    msg.hidden = true;
    let controls;
    switch (desc.type) {
      case 'number':
      case 'integer':
        controls = numberControls(desc, binding, title, msg);
        break;
      case 'enum':
        controls = enumControls(desc, binding, title, msg);
        break;
      case 'boolean':
        controls = booleanControls(desc, binding, title, msg);
        break;
      default:
        controls = stringControls(desc, binding, title, msg);
    }
    const reset = el('button', 'pp-reset', '既定値へ戻す');
    reset.type = 'button';
    reset.setAttribute('aria-label', `${title} を既定値へ戻す`);
    reset.addEventListener('click', () => {
      binding.set(undefined);
    });
    const row = el('div', 'pp-row');
    row.append(...controls, reset);
    box.append(row, msg);
    return box;
  }

  /** Field nodes for the entries of one descriptor object (an archetype's PARAMS or a motif's fields). */
  function fieldsFor(fields, makeBinding) {
    const out = [];
    for (const [key, desc] of Object.entries(fields)) {
      const node = fieldNode(desc, makeBinding(key), key, labelOf(key));
      if (node) out.push(node);
    }
    return out;
  }

  function section(heading, nodes) {
    const sec = el('section', 'pp-group');
    sec.append(el('h2', 'pp-section', heading), ...nodes);
    return sec;
  }

  /** Note line for what the screen cannot change in this layer. */
  function unsupportedNote(prefix) {
    const list = [...unsupported.map((k) => `${prefix}${k}`), ...notes];
    if (!list.length) return null;
    return el('p', 'pp-unsupported', `この画面では変えられない項目(spec 側で指定します): ${list.join('、')}`);
  }

  /** Common options: density, motifScale, strokeScale, seed, tileMode, then the two colours. */
  function commonSection() {
    const nodes = [];
    for (const [key, desc] of Object.entries(COMMON)) {
      const node = fieldNode(desc, optionBinding(key), key, labelOf(key));
      if (node) nodes.push(node);
    }
    // ink and paper: exactly two colour inputs (CONVENTIONS §5); no third colour is offered.
    const colorMsg = el('p', 'pp-msg');
    colorMsg.hidden = true;
    const colorOf = (key, fallback) => {
      const v = getAt(state, ['options', key]);
      return isColor(v) ? v : fallback;
    };
    for (const [key, fallback] of [['ink', DEFAULT_INK], ['paper', DEFAULT_PAPER]]) {
      const title = labelOf(key);
      const box = el('div', 'pp-field');
      box.append(...header(title, key, { desc: '' }));
      const input = el('input', 'pp-color');
      input.type = 'color';
      input.setAttribute('aria-label', title);
      const code = el('span', 'pp-unit');
      input.addEventListener('input', () => {
        if (!isColor(input.value)) {
          showMsg(colorMsg, 'error', '入力できません: #rrggbb 形式の色だけ使えます');
          return;
        }
        onOptionChange(key, input.value.toLowerCase());
      });
      const reset = el('button', 'pp-reset', '既定値へ戻す');
      reset.type = 'button';
      reset.setAttribute('aria-label', `${title} を既定値へ戻す`);
      reset.addEventListener('click', () => onOptionChange(key, undefined));
      const row = el('div', 'pp-row');
      row.append(input, code, reset);
      box.append(row);
      nodes.push(box);
      syncers.push(() => {
        const v = colorOf(key, fallback);
        if (document.activeElement !== input && input.value !== v) input.value = v;
        code.textContent = v;
      });
    }
    nodes.push(colorMsg);
    syncers.push(() => {
      const ink = colorOf('ink', DEFAULT_INK);
      const paper = colorOf('paper', DEFAULT_PAPER);
      if (ink === paper) showMsg(colorMsg, 'warn', '線の色と地の色が同じです。模様が見えなくなります');
      else showMsg(colorMsg, 'none', '');
    });
    return section('共通変数', nodes);
  }

  function buildAll() {
    builtFor = state.presetId ?? null;
    syncers = [];
    currentArchetype = '';
    const head = el('div', 'pp-head');
    let spec = null;
    if (builtFor !== null) {
      try {
        spec = getPreset(builtFor);
      } catch (e) {
        root.replaceChildren(el('p', 'pp-error', `プリセットを読めません: ${e.message}`));
        return;
      }
    }
    head.append(el('p', 'pp-title', spec ? (spec.names?.ja ?? spec.id) : 'プリセットを選んでください'));
    if (spec) head.append(el('p', 'pp-key', spec.id));
    const sections = [head, commonSection()];

    if (spec) {
      spec.layers.forEach((layer, i) => {
        unsupported = [];
        notes = [];
        currentArchetype = layer.archetype;
        const arch = ARCHETYPES[layer.archetype];
        if (!arch) {
          sections.push(el('p', 'pp-error', `未知の型です: ${layer.archetype}`));
          return;
        }
        const nodes = fieldsFor(arch.PARAMS.fields, (key) => overrideBinding(`/layers/${i}/params/${key}`, getAt(layer, ['params', key])));
        const motifDesc = layer.motif ? MOTIFS[layer.motif.kind]?.descriptor : null;
        if (motifDesc) {
          const fields = Object.fromEntries(Object.entries(motifDesc.fields).filter(([k]) => k !== 'kind'));
          nodes.push(...fieldsFor(fields, (key) => overrideBinding(`/layers/${i}/motif/${key}`, getAt(layer, ['motif', key]))));
        }
        const sec = section(`層 ${layer.id} (${layer.archetype}${motifDesc ? `・モチーフ ${layer.motif.kind}` : ''})`, nodes);
        const note = unsupportedNote(`${layer.id}.`);
        if (note) sec.append(note);
        sections.push(sec);
      });
    } else {
      sections.push(el('p', 'pp-unsupported', '左の一覧からプリセットを選ぶと、ここに型とモチーフの入力欄が出ます。'));
    }
    root.replaceChildren(...sections);
    for (const s of syncers) s();
  }

  buildAll();

  return {
    update(next) {
      state = next ?? state;
      if ((state.presetId ?? null) !== builtFor) {
        buildAll();
        return;
      }
      for (const s of syncers) s();
    },
    destroy() {
      container.replaceChildren();
    },
  };
}
