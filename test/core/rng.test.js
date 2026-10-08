import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, hashSeed, layerSeed } from '../../src/core/rng.js';

const take = (rng, n) => Array.from({ length: n }, () => rng.next());

test('same seed -> identical sequence', () => {
  assert.deepEqual(take(createRng(42), 100), take(createRng(42), 100));
});

test('different seeds -> different sequences', () => {
  assert.notDeepEqual(take(createRng(1), 10), take(createRng(2), 10));
});

test('sequence is pinned (guards against accidental algorithm changes)', () => {
  // mulberry32, seed 0 and 42. Changing these values is a breaking change (all scatter presets move).
  assert.deepEqual(take(createRng(0), 3), [1144304738, 1416247, 958946056]);
  assert.deepEqual(take(createRng(42), 3), [2581720956, 1925393290, 3661312704]);
});

test('hashSeed is stable, order-sensitive and type-tagged', () => {
  assert.equal(hashSeed(0, 'circles'), hashSeed(0, 'circles'));
  assert.notEqual(hashSeed(0, 'a', 'b'), hashSeed(0, 'b', 'a'));
  assert.notEqual(hashSeed(1), hashSeed('1'));
  assert.equal(hashSeed(7, 'lines'), 1577007344);
});

test('random/uniform/int stay in range', () => {
  const r = createRng(123);
  for (let i = 0; i < 2000; i++) {
    const x = r.random();
    assert.ok(x >= 0 && x < 1);
    const u = r.uniform(-2, 3);
    assert.ok(u >= -2 && u < 3);
    const k = r.int(1, 6);
    assert.ok(Number.isInteger(k) && k >= 1 && k <= 6);
  }
});

test('weightedIndex follows weights (19 segments, R2 §18 classes)', () => {
  const r = createRng(9);
  const w = [9, 1, 7, 2];
  const hist = [0, 0, 0, 0];
  for (let i = 0; i < 19000; i++) hist[r.weightedIndex(w)]++;
  w.forEach((wi, i) => assert.ok(Math.abs(hist[i] / 19000 - wi / 19) < 0.02, `class ${i}: ${hist[i]}`));
  assert.throws(() => r.weightedIndex([0, 0]), /sum to 0/);
  assert.throws(() => r.weightedIndex([]), /empty/);
});

test('fork gives independent, reproducible streams', () => {
  const a = createRng(5).fork('x');
  const b = createRng(5).fork('x');
  const c = createRng(5).fork('y');
  assert.deepEqual(take(a, 5), take(b, 5));
  assert.notDeepEqual(take(createRng(5).fork('x'), 5), take(c, 5));
});

test('layerSeed: base seed changes every layer; explicit layer seed is a label', () => {
  assert.notEqual(layerSeed(0, { id: 'a' }), layerSeed(1, { id: 'a' }));
  assert.notEqual(layerSeed(0, { id: 'a' }), layerSeed(0, { id: 'b' }));
  assert.equal(layerSeed(0, { id: 'a', seed: 11 }), layerSeed(0, { id: 'zzz', seed: 11 }));
});

test('invalid seeds throw', () => {
  for (const s of [-1, 1.5, 2 ** 32, '3', NaN]) assert.throws(() => createRng(s), /seed must be/);
});

test('shuffle and normal are deterministic', () => {
  assert.deepEqual(createRng(3).shuffle([1, 2, 3, 4, 5]), createRng(3).shuffle([1, 2, 3, 4, 5]));
  const r = createRng(4);
  const xs = Array.from({ length: 5000 }, () => r.normal(10, 2));
  const mean = xs.reduce((a, b) => a + b) / xs.length;
  assert.ok(Math.abs(mean - 10) < 0.1);
});
