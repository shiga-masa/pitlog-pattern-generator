import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, attrs, escapeXml, pathData, primitiveToSVG, svgDocument, renderSpecToSVG, renderSVG, renderBatch } from '../../src/render/svg.js';
import { line, polyline, polygon, circle, ellipse, path } from '../../src/core/primitives.js';
import { makeEnv } from '../../src/core/validate.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { PatternRegistry } from '../../src/core/registry.js';
import { NotImplementedError, LimitError, SchemaError } from '../../src/core/errors.js';
import { spec, alias } from '../fixtures/specs.js';

const C = { ink: '#000000', paper: '#ffffff' };

test('fmt: 3 decimals, no trailing zeros, no -0, no exponent; NaN throws', () => {
  assert.equal(fmt(1), '1');
  assert.equal(fmt(0.2392), '0.239');
  assert.equal(fmt(56.0300001), '56.03');
  assert.equal(fmt(-0.0001), '0');
  assert.equal(fmt(1e-7), '0');
  assert.equal(fmt(123456789.12345), '123456789.123');
  assert.equal(fmt(2.0005), '2.001');
  assert.throws(() => fmt(NaN), /finite/);
  assert.throws(() => fmt(Infinity), /finite/);
});

test('attrs and escaping', () => {
  assert.equal(attrs({ a: 1.5, b: undefined, c: null, d: 'x"<' }), 'a="1.5" d="x&quot;&lt;"');
  assert.equal(escapeXml(`&'`), '&amp;&apos;');
});

test('each primitive serialises with only ink/paper colours', () => {
  assert.equal(primitiveToSVG(line(0, 0, 1.23456, 2), C), '<line x1="0" y1="0" x2="1.235" y2="2"/>');
  assert.equal(primitiveToSVG(polyline([[0, 0], [1, 1]]), C), '<polyline points="0,0 1,1"/>');
  assert.equal(primitiveToSVG(polygon([[0, 0], [1, 0], [0, 1]], { fill: 'paper' }), C), '<polygon points="0,0 1,0 0,1" fill="#ffffff"/>');
  assert.equal(primitiveToSVG(circle(1, 2, 3.5, { fill: 'ink' }), C), '<circle cx="1" cy="2" r="3.5" fill="#000000"/>');
  assert.equal(primitiveToSVG(circle(1, 2, 3.5, { fill: 'ink', stroke: 'none' }), C), '<circle cx="1" cy="2" r="3.5" stroke="none" fill="#000000"/>');
  assert.equal(primitiveToSVG(path([{ op: 'M', x: 0, y: 0 }, { op: 'C', x1: 1, y1: 1, x2: 2, y2: 2, x: 3, y: 3 }, { op: 'Z' }]), C), '<path d="M0 0C1 1 2 2 3 3Z"/>');
  assert.equal(primitiveToSVG(line(0, 0, 1, 0, { dash: [5.7, 2.75], dashOffset: 1 }), C), '<line x1="0" y1="0" x2="1" y2="0" stroke-dasharray="5.7 2.75" stroke-dashoffset="1"/>');
  assert.equal(pathData([{ op: 'M', x: -0.00001, y: 1 }, { op: 'Q', x1: 1, y1: 2, x: 3, y: 4 }]), 'M0 1Q1 2 3 4');
});

test('ellipse rotation: math CCW becomes SVG rotate(-deg)', () => {
  assert.equal(primitiveToSVG(ellipse(5, 5, 2, 1, 22.5, { fill: 'paper' }), C), '<ellipse cx="5" cy="5" rx="2" ry="1" transform="rotate(-22.5 5 5)" fill="#ffffff"/>');
});

test('svgDocument writes units on width/height and pt viewBox', () => {
  const d = svgDocument({ region: { width: 56.03, height: 28.41 }, unit: 'pt', dpi: 96, body: '' });
  assert.match(d, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="56.03pt" height="28.41pt" viewBox="0 0 56.03 28.41"><\/svg>$/);
  const mm = svgDocument({ region: { width: 72, height: 72 }, unit: 'mm', dpi: 96, body: '' });
  assert.match(mm, /width="25.4mm"/);
  const px = svgDocument({ region: { width: 72, height: 36 }, unit: 'px', dpi: 300, body: '' });
  assert.match(px, /width="300" height="150"/);
});

// A stand-in grid archetype that draws one circle per row: lets the pipeline run before stage 1.
const fakeGrid = {
  ...ARCHETYPES.grid,
  render(layer, ctx) {
    const prims = [];
    for (let r = 0; r < layer.params.rows; r++) {
      prims.push(circle(ctx.region.width / 2, (r + 0.5) * layer.params.pitchY, layer.motif.d / 2, { fill: layer.motif.fill }));
    }
    return { primitives: prims, placed: prims.length, skipped: 1, warnings: ['fake'] };
  },
};
const fakeEnv = makeEnv({ archetypes: { ...ARCHETYPES, grid: fakeGrid } });

test('pipeline: resolved, density-applied layer reaches the archetype; output is a complete SVG', () => {
  const { svg, meta } = renderSpecToSVG(spec(), { density: 2 }, { env: fakeEnv });
  assert.match(svg, /^<svg [^>]*viewBox="0 0 56.03 28.41">/);
  assert.match(svg, /<title>礫岩<\/title>/);
  assert.match(svg, /<clipPath id="zc-zc_111101002-clip">/);
  assert.match(svg, /<rect x="0" y="0" width="56.03" height="28.41" fill="#ffffff"\/>/);
  assert.match(svg, /stroke-width="0.239" stroke-linecap="round" stroke-linejoin="miter"/);
  assert.match(svg, /<g data-layer="circles" clip-path="url\(#zc-zc_111101002-clip\)">(<circle [^>]*r="1.75" fill="#000000"\/>){3}<\/g>/);
  assert.equal(meta.counts.layers.processed, 1);
  assert.deepEqual(meta.counts.instances, { placed: 3, skipped: 1 });
  assert.equal(meta.counts.primitives, 3);
  assert.ok(meta.warnings.includes('layer circles: fake'));
});

test('pipeline output contains exactly two colours', () => {
  const { svg } = renderSpecToSVG(spec({ ink: '#2B2420', table: '4-1' }), {}, { env: fakeEnv });
  const colours = new Set(svg.match(/#[0-9a-fA-F]{3,8}\b/g));
  assert.deepEqual([...colours].sort(), ['#2b2420', '#ffffff']);
  assert.doesNotMatch(svg, /opacity|gradient|rgba?\(/);
});

test('frame is drawn last, inset by half its line width; ground none omits the paper rect', () => {
  const { svg } = renderSpecToSVG(spec({ table: '4-1', ground: 'none' }), {}, { env: fakeEnv });
  assert.match(svg, /<rect x="0.1" y="0.1" width="56.24" height="28.42" fill="none" stroke="#000000" stroke-width="0.2"\/><\/svg>$/);
  assert.doesNotMatch(svg, /fill="#ffffff"\/><g/);
});

test('layers draw in z order (ties keep array order)', () => {
  const s = spec();
  s.layers.push({ ...structuredClone(s.layers[0]), id: 'top', z: -1 });
  const { svg } = renderSpecToSVG(s, {}, { env: fakeEnv });
  assert.ok(svg.indexOf('data-layer="top"') < svg.indexOf('data-layer="circles"'));
});

test('an archetype that is not implemented surfaces as NotImplementedError, never as an empty picture', () => {
  const stub = { ...fakeGrid, render: () => { throw new NotImplementedError('grid.render', 'arch-1'); } };
  const env = makeEnv({ archetypes: { ...ARCHETYPES, grid: stub } });
  assert.throws(() => renderSpecToSVG(spec(), {}, { env }), (e) => e instanceof NotImplementedError && e.owner === 'arch-1');
});

test('the real archetypes render the fixture spec in frame and period mode with the default environment', () => {
  for (const tileMode of ['frame', 'period']) {
    const { svg, meta } = renderSpecToSVG(spec(), { tileMode });
    assert.ok(meta.counts.primitives > 0, tileMode);
    assert.match(svg, /^<svg /);
  }
});

test('bad archetype output is rejected with the layer id', () => {
  const env = makeEnv({ archetypes: { ...ARCHETYPES, grid: { ...fakeGrid, render: () => ({ primitives: [{ type: 'circle', cx: 0, cy: 0, r: 1, style: { fill: '#ff0000' } }], placed: 1, skipped: 0, warnings: [] }) } } });
  assert.throws(() => renderSpecToSVG(spec(), {}, { env }), /layer circles \(grid\): primitive 0/);
  const env2 = makeEnv({ archetypes: { ...ARCHETYPES, grid: { ...fakeGrid, render: () => ({ primitives: [] }) } } });
  assert.throws(() => renderSpecToSVG(spec(), {}, { env: env2 }), /placed must be an integer/);
});

test('primitive limit raises LimitError', () => {
  const many = { ...fakeGrid, render: () => ({ primitives: Array.from({ length: 200001 }, () => circle(0, 0, 1, { fill: 'ink' })), placed: 200001, skipped: 0, warnings: [] }) };
  assert.throws(() => renderSpecToSVG(spec(), {}, { env: makeEnv({ archetypes: { ...ARCHETYPES, grid: many } }) }), LimitError);
});

test('invalid options stop the render', () => {
  assert.throws(() => renderSpecToSVG(spec(), { denstiy: 2 }, { env: fakeEnv }), SchemaError);
});

test('renderSVG resolves ids through a registry; renderBatch counts processed/skipped/failed', async () => {
  const reg = new PatternRegistry({ env: fakeEnv });
  reg.add(spec());
  reg.add(alias('zc:111101102', 'zc:111101002'));
  const one = await renderSVG('sym:Cg', {}, { registry: reg, env: fakeEnv });
  assert.equal(one.meta.id, 'zc:111101002');
  const b = await renderBatch(['zc:111101002', 'zc:111101102', 'zc:111101002', 'zc:999999999'], {}, { registry: reg, env: fakeEnv });
  assert.deepEqual(b.counts, { processed: 2, skipped: 1, failed: 1 });
  assert.match(b.results[3].error, /ResolveError/);
});
