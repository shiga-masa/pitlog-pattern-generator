import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILDERS, EXTENTS, KINDS } from '../../src/motifs/glyphs.js';
import { exactBBox } from '../../src/motifs/curves.js';
import { createRng } from '../../src/core/rng.js';
import { GeometryError } from '../../src/core/errors.js';

const TOL = 1e-9;
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= TOL, `${msg}: ${a} vs ${b}`);
const ctxFor = (seed) => ({ strokeWidth: 0.239, rng: createRng(seed) });
const PT = { kind: 'ptGlyph', stemLen: 5.75, armLen: 5.56 };
const VEIN = { kind: 'vein', chord: 28.01, height: 16.49, secondOffset: { x: 6.41, y: 6.98 }, rungs: 6, rungLengthMin: 8.21, rungLengthMax: 9.58 };
const BLOB_A = { kind: 'blob', w: 5.22, h: 4.2, vertices: 17, irregularity: 0.12, rotation: 0, fill: 'paper' };
const PATH = { kind: 'path', d: 'M0 0 C 2 -3 4 3 6 0 L 6 2 H 0 Z', fill: 'ink' };
const scaled = (m, f) => Object.fromEntries(Object.entries(m).map(([k, v]) => {
  if (k === 'kind' || k === 'rungs' || k === 'vertices') return [k, v];
  if (typeof v === 'number') return [k, v * f];
  if (v && typeof v === 'object') return [k, Object.fromEntries(Object.entries(v).map(([a, b]) => [a, b * f]))];
  return [k, v];
}));
const PAINTS = ['ink', 'paper', 'none'];

test('every glyph kind has a descriptor, a builder and an extent function', () => {
  for (const k of ['ptGlyph', 'vein', 'blob', 'path']) {
    assert.ok(KINDS[k], `descriptor ${k}`);
    assert.equal(typeof BUILDERS[k], 'function');
    assert.equal(typeof EXTENTS[k], 'function');
  }
});

test('ptGlyph default: one open path, extent = armLen x stemLen, top-left corner at the start', () => {
  const p = BUILDERS.ptGlyph(PT, ctxFor(1));
  assert.equal(p.length, 1);
  const e = EXTENTS.ptGlyph(PT);
  near(e.w, 5.56, 'width');
  near(e.h, 5.75, 'height');
  const b = exactBBox(p);
  near(b.minX, -5.56 / 2, 'left');
  near(b.minY, -5.75 / 2, 'top');
});

test('vein default: two S curves plus one cross stroke per rung', () => {
  const p = BUILDERS.vein(VEIN, ctxFor(1));
  assert.equal(p.filter((q) => q.type === 'path').length, 2);
  assert.equal(p.filter((q) => q.type === 'line').length, 6);
});

test('vein extent = chord + secondOffset.x by height + secondOffset.y', () => {
  const e = EXTENTS.vein(VEIN);
  near(e.w, 28.01 + 6.41, 'width');
  near(e.h, 16.49 + 6.98, 'height');
});

test('vein cross strokes are perpendicular to the chord and lie within the length range', () => {
  const p = BUILDERS.vein(VEIN, ctxFor(1));
  const chord = [VEIN.chord, -VEIN.height];
  for (const q of p.filter((x) => x.type === 'line')) {
    const dx = q.x2 - q.x1;
    const dy = q.y2 - q.y1;
    near(dx * chord[0] + dy * chord[1], 0, 'perpendicular to the chord');
    const L = Math.hypot(dx, dy);
    assert.ok(L >= VEIN.rungLengthMin - TOL && L <= VEIN.rungLengthMax + TOL, `length ${L}`);
  }
});

test('vein with rungs = 0 draws the two curves only', () => {
  assert.equal(BUILDERS.vein({ ...VEIN, rungs: 0 }, ctxFor(1)).length, 2);
});

test('blob default: one polygon with the declared vertex count and bbox exactly w x h', () => {
  const p = BUILDERS.blob(BLOB_A, ctxFor(3));
  assert.equal(p.length, 1);
  assert.equal(p[0].type, 'polygon');
  assert.equal(p[0].points.length, 17);
  const e = EXTENTS.blob(BLOB_A);
  near(e.w, 5.22, 'width');
  near(e.h, 4.2, 'height');
});

test('blob with a rotation keeps the declared bbox', () => {
  const e = EXTENTS.blob({ ...BLOB_A, rotation: 30 });
  near(e.w, 5.22, 'width');
  near(e.h, 4.2, 'height');
});

test('blob: same layer seed gives the same outline; a different layer seed gives a different one', () => {
  const a = BUILDERS.blob(BLOB_A, ctxFor(11));
  const b = BUILDERS.blob(BLOB_A, ctxFor(11));
  const c = BUILDERS.blob(BLOB_A, ctxFor(12));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a[0].points, c[0].points);
});

test('blob: each copy in one layer has the same outline (fork does not advance the layer stream)', () => {
  const rng = createRng(5);
  const first = BUILDERS.blob(BLOB_A, { strokeWidth: 0.239, rng });
  const second = BUILDERS.blob(BLOB_A, { strokeWidth: 0.239, rng });
  assert.deepEqual(first, second);
});

test('blob with irregularity 0 is the w x h ellipse polygon (vertex on each axis extreme in the fit)', () => {
  const p = BUILDERS.blob({ ...BLOB_A, irregularity: 0 }, ctxFor(1));
  const b = exactBBox(p);
  near(b.maxX - b.minX, 5.22, 'x span');
  near(b.maxY - b.minY, 4.2, 'y span');
});

test('blob: unmeasured irregularity (null) is a GeometryError that names the field', () => {
  assert.throws(() => BUILDERS.blob({ ...BLOB_A, irregularity: null }, ctxFor(1)), (err) => err instanceof GeometryError && /irregularity/.test(err.message));
});

test('blob: unmeasured rotation (null) is a GeometryError that names the field', () => {
  assert.throws(() => BUILDERS.blob({ ...BLOB_A, rotation: null }, ctxFor(1)), (err) => err instanceof GeometryError && /rotation/.test(err.message));
});

test('blob without a seeded rng is a GeometryError', () => {
  assert.throws(() => BUILDERS.blob(BLOB_A, { strokeWidth: 0.239 }), GeometryError);
});

test('path: user data is parsed and centred; the fill token is kept', () => {
  const p = BUILDERS.path(PATH, ctxFor(1));
  assert.equal(p.length, 1);
  assert.equal(p[0].type, 'path');
  assert.equal(p[0].style.fill, 'ink');
  const b = exactBBox(p);
  near((b.minX + b.maxX) / 2, 0, 'centred x');
  near((b.minY + b.maxY) / 2, 0, 'centred y');
});

test('path: unsupported commands are rejected with the supported list', () => {
  assert.throws(() => BUILDERS.path({ ...PATH, d: 'M0 0 A 1 1 0 0 1 2 2' }, ctxFor(1)), /supported: M L H V C Q Z/);
});

test('path: empty or malformed data is rejected', () => {
  assert.throws(() => BUILDERS.path({ ...PATH, d: '   ' }, ctxFor(1)), TypeError);
  assert.throws(() => BUILDERS.path({ ...PATH, d: 'L 1 1 L 2 2' }, ctxFor(1)), /first command must be M/);
});

test('density 2 (dimensions halved by the caller) halves the extent of the parametric glyphs', () => {
  for (const [k, m] of [['ptGlyph', PT], ['vein', VEIN], ['blob', BLOB_A]]) {
    const full = EXTENTS[k](m);
    const half = EXTENTS[k](scaled(m, 0.5));
    near(half.w, full.w / 2, `${k} width`);
    near(half.h, full.h / 2, `${k} height`);
  }
});

test('glyph builders use only the paint tokens ink / paper / none', () => {
  for (const [k, m] of [['ptGlyph', PT], ['vein', VEIN], ['blob', BLOB_A], ['path', PATH]]) {
    for (const p of BUILDERS[k](m, ctxFor(2))) {
      assert.ok(PAINTS.includes(p.style.stroke), `${k} stroke`);
      assert.ok(PAINTS.includes(p.style.fill), `${k} fill`);
    }
  }
});
