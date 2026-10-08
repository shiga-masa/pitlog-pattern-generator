// YOMI coverage: every preset that draws a pattern (resolved layers not all 'empty') has a hiragana
// reading, except the ids in KNOWN_MISSING, each with the reason. Counts are printed at the end.
// A value is a string or a non-empty array of distinct readings (first = primary, used for sorting).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPresets } from '../../src/index.js';
import { YOMI } from '../../src/presets/yomi.js';

/** Ids deliberately left without a reading (the reading could not be established). */
const KNOWN_MISSING = {};

// hiragana, long-vowel mark, middle dot, brackets, digits and ASCII/full-width symbols only
const ALLOWED = /^[ぁ-ゖー・（）()「」［］[\]0-9０-９\-－～~、,./／ ]+$/u;
const HAS_KANA = /[ぁ-ゖ]/u;

const all = listPresets();
const targets = all.filter((p) => !p.archetypes.every((a) => a === 'empty'));

test('YOMI covers every preset with a pattern (except KNOWN_MISSING)', () => {
  const missing = targets.filter((p) => !(p.id in YOMI) && !(p.id in KNOWN_MISSING)).map((p) => `${p.id} ${p.names.ja}`);
  assert.deepEqual(missing, [], `ids without a reading:\n${missing.join('\n')}`);
  console.log(`yomi: targets ${targets.length}, with reading ${targets.filter((p) => p.id in YOMI).length}, known missing ${Object.keys(KNOWN_MISSING).length}`);
});

test('KNOWN_MISSING ids are targets and have no YOMI entry', () => {
  const ids = new Set(targets.map((p) => p.id));
  for (const id of Object.keys(KNOWN_MISSING)) {
    assert.ok(ids.has(id), `${id} in KNOWN_MISSING is not a target preset`);
    assert.ok(!(id in YOMI), `${id} is in KNOWN_MISSING but has a reading; remove it from KNOWN_MISSING`);
  }
});

test('YOMI has no stray ids (only targets)', () => {
  const ids = new Set(targets.map((p) => p.id));
  const stray = Object.keys(YOMI).filter((id) => !ids.has(id));
  assert.deepEqual(stray, [], `YOMI ids that are not pattern presets: ${stray.join(', ')}`);
});

const isReading = (y) => typeof y === 'string' && ALLOWED.test(y) && HAS_KANA.test(y);

test('every reading is hiragana (a string, or every element of an array)', () => {
  const bad = Object.entries(YOMI).filter(([, y]) => (Array.isArray(y) ? y.length === 0 || !y.every(isReading) : !isReading(y)));
  assert.deepEqual(bad, [], `readings with forbidden characters: ${bad.map(([id, y]) => `${id}=${y}`).join(', ')}`);
});

test('an array of readings has no duplicates', () => {
  const dup = Object.entries(YOMI).filter(([, y]) => Array.isArray(y) && new Set(y).size !== y.length);
  assert.deepEqual(dup, [], `duplicate readings: ${dup.map(([id, y]) => `${id}=${y}`).join(', ')}`);
});

test('required alternative readings are present with the primary reading first', () => {
  const expect = {
    'zc:111121002': ['だいれきがん', 'たいれきがん'],
    'zc:599200002': ['うめど', 'うめつち', 'まいど'],
    'zc:t5-2:1': ['うめど', 'うめつち', 'まいど'],
    'zc:599200001': ['もりど', 'もりつち'],
    'zc:533102000': ['こくでい', 'くろどろ', 'くろでい'],
    'zc:540120000': ['かざんばい', 'かざんかい'],
    'zc:531211200': ['ちゅうさ', 'なかずな', 'ちゅうずな'],
    'zc:531111300': ['さいれき', 'ほそれき'],
  };
  for (const [id, ys] of Object.entries(expect)) assert.deepEqual(YOMI[id], ys, id);
});

test('presets with the same name share the same reading', () => {
  const byName = new Map();
  for (const p of targets) {
    if (!(p.id in YOMI)) continue;
    const prev = byName.get(p.names.ja);
    if (prev !== undefined) assert.deepEqual(YOMI[p.id], prev, `${p.id} ${p.names.ja}`);
    else byName.set(p.names.ja, YOMI[p.id]);
  }
});
