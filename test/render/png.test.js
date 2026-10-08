import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPNG, pixelSize, withinPixelLimits, maxDpiFor } from '../../src/render/png.js';
import { circle } from '../../src/core/primitives.js';
import { makeEnv } from '../../src/core/validate.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { LimitError, ZcError } from '../../src/core/errors.js';
import { spec } from '../fixtures/specs.js';

const fakeGrid = {
  ...ARCHETYPES.grid,
  render(layer, ctx) {
    const prims = [];
    for (let r = 0; r < layer.params.rows; r++) {
      prims.push(circle(ctx.region.width / 2, (r + 0.5) * layer.params.pitchY, layer.motif.d / 2, { fill: layer.motif.fill }));
    }
    return { primitives: prims, placed: prims.length, skipped: 0, warnings: [] };
  },
};
const fakeEnv = makeEnv({ archetypes: { ...ARCHETYPES, grid: fakeGrid } });

test('pixelSize: region in pt times dpi over 72, rounded up', () => {
  assert.deepEqual(pixelSize({ width: 72, height: 72 }, 96), { width: 96, height: 96 });
  assert.deepEqual(pixelSize({ width: 56.03, height: 28.41 }, 300), { width: 234, height: 119 });
  assert.deepEqual(pixelSize({ width: 0.001, height: 0.001 }, 96), { width: 1, height: 1 });
});

test('withinPixelLimits: 8192 px per side and 5e7 px in total', () => {
  assert.equal(withinPixelLimits({ width: 8192, height: 6103 }), true);
  assert.equal(withinPixelLimits({ width: 8193, height: 1 }), false);
  assert.equal(withinPixelLimits({ width: 8000, height: 6300 }), false); // 5.04e7 > 5e7
});

test('maxDpiFor: the returned dpi fits and the next integer does not', () => {
  const region = { width: 56.03, height: 28.41 };
  const d = maxDpiFor(region);
  assert.ok(d >= 1);
  assert.equal(withinPixelLimits(pixelSize(region, d)), true);
  assert.equal(withinPixelLimits(pixelSize(region, d + 1)), false);
});

test('maxDpiFor: null when no dpi fits at all (region far too large)', () => {
  assert.equal(maxDpiFor({ width: 1e6, height: 1e6 }), null);
});

test('renderPNG: a side over 8192 px throws LimitError with a candidate dpi that really fits', async () => {
  const size = { width: 1000, height: 100, unit: 'mm' };
  const region = { width: (1000 * 72) / 25.4, height: (100 * 72) / 25.4 };
  await assert.rejects(renderPNG(spec(), { size, dpi: 300 }, { env: fakeEnv }), (e) => {
    assert.ok(e instanceof LimitError);
    assert.match(e.message, /Nothing was shrunk/);
    const m = e.message.match(/dpi <= (\d+)/);
    assert.ok(m, 'message lists a candidate dpi');
    assert.equal(withinPixelLimits(pixelSize(region, Number(m[1]))), true);
    return true;
  });
});

test('renderPNG: total pixels over 5e7 throw LimitError even when each side is within 8192', async () => {
  const size = { width: 680, height: 600, unit: 'mm' };
  await assert.rejects(renderPNG(spec(), { size, dpi: 300 }, { env: fakeEnv }), (e) => e instanceof LimitError && /in total/.test(e.message));
});

test('renderPNG: a size inside the limits passes the check and needs a browser canvas', async () => {
  const size = { width: 100, height: 50, unit: 'mm' };
  await assert.rejects(renderPNG(spec(), { size, dpi: 300 }, { env: fakeEnv }), (e) => (
    e instanceof ZcError && !(e instanceof LimitError) && /needs a browser canvas/.test(e.message)
  ));
});

test('renderPNG: without dpi the library default (96) applies, so a size that fails at 300 dpi passes', async () => {
  const size = { width: 1000, height: 100, unit: 'mm' };
  // 1000 mm at 300 dpi is over 8192 px (LimitError above); at the default 96 dpi it is 3780 px and passes
  await assert.rejects(renderPNG(spec(), { size }, { env: fakeEnv }), (e) => (
    e instanceof ZcError && !(e instanceof LimitError) && /needs a browser canvas/.test(e.message)
  ));
});
