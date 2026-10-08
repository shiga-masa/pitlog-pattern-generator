/**
 * Deterministic seeded random numbers (CONVENTIONS §4).
 *
 * - Generator: mulberry32 over a uint32 state. Same seed -> same sequence on every JS engine
 *   (only 32-bit integer ops and one division by 2^32 are used).
 * - Never use Math.random() anywhere in src/.
 * - Seeds are uint32 integers. Layer seeds are derived with hashSeed(baseSeed, label).
 */

const UINT32 = 0x100000000;

function assertSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError(`seed must be an integer in 0..4294967295, got ${JSON.stringify(seed)}`);
  }
}

/**
 * Mix any number of seed parts (uint32 integers or strings) into one uint32 (FNV-1a + murmur3 finaliser).
 * @param {...(number|string)} parts @returns {number}
 */
export function hashSeed(...parts) {
  let h = 0x811c9dc5;
  const feed = (byte) => {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  for (const p of parts) {
    if (typeof p === 'number') {
      assertSeed(p);
      feed(0x4e); // tag: number
      for (let s = 0; s < 32; s += 8) feed((p >>> s) & 0xff);
    } else if (typeof p === 'string') {
      feed(0x53); // tag: string
      for (const ch of p) {
        const c = ch.codePointAt(0);
        for (let s = 0; s < 24; s += 8) feed((c >>> s) & 0xff);
      }
    } else {
      throw new TypeError(`hashSeed: parts must be uint32 numbers or strings, got ${JSON.stringify(p)}`);
    }
    feed(0xff); // separator
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * @typedef {object} Rng
 * @property {number} seed initial seed
 * @property {() => number} next uint32
 * @property {() => number} random float in [0, 1)
 * @property {(a:number, b:number) => number} uniform float in [a, b)
 * @property {(a:number, b:number) => number} int integer in [a, b] (inclusive)
 * @property {(mean:number, sd:number) => number} normal Box–Muller
 * @property {(weights:number[]) => number} weightedIndex index chosen with probability ∝ weight
 * @property {<T>(arr:T[]) => T[]} shuffle new array, Fisher–Yates
 * @property {(label:string|number) => Rng} fork independent child stream, deterministic per label
 */

/** @param {number} seed uint32 @returns {Rng} */
export function createRng(seed) {
  assertSeed(seed);
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  const random = () => next() / UINT32;
  return {
    seed,
    next,
    random,
    uniform(a, b) {
      if (!(Number.isFinite(a) && Number.isFinite(b) && b >= a)) throw new RangeError(`uniform(${a}, ${b}): need finite a <= b`);
      return a + (b - a) * random();
    },
    int(a, b) {
      if (!(Number.isInteger(a) && Number.isInteger(b) && b >= a)) throw new RangeError(`int(${a}, ${b}): need integers a <= b`);
      return a + Math.floor(random() * (b - a + 1));
    },
    normal(mean = 0, sd = 1) {
      let u = random();
      while (u === 0) u = random();
      const v = random();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    weightedIndex(weights) {
      if (!Array.isArray(weights) || weights.length === 0) throw new RangeError('weightedIndex: empty weights');
      let total = 0;
      for (const w of weights) {
        if (!(Number.isFinite(w) && w >= 0)) throw new RangeError(`weightedIndex: bad weight ${w}`);
        total += w;
      }
      if (total <= 0) throw new RangeError('weightedIndex: weights sum to 0');
      let r = random() * total;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r < 0) return i;
      }
      return weights.length - 1;
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    fork(label) {
      return createRng(hashSeed(seed, String(label)));
    },
  };
}

/**
 * Seed of one layer: hashSeed(baseSeed, layer.seed ?? layer.id).
 * Changing the base seed changes every layer; layers never share a stream.
 * @param {number} baseSeed @param {{id:string, seed?:number}} layer
 */
export function layerSeed(baseSeed, layer) {
  return hashSeed(baseSeed, layer.seed ?? layer.id);
}
