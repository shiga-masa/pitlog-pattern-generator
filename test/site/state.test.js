import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState,
  buildRenderOptions,
  encodeShareQuery,
  decodeShareQuery,
  OVERRIDES_MAX_CHARS,
} from '../../site/app/state.js';

test('buildRenderOptions returns no size or dpi for the preview', () => {
  const s = defaultState();
  s.presetId = 'zc:111101002';
  s.output = { unit: 'mm', width: 20, height: 10, dpi: 300, format: 'svg' };
  assert.deepEqual(buildRenderOptions(s), {});
});

test('buildRenderOptions adds size and dpi for export', () => {
  const s = defaultState();
  s.output = { unit: 'mm', width: 20, height: 10, dpi: 300, format: 'png' };
  assert.deepEqual(buildRenderOptions(s, { forExport: true }), {
    dpi: 300,
    size: { width: 20, height: 10, unit: 'mm' },
  });
});

test('buildRenderOptions omits size when a dimension is null (preset frame)', () => {
  const s = defaultState();
  s.output.width = 20;
  assert.deepEqual(buildRenderOptions(s, { forExport: true }), { dpi: 300 });
});

test('encodeShareQuery omits default values', () => {
  const s = defaultState();
  s.presetId = 'zc:111101002';
  assert.equal(encodeShareQuery(s).query, 'id=zc%3A111101002');
});

test('share query round-trips options, output and overrides', () => {
  const s = defaultState();
  s.presetId = 'zc:t3-9:2';
  s.options = { density: 1.5, motifScale: 'follow', seed: 7, tileMode: 'period', ink: '#111111', paper: '#ffffff' };
  s.overrides = { '/layers/0/params/angle': 30 };
  s.output = { unit: 'px', width: 200, height: 100, dpi: 600, format: 'png' };
  const { query, overridesTooLong } = encodeShareQuery(s);
  assert.equal(overridesTooLong, false);
  const back = decodeShareQuery('?' + query);
  assert.deepEqual(back.warnings, []);
  assert.equal(back.state.presetId, 'zc:t3-9:2');
  assert.equal(back.state.options.density, 1.5);
  assert.equal(back.state.options.seed, 7);
  assert.equal(back.state.options.tileMode, 'period');
  assert.equal(back.state.options.ink, '#111111');
  assert.deepEqual(back.state.overrides, { '/layers/0/params/angle': 30 });
  assert.deepEqual(back.state.output, s.output);
});

test('overrides longer than the limit are reported, not put in the URL', () => {
  const s = defaultState();
  s.overrides = { '/layers/0/params/x': 'a'.repeat(OVERRIDES_MAX_CHARS) };
  const r = encodeShareQuery(s);
  assert.equal(r.overridesTooLong, true);
  assert.equal(r.query.includes('o='), false);
  assert.ok(JSON.parse(r.overridesJson)['/layers/0/params/x']);
});

test('decodeShareQuery warns on unknown keys and invalid values', () => {
  const r = decodeShareQuery('?density=-1&bogus=1&dpi=abc&tile=weird');
  assert.equal(r.warnings.length, 4);
  assert.equal(r.state.options.density, undefined);
  assert.equal(r.state.output.dpi, 300);
  assert.equal(r.state.options.tileMode, undefined);
});

test('decodeShareQuery warns on a broken overrides parameter', () => {
  const r = decodeShareQuery('?o=!!!');
  assert.equal(r.warnings.length, 1);
  assert.deepEqual(r.state.overrides, {});
});

test('optionError gives a Japanese reason for an invalid common option and null for a valid one', async () => {
  const { optionError, optionDefault } = await import('../../site/app/state.js');
  assert.equal(optionError('density', 2), null);
  assert.match(optionError('density', 0), /0 より大きい/);
  assert.match(optionError('seed', 1.5), /整数/);
  assert.match(optionError('tileMode', 'x'), /"frame"/);
  assert.throws(() => optionError('dpi', 300), /known: density/);
  assert.equal(optionDefault('motifScale'), 'follow');
});
