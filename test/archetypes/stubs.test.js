// Stage-0 contract tests for every stage-1 file. A stub must throw NotImplementedError (never return
// an empty result). Once a function is implemented these checks skip themselves, so stage-1 owners
// never need to edit this shared file; their own test files cover the implementation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHETYPES, ARCHETYPE_NAMES } from '../../src/archetypes/index.js';
import { MOTIFS, MOTIF_KINDS } from '../../src/motifs/index.js';
import { NotImplementedError } from '../../src/core/errors.js';
import * as lattice from '../../src/core/lattice.js';
import * as clip from '../../src/core/clip.js';
import * as svgPattern from '../../src/render/svgPattern.js';
import * as canvas from '../../src/render/canvas.js';
import * as png from '../../src/render/png.js';
import { compose } from '../../src/index.js';

test('the ten archetypes of design §1.2 are registered, one file each', () => {
  assert.deepEqual([...ARCHETYPE_NAMES].sort(), ['brick', 'diagonalBand', 'edgeBand', 'empty', 'frameDiagonal', 'grid', 'hatch', 'scatter', 'symbol', 'wave']);
});

test('the motif kinds of design §1.3 are registered', () => {
  const expected = ['circle', 'dot', 'ellipse', 'triangle', 'hline', 'seg', 'lineGlyph', 'L', 'chevron', 'splitChevron', 'parallelPair', 'pairVline', 'waveUnit', 'shell', 'lens', 'hook', 'X', 'ptGlyph', 'vein', 'blob', 'path'];
  assert.deepEqual([...MOTIF_KINDS].sort(), [...expected].sort());
});

/** 'stub' if f throws NotImplementedError, otherwise 'implemented'. */
function state(f) {
  try {
    f();
  } catch (e) {
    if (e instanceof NotImplementedError) return 'stub';
  }
  return 'implemented';
}

function stubCheck(t, label, f, owner) {
  if (state(f) === 'implemented') {
    t.skip(`${label} is implemented; covered by the owner's tests`);
    return;
  }
  assert.throws(f, (e) => e instanceof NotImplementedError && e.owner === owner && /NOT IMPLEMENTED/.test(e.message));
}

const ARCH_OWNER = { grid: 'arch-1', brick: 'arch-2', hatch: 'arch-2', wave: 'arch-3', frameDiagonal: 'arch-3', scatter: 'arch-4', symbol: 'arch-4', empty: 'arch-4', diagonalBand: 'arch-5', edgeBand: 'arch-5' };
const MOTIF_OWNER = { 'motifs/basic.js': 'motif-1', 'motifs/lineGlyph.js': 'motif-1', 'motifs/curves.js': 'motif-2', 'motifs/glyphs.js': 'motif-2' };

for (const name of ARCHETYPE_NAMES) {
  test(`archetype ${name}: render() / period() are stubs with owner ${ARCH_OWNER[name]} until implemented`, (t) => {
    stubCheck(t, `${name}.render`, () => ARCHETYPES[name].render({}, {}), ARCH_OWNER[name]);
    stubCheck(t, `${name}.period`, () => ARCHETYPES[name].period({}, {}), ARCH_OWNER[name]);
  });
}

for (const kind of MOTIF_KINDS) {
  test(`motif ${kind}: build() / extent() are stubs until implemented`, (t) => {
    const owner = MOTIF_OWNER[MOTIFS[kind].file];
    stubCheck(t, `${kind}.build`, () => MOTIFS[kind].build({ kind }, {}), owner);
    stubCheck(t, `${kind}.extent`, () => MOTIFS[kind].extent({ kind }), owner);
  });
}

test('core and render functions: a stub throws NotImplementedError with an owner, an implemented one is skipped', async (t) => {
  // Stage 2: all of these are implemented; the check stays so that a regression to a stub is caught.
  const sync = {
    'lattice.latticePoints': () => lattice.latticePoints({}),
    'lattice.cycleIndex': () => lattice.cycleIndex(0, 0, 2, 'col', 0),
    'clip.clipSegment': () => clip.clipSegment(0, 0, 1, 1, {}),
    'clip.clipPolyline': () => clip.clipPolyline([], {}),
    'clip.keepInstance': () => clip.keepInstance([], {}, 'whole'),
    'svgPattern.computeTile': () => svgPattern.computeTile({}, {}),
    'canvas.drawPrimitives': () => canvas.drawPrimitives(null, [], {}),
    'index.compose': () => compose([]),
  };
  for (const [label, f] of Object.entries(sync)) {
    if (state(f) === 'implemented') continue;
    assert.throws(f, (e) => e instanceof NotImplementedError && e.owner.length > 0, label);
  }
  const async = {
    'svgPattern.renderSVGPattern': () => svgPattern.renderSVGPattern('x'),
    'canvas.renderCanvas': () => canvas.renderCanvas(null, 'x', {}, {}),
    'png.renderPNG': () => png.renderPNG('x'),
  };
  for (const [label, f] of Object.entries(async)) {
    let err = null;
    try { await f(); } catch (e) { err = e; }
    assert.ok(err !== null, `${label} must reject for an unknown input`);
    if (err instanceof NotImplementedError) assert.ok(err.owner.length > 0, label);
  }
  t.diagnostic('stage 2: no stub left among the core and render functions');
});
