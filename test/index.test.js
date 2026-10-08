import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose, renderSVG, resolveId, getPreset, presetReport, validateSpec } from '../src/index.js';
import { spec } from './fixtures/specs.js';

test('compose concatenates the layers; spec-level fields come from the first input and differences are noted', async () => {
  const c = compose(['礫岩', 'zc:t3-9:1']);
  assert.equal(c.id, 'zc:111101002');
  assert.equal(c.names.ja, '礫岩 + シュードタキライト化');
  assert.deepEqual(c.layers.map((l) => l.archetype), ['grid', 'edgeBand']);
  assert.match(c.provenance.notes, /zc:t3-9:1 frame .* not used/);
  assert.equal(c.code, undefined);
  assert.ok(validateSpec(c).ok);
  const { meta } = await renderSVG(c);
  assert.equal(meta.counts.layers.processed, 2);
});

test('compose renames colliding layer ids and follows avoid / relation inside that input', () => {
  const a = spec();
  const b = spec({ layers: [
    { id: 'circles', archetype: 'grid', motif: { kind: 'dot', d: 1.3 }, params: { pitchX: 9.64, pitchY: 4.26, rows: 6 } },
    { id: 'tris', archetype: 'grid', motif: { kind: 'triangle', base: 4, height: 3, fill: 'paper' }, params: { pitchX: 19.28, pitchY: 8.52, rows: 3, avoid: 'circles' } },
  ] });
  const c = compose([a, b]);
  assert.deepEqual(c.layers.map((l) => l.id), ['circles', 'circles2', 'tris']);
  assert.equal(c.layers[2].params.avoid, 'circles2');
  assert.match(c.provenance.notes, /layer circles renamed to circles2/);
});

test('compose refuses fewer than two inputs and alias specs', () => {
  assert.throws(() => compose([]), TypeError);
  assert.throws(() => compose(['礫岩']), TypeError);
  assert.throws(() => compose([{ schema: 'zc-pattern/1.0.0', id: 'zc:111111002', table: '3-1', names: { ja: 'x' }, aliasOf: 'zc:111101002', provenance: { doc: 'R1', section: '1', measured: true } }, '礫岩']), /alias/);
});

test('the public API resolves table 5 rows to the table 4 drawing', () => {
  assert.equal(resolveId('zc:t5-2:0'), 'zc:t5-2:0');
  assert.deepEqual(getPreset('zc:t5-2:0').layers, getPreset('盛土').layers);
  assert.equal(getPreset('zc:t5-3:0').id, 'zc:t4-3:G');
  assert.equal(presetReport().total.failed, 0);
});
