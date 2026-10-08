import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UNIT_FIT, fitOf, fitPeriod, stretchPrimitive, drawStretched, offsetOf } from '../../src/core/fit.js';
import { line, circle, path } from '../../src/core/primitives.js';

test('fitOf defaults to the unit fit and rejects bad factors', () => {
  assert.deepEqual(fitOf({}), UNIT_FIT);
  assert.throws(() => fitOf({ fit: { x: 0, y: 1 } }), /finite factors > 0/);
});

test('fitPeriod scales a period by the fit and keeps null', () => {
  assert.deepEqual(fitPeriod({ w: 10, h: 4 }, { fit: { x: 1.02, y: 0.97 } }), { w: 10.2, h: 3.88 });
  assert.equal(fitPeriod(null, { fit: { x: 1.02, y: 1 } }), null);
});

test('stretchPrimitive scales lines and paths; circles are refused (they would stop being round)', () => {
  assert.deepEqual(stretchPrimitive(line(1, 2, 3, 4), { x: 2, y: 0.5 }), line(2, 1, 6, 2));
  const p = stretchPrimitive(path([{ op: 'M', x: 1, y: 1 }, { op: 'Q', x1: 2, y1: 2, x: 3, y: 1 }]), { x: 2, y: 3 });
  assert.deepEqual(p.cmds, [{ op: 'M', x: 2, y: 3 }, { op: 'Q', x1: 4, y1: 6, x: 6, y: 3 }]);
  assert.throws(() => stretchPrimitive(circle(0, 0, 1), { x: 2, y: 2 }), /cannot be stretched/);
});

test('drawStretched draws in unfitted coordinates and stretches the result back', () => {
  const ctx = { region: { x: 0, y: 0, width: 20.4, height: 9.7 }, origin: { x: 10.2, y: 0 }, fit: { x: 1.02, y: 0.97 } };
  const seen = [];
  const res = drawStretched(ctx, (c) => {
    seen.push(c);
    return { primitives: [line(0, 0, c.region.width, c.region.height)], placed: 1, skipped: 0, warnings: [], anchors: [{ x: c.origin.x, y: 0 }] };
  });
  assert.ok(Math.abs(seen[0].region.width - 20) < 1e-12 && Math.abs(seen[0].region.height - 10) < 1e-12);
  assert.deepEqual(seen[0].fit, UNIT_FIT);
  assert.ok(Math.abs(seen[0].origin.x - 10) < 1e-12);
  assert.ok(Math.abs(res.primitives[0].x2 - 20.4) < 1e-12 && Math.abs(res.primitives[0].y2 - 9.7) < 1e-12);
  assert.ok(Math.abs(res.anchors[0].x - 10.2) < 1e-12);
});

test('offsetOf reads layer.offset, zero when absent', () => {
  assert.deepEqual(offsetOf({}), { x: 0, y: 0 });
  assert.deepEqual(offsetOf({ offset: { x: 1, y: -2 } }), { x: 1, y: -2 });
});
