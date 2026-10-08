// Stage-2 cross-archetype contracts (CONVENTIONS §3.1 layer.offset, §3.3 ctx.fit), run through the real
// resolve + computeLayers pipeline so that every archetype is held to the same rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSpec } from '../../src/core/resolve.js';
import { DEFAULT_ENV } from '../../src/core/validate.js';
import { GeometryError } from '../../src/core/errors.js';
import { computeLayers } from '../../src/render/svg.js';
import { bboxOf } from '../../src/core/primitives.js';
import { spec } from '../fixtures/specs.js';

const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

function layerResult(layer, extra = {}) {
  const r = resolveSpec(spec({ layers: [layer], ...extra }), {});
  const region = { x: 0, y: 0, width: r.render.region.width, height: r.render.region.height };
  return computeLayers(r.drawSpec, DEFAULT_ENV, r.render, { region, tileMode: 'frame' }).results[layer.id];
}

const shifted = (layer, offset) => ({ ...structuredClone(layer), offset });

test('hatch: layer.offset moves the line family (horizontal lines move by offset.y)', () => {
  const l = { id: 'lines', archetype: 'hatch', params: { angle: 0, spacing: 4 } };
  const a = layerResult(l).primitives.map((p) => p.y1).sort((x, y) => x - y);
  const b = layerResult(shifted(l, { x: 0, y: 1 })).primitives.map((p) => p.y1).sort((x, y) => x - y);
  const frac = (v) => ((v % 4) + 4) % 4;
  assert.ok(near(frac(b[0] - a[0]), 1), `shift ${b[0] - a[0]}`);
});

test('wave: layer.offset moves the reference point (lines move by offset.y)', () => {
  const l = { id: 'waves', archetype: 'wave', params: { angle: 0, wavelength: 11.33, amplitude: 1, lineSpacing: 8.17, lines: 3, margin: 2.78 } };
  const ya = bboxOf(layerResult(l).primitives);
  const yb = bboxOf(layerResult(shifted(l, { x: 0, y: -1.01 })).primitives);
  assert.ok(near(yb.minY - ya.minY, -1.01, 1e-6) && near(yb.maxY - ya.maxY, -1.01, 1e-6));
});

test('grid, symbol, diagonalBand: layer.offset moves the anchors by exactly the offset', () => {
  const layers = [
    { id: 'g', archetype: 'grid', motif: { kind: 'dot', d: 1.3 }, params: { pitchX: 9.64, pitchY: 4.26, rows: 3, cols: 3 } },
    { id: 's', archetype: 'symbol', motif: { kind: 'dot', d: 2 } },
    { id: 'd', archetype: 'diagonalBand', motif: { kind: 'dot', d: 1.42 }, params: { bands: 1, alongPitch: 3.13 } },
  ];
  for (const l of layers) {
    const a = layerResult(l).anchors;
    const b = layerResult(shifted(l, { x: 0.5, y: -0.25 })).anchors;
    assert.ok(a.length > 0, l.archetype);
    const key = (p) => `${(p.x).toFixed(6)},${(p.y).toFixed(6)}`;
    const moved = new Set(a.map((p) => key({ x: p.x + 0.5, y: p.y - 0.25 })));
    const hits = b.filter((p) => moved.has(key(p))).length;
    assert.ok(hits >= Math.min(a.length, b.length) - 2, `${l.archetype}: ${hits} of ${b.length} anchors moved by the offset`);
  }
});

test('scatter: layer.offset moves the segments; segments that leave the region are skipped with a warning', () => {
  const l = { id: 'segs', archetype: 'scatter', seed: 3, params: { count: 12, length: 6, angles: [{ deg: 27, weight: 1 }] } };
  const a = layerResult(l);
  const b = layerResult(shifted(l, { x: 1, y: 0 }));
  assert.equal(b.placed + b.skipped, a.placed + a.skipped);
  const far = layerResult(shifted(l, { x: 100, y: 0 }));
  assert.equal(far.placed, 0);
  assert.ok(far.warnings.some((w) => /moves 12 segment/.test(w)));
});

test('edgeBand: offset.y shifts the rows, offset.x is refused; frameDiagonal refuses any offset', () => {
  const eb = { id: 'bars', archetype: 'edgeBand', motif: { kind: 'hline', length: 6.92 }, params: { pitchY: 3.57 } };
  const a = layerResult(eb).anchors;
  const b = layerResult(shifted(eb, { x: 0, y: 0.5 })).anchors;
  assert.ok(near(b[0].y - a[0].y, 0.5));
  assert.throws(() => layerResult(shifted(eb, { x: 1, y: 0 })), (e) => e instanceof GeometryError && /offset\.x/.test(e.message));
  const fd = { id: 'diag', archetype: 'frameDiagonal', params: { direction: '/' } };
  assert.throws(() => layerResult(shifted(fd, { x: 1, y: 0 })), (e) => e instanceof GeometryError && /frame corners/.test(e.message));
});

test('edgeBand edgeMode auto: a motif wider than the band is drawn and clipped instead of vanishing', () => {
  const lens = { id: 'lenses', archetype: 'edgeBand', motif: { kind: 'lens', arcWidth: 5.6, arcHeight: 1.45, arcs: 2, shift: { x: 1.45, y: 0.24 } }, params: { pitchY: 4.21 } };
  const r = layerResult(lens, { table: '3-9' });
  assert.ok(r.placed > 0);
  assert.throws(() => layerResult({ ...lens, params: { ...lens.params, edgeMode: 'whole' } }, { table: '3-9' }), /no motif fits/);
});
