import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  foldText,
  isBlankRow,
  partitionRows,
  sortByYomi,
  filterCatalog,
  readingsOf,
  primaryReading,
  buildCatalog,
} from '../../site/app/ui/catalog.js';
import { listPresets } from '../../src/index.js';
import { YOMI } from '../../src/presets/yomi.js';

const ROWS = [
  { id: 'a:1', names: { ja: '礫岩' }, symbol: 'Cg', code: '111', archetypes: ['scatter'] },
  { id: 'a:2', names: { ja: '付加コンプレックス' }, code: '222', archetypes: ['empty'] },
  { id: 'a:3', names: { ja: '巨礫岩' }, code: '333', aliasOf: 'a:1', archetypes: ['scatter'] },
  { id: 'a:4', names: { ja: '空の別名' }, aliasOf: 'a:2', archetypes: ['empty'] },
  { id: 'a:5', names: { ja: '砂岩' }, symbol: 'Ss', archetypes: ['grid', 'empty'] },
  { id: 'a:6', names: { ja: '型なし' }, archetypes: [] },
  { id: 'a:7', names: { ja: 'アルコース' }, archetypes: ['grid'] },
];
const Y = { 'a:1': 'れきがん', 'a:2': 'ふかこんぷれっくす', 'a:3': 'きょれきがん', 'a:5': 'さがん', 'a:7': 'あるこーす' };

test('foldText folds katakana to hiragana and NFKC-normalises', () => {
  assert.equal(foldText('アルコース'), 'あるこーす');
  assert.equal(foldText('ＣＧ'), 'cg');
});

test('isBlankRow: all-empty or no archetypes is blank; a mix with a pattern is not', () => {
  assert.equal(isBlankRow(ROWS[1]), true);
  assert.equal(isBlankRow(ROWS[5]), true);
  assert.equal(isBlankRow(ROWS[4]), false);
  assert.equal(isBlankRow(ROWS[0]), false);
});

test('partitionRows excludes blank presets and aliases of blank presets, keeps patterned aliases', () => {
  const { shown, excluded } = partitionRows(ROWS);
  assert.deepEqual(shown.map((r) => r.id), ['a:1', 'a:3', 'a:5', 'a:7']);
  assert.deepEqual(excluded.map((r) => r.id), ['a:2', 'a:4', 'a:6']);
});

test('partitionRows excludes an alias whose target is blank even if the alias row says otherwise', () => {
  const rows = [
    { id: 'b:1', archetypes: ['empty'] },
    { id: 'b:2', aliasOf: 'b:1', archetypes: ['grid'] },
  ];
  assert.deepEqual(partitionRows(rows).shown, []);
});

test('sortByYomi orders by reading and puts rows without a reading last (by id)', () => {
  const rows = [ROWS[6], ROWS[0], ROWS[2], ROWS[4], { id: 'z:9', archetypes: ['grid'] }, { id: 'z:1', archetypes: ['grid'] }];
  const { sorted, missing } = sortByYomi(rows, Y);
  assert.deepEqual(sorted.map((r) => r.id), ['a:7', 'a:3', 'a:5', 'a:1', 'z:1', 'z:9']);
  assert.deepEqual(missing, ['z:1', 'z:9']);
});

test('sortByYomi treats a katakana reading like hiragana and breaks ties by id', () => {
  const rows = [{ id: 'c:2' }, { id: 'c:1' }, { id: 'c:3' }];
  const { sorted } = sortByYomi(rows, { 'c:1': 'イ', 'c:2': 'い', 'c:3': 'あ' });
  assert.deepEqual(sorted.map((r) => r.id), ['c:3', 'c:1', 'c:2']);
});

test('filterCatalog matches name, reading (either kana), symbol, code and id; tokens are ANDed', () => {
  const rows = partitionRows(ROWS).shown;
  const ids = (q) => filterCatalog(rows, q, Y).map((r) => r.id);
  assert.deepEqual(ids(''), ['a:1', 'a:3', 'a:5', 'a:7']);
  assert.deepEqual(ids('礫'), ['a:1', 'a:3']);
  assert.deepEqual(ids('レキ'), ['a:1', 'a:3']);
  assert.deepEqual(ids('さがん'), ['a:5']);
  assert.deepEqual(ids('cg'), ['a:1']);
  assert.deepEqual(ids('333'), ['a:3']);
  assert.deepEqual(ids('a:7'), ['a:7']);
  assert.deepEqual(ids('れき きょ'), ['a:3']);
  assert.deepEqual(ids('存在しない'), []);
});

const MULTI_ROWS = [
  { id: 'm:1', names: { ja: '大礫岩' }, archetypes: ['grid'] },
  { id: 'm:2', names: { ja: '埋土' }, archetypes: ['grid'] },
  { id: 'm:3', names: { ja: '礫岩' }, archetypes: ['grid'] },
];
const MY = { 'm:1': ['だいれきがん', 'たいれきがん'], 'm:2': ['うめど', 'うめつち', 'まいど'], 'm:3': 'れきがん' };

test('readingsOf / primaryReading accept a string or an array', () => {
  assert.deepEqual(readingsOf(MY, 'm:1'), ['だいれきがん', 'たいれきがん']);
  assert.deepEqual(readingsOf(MY, 'm:3'), ['れきがん']);
  assert.deepEqual(readingsOf(MY, 'none'), []);
  assert.equal(primaryReading(MY, 'm:2'), 'うめど');
  assert.equal(primaryReading(MY, 'm:3'), 'れきがん');
  assert.equal(primaryReading(MY, 'none'), null);
  assert.equal(primaryReading({ x: [] }, 'x'), null);
});

test('sortByYomi sorts by the first reading of an array', () => {
  // だいれきがん (primary) < れきがん; たいれきがん / まいど must not be used as the key
  const { sorted, missing } = sortByYomi(MULTI_ROWS, MY);
  assert.deepEqual(sorted.map((r) => r.id), ['m:2', 'm:1', 'm:3']);
  assert.deepEqual(missing, []);
});

test('filterCatalog matches every reading of an array, in either kana', () => {
  const ids = (q) => filterCatalog(MULTI_ROWS, q, MY).map((r) => r.id);
  assert.deepEqual(ids('だいれき'), ['m:1']);
  assert.deepEqual(ids('たいれき'), ['m:1']);
  assert.deepEqual(ids('タイレキ'), ['m:1']);
  assert.deepEqual(ids('うめつち'), ['m:2']);
  assert.deepEqual(ids('マイド'), ['m:2']);
  assert.deepEqual(ids('れきがん'), ['m:1', 'm:3']);
});

test('filterCatalog on the real YOMI finds alternative readings', () => {
  const rows = buildCatalog(listPresets(), YOMI).rows;
  const ids = (q) => filterCatalog(rows, q, YOMI).map((r) => r.id);
  assert.ok(ids('たいれきがん').includes('zc:111121002'));
  assert.ok(ids('まいど').includes('zc:599200002'));
  assert.ok(ids('うめつち').includes('zc:t5-2:1'));
  assert.ok(ids('くろどろ').includes('zc:533102000'));
  assert.ok(ids('カザンカイ').includes('zc:540120000'));
});

test('buildCatalog on the real registry: no blank pattern shown, counts add up, order follows YOMI', () => {
  const all = listPresets();
  const byId = new Map(all.map((r) => [r.id, r]));
  const model = buildCatalog(all, YOMI);
  assert.equal(model.rows.length + model.excluded, all.length);
  assert.ok(model.rows.length > 0);
  for (const r of model.rows) {
    assert.equal(isBlankRow(r), false, r.id);
    if (r.aliasOf) assert.equal(isBlankRow(byId.get(r.aliasOf)), false, r.id);
  }
  const withY = model.rows.filter((r) => !model.missingYomi.includes(r.id));
  const k = (id) => foldText(primaryReading(YOMI, id));
  for (let i = 1; i < withY.length; i += 1) {
    assert.ok(k(withY[i - 1].id) <= k(withY[i].id), `${withY[i - 1].id} before ${withY[i].id}`);
  }
  // rows without a reading are all at the end
  const tail = model.rows.slice(model.rows.length - model.missingYomi.length).map((r) => r.id);
  assert.deepEqual(tail, model.missingYomi);
});
