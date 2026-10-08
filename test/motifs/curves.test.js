import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILDERS, EXTENTS, KINDS, exactBBox, cubicAt } from '../../src/motifs/curves.js';
import { createRng } from '../../src/core/rng.js';

const CTX = { strokeWidth: 0.239, rng: createRng(1) };
const TOL = 1e-9;
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= TOL, `${msg}: ${a} vs ${b}`);
const WAVE = { kind: 'waveUnit', halfWidth: 2.83, height: 2.07 };
const SHELL = { kind: 'shell', paperW: 3.92, paperH: 6.25, inkW: 3.92, inkH: 3.42, inkOffset: { x: 0, y: 1.12 } };
const LENS = { kind: 'lens', arcWidth: 5.71, arcHeight: 1.45, arcs: 2, shift: { x: 1.45, y: 0.24 } };
const HOOK = { kind: 'hook', outerLen: 3.1, innerLen: 3.1, drop: 2.9, jog: 0.72 };
const X = { kind: 'X', width: 6.92, height: 7.13 };
// Scale every length by f; counts (arcs) and the kind stay as they are.
const scaled = (m, f) => Object.fromEntries(Object.entries(m).map(([k, v]) => {
  if (k === 'kind' || k === 'arcs') return [k, v];
  if (typeof v === 'number') return [k, v * f];
  if (v && typeof v === 'object') return [k, Object.fromEntries(Object.entries(v).map(([a, b]) => [a, b * f]))];
  return [k, v];
}));

test('every curve kind has a descriptor, a builder and an extent function', () => {
  for (const k of ['waveUnit', 'shell', 'lens', 'hook', 'X']) {
    assert.ok(KINDS[k], `descriptor ${k}`);
    assert.equal(typeof BUILDERS[k], 'function');
    assert.equal(typeof EXTENTS[k], 'function');
  }
});

test('waveUnit default: one path of two cubic arches, width 2 * halfWidth, height = full crest-to-trough', () => {
  const p = BUILDERS.waveUnit(WAVE, CTX);
  assert.equal(p.length, 1);
  assert.equal(p[0].type, 'path');
  assert.deepEqual(p[0].cmds.map((c) => c.op), ['M', 'C', 'C']);
  const e = EXTENTS.waveUnit(WAVE);
  near(e.w, 2 * 2.83, 'width');
  near(e.h, 2.07, 'height');
});

test('waveUnit arches peak at height / 2 from the zero line (one above, one below)', () => {
  const b = exactBBox(BUILDERS.waveUnit(WAVE, CTX));
  near(b.minY, -1.035, 'crest');
  near(b.maxY, 1.035, 'trough');
});

test('waveUnit centre of the exact bbox is the origin', () => {
  const b = exactBBox(BUILDERS.waveUnit(WAVE, CTX));
  near((b.minX + b.maxX) / 2, 0, 'cx');
  near((b.minY + b.maxY) / 2, 0, 'cy');
});

test('shell default: paper ellipse first (fill paper), ink ellipse second (fill ink), offset as given', () => {
  const p = BUILDERS.shell(SHELL, CTX);
  assert.equal(p.length, 2);
  assert.equal(p[0].style.fill, 'paper');
  assert.equal(p[1].style.fill, 'ink');
  near(p[1].cy - p[0].cy, 1.12, 'ink offset');
  near(p[0].rx, 1.96, 'paper half width');
  near(p[1].ry, 1.71, 'ink half height');
});

test('shell extent covers both ellipses', () => {
  const e = EXTENTS.shell(SHELL);
  near(e.w, 3.92, 'width');
  near(e.h, 6.25, 'height');
});

test('lens default: two open arcs, chord and sagitta as given, second arc shifted by shift', () => {
  const p = BUILDERS.lens(LENS, CTX);
  assert.equal(p.length, 2);
  const e = EXTENTS.lens(LENS);
  near(e.w, 5.71 + 1.45, 'width = chord + shift.x');
  near(e.h, 1.45 + 0.24 + 1.45, 'height = up sagitta + shift.y + down sagitta');
});

test('lens: even arc bulges up and odd arc bulges down, each by the sagitta', () => {
  const p = BUILDERS.lens(LENS, CTX);
  const upEnd = p[0].cmds[0].y;
  const downEnd = p[1].cmds[0].y;
  const up = exactBBox([p[0]]);
  const down = exactBBox([p[1]]);
  near(upEnd - up.minY, 1.45, 'upper arc rises 1.45 above its chord');
  near(down.maxY - downEnd, 1.45, 'lower arc drops 1.45 below its chord');
  near(downEnd - upEnd, 0.24, 'second arc starts 0.24 lower');
});

test('lens arcs count controls the number of paths', () => {
  assert.equal(BUILDERS.lens({ ...LENS, arcs: 4 }, CTX).length, 4);
});

test('hook default: one open path, width = outerLen + jog + innerLen (6.92 band), height = drop', () => {
  const p = BUILDERS.hook(HOOK, CTX);
  assert.equal(p.length, 1);
  const e = EXTENTS.hook(HOOK);
  near(e.w, 3.1 + 0.72 + 3.1, 'width');
  near(e.h, 2.9, 'height');
});

test('hook: the path starts at the outer edge and ends at the inner edge', () => {
  const [path] = BUILDERS.hook(HOOK, CTX);
  const first = path.cmds[0];
  const last = path.cmds[path.cmds.length - 1];
  near(first.x, -(3.1 + 0.72 + 3.1) / 2, 'start x');
  near(last.x, (3.1 + 0.72 + 3.1) / 2, 'end x');
  near(first.y, -2.9 / 2, 'start y (upper stroke)');
  near(last.y, 2.9 / 2, 'end y (lower stroke)');
});

test('X default: two diagonals of the box that meet at the centre', () => {
  const p = BUILDERS.X(X, CTX);
  assert.equal(p.length, 2);
  assert.equal(p[0].type, 'line');
  const e = EXTENTS.X(X);
  near(e.w, 6.92, 'width');
  near(e.h, 7.13, 'height');
  near(p[0].x1 + p[0].x2, 0, 'diagonal 1 centred');
  near(p[1].x1 + p[1].x2, 0, 'diagonal 2 centred');
});

test('density 2 (dimensions halved by the caller): extents halve, stroke width is not part of the geometry', () => {
  for (const [k, m] of [['waveUnit', WAVE], ['shell', SHELL], ['lens', LENS], ['hook', HOOK], ['X', X]]) {
    const full = EXTENTS[k](m);
    const half = EXTENTS[k](scaled(m, 0.5));
    near(half.w, full.w / 2, `${k} width`);
    near(half.h, full.h / 2, `${k} height`);
  }
});

test('builders use only the paint tokens ink / paper / none', () => {
  for (const [k, m] of [['waveUnit', WAVE], ['shell', SHELL], ['lens', LENS], ['hook', HOOK], ['X', X]]) {
    for (const p of BUILDERS[k](m, CTX)) {
      const st = p.style;
      assert.ok(['ink', 'paper', 'none'].includes(st.stroke), `${k} stroke`);
      assert.ok(['ink', 'paper', 'none'].includes(st.fill), `${k} fill`);
    }
  }
});

test('builders never return an empty list', () => {
  for (const [k, m] of [['waveUnit', WAVE], ['shell', SHELL], ['lens', LENS], ['hook', HOOK], ['X', X]]) {
    assert.ok(BUILDERS[k](m, CTX).length > 0, k);
  }
});

test('exact bbox of a cubic is smaller than its control-point hull (sampling is used)', () => {
  const p = [[0, 0], [0, -10], [4, -10], [4, 0]];
  const top = cubicAt(p, 0.5)[1];
  near(top, -7.5, 'midpoint height');
  const b = exactBBox([{ type: 'path', cmds: [{ op: 'M', x: 0, y: 0 }, { op: 'C', x1: 0, y1: -10, x2: 4, y2: -10, x: 4, y: 0 }], style: { stroke: 'ink', fill: 'none', dash: null, dashOffset: 0 } }]);
  near(b.minY, -7.5, 'sampled extent, not the control point -10');
});

