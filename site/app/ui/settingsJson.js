/**
 * Settings JSON (CONTRACT.md §2.1): the current specification as one JSON object that the user
 * copies, edits and applies back, and that the library takes as it is:
 *
 *   { "preset": "zc:111300002",
 *     "options": { density, motifScale, strokeScale, seed, tileMode, ink, paper,
 *                  "overrides": { "/layers/0/params/rowPitches": [4.1, 4.3] } } }
 *
 *   const { svg } = await renderSVG(json.preset, json.options);
 *
 * All seven common options are written with their current values (defaults filled in), and
 * `overrides` is always present (possibly {}), so the user sees every key that can be edited.
 * Pure: no DOM. The library functions are imported for the checks only.
 */

import { resolveId, toSpec } from '../../../src/index.js';
import { OPTION_KEYS, optionDefault, optionError } from '../state.js';

const TOP_KEYS = Object.freeze(['preset', 'options']);
const OPTION_JSON_KEYS = Object.freeze([...OPTION_KEYS, 'overrides']);

/**
 * The settings object of a state.
 * @param {{presetId: string|null, options: object, overrides: object}} state
 * @returns {{preset: string|null, options: object}}
 */
export function buildSettings(state) {
  const options = {};
  for (const key of OPTION_KEYS) options[key] = state.options?.[key] !== undefined ? state.options[key] : optionDefault(key);
  options.overrides = structuredClone(state.overrides ?? {});
  return { preset: state.presetId ?? null, options };
}

/** The text shown in the settings JSON field (2-space indent). */
export function formatSettings(state) {
  return JSON.stringify(buildSettings(state), null, 2);
}

const ISSUE_JA = [
  [/^must be >= (.+), got (.+)$/, (m) => `${m[1]} 以上にしてください(入力 ${m[2]})`],
  [/^must be <= (.+), got (.+)$/, (m) => `${m[1]} 以下にしてください(入力 ${m[2]})`],
  [/^must be > (.+), got (.+)$/, (m) => `${m[1]} より大きくしてください(入力 ${m[2]})`],
  [/^expected a finite (?:number|integer), got (.+)$/, (m) => `数値にしてください(入力 ${m[1]})`],
  [/^expected an integer, got (.+)$/, (m) => `整数にしてください(入力 ${m[1]})`],
  [/^expected an array/, () => '配列 [ … ] で書いてください'],
  [/^expected an object/, () => 'オブジェクト { … } で書いてください'],
  [/^expected a string/, () => '文字列で書いてください'],
  [/^expected true\/false/, () => 'true か false にしてください'],
  [/^needs at least (\d+) item/, (m) => `要素を ${m[1]} 個以上にしてください`],
  [/^allows at most (\d+) item/, (m) => `要素は ${m[1]} 個までです`],
  [/^unknown key "(.+)"; allowed: (.+)$/, (m) => `この位置に "${m[1]}" という項目はありません(使える項目: ${m[2]})`],
  [/^required key is missing/, () => '必須の項目がありません'],
  [/^unknown value (.+)$/, (m) => `候補にない値です: ${m[1]}`],
  [/^unknown motif kind (.+)$/, (m) => `モチーフの種類 ${m[1]} はありません`],
  [/^matches none of the allowed forms/, () => 'どの指定方法にも合いません'],
  [/^no object at "(.*)"$/, (m) => `"${m[1]}" という場所はこの模様にありません`],
  [/^array index (\d+) out of range \(length (\d+)\)$/, (m) => `${m[1]} 番目の要素はありません(要素数 ${m[2]})`],
  [/^"(.+)" identifies the preset and cannot be overridden$/, (m) => `"${m[1]}" は模様を識別する項目なので上書きできません`],
];

/**
 * Japanese wording of one library schema issue ({path, message, candidates?}).
 * Unknown messages keep the original text after a Japanese lead, so nothing is lost.
 */
export function issueJa(issue) {
  const msg = String(issue.message ?? '');
  let text = null;
  for (const [re, f] of ISSUE_JA) {
    const m = msg.match(re);
    if (m) {
      text = f(m);
      break;
    }
  }
  if (text === null) text = `値が合いません(${msg})`;
  if (issue.candidates?.length) text += `。候補: ${issue.candidates.slice(0, 5).join(', ')}`;
  return issue.path ? `${issue.path}: ${text}` : text;
}

/**
 * Parse and check a settings JSON text. Nothing is applied here: the caller applies the result
 * only when ok, so a rejected text leaves the previous settings as they are.
 * @param {string} text
 * @param {{currentPresetId?: string|null}} [ctx] preset used when the text has no "preset"
 * @returns {{ok: true, presetId: string, options: Record<string, unknown>, overrides: object}
 *          | {ok: false, error: string}}
 *   options has all seven keys; a value equal to the default is undefined (= key removed).
 */
export function parseSettings(text, ctx = {}) {
  const fail = (error) => ({ ok: false, error });
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return fail(`JSON として読めません(${e.message})`);
  }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return fail('全体を { "preset": …, "options": { … } } の形のオブジェクトにしてください');
  }
  const extra = Object.keys(json).filter((k) => !TOP_KEYS.includes(k));
  if (extra.length) return fail(`未知の項目 ${extra.map((k) => `"${k}"`).join(', ')} があります。使える項目: ${TOP_KEYS.join(', ')}`);

  let presetId = ctx.currentPresetId ?? null;
  if (json.preset !== undefined && json.preset !== null) {
    if (typeof json.preset !== 'string' || json.preset.trim() === '') return fail('"preset" は模様の ID の文字列にしてください(例 "zc:111300002")');
    try {
      presetId = resolveId(json.preset);
    } catch (e) {
      return fail(`"preset" の ${JSON.stringify(json.preset)} は模様として見つかりません(${e.message})`);
    }
  }
  if (presetId === null) return fail('"preset" に模様の ID を書いてください(例 "zc:111300002")');

  const opts = json.options ?? {};
  if (typeof opts !== 'object' || opts === null || Array.isArray(opts)) return fail('"options" はオブジェクト { … } にしてください');
  const unknownOpts = Object.keys(opts).filter((k) => !OPTION_JSON_KEYS.includes(k));
  if (unknownOpts.length) {
    return fail(`"options" に未知の項目 ${unknownOpts.map((k) => `"${k}"`).join(', ')} があります。使える項目: ${OPTION_JSON_KEYS.join(', ')}(寸法と dpi は書き出し欄で指定します)`);
  }
  const options = {};
  for (const key of OPTION_KEYS) {
    const v = opts[key];
    if (v === undefined || v === null) {
      options[key] = undefined;
      continue;
    }
    const err = optionError(key, v);
    if (err) return fail(`options.${key} の ${JSON.stringify(v)} は使えません: ${err}`);
    options[key] = v === optionDefault(key) ? undefined : v;
  }

  const overrides = opts.overrides ?? {};
  if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
    return fail('"overrides" はオブジェクト { "/layers/0/params/…": 値 } にしてください');
  }
  const badKeys = Object.keys(overrides).filter((k) => !/^\/./.test(k));
  if (badKeys.length) return fail(`"overrides" のキーは "/" で始まる JSON Pointer にしてください(例 "/layers/0/params/pitchX"): ${badKeys.join(', ')}`);
  if (Object.keys(overrides).length) {
    try {
      toSpec(presetId, { overrides });
    } catch (e) {
      const lines = Array.isArray(e.errors) ? e.errors.map(issueJa) : [e.message];
      return fail(`"overrides" をこの模様に当てはめられません: ${lines.join(' / ')}`);
    }
  }
  return { ok: true, presetId, options, overrides: structuredClone(overrides) };
}
