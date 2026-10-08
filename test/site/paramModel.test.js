import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPreset, listPresets } from '../../src/index.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { MOTIFS } from '../../src/motifs/index.js';
import {
  editableDescriptor, isEditable, checkValue, visibleFields, isWideField, layerHeading, ARCHETYPE_JA,
} from '../../site/app/ui/paramModel.js';

const GRID = ARCHETYPES.grid.PARAMS.fields;
const keysOf = (fields, base, ctx) => visibleFields(fields, base, ctx).map((f) => f.key);

test('arrays, motif lists and strings have no editable form', () => {
  for (const k of ['cycle', 'rotations', 'rowPitches', 'colPitches', 'rowShifts', 'avoid']) {
    assert.equal(editableDescriptor(GRID[k]), null, k);
    assert.equal(isEditable(GRID[k]), false, k);
  }
  assert.ok(isEditable(GRID.pitchX));
  assert.ok(isEditable(GRID.rowOffset));
});

test('a union keeps only its scalar alternatives', () => {
  const angle = editableDescriptor(ARCHETYPES.hatch.PARAMS.fields.angle);
  assert.ok(angle.options.every((o) => o.type !== 'array'));
  assert.equal(editableDescriptor({ type: 'union', options: [{ type: 'array', items: { type: 'number' } }] }), null);
});

test('mudstone (uneven rows) shows the scalar grid fields and hides the row gap list', () => {
  const layer = getPreset('zc:111300002').layers[0];
  const keys = keysOf(GRID, layer.params, { archetype: 'grid', params: layer.params });
  assert.deepEqual(keys, ['pitchX', 'pitchY', 'rowOffset', 'rows', 'cols', 'flipRows', 'edgeMode']);
});

test('grid assign and phase are shown only when the layer has a cycle', () => {
  const plain = getPreset('zc:111300002').layers[0];
  assert.ok(!keysOf(GRID, plain.params, { archetype: 'grid', params: plain.params }).includes('assign'));
  const breccia = getPreset('zc:111102002').layers[0];
  const keys = keysOf(GRID, breccia.params, { archetype: 'grid', params: breccia.params });
  assert.ok(keys.includes('assign') && keys.includes('phase'));
  assert.ok(!keys.includes('cycle'));
});

test('a field whose preset value has a form the panel cannot show is hidden', () => {
  const hatch = ARCHETYPES.hatch.PARAMS.fields;
  assert.ok(keysOf(hatch, { angle: 45 }, { archetype: 'hatch' }).includes('angle'));
  assert.ok(!keysOf(hatch, { angle: [45, 135] }, { archetype: 'hatch' }).includes('angle'));
});

test('no preset shows an array or string field, and every layer heading avoids internal names', () => {
  let layers = 0;
  for (const row of listPresets()) {
    if (row.aliasOf) continue;
    const spec = getPreset(row.id);
    spec.layers.forEach((layer, i) => {
      layers += 1;
      const arch = ARCHETYPES[layer.archetype];
      const shown = visibleFields(arch.PARAMS.fields, layer.params ?? {}, { archetype: layer.archetype, params: layer.params ?? {} });
      if (layer.motif) shown.push(...visibleFields(MOTIFS[layer.motif.kind].descriptor.fields, layer.motif));
      for (const { key, desc } of shown) {
        assert.ok(!['array', 'string', 'motif', 'record'].includes(desc.type), `${row.id} ${key}`);
      }
      const h = layerHeading(layer, i, spec.layers.length);
      assert.ok(!h.includes(layer.id), `${row.id}: ${h}`);
      assert.ok(!h.includes(layer.archetype) || layer.archetype in ARCHETYPE_JA === false, `${row.id}: ${h}`);
    });
  }
  assert.ok(layers > 200, `checked ${layers} layers`);
});

test('layer headings are numbered only when there are several layers', () => {
  const two = getPreset('zc:121000000');
  assert.equal(layerHeading(two.layers[0], 0, 2), '層 1(格子配置・点)');
  assert.equal(layerHeading(two.layers[1], 1, 2), '層 2(格子配置・円)');
  const one = getPreset('zc:111102002');
  assert.equal(layerHeading(one.layers[0], 0, 1), '模様(格子配置・モチーフの循環)');
});

test('checkValue rejects out-of-range input with a Japanese reason', () => {
  assert.equal(checkValue(GRID.pitchX, -1).error, '0 より大きくしてください');
  assert.equal(checkValue(GRID.pitchX, 'a').error, '数値を入力してください');
  assert.equal(checkValue(GRID.pitchX, 5).error, null);
  assert.equal(checkValue(GRID.pitchX, undefined).error, '必須の項目です');
});

test('wide fields: objects of several sub-fields and long titles span both columns', () => {
  const margin = editableDescriptor(ARCHETYPES.hatch.PARAMS.fields.margin);
  assert.equal(isWideField(margin, '端からの余白'), true);
  assert.equal(isWideField(editableDescriptor(GRID.rowOffset), '奇数行のずれ'), false);
  assert.equal(isWideField(GRID.pitchX, '横ピッチ'), false);
  assert.equal(isWideField(GRID.pitchX, 'あ'.repeat(17)), true);
});
