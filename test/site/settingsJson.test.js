import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSVG } from '../../src/index.js';
import { defaultState } from '../../site/app/state.js';
import { buildSettings, formatSettings, parseSettings, issueJa } from '../../site/app/ui/settingsJson.js';

const stateOf = (presetId, options = {}, overrides = {}) => ({ ...defaultState(), presetId, options, overrides });

test('settings JSON lists the preset, all seven options with defaults filled, and overrides', () => {
  const s = buildSettings(stateOf('zc:111300002', { density: 2 }));
  assert.deepEqual(s, {
    preset: 'zc:111300002',
    options: { density: 2, motifScale: 'follow', strokeScale: 1, seed: 0, tileMode: 'frame', ink: '#000000', paper: '#ffffff', overrides: {} },
  });
});

test('settings JSON can be passed to renderSVG as it is', async () => {
  const s = JSON.parse(formatSettings(stateOf('zc:121000000', { tileMode: 'period' }, { '/layers/0/params/rowPitches': [8, 9] })));
  const { svg } = await renderSVG(s.preset, s.options);
  assert.match(svg, /^<svg/);
});

test('parse of a formatted state gives the same settings; defaults become "key removed"', () => {
  const st = stateOf('zc:111300002', { density: 2, seed: 0 }, { '/layers/0/params/pitchX': 9 });
  const r = parseSettings(formatSettings(st));
  assert.equal(r.ok, true);
  assert.equal(r.presetId, 'zc:111300002');
  assert.deepEqual(r.overrides, { '/layers/0/params/pitchX': 9 });
  assert.equal(r.options.density, 2);
  assert.equal(r.options.seed, undefined);
  assert.equal(r.options.ink, undefined);
  assert.deepEqual(Object.keys(r.options).sort(), ['density', 'ink', 'motifScale', 'paper', 'seed', 'strokeScale', 'tileMode']);
});

test('array overrides (rowPitches, colPitches) are accepted through the JSON', () => {
  const r = parseSettings(JSON.stringify({
    preset: 'zc:121000000',
    options: { overrides: { '/layers/0/params/rowPitches': [8.7, 8.4], '/layers/1/params/colPitches': [[22, 21], [22.5, 20.5]] } },
  }));
  assert.equal(r.ok, true);
});

test('the preset falls back to the current one and an alias is resolved', () => {
  assert.equal(parseSettings('{"options": {}}', { currentPresetId: 'zc:111300002' }).presetId, 'zc:111300002');
  assert.match(parseSettings('{"options": {}}', { currentPresetId: null }).error, /"preset" に模様の ID/);
});

test('invalid settings are rejected with a Japanese reason and nothing to apply', () => {
  const cases = [
    ['{"preset": ', /JSON として読めません/],
    ['[]', /オブジェクト/],
    ['{"preset": "zc:111300002", "size": {}}', /未知の項目 "size"/],
    ['{"preset": "zc:000000000"}', /模様として見つかりません/],
    ['{"preset": "zc:111300002", "options": {"density": 0}}', /options\.density .*0 より大きい数値/],
    ['{"preset": "zc:111300002", "options": {"ink": "red"}}', /#rrggbb/],
    ['{"preset": "zc:111300002", "options": {"dpi": 300}}', /未知の項目 "dpi"/],
    ['{"preset": "zc:111300002", "options": {"overrides": {"layers/0": 1}}}', /JSON Pointer/],
    ['{"preset": "zc:111300002", "options": {"overrides": {"/layers/0/params/pitchX": -1}}}', /pitchX: 0 より大きくしてください\(入力 -1\)/],
    ['{"preset": "zc:111300002", "options": {"overrides": {"/layers/0/params/rowPitches": []}}}', /要素を 1 個以上/],
    ['{"preset": "zc:111300002", "options": {"overrides": {"/layers/5/params/pitchX": 1}}}', /要素はありません|場所はこの模様にありません/],
  ];
  for (const [text, re] of cases) {
    const r = parseSettings(text, { currentPresetId: 'zc:111300002' });
    assert.equal(r.ok, false, text);
    assert.match(r.error, re, text);
  }
});

test('issueJa translates library messages and keeps unknown ones with a Japanese lead', () => {
  assert.equal(issueJa({ path: '/a', message: 'must be <= 360, got 400' }), '/a: 360 以下にしてください(入力 400)');
  assert.equal(issueJa({ path: '', message: 'unknown value "q"', candidates: ['frame', 'fit'] }), '候補にない値です: "q"。候補: frame, fit');
  assert.equal(issueJa({ path: '/b', message: 'something new' }), '/b: 値が合いません(something new)');
});
