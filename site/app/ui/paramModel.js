/**
 * Pure helpers of the parameter panel (no DOM; imported by paramPanel.js and by node:test).
 * Contract: site/app/ui/CONTRACT.md §4.2.
 *
 * The panel shows only the scalar settings a user tunes (numbers, integers, enums, booleans, and
 * objects / unions made of them). Structural data (arrays such as cycle, rotations, rowPitches,
 * colPitches, rowShifts; strings such as layer references and path data) is not shown at all and
 * is changed through the settings JSON (overrides) instead.
 */

const SCALAR_TYPES = Object.freeze(['number', 'integer', 'enum', 'boolean']);

/**
 * Keys that act only together with another key of the same layer: shown only when that key is set.
 * grid: assign and phase only choose how params.cycle is applied.
 */
const NEEDS_KEY = Object.freeze({
  grid: Object.freeze({ assign: 'cycle', phase: 'cycle' }),
});

/** Japanese names of the archetypes (layer types) and motif kinds, for the layer headings. */
export const ARCHETYPE_JA = Object.freeze({
  grid: '格子配置', brick: 'れんが積み', hatch: '平行線', frameDiagonal: '枠の対角線', wave: '波線',
  scatter: '散らばった線分', diagonalBand: '斜めの帯', edgeBand: '縁の帯', symbol: '記号', empty: '空白',
});

export const MOTIF_JA = Object.freeze({
  circle: '円', dot: '点', ellipse: '楕円', triangle: '三角形', hline: '横線', seg: '線分',
  lineGlyph: '線の記号', L: 'L 字', chevron: '山形', splitChevron: '割れた山形', parallelPair: '平行な 2 本線',
  pairVline: '2 本の縦線', waveUnit: '波の 1 単位', shell: '貝殻', lens: 'レンズ形', hook: 'かぎ形', X: '× 印',
  ptGlyph: '記号', vein: '脈', blob: '不定形',
});

/**
 * The part of a descriptor the panel can show, or null when nothing of it can be shown.
 * A union keeps only its scalar alternatives; an object is shown only when every field is.
 * @param {object} desc
 * @returns {object|null}
 */
export function editableDescriptor(desc) {
  if (SCALAR_TYPES.includes(desc.type)) return desc;
  if (desc.type === 'object') {
    const fields = {};
    for (const [k, f] of Object.entries(desc.fields)) {
      const e = editableDescriptor(f);
      if (!e) return null;
      fields[k] = e;
    }
    return { ...desc, fields };
  }
  if (desc.type === 'union') {
    const options = desc.options.map(editableDescriptor).filter(Boolean);
    if (options.length === 0) return null;
    return options.length === desc.options.length ? desc : { ...desc, options };
  }
  return null;
}

/** True when the descriptor can be shown on this screen. */
export function isEditable(desc) {
  return editableDescriptor(desc) !== null;
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

/**
 * The fields of one descriptor object (an archetype's PARAMS or a motif's fields) that the panel
 * shows, in descriptor order, each with the descriptor reduced to its editable part.
 * A field is left out when it has no scalar form, when its current value (`base`, the preset's
 * value) is in a form the panel cannot show (e.g. hatch angle given as an array), or when it only
 * acts together with a key the layer does not set (grid assign / phase without cycle).
 * @param {Record<string, object>} fields descriptor fields
 * @param {Record<string, unknown>} base current values of the preset (layer.params or layer.motif)
 * @param {{archetype?: string, params?: Record<string, unknown>}} [ctx]
 * @returns {Array<{key: string, desc: object}>}
 */
export function visibleFields(fields, base = {}, ctx = {}) {
  const needs = NEEDS_KEY[ctx.archetype] ?? {};
  const out = [];
  for (const [key, desc] of Object.entries(fields)) {
    const need = needs[key];
    if (need && (ctx.params ?? {})[need] === undefined) continue;
    const e = editableDescriptor(desc);
    if (!e) continue;
    const v = base?.[key];
    if (v !== undefined && checkValue(e, v).error !== null) continue;
    out.push({ key, desc: e });
  }
  return out;
}

/**
 * True when a field spans both columns of the two-column layout: fields given as an object of
 * two or more sub-fields (e.g. margin per side; they stack inside) and fields with a long title.
 * @param {object} desc editable descriptor
 * @param {string} title
 */
export function isWideField(desc, title) {
  const multi = (d) => d.type === 'object' && Object.keys(d.fields).length > 1;
  const hasObject = multi(desc) || (desc.type === 'union' && desc.options.some(multi));
  return hasObject || [...String(title)].length > 16;
}

/**
 * Heading of a layer section, without internal names (layer id, archetype or motif keys).
 * @param {{archetype: string, motif?: {kind: string}, params?: object}} layer
 * @param {number} index 0-based layer index
 * @param {number} total number of layers
 */
export function layerHeading(layer, index, total) {
  const type = ARCHETYPE_JA[layer.archetype] ?? '模様';
  let what = type;
  if (layer.motif) what += `・${MOTIF_JA[layer.motif.kind] ?? 'モチーフ'}`;
  else if (layer.params?.cycle !== undefined && layer.archetype === 'grid') what += '・モチーフの循環';
  return total > 1 ? `層 ${index + 1}(${what})` : `模様(${what})`;
}
