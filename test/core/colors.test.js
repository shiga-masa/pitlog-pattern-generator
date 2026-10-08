import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkColors, isColor, normalizeColor, DEFAULT_INK, DEFAULT_PAPER } from '../../src/core/colors.js';
import { validateSpec, validateOptions } from '../../src/core/validate.js';
import { makeStyle } from '../../src/core/primitives.js';
import { spec } from '../fixtures/specs.js';

test('defaults: ink pure black, paper pure white', () => {
  assert.equal(DEFAULT_INK, '#000000');
  assert.equal(DEFAULT_PAPER, '#ffffff');
});

test('only #rrggbb is a colour', () => {
  for (const ok of ['#000000', '#FFFFFF', '#2b2420']) assert.equal(isColor(ok), true, ok);
  for (const bad of ['#000', '#00000000', 'black', 'rgb(0,0,0)', '000000', '#gggggg', '', null, 0]) assert.equal(isColor(bad), false, String(bad));
  assert.equal(normalizeColor('#ABCDEF'), '#abcdef');
  assert.throws(() => normalizeColor('#abc'), /#rrggbb/);
});

test('spec with custom ink/paper is accepted', () => {
  const r = validateSpec(spec({ ink: '#1a2b3c', paper: '#fdfdfd' }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('malformed ink/paper are rejected with the reason', () => {
  for (const bad of ['#000', '#000000ff', 'black', 'rgba(0,0,0,0.5)', 'transparent']) {
    const r = validateSpec(spec({ ink: bad }));
    assert.equal(r.ok, false, bad);
    assert.ok(r.errors.some((e) => e.path === '/ink' && /#rrggbb/.test(e.message)), `${bad}: ${JSON.stringify(r.errors)}`);
  }
  assert.equal(validateOptions({ paper: '#fff' }).ok, false);
});

test('a third colour anywhere is rejected (layer, motif, primitive style, options)', () => {
  const a = spec();
  a.layers[0].color = '#ff0000';
  const ra = validateSpec(a);
  assert.equal(ra.ok, false);
  assert.ok(ra.errors.some((e) => e.path === '/layers/0/color' && /only the two root colours/.test(e.message)));

  const b = spec();
  b.layers[0].motif.fill = '#ff0000';
  const rb = validateSpec(b);
  assert.ok(rb.errors.some((e) => e.path === '/layers/0/motif/fill' && /not allowed here/.test(e.message)));

  const c = spec({ background: '#eeeeee' });
  assert.ok(validateSpec(c).errors.some((e) => e.path === '/background'));

  assert.equal(validateOptions({ stroke: { color: '#123456' } }).ok, false);
  assert.throws(() => makeStyle({ stroke: '#ff0000' }), /ink, paper, none/);
  assert.throws(() => makeStyle({ color: '#ff0000' }), /unknown key "color"/);
});

test('gradients and transparency are rejected', () => {
  for (const [k, v] of [['opacity', 0.5], ['gradient', { from: 'ink' }], ['fillOpacity', 0.3]]) {
    const s = spec();
    s.layers[0][k] = v;
    assert.ok(validateSpec(s).errors.some((e) => e.path === `/layers/0/${k}`), k);
  }
  const g = spec();
  g.layers[0].motif.fill = 'linear-gradient(#000, #fff)';
  assert.equal(validateSpec(g).ok, false);
  const t = spec();
  t.layers[0].motif.fill = 'transparent';
  assert.equal(validateSpec(t).ok, false);
});

test('checkColors lists every violation, not just the first', () => {
  const r = checkColors({ ink: '#00', layers: [{ color: '#111111' }, { motif: { fill: 'rgb(1,2,3)' } }] });
  assert.equal(r.errors.length, 3);
});

test('ink == paper is a warning, not an error', () => {
  const r = validateSpec(spec({ ink: '#ffffff', paper: '#FFFFFF' }));
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => /same colour/.test(w.message)));
});
