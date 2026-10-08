// Tests for archetype grid (arch-1). The lattice functions are injected through renderGrid(), so these
// tests use a minimal self-made lattice and pass while core/lattice.js is still a stub.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderGrid, period, render, PARAMS, DENSITY, MOTIF, ARCHETYPE } from '../../src/archetypes/grid.js';
import { createRng } from '../../src/core/rng.js';
import { circle, line, polygon } from '../../src/core/primitives.js';
import { GeometryError } from '../../src/core/errors.js';

const INK = { stroke: 'none', fill: 'ink' };
const SEG = { stroke: 'ink', fill: 'none' };

/** Test-only motif builder (the real motif files are stubs at this stage). Local coordinates, centred. */
function localPrims(m) {
  if (m.kind === 'dot') return [circle(0, 0, m.d / 2, INK)];
  if (m.kind === 'seg') return [line(-m.length / 2, 0, m.length / 2, 0, SEG)];
  if (m.kind === 'tri') return [polygon([[-m.base / 2, m.height / 2], [m.base / 2, m.height / 2], [0, -m.height / 2]], INK)];
  throw new Error(`test motif ${m.kind}`);
}

function extentOf(m) {
  if (m.kind === 'dot') return { w: m.d, h: m.d };
  if (m.kind === 'seg') return { w: m.length, h: 0 };
  return { w: m.base, h: m.height };
}

/**
 * Minimal lattice with the core/lattice.js contract for the cases used here: origin topLeft,
 * explicit rows and cols, first point (pitchX/2, pitchY/2), odd rows shifted by rowOffsetPt.
 */
const cycleFormula = {
  col: (row, col, n, phase) => (col + row + phase) % n,
  row: (row, col, n, phase) => (row + phase) % n,
  rowcol: (row, col, n, phase) => (2 * col + (row % 2) + phase) % n,
};

const testLattice = {
  latticePoints(o) {
    if (o.rows === 'auto' || o.cols === 'auto') throw new Error('test lattice needs explicit rows and cols');
    const out = [];
    for (let r = 0; r < o.rows; r++) {
      for (let c = 0; c < o.cols; c++) {
        out.push({
          x: o.region.x + o.pitchX / 2 + c * o.pitchX + (r % 2 ? o.rowOffsetPt : 0),
          y: o.region.y + o.pitchY / 2 + r * o.pitchY,
          row: r,
          col: c,
        });
      }
    }
    return out;
  },
  cycleIndex(row, col, n, assign, phase) {
    return cycleFormula[assign](row, col, n, phase);
  },
};

function ctxFor(over = {}) {
  return {
    region: { x: 0, y: 0, width: 60, height: 30 },
    tileMode: 'frame',
    strokeWidth: 0.239,
    origin: 'topLeft',
    jitter: 0,
    rng: createRng(1),
    results: {},
    buildMotif: (m) => localPrims(m),
    motifExtent: (m) => extentOf(m),
    ...over,
  };
}

/** Resolved-looking grid layer: all defaults filled, like resolveSpec() would produce. */
function layerOf(params = {}, over = {}) {
  return {
    id: 'dots',
    archetype: 'grid',
    motif: { kind: 'dot', d: 2 },
    params: {
      pitchX: 10, pitchY: 8, rowOffset: 0, rows: 2, cols: 3, assign: 'col', phase: 0, flipRows: false, edgeMode: 'whole',
      ...params,
    },
    ...over,
  };
}

const run = (layer, ctx = ctxFor()) => renderGrid(testLattice, layer, ctx);
const near = (a, b, msg = '') => assert.ok(Math.abs(a - b) < 1e-9, `${msg} expected ${b}, got ${a}`);

test('the archetype exports its name, motif policy and density flags', () => {
  assert.equal(ARCHETYPE, 'grid');
  assert.equal(MOTIF, 'motifOrCycle');
  assert.deepEqual(DENSITY, { params: true, motif: true });
  assert.equal(PARAMS.type, 'object');
});

test('default square lattice places 2 x 3 dots at the expected centres', () => {
  const r = run(layerOf());
  assert.deepEqual(r.anchors.map((a) => [a.x, a.y]), [[5, 4], [15, 4], [25, 4], [5, 12], [15, 12], [25, 12]]);
  assert.equal(r.placed, 6);
  assert.equal(r.skipped, 0);
  assert.equal(r.primitives.length, 6);
});

test('a staggered rowOffset of 0.5 shifts odd rows by half the pitchX', () => {
  const r = run(layerOf({ rowOffset: 0.5 }));
  const odd = r.anchors.filter((a) => a.row === 1).map((a) => a.x);
  assert.deepEqual(odd, [10, 20, 30]);
});

test('a rowOffset given in pt is used as pt, not as a ratio', () => {
  const r = run(layerOf({ rowOffset: { pt: 4.77 } }));
  const odd = r.anchors.filter((a) => a.row === 1).map((a) => a.x);
  near(odd[0], 5 + 4.77, 'first odd-row x');
});

test('the renderer uses the layer values as given, so a density-2 layer halves pitch and motif', () => {
  const base = run(layerOf({ pitchX: 10, pitchY: 8 }, { motif: { kind: 'dot', d: 4 } }));
  const half = run(layerOf({ pitchX: 5, pitchY: 4 }, { motif: { kind: 'dot', d: 2 } }));
  base.anchors.forEach((a, i) => {
    near(half.anchors[i].x, a.x / 2, 'x');
    near(half.anchors[i].y, a.y / 2, 'y');
  });
  near(half.primitives[0].r, base.primitives[0].r / 2, 'radius');
});

test('edgeMode whole counts instances that do not fit the region as skipped', () => {
  const r = run(layerOf({ cols: 3 }, {}), ctxFor({ region: { x: 0, y: 0, width: 20, height: 10 } }));
  assert.equal(r.placed, 2);
  assert.equal(r.skipped, 4);
  assert.deepEqual(r.anchors.map((a) => a.x), [5, 15]);
});

test('edgeMode clip draws every instance that touches the region', () => {
  const layer = layerOf({ pitchX: 9.5, cols: 3, rows: 1, edgeMode: 'clip' });
  const r = run(layer, ctxFor({ region: { x: 0, y: 0, width: 23.5, height: 30 } }));
  assert.equal(r.placed, 3);
  assert.equal(r.skipped, 0);
});

test('edgeMode whole drops the instance that crosses the region edge', () => {
  const layer = layerOf({ pitchX: 9.5, cols: 3, rows: 1, edgeMode: 'whole' });
  const r = run(layer, ctxFor({ region: { x: 0, y: 0, width: 23.5, height: 30 } }));
  assert.equal(r.placed, 2);
  assert.equal(r.skipped, 1);
});

test('a cycle assigned by column alternates motifs along each row', () => {
  const layer = layerOf({ cycle: [{ kind: 'dot', d: 2 }, { kind: 'seg', length: 4 }], cols: 4, rows: 1 }, { motif: undefined });
  const r = run(layer);
  assert.deepEqual(r.primitives.map((p) => p.type), ['circle', 'line', 'circle', 'line']);
});

test('a cycle assigned by row gives every row one motif', () => {
  const layer = layerOf({ cycle: [{ kind: 'dot', d: 2 }, { kind: 'seg', length: 4 }], cols: 2, rows: 2, assign: 'row' }, { motif: undefined });
  const r = run(layer);
  assert.deepEqual(r.primitives.map((p) => p.type), ['circle', 'circle', 'line', 'line']);
});

test('assign rowcol uses the x-position index 2*col + row parity (R2 §47)', () => {
  const layer = layerOf({ cycle: [{ kind: 'dot', d: 2 }, { kind: 'seg', length: 4 }, { kind: 'tri', base: 3, height: 3 }], cols: 2, rows: 2, assign: 'rowcol' }, { motif: undefined });
  const r = run(layer);
  // row0: index 0, 2 -> dot, tri; row1: index 1, 3 mod 3 = 0 -> seg, dot
  assert.deepEqual(r.primitives.map((p) => p.type), ['circle', 'polygon', 'line', 'circle']);
});

test('renderGrid asks the lattice for each cell index with the layer assign and phase', () => {
  const calls = [];
  const spy = { ...testLattice, cycleIndex(row, col, n, assign, phase) { calls.push([row, col, n, assign, phase]); return 0; } };
  const layer = layerOf({ cycle: [{ kind: 'dot', d: 2 }, { kind: 'seg', length: 4 }], cols: 1, rows: 1, assign: 'col', phase: 1 }, { motif: undefined });
  renderGrid(spy, layer, ctxFor());
  assert.deepEqual(calls, [[0, 0, 2, 'col', 1]]);
});

test('flipRows mirrors odd rows upside down', () => {
  const layer = layerOf({ flipRows: true, cols: 1, rows: 2 }, { motif: { kind: 'tri', base: 3, height: 3 } });
  const r = run(layer);
  const apexY = (p, cy) => p.points[2][1] - cy;
  near(apexY(r.primitives[0], 4), -1.5, 'row 0 apex above centre');
  near(apexY(r.primitives[1], 12), 1.5, 'row 1 apex below centre');
});

test('rotations with one list cycle along each row by column', () => {
  const layer = layerOf({ rotations: [[0, 90]], cols: 2, rows: 1 }, { motif: { kind: 'seg', length: 4 } });
  const r = run(layer);
  const [a, b] = r.primitives;
  near(a.x1, 3, 'row end x at rotation 0'); near(a.y1, 4, 'row end y at rotation 0');
  near(b.x1, 15, 'rotated x'); near(Math.abs(b.y1 - b.y2), 4, 'vertical length after 90 deg');
  near(b.x1, b.x2, 'vertical segment x');
});

test('rotations with two lists choose the list by row parity', () => {
  const layer = layerOf({ rotations: [[0], [90]], cols: 1, rows: 2 }, { motif: { kind: 'seg', length: 4 } });
  const r = run(layer);
  near(r.primitives[0].y1, r.primitives[0].y2, 'even row horizontal');
  near(r.primitives[1].x1, r.primitives[1].x2, 'odd row vertical');
});

test('avoid skips an instance whose footprint contains an anchor of the avoided layer', () => {
  const ctx = ctxFor({ results: { base: { primitives: [], placed: 1, skipped: 0, warnings: [], anchors: [{ x: 5, y: 4 }] } } });
  const r = run(layerOf({ avoid: 'base', cols: 3, rows: 1 }), ctx);
  assert.equal(r.skipped, 1);
  assert.equal(r.placed, 2);
  assert.deepEqual(r.anchors.map((a) => a.x), [15, 25]);
});

test('avoid naming a layer that is not earlier throws with the id', () => {
  assert.throws(() => run(layerOf({ avoid: 'missing' })), (e) => e instanceof GeometryError && /"missing"/.test(e.message));
});

test('relation takes the pitch from the reference layer and shifts by phase times its pitch', () => {
  const ctx = ctxFor({ results: { base: { primitives: [], placed: 1, skipped: 0, warnings: [], anchors: [], pitch: { x: 10, y: 8 } } } });
  const layer = layerOf({ pitchX: 20, pitchY: 16, cols: 2, rows: 1 }, { relation: { to: 'base', pitchRatio: 2, phase: 0.5 } });
  const r = run(layer, ctx);
  assert.deepEqual(r.anchors.map((a) => [a.x, a.y]), [[15, 8], [35, 8]]);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.pitch, { x: 20, y: 16 });
});

test('relation warns when the params pitch disagrees with the derived pitch', () => {
  const ctx = ctxFor({ results: { base: { primitives: [], placed: 1, skipped: 0, warnings: [], anchors: [], pitch: { x: 10, y: 8 } } } });
  const layer = layerOf({ pitchX: 21, pitchY: 16, cols: 1, rows: 1 }, { relation: { to: 'base', pitchRatio: 2, phase: 0 } });
  const r = run(layer, ctx);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /relation to "base"/);
});

test('relation to a layer without a lattice pitch throws', () => {
  const ctx = ctxFor({ results: { base: { primitives: [], placed: 1, skipped: 0, warnings: [], anchors: [] } } });
  const layer = layerOf({ cols: 1, rows: 1 }, { relation: { to: 'base', pitchRatio: 1, phase: 0 } });
  assert.throws(() => run(layer, ctx), (e) => e instanceof GeometryError && /exposes no lattice pitch/.test(e.message));
});

test('jitter with the same seed gives the same output and another seed gives other positions', () => {
  const layer = layerOf({ cols: 3, rows: 2 });
  const a = run(layer, ctxFor({ jitter: 0.5, rng: createRng(7) }));
  const b = run(layer, ctxFor({ jitter: 0.5, rng: createRng(7) }));
  const c = run(layer, ctxFor({ jitter: 0.5, rng: createRng(8) }));
  assert.deepEqual(a.anchors, b.anchors);
  assert.notDeepEqual(a.anchors, c.anchors);
});

test('a layer that draws nothing throws GeometryError with the counts', () => {
  const ctx = ctxFor({ region: { x: 0, y: 0, width: 4, height: 4 } });
  assert.throws(() => run(layerOf({ cols: 1, rows: 1 }, { motif: { kind: 'dot', d: 10 } }), ctx), (e) => e instanceof GeometryError && /1 candidates, 1 skipped/.test(e.message));
});

test('giving both layer.motif and params.cycle throws', () => {
  const layer = layerOf({ cycle: [{ kind: 'dot', d: 2 }] });
  assert.throws(() => run(layer), (e) => e instanceof GeometryError && /got both/.test(e.message));
});

test('giving neither layer.motif nor params.cycle throws', () => {
  const layer = layerOf({}, { motif: undefined });
  assert.throws(() => run(layer), (e) => e instanceof GeometryError && /got neither/.test(e.message));
});

test('period of a square lattice is one cell', () => {
  assert.deepEqual(period(layerOf(), { results: {} }), { w: 10, h: 8 });
});

test('period of a staggered lattice is one column by two rows', () => {
  assert.deepEqual(period(layerOf({ rowOffset: 0.5 }), { results: {} }), { w: 10, h: 16 });
});

test('period of a flipped-row lattice is one column by two rows', () => {
  assert.deepEqual(period(layerOf({ flipRows: true }), { results: {} }), { w: 10, h: 16 });
});

test('period of a column cycle of two motifs is two by two cells', () => {
  const layer = layerOf({ cycle: [{ kind: 'dot', d: 2 }, { kind: 'seg', length: 4 }] }, { motif: undefined });
  assert.deepEqual(period(layer, { results: {} }), { w: 20, h: 16 });
});

test('period of a two-list rotation with rowcol is two by two cells (R2 §47 y-period 11.32 uses this)', () => {
  const layer = layerOf({ pitchX: 19.7, pitchY: 5.66, rowOffset: 0.5, rotations: [[30, 150], [120, 60]], cycle: undefined }, { motif: { kind: 'seg', length: 7 } });
  layer.params.assign = 'rowcol';
  const p = period(layer, { results: {} });
  near(p.w, 39.4, 'w'); near(p.h, 11.32, 'h');
});

test('period is null when the relation reference is not available yet', () => {
  const layer = layerOf({}, { relation: { to: 'base', pitchRatio: 1, phase: 0 } });
  assert.equal(period(layer, { results: {} }), null);
});

test('period tile draws an instance that crosses the tile border once; the renderer makes the copies', () => {
  // CONVENTIONS §3.3 period-tile contract: the archetype returns each individual once (wrapToRect copies).
  const layer = layerOf({ cols: 1, rows: 1 }, { motif: { kind: 'seg', length: 12 } });
  const r = renderGrid(testLattice, layer, ctxFor({ tileMode: 'period' }));
  assert.equal(r.placed, 1);
  assert.equal(r.primitives.length, 1);
  assert.equal(r.primitives[0].x1, -1);
});

test('period render places each lattice cell once, at its position wrapped into the tile', () => {
  // Odd row shifted by 5 pt in a 10 pt tile: its cell wraps to x = 0 (= 10) and is drawn there only.
  const layer = layerOf({ rowOffset: 0.5, cols: 1, rows: 2 }, { motif: { kind: 'dot', d: 2 } });
  const r = renderGrid(testLattice, layer, ctxFor({ tileMode: 'period' }));
  assert.equal(r.placed, 2);
  assert.equal(r.primitives.length, 2);
  const centres = r.primitives.map((p) => [p.cx, p.cy]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  assert.deepEqual(centres, [[5, 4], [0, 12]]);
});

test('ctx.fit scales the pitch (and the period) but not the motif', () => {
  const layer = layerOf({ cols: 2, rows: 1 }, { motif: { kind: 'dot', d: 2 } });
  const fit = { x: 1.04, y: 0.98 };
  const p = period(layer, { results: {}, fit });
  assert.ok(Math.abs(p.w - 10 * 1.04) < 1e-9 && Math.abs(p.h - 8 * 0.98) < 1e-9, JSON.stringify(p));
  const r = renderGrid(testLattice, layer, ctxFor({ tileMode: 'period', fit }));
  assert.ok(Math.abs(r.pitch.x - 10.4) < 1e-9);
  const ext = r.primitives[0];
  assert.equal(ext.r ?? ext.rx ?? 1, 1);
});

test('render() passes the real lattice module; with the stub it fails with the lattice owner named', () => {
  let err = null;
  try {
    render(layerOf(), ctxFor());
  } catch (e) {
    err = e;
  }
  // Either the real lattice is implemented (then no error) or it is the core-A stub.
  if (err) assert.equal(err.owner, 'core-A');
});

// ---------------------------------------------------------------------------
// Uneven lattice: rowPitches / colPitches / rowShifts (hand-placed originals)
// ---------------------------------------------------------------------------

/** Lattice that must not be called: proves the uneven path does not go through core/lattice.js. */
const noLattice = {
  latticePoints() {
    throw new Error('latticePoints must not be called for an uneven lattice');
  },
  cycleIndex: testLattice.cycleIndex,
};
const xy = (r) => r.anchors.map((a) => [a.x, a.y]);
const nearAll = (got, want, msg) => {
  assert.equal(got.length, want.length, `${msg}: count ${got.length} != ${want.length}`);
  got.forEach((g, i) => {
    near(g[0], want[i][0], `${msg}[${i}].x`);
    near(g[1], want[i][1], `${msg}[${i}].y`);
  });
};

test('without uneven keys the regular lattice of core/lattice.js is used unchanged', () => {
  const plain = run(layerOf({ rowOffset: 0.5 }));
  assert.throws(() => renderGrid(noLattice, layerOf({ rowOffset: 0.5 }), ctxFor()), /must not be called/);
  assert.deepEqual(xy(plain), [[5, 4], [15, 4], [25, 4], [10, 12], [20, 12], [30, 12]]);
});

test('rowPitches places row r at the cumulative sum of the cycled row gaps', () => {
  const r = renderGrid(noLattice, layerOf({ rows: 4, cols: 1, rowPitches: [7, 5] }), ctxFor({ region: { x: 0, y: 0, width: 60, height: 40 } }));
  // topLeft: first point at (pitchX/2, pitchY/2) = (5, 4); gaps 7, 5, 7
  nearAll(xy(r), [[5, 4], [5, 11], [5, 16], [5, 23]], 'rows');
});

test('one colPitches list applies to every row, on top of rowOffset', () => {
  const r = renderGrid(noLattice, layerOf({ rows: 2, cols: 3, rowOffset: { pt: 2 }, colPitches: [[9, 12]] }), ctxFor());
  nearAll(xy(r), [[5, 4], [14, 4], [26, 4], [7, 12], [16, 12], [28, 12]], 'cols');
});

test('two colPitches lists apply by row parity and rowShifts adds a per-row x shift', () => {
  const layer = layerOf({ rows: 3, cols: 2, rowOffset: 0.5, colPitches: [[9], [11]], rowShifts: [0, 0.5, -0.3] });
  const r = renderGrid(noLattice, layer, ctxFor());
  nearAll(xy(r), [[5, 4], [14, 4], [10.5, 12], [21.5, 12], [4.7, 20], [13.7, 20]], 'parity');
});

test('origin center centres the span of row 0 and of all rows of the uneven lattice', () => {
  const layer = layerOf({ rows: 3, cols: 3, colPitches: [[10, 20]], rowPitches: [6, 10] });
  const r = renderGrid(noLattice, layer, ctxFor({ origin: 'center', region: { x: 0, y: 0, width: 60, height: 30 } }));
  // x span 30 -> x0 = 15; y span 16 -> y0 = 7
  nearAll(xy(r).slice(0, 3), [[15, 7], [25, 7], [45, 7]], 'row 0');
  near(r.anchors[8].y, 23, 'last row y');
});

test('origin {x, y} puts cell (0, 0) there and layer.offset moves the uneven lattice', () => {
  const layer = layerOf({ rows: 2, cols: 2, rowPitches: [5] }, { offset: { x: 1, y: -1 } });
  const r = renderGrid(noLattice, layer, ctxFor({ origin: { x: 3, y: 6 } }));
  nearAll(xy(r), [[4, 5], [14, 5], [4, 10], [14, 10]], 'origin');
});

test('rows and cols auto count the uneven positions inside the closed region', () => {
  // y: 0, 7, 12, 19, 24, 31 -> 5 rows within height 30; x even 0, 9, 21, 30 -> 4, odd 0, 11, 22, 33 -> 3
  const layer = layerOf({ rows: 'auto', cols: 'auto', rowPitches: [7, 5], colPitches: [[9, 12], [11]], edgeMode: 'clip' });
  const r = renderGrid(noLattice, layer, ctxFor({ origin: { x: 0, y: 0 }, region: { x: 0, y: 0, width: 30, height: 30 } }));
  const rows = new Set(r.anchors.map((a) => a.row));
  const cols = new Set(r.anchors.map((a) => a.col));
  assert.equal(rows.size, 5);
  assert.equal(cols.size, 4);
});

test('edgeMode whole counts uneven-lattice instances outside the region as skipped', () => {
  const layer = layerOf({ rows: 2, cols: 3, colPitches: [[9, 30]] });
  const r = renderGrid(noLattice, layer, ctxFor({ region: { x: 0, y: 0, width: 30, height: 30 } }));
  assert.equal(r.placed, 4);
  assert.equal(r.skipped, 2);
});

test('density 2 halves rowPitches, colPitches and rowShifts (length class) through resolveSpec', async () => {
  const { resolveSpec } = await import('../../src/core/resolve.js');
  const s = {
    schema: 'zc-pattern/1.0.0', id: 'zc:111101002', table: '3-1', names: { ja: 'grid test' },
    provenance: { doc: 'design', section: 'test', measured: false },
    layers: [{ id: 'dots', archetype: 'grid', motif: { kind: 'dot', d: 1.3 },
      params: { pitchX: 10, pitchY: 8, rowPitches: [7, 9], colPitches: [[9, 11], [10]], rowShifts: [0, -0.4] } }],
  };
  const p = resolveSpec(s, { density: 2 }).drawSpec.layers[0].params;
  assert.deepEqual(p.rowPitches, [3.5, 4.5]);
  assert.deepEqual(p.colPitches, [[4.5, 5.5], [5]]);
  assert.deepEqual(p.rowShifts, [0, -0.2]);
  assert.equal(p.pitchX, 5);
});

test('the schema rejects a non-positive row gap and more than two colPitches lists', async () => {
  const { validateValue, applyDefaults } = await import('../../src/core/schema.js');
  const errs = (params) => {
    const out = { errors: [], warnings: [] };
    validateValue(PARAMS, applyDefaults(PARAMS, { pitchX: 10, pitchY: 8, ...params }), '/params', out);
    return out.errors.map((e) => `${e.path}: ${e.message}`).join(' ');
  };
  assert.match(errs({ rowPitches: [5, 0] }), /rowPitches/);
  assert.match(errs({ colPitches: [[1], [2], [3]] }), /colPitches/);
  assert.equal(errs({ rowPitches: [5, 6], colPitches: [[9], [11]], rowShifts: [-0.3, 0.2] }), '');
});

test('period of an uneven lattice is the cycled sums; ctx.fit scales them', () => {
  const layer = layerOf({ rows: 2, cols: 2, rowOffset: 0.5, rowPitches: [7, 5], colPitches: [[9, 12], [10, 11]] });
  const p = period(layer, { results: {} });
  near(p.w, 21, 'w');
  near(p.h, 12, 'h');
  const f = period(layer, { results: {}, fit: { x: 1.02, y: 0.97 } });
  near(f.w, 21 * 1.02, 'fitted w');
  near(f.h, 12 * 0.97, 'fitted h');
});

test('rowShifts and a cycled rowPitches list lengthen the row period to their lcm', () => {
  const layer = layerOf({ rows: 2, cols: 1, rowPitches: [7, 5, 6], rowShifts: [0, 0.5] });
  const p = period(layer, { results: {} });
  near(p.h, 2 * 18, 'h over lcm(3, 2) = 6 rows');
});

test('two colPitches lists of different span have no period, and drawing a period tile throws', () => {
  const layer = layerOf({ rows: 2, cols: 2, colPitches: [[9, 12], [10]] });
  assert.equal(period(layer, { results: {} }), null);
  assert.throws(() => renderGrid(noLattice, layer, ctxFor({ tileMode: 'period' })), (e) => e instanceof GeometryError && /colPitches even\/odd lists span/.test(e.message));
});

test('a period tile of an uneven lattice draws each cell once, wrapped into the tile', () => {
  const layer = layerOf({ rows: 2, cols: 2, rowOffset: 0.5, rowPitches: [7, 5], colPitches: [[9, 12], [10, 11]] }, { motif: { kind: 'dot', d: 1 } });
  const r = renderGrid(noLattice, layer, ctxFor({ tileMode: 'period' }));
  const p = period(layer, { results: {} });
  assert.equal(r.placed, 4);
  for (const a of r.anchors) assert.ok(a.x >= 0 && a.x < p.w && a.y >= 0 && a.y < p.h, JSON.stringify(a));
  // first point (5, 4); odd row: 5 + 0.5·10 = 10 and 10 + 10 = 20 at y 11
  const got = xy(r).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  nearAll(got, [[5, 4], [14, 4], [10, 11], [20, 11]], 'tile');
});

test('an uneven key on a layer tied by relation is rejected with the reason', () => {
  const ref = { pitch: { x: 10, y: 8 }, anchors: [] };
  const layer = layerOf({ rowPitches: [7] }, { relation: { to: 'big', pitchRatio: 1 } });
  assert.throws(() => renderGrid(noLattice, layer, ctxFor({ results: { big: ref } })), (e) => e instanceof GeometryError && /rowPitches cannot be combined with relation/.test(e.message));
});

test('the overlap warning uses the smallest uneven gap', () => {
  const layer = layerOf({ rows: 2, cols: 2, rowPitches: [1.5] }, { motif: { kind: 'dot', d: 2 } });
  const r = renderGrid(noLattice, layer, ctxFor());
  assert.ok(r.warnings.some((w) => /pitchY 1\.500/.test(w)), r.warnings.join(' | '));
});
