import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planSpec, buildInstructions, primitivesInstructions, drawInstructions, renderCanvas, drawPrimitives,
} from '../../src/render/canvas.js';
import { line, polyline, polygon, circle, ellipse, path } from '../../src/core/primitives.js';
import { makeEnv } from '../../src/core/validate.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { NotImplementedError, GeometryError, ZcError } from '../../src/core/errors.js';
import { spec } from '../fixtures/specs.js';
import { renderSpecToSVG } from '../../src/render/svg.js';

const DEG = Math.PI / 180;
const INK = '#000000';
const PAPER = '#ffffff';

// A stand-in grid archetype that draws one circle per row (same idea as test/render/svg.test.js).
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

/** A plan with hand-made layers, for testing the instruction builder alone. */
function plan(over = {}) {
  return {
    region: { x: 0, y: 0, width: 10, height: 5 },
    colors: { ink: INK, paper: PAPER },
    strokeWidth: 0.239,
    cap: 'round',
    join: 'miter',
    ground: 'none',
    frame: { show: 'none', lineWidth: 0.2 },
    layers: [{ id: 'a', clip: false, primitives: [circle(2, 2, 1, { fill: 'ink' })] }],
    ...over,
  };
}

/** A context that records every call and property write, for checking the browser glue in Node. */
function recorder() {
  const calls = [];
  const names = [
    'save', 'restore', 'transform', 'beginPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo',
    'closePath', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'setLineDash',
  ];
  const ctx = { calls, props: {} };
  for (const n of names) ctx[n] = (...args) => calls.push([n, ...args]);
  return new Proxy(ctx, {
    set(t, k, v) {
      if (k in t) t[k] = v; else t.props[k] = v;
      return true;
    },
    get(t, k) {
      if (k in t) return t[k];
      return undefined;
    },
  });
}

test('buildInstructions: a tiny plan gives the exact instruction list', () => {
  const out = buildInstructions(plan(), { x: 3, y: 4, scale: 2 });
  assert.deepEqual(out, [
    { op: 'save' },
    { op: 'setGlobalAlpha', v: 1 },
    { op: 'transform', a: 2, b: 0, c: 0, d: 2, e: 3, f: 4 },
    { op: 'setLineWidth', v: 0.239 },
    { op: 'setLineCap', v: 'round' },
    { op: 'setLineJoin', v: 'miter' },
    { op: 'setStrokeStyle', v: INK },
    { op: 'setFillStyle', v: INK },
    { op: 'save' },
    { op: 'beginPath' },
    { op: 'ellipse', x: 2, y: 2, rx: 1, ry: 1, rotation: 0, startAngle: 0, endAngle: 2 * Math.PI },
    { op: 'setFillStyle', v: INK },
    { op: 'fill' },
    { op: 'setStrokeStyle', v: INK },
    { op: 'setLineDash', v: [] },
    { op: 'setLineDashOffset', v: 0 },
    { op: 'stroke' },
    { op: 'restore' },
    { op: 'restore' },
  ]);
});

test('buildInstructions: only ink and paper colour values appear', () => {
  const p = plan({
    ground: 'paper',
    frame: { show: 'ink', lineWidth: 0.2 },
    layers: [{ id: 'a', clip: true, primitives: [
      circle(2, 2, 1, { fill: 'paper' }), line(0, 0, 5, 5), polygon([[0, 0], [1, 0], [0, 1]], { fill: 'ink', stroke: 'paper' }),
    ] }],
  });
  const colours = buildInstructions(p, { scale: 1 })
    .flatMap((i) => ('v' in i ? [i.v] : []))
    .filter((v) => typeof v === 'string' && v.startsWith('#'));
  assert.ok(colours.length > 0);
  for (const c of colours) assert.ok(c === INK || c === PAPER, `unexpected colour ${c}`);
});

test('buildInstructions: paper ground is a fillRect in paper, before the layers', () => {
  const out = buildInstructions(plan({ ground: 'paper' }), { scale: 1 });
  const i = out.findIndex((x) => x.op === 'fillRect');
  assert.deepEqual(out[i], { op: 'fillRect', x: 0, y: 0, w: 10, h: 5 });
  assert.deepEqual(out[i - 1], { op: 'setFillStyle', v: PAPER });
  assert.ok(i < out.findIndex((x) => x.op === 'ellipse'));
});

test('buildInstructions: no ground when ground is none', () => {
  assert.equal(buildInstructions(plan({ ground: 'none' }), { scale: 1 }).some((x) => x.op === 'fillRect'), false);
});

test('buildInstructions: clipped layer is wrapped in save / rect / clip / restore', () => {
  const out = buildInstructions(plan({ layers: [{ id: 'a', clip: true, primitives: [line(0, 0, 1, 1)] }] }), { scale: 1 });
  const i = out.findIndex((x) => x.op === 'clip');
  assert.deepEqual(out.slice(i - 2, i + 1), [
    { op: 'beginPath' },
    { op: 'rect', x: 0, y: 0, w: 10, h: 5 },
    { op: 'clip' },
  ]);
  assert.equal(out[i - 3].op, 'save');
  assert.equal(out[i + 1].op, 'beginPath'); // the layer's first primitive
});

test('buildInstructions: unclipped layer has no clip op', () => {
  assert.equal(buildInstructions(plan(), { scale: 1 }).some((x) => x.op === 'clip'), false);
});

test('buildInstructions: ink frame is inset by half the line width', () => {
  const out = buildInstructions(plan({ frame: { show: 'ink', lineWidth: 0.2 } }), { scale: 1 });
  const i = out.findIndex((x) => x.op === 'strokeRect');
  assert.deepEqual(out[i], { op: 'strokeRect', x: 0.1, y: 0.1, w: 9.8, h: 4.8 });
  assert.equal(out[i - 1].op, 'setStrokeStyle');
  assert.equal(out[i - 2].v, 0.2);
});

test('buildInstructions: ellipse rotation is math CCW, so the canvas angle is negated', () => {
  const out = primitivesInstructions([ellipse(5, 5, 2, 1, 30, { fill: 'paper' })], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'round', join: 'miter', scale: 1 });
  const e = out.find((x) => x.op === 'ellipse');
  assert.ok(Math.abs(e.rotation + 30 * DEG) < 1e-12);
  assert.equal(e.rx, 2);
  assert.equal(e.ry, 1);
});

test('buildInstructions: polyline is open, polygon is closed', () => {
  const pl = primitivesInstructions([polyline([[0, 0], [1, 0], [1, 1]])], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'butt', join: 'miter', scale: 1 });
  const pg = primitivesInstructions([polygon([[0, 0], [1, 0], [1, 1]])], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'butt', join: 'miter', scale: 1 });
  assert.deepEqual(pl.filter((x) => ['moveTo', 'lineTo', 'closePath'].includes(x.op)).map((x) => x.op), ['moveTo', 'lineTo', 'lineTo']);
  assert.deepEqual(pg.filter((x) => ['moveTo', 'lineTo', 'closePath'].includes(x.op)).map((x) => x.op), ['moveTo', 'lineTo', 'lineTo', 'closePath']);
});

test('buildInstructions: path commands map to canvas calls', () => {
  const out = primitivesInstructions([path([
    { op: 'M', x: 0, y: 0 }, { op: 'L', x: 1, y: 0 }, { op: 'C', x1: 1, y1: 1, x2: 2, y2: 2, x: 3, y: 3 },
    { op: 'Q', x1: 4, y1: 4, x: 5, y: 5 }, { op: 'Z' },
  ], { stroke: 'ink' })], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'butt', join: 'miter', scale: 1 });
  const start = out.findIndex((x) => x.op === 'beginPath') + 1;
  assert.deepEqual(out.slice(start, out.findIndex((x) => x.op === 'closePath') + 1), [
    { op: 'moveTo', x: 0, y: 0 },
    { op: 'lineTo', x: 1, y: 0 },
    { op: 'bezierCurveTo', x1: 1, y1: 1, x2: 2, y2: 2, x: 3, y: 3 },
    { op: 'quadraticCurveTo', x1: 4, y1: 4, x: 5, y: 5 },
    { op: 'closePath' },
  ]);
});

test('buildInstructions: dash and dash offset reach the stroke', () => {
  const out = primitivesInstructions([line(0, 0, 10, 0, { dash: [5.7, 2.75], dashOffset: 1 })], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'butt', join: 'miter', scale: 1 });
  assert.deepEqual(out.filter((x) => x.op === 'setLineDash' || x.op === 'setLineDashOffset'), [
    { op: 'setLineDash', v: [5.7, 2.75] },
    { op: 'setLineDashOffset', v: 1 },
  ]);
});

test('buildInstructions: a filled-only primitive is not stroked', () => {
  const out = primitivesInstructions([circle(0, 0, 1, { stroke: 'none', fill: 'paper' })], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'butt', join: 'miter', scale: 1 });
  assert.equal(out.some((x) => x.op === 'stroke'), false);
  assert.ok(out.some((x) => x.op === 'fill'));
});

test('buildInstructions: a non-positive scale throws', () => {
  assert.throws(() => buildInstructions(plan(), { scale: 0 }), /scale must be > 0/);
  assert.throws(() => buildInstructions(plan(), { scale: NaN }), /scale must be > 0/);
});

test('drawInstructions: replays every op on a 2D context with the right arguments', () => {
  const ctx = recorder();
  drawInstructions(ctx, buildInstructions(plan({ frame: { show: 'ink', lineWidth: 0.2 } }), { x: 1, y: 2, scale: 3 }));
  assert.deepEqual(ctx.calls[0], ['save']);
  assert.deepEqual(ctx.calls[1], ['transform', 3, 0, 0, 3, 1, 2]);
  assert.equal(ctx.props.lineWidth, 0.2);
  assert.equal(ctx.props.lineCap, 'round');
  assert.equal(ctx.props.globalAlpha, 1);
  assert.deepEqual(ctx.calls.find((c) => c[0] === 'ellipse'), ['ellipse', 2, 2, 1, 1, 0, 0, 2 * Math.PI]);
  assert.ok(ctx.calls.some((c) => c[0] === 'strokeRect'));
  assert.equal(ctx.calls.at(-1)[0], 'restore');
});

test('drawInstructions: unknown op throws and names it', () => {
  assert.throws(() => drawInstructions(recorder(), [{ op: 'gradient' }]), /unknown op "gradient"/);
});

test('drawInstructions: an object without 2D methods throws a clear error naming the missing ones', () => {
  assert.throws(() => drawInstructions({}, []), (e) => e instanceof ZcError && /CanvasRenderingContext2D/.test(e.message) && /beginPath/.test(e.message));
  assert.throws(() => drawInstructions(null, []), (e) => e instanceof ZcError && /is required/.test(e.message));
});

test('renderCanvas: without a browser context it throws a clear ZcError (Node has no canvas)', async () => {
  await assert.rejects(
    renderCanvas(null, spec(), { density: 1 }, { x: 0, y: 0, width: 112, height: 57 }, { env: fakeEnv }),
    (e) => e instanceof ZcError && /CanvasRenderingContext2D is required/.test(e.message),
  );
});

test('renderCanvas: draws the resolved pattern through the context and returns meta', async () => {
  const ctx = recorder();
  const { meta } = await renderCanvas(ctx, spec(), { density: 2 }, { x: 4, y: 6, width: 112.06, height: 56.82 }, { env: fakeEnv });
  assert.deepEqual(ctx.calls.find((c) => c[0] === 'transform'), ['transform', 2, 0, 0, 2, 4, 6]);
  const ellipses = ctx.calls.filter((c) => c[0] === 'ellipse');
  assert.equal(ellipses.length, 3);
  assert.equal(ellipses[0][3], 1.75); // rx: d 3.5 at density 2 (motif follows density) -> r 1.75
  assert.deepEqual(meta.counts.instances, { placed: 3, skipped: 1 });
  assert.equal(meta.strokeWidth, 0.239);
  assert.ok(meta.warnings.includes('layer circles: fake'));
});

test('renderCanvas: a rect with another aspect ratio is a GeometryError, never stretched', async () => {
  await assert.rejects(
    renderCanvas(recorder(), spec(), {}, { x: 0, y: 0, width: 100, height: 10 }, { env: fakeEnv }),
    (e) => e instanceof GeometryError && /aspect ratio/.test(e.message),
  );
});

test('renderCanvas: a bad rect is rejected before anything is drawn', async () => {
  const ctx = recorder();
  await assert.rejects(renderCanvas(ctx, spec(), {}, { x: 0, y: 0, width: 0, height: 10 }, { env: fakeEnv }), /rect needs/);
  assert.equal(ctx.calls.length, 0);
});

test('planSpec: the resolved region comes from the frame when no size is given', () => {
  const p = planSpec(spec(), {}, { env: fakeEnv });
  assert.deepEqual(p.region, { x: 0, y: 0, width: 56.03, height: 28.41 });
  assert.equal(p.unit, 'pt');
  assert.deepEqual(p.colors, { ink: INK, paper: PAPER });
  assert.equal(p.layers.length, 1);
  assert.equal(p.layers[0].clip, true);
});

test('planSpec: density 2 halves the pitch and the motif but keeps the line width', () => {
  const p = planSpec(spec(), { density: 2 }, { env: fakeEnv });
  assert.equal(p.strokeWidth, 0.239);
  assert.equal(p.layers[0].primitives[0].r, 1.75);
  assert.equal(p.layers[0].primitives.length, 3);
});

test('planSpec: every tileMode goes through the shared pipeline (same tiling and primitives as the SVG output)', () => {
  for (const tileMode of ['frame', 'period']) {
    const p = planSpec(spec(), { tileMode });
    const s = renderSpecToSVG(spec(), { tileMode });
    assert.deepEqual(p.meta.tiling, s.meta.tiling, tileMode);
    assert.equal(p.layers.reduce((n, l) => n + l.primitives.length, 0), s.meta.counts.primitives, tileMode);
  }
});

test('drawPrimitives: draws a given primitive list through the context', () => {
  const ctx = recorder();
  drawPrimitives(ctx, [circle(1, 1, 1, { fill: 'ink' }), line(0, 0, 2, 2)], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'round', join: 'round', scale: 4 });
  assert.deepEqual(ctx.calls[1], ['transform', 4, 0, 0, 4, 0, 0]);
  assert.equal(ctx.props.lineJoin, 'round');
  assert.equal(ctx.calls.filter((c) => c[0] === 'stroke').length, 2);
  assert.equal(ctx.calls.filter((c) => c[0] === 'fill').length, 1);
});

test('drawPrimitives: rejects a non-positive scale', () => {
  assert.throws(() => drawPrimitives(recorder(), [], { ink: INK, paper: PAPER, strokeWidth: 0.2, cap: 'butt', join: 'miter', scale: -1 }), /scale must be > 0/);
});
