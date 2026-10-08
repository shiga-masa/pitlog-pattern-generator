import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPattern, renderSVGPattern, computeTile } from '../../src/render/svgPattern.js';
import { renderSpecToSVG } from '../../src/render/svg.js';
import { circle } from '../../src/core/primitives.js';
import { makeEnv } from '../../src/core/validate.js';
import { ARCHETYPES } from '../../src/archetypes/index.js';
import { PatternRegistry } from '../../src/core/registry.js';
import { GeometryError, ResolveError } from '../../src/core/errors.js';
import { spec } from '../fixtures/specs.js';

const TOL = 1e-6;
const near = (a, b, tol = TOL) => Math.abs(a - b) <= tol;

/** Stand-in grid: one circle per cell, anchored at the cell centre. Honours ctx.fit. */
function lattice(overrides = {}) {
  return {
    ...ARCHETYPES.grid,
    period(layer, ctx) {
      return { w: layer.params.pitchX * ctx.fit.x, h: layer.params.pitchY * ctx.fit.y };
    },
    render(layer, ctx) {
      const d = layer.motif.d;
      const W = ctx.region.width;
      const H = ctx.region.height;
      const fx = layer.params.pitchX * ctx.fit.x;
      const fy = layer.params.pitchY * ctx.fit.y;
      const prims = [];
      if (ctx.tileMode !== 'frame') {
        // period / fit: the tile holds one cell, so one domain anchor per cell
        const nx = Math.round(W / fx);
        const ny = Math.round(H / fy);
        for (let i = 0; i < nx; i++) {
          for (let j = 0; j < ny; j++) prims.push(circle((i + 0.5) * fx, (j + 0.5) * fy, d / 2, { fill: layer.motif.fill }));
        }
        return { primitives: prims, placed: prims.length, skipped: 0, warnings: [] };
      }
      // frame: draw only motifs wholly inside the region (edgeMode whole)
      let placed = 0;
      let skipped = 0;
      for (let i = 0; i <= Math.ceil(W / fx); i++) {
        for (let j = 0; j <= Math.ceil(H / fy); j++) {
          const cx = (i + 0.5) * fx;
          const cy = (j + 0.5) * fy;
          if (cx - d / 2 >= 0 && cx + d / 2 <= W && cy - d / 2 >= 0 && cy + d / 2 <= H) {
            prims.push(circle(cx, cy, d / 2, { fill: layer.motif.fill }));
            placed++;
          } else {
            skipped++;
          }
        }
      }
      return { primitives: prims, placed, skipped, warnings: [] };
    },
    ...overrides,
  };
}
const env = makeEnv({ archetypes: { ...ARCHETYPES, grid: lattice() } });

const grid = (id, pitchX, pitchY, d = 7) => ({
  id,
  archetype: 'grid',
  motif: { kind: 'circle', d, fill: 'ink' },
  params: { pitchX, pitchY, rowOffset: 0.5, rows: 3 },
});

/** Circles of a markup string as [cx, cy, r] numbers. */
function circlesOf(markup) {
  return [...markup.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
}

test('period tile is the layer period at density 1', () => {
  const r = buildPattern(spec(), {}, { env });
  assert.ok(near(r.tile.w, 11.22) && near(r.tile.h, 9.27));
  assert.equal(r.meta.tileMode, 'period');
  assert.equal(r.meta.periodic, true);
  assert.deepEqual(r.meta.warnings, []);
});

test('density 2 halves the period and leaves the stroke width in pt', () => {
  const r = buildPattern(spec(), { density: 2 }, { env });
  assert.ok(near(r.tile.w, 5.61) && near(r.tile.h, 4.635));
  assert.equal(r.meta.strokeWidth, 0.239);
});

test('pattern markup is one userSpaceOnUse pattern with the tile size and no clip path', () => {
  const r = buildPattern(spec(), {}, { env });
  assert.match(r.defs, /^<pattern id="zc-zc_111101002-pattern" patternUnits="userSpaceOnUse" x="0" y="0" width="11.22" height="9.27">/);
  assert.ok(r.defs.endsWith('</pattern>'));
  assert.doesNotMatch(r.defs, /clipPath|clip-path/);
  assert.equal(r.ref, 'url(#zc-zc_111101002-pattern)');
});

test('the pattern uses only ink and paper colours', () => {
  const r = buildPattern(spec(), {}, { env });
  assert.deepEqual([...new Set(r.defs.match(/#[0-9a-fA-F]{3,8}\b/g))].sort(), ['#000000', '#ffffff']);
  assert.match(r.defs, /<rect x="0" y="0" width="11.22" height="9.27" fill="#ffffff"\/>/);
  assert.doesNotMatch(r.defs, /opacity|gradient|rgba?\(/);
});

test('a motif crossing the tile edges is copied to every neighbouring tile, each copy once', () => {
  // radius 7 > half the period on both axes: the domain circle reaches all four edges
  const r = buildPattern(spec({ layers: [grid('circles', 11.22, 9.27, 14)] }), {}, { env });
  const cs = circlesOf(r.defs);
  assert.equal(cs.length, 9);
  const expected = [];
  for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) expected.push([5.61 + i * 11.22, 4.635 + j * 9.27]);
  for (const [ex, ey] of expected) {
    assert.ok(cs.some(([x, y]) => near(x, ex, 1e-3) && near(y, ey, 1e-3)), `missing copy at ${ex}, ${ey}`);
  }
});

test('a motif inside the tile is not copied', () => {
  const r = buildPattern(spec({ layers: [grid('circles', 11.22, 9.27, 2)] }), {}, { env });
  assert.equal(circlesOf(r.defs).length, 1);
});

test('tileMode frame draws the region once: tile equals the frame and nothing is copied', () => {
  const r = buildPattern(spec(), { tileMode: 'frame' }, { env });
  assert.ok(near(r.tile.w, 56.03) && near(r.tile.h, 28.41));
  assert.equal(r.meta.periodic, false);
  const cs = circlesOf(r.defs);
  assert.equal(cs.length, r.meta.counts.instances.placed);
  for (const [x, y, rad] of cs) {
    assert.ok(x - rad >= -TOL && x + rad <= 56.03 + TOL && y - rad >= -TOL && y + rad <= 28.41 + TOL, `circle at ${x},${y} leaves the frame`);
  }
});

test('period mode uses the common period of several layers', () => {
  const s = spec({ layers: [grid('a', 6, 4, 2), grid('b', 4, 6, 2)] });
  const r = buildPattern(s, {}, { env });
  assert.ok(near(r.tile.w, 12) && near(r.tile.h, 12));
  assert.equal(r.meta.tileMode, 'period');
});

test('period mode with no common period and no fit within 5 % falls back to the frame with a warning naming the layers', () => {
  const s = spec({ layers: [grid('a', 11.22, 9.27, 2), grid('b', 10, 9.27, 2)] });
  const r = buildPattern(s, {}, { env });
  assert.equal(r.meta.tileMode, 'frame');
  assert.equal(r.meta.periodic, false);
  assert.ok(r.meta.warnings.some((w) => /no common period/.test(w) && /a 11\.22x9\.27/.test(w)), r.meta.warnings.join('\n'));
});

test('explicit fit with no common period is refused with the layers named', () => {
  const s = spec({ layers: [grid('a', 11.22, 9.27, 2), grid('b', 10, 9.27, 2)] });
  assert.throws(() => buildPattern(s, { tileMode: 'fit' }, { env }), (e) => e instanceof GeometryError && /no common period/.test(e.message) && /a 11\.22x9\.27/.test(e.message));
});

test('fit: an integer count of periods fills the target within 5 %', () => {
  const r = buildPattern(spec(), { tileMode: 'fit', size: { width: 56.03, height: 28.41, unit: 'pt' } }, { env });
  assert.ok(near(r.tile.w, 56.03 / 5, 1e-9));
  assert.ok(near(r.tile.h, 28.41 / 3, 1e-9));
  assert.equal(r.meta.adjust.x.n, 5);
  assert.equal(r.meta.adjust.y.n, 3);
  assert.ok(Math.abs(r.meta.adjust.x.ratio - 1) <= 0.05);
});

test('fit beyond 5 % is refused with the nearest count and ratio', () => {
  assert.throws(
    () => buildPattern(spec(), { tileMode: 'fit', size: { width: 50, height: 28.41, unit: 'pt' } }, { env }),
    (e) => e instanceof GeometryError && /within ±5 %/.test(e.message) && /x period 11\.22/.test(e.message),
  );
});

test('an archetype that ignores ctx.fit is caught instead of drawing a seam', () => {
  const ignoring = makeEnv({ archetypes: { ...ARCHETYPES, grid: lattice({ period: (l) => ({ w: l.params.pitchX, h: l.params.pitchY }) }) } });
  assert.throws(
    () => buildPattern(spec(), { tileMode: 'fit', size: { width: 56.03, height: 28.41, unit: 'pt' } }, { env: ignoring }),
    (e) => e instanceof GeometryError && /did not apply ctx.fit/.test(e.message),
  );
});

test('a layer without a period falls back to the frame tile with a warning', () => {
  const noPeriod = makeEnv({ archetypes: { ...ARCHETYPES, grid: lattice({ period: () => null }) } });
  const r = buildPattern(spec(), {}, { env: noPeriod });
  assert.equal(r.meta.periodic, false);
  assert.ok(near(r.tile.w, 56.03) && near(r.tile.h, 28.41));
  assert.ok(r.meta.warnings.some((w) => /no period for layer\(s\) circles/.test(w)));
});

test('renderSVG tileMode fit fills the region with whole tiles and draws each motif once', () => {
  const { svg, meta } = renderSpecToSVG(spec({ layers: [grid('circles', 11.22, 9.27, 14)] }), { tileMode: 'fit' }, { env });
  const cs = circlesOf(svg);
  assert.equal(meta.tiling.adjust.x.n, 5);
  assert.equal(meta.tiling.adjust.y.n, 3);
  const keys = new Set(cs.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`));
  assert.equal(keys.size, cs.length, 'no motif is drawn twice');
  const tw = 56.03 / 5;
  const th = 28.41 / 3;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      const ex = (i + 0.5) * tw;
      const ey = (j + 0.5) * th;
      assert.ok(cs.some(([x, y]) => near(x, ex, 1e-3) && near(y, ey, 1e-3)), `tile ${i},${j} has no motif`);
    }
  }
  assert.match(svg, /<clipPath id="zc-zc_111101002-clip">/);
});

test('renderSVGPattern resolves an id through the registry and rejects an unknown id', async () => {
  const registry = new PatternRegistry({ env });
  registry.add(spec());
  const r = await renderSVGPattern('zc:111101002', {}, { registry, env });
  assert.equal(r.ref, 'url(#zc-zc_111101002-pattern)');
  await assert.rejects(renderSVGPattern('zc:999999999', {}, { registry, env }), ResolveError);
});

test('frame.show ink is not drawn in a tile and the omission is reported', () => {
  const r = buildPattern(spec({ frame: { show: 'ink' } }), {}, { env });
  assert.ok(r.meta.warnings.some((w) => /frame is not part of a pattern tile/.test(w)));
  assert.doesNotMatch(r.defs, /fill="none" stroke="#000000" stroke-width="0.239"\/><\/pattern>/);
});

test('computeTile of a frame request returns the target size and is not periodic', () => {
  const drawSpec = { frame: { width: 56.03, height: 28.41 }, layers: [] };
  const t = computeTile(drawSpec, { env, render: { strokeWidth: 0.239 }, mode: 'frame', target: { width: 20, height: 10 } });
  assert.deepEqual(t.tile, { width: 20, height: 10 });
  assert.equal(t.periodic, false);
});
