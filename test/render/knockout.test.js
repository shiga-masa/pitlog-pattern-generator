import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flatten, segmentsIntersect, shapesIntersect, applyKnockout } from '../../src/render/knockout.js';
import { renderSpecToSVG } from '../../src/render/svg.js';
import { line, polygon, circle } from '../../src/core/primitives.js';
import { spec } from '../fixtures/specs.js';

test('segment intersection includes touching and collinear overlap', () => {
  assert.ok(segmentsIntersect([0, 0], [2, 2], [0, 2], [2, 0]));
  assert.ok(segmentsIntersect([0, 0], [2, 0], [2, 0], [3, 1]));
  assert.ok(segmentsIntersect([0, 0], [2, 0], [1, 0], [3, 0]));
  assert.ok(!segmentsIntersect([0, 0], [1, 0], [0, 1], [1, 1]));
});

test('a line crossing a triangle or lying inside it intersects; a line outside does not', () => {
  const tri = flatten(polygon([[0, 0], [10, 0], [5, 8]], { fill: 'paper' }));
  assert.ok(shapesIntersect(flatten(line(-1, 2, 11, 2)), tri));
  assert.ok(shapesIntersect(flatten(line(4, 1, 6, 1)), tri), 'inside the closed triangle');
  assert.ok(!shapesIntersect(flatten(line(0, 9, 10, 9)), tri));
  assert.ok(shapesIntersect(flatten(circle(5, 3, 0.5, { fill: 'ink' })), tri), 'a dot inside');
});

test('applyKnockout removes intersected primitives of the layers below only', () => {
  const layers = [{ id: 'lines', blend: 'over' }, { id: 'tris', blend: 'knockout' }, { id: 'top', blend: 'over' }];
  const prims = {
    lines: [line(-1, 2, 11, 2), line(0, 20, 10, 20)],
    tris: [polygon([[0, 0], [10, 0], [5, 8]], { fill: 'paper' })],
    top: [line(-1, 3, 11, 3)],
  };
  const r = applyKnockout(layers, prims);
  assert.equal(r.prims.lines.length, 1);
  assert.equal(r.prims.lines[0].y1, 20);
  assert.equal(r.prims.top.length, 1, 'layers above are untouched');
  assert.deepEqual(r.removed, { lines: 1 });
});

test('blend knockout runs in the renderer and is counted in meta', () => {
  const s = spec({
    layers: [
      { id: 'lines', archetype: 'hatch', params: { angle: 0, spacing: 2 } },
      { id: 'circles', archetype: 'grid', blend: 'knockout', motif: { kind: 'circle', d: 7.0, fill: 'paper' }, params: { pitchX: 11.22, pitchY: 9.27, rowOffset: 0.5, rows: 3 } },
    ],
  });
  const over = renderSpecToSVG({ ...s, layers: s.layers.map((l) => ({ ...l, blend: 'over' })) });
  const knock = renderSpecToSVG(s);
  assert.ok(knock.meta.counts.knockout.lines > 0);
  assert.equal(over.meta.counts.primitives - knock.meta.counts.primitives, knock.meta.counts.knockout.lines);
  assert.ok(knock.meta.warnings.some((w) => /removed by blend "knockout"/.test(w)));
});
