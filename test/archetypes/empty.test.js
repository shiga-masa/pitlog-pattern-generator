import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHETYPE, PARAMS, render, period } from '../../src/archetypes/empty.js';
import { createRng } from '../../src/core/rng.js';
import { applyDefaults } from '../../src/core/schema.js';

function makeLayer() {
  return { id: 'none', archetype: ARCHETYPE, params: applyDefaults(PARAMS, {}) };
}

function makeCtx() {
  return {
    region: { x: 0, y: 0, width: 56.03, height: 28.41 },
    tileMode: 'frame',
    strokeWidth: 0.2,
    origin: 'center',
    jitter: 0,
    clip: true,
    rng: createRng(1),
    results: {},
    buildMotif: () => { throw new Error('empty does not use motifs'); },
    motifExtent: () => ({ w: 0, h: 0 }),
  };
}

test('empty: render returns a normal result with nothing drawn', () => {
  const r = render(makeLayer(), makeCtx());
  assert.deepEqual(r, { primitives: [], placed: 0, skipped: 0, warnings: [], anchors: [] });
});

test('empty: period is one frame', () => {
  assert.deepEqual(period(makeLayer(), makeCtx()), { w: 56.03, h: 28.41 });
});
