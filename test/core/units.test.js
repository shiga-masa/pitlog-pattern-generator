import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPt, fromPt, ptToPixels, PT_PER_MM } from '../../src/core/units.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('mm <-> pt', () => {
  close(PT_PER_MM, 72 / 25.4);
  close(toPt(25.4, 'mm'), 72);
  close(fromPt(72, 'mm'), 25.4);
});

test('px <-> pt uses dpi (96 dpi: 1 px = 0.75 pt)', () => {
  close(toPt(1, 'px', 96), 0.75);
  close(fromPt(0.239, 'px', 300), 0.239 * 300 / 72);
  assert.throws(() => toPt(1, 'px'), /dpi/);
});

test('pixel count rounds up', () => {
  assert.equal(ptToPixels(56.03, 600), 467);
  assert.equal(ptToPixels(72, 300), 300);
  assert.throws(() => toPt(1, 'in'), /unknown unit/);
});
