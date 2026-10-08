// Stage-2 smoke test: every registered preset is drawn through the PUBLIC API (src/index.js)
// with SVG, <pattern> and PNG output, and every result is checked for exceptions, NaN, colours
// (ink/paper only) and a valid viewBox. Counts of processed / skipped / failed are printed at the end.
// Nothing is skipped silently: the only allowed skips are listed in KNOWN_VALUE_ISSUES (unmeasured or
// contract-inconsistent preset values that stage 2 must not change) and fit targets that do not exist
// (no period / no common period), each counted with its reason.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderSVG, renderSVGPattern, renderPNG, listPresets, getPreset, resolveId, presetReport, toSpec,
} from '../../src/index.js';
import { PRESET_FILES } from '../../src/presets/index.js';
import { GeometryError } from '../../src/core/errors.js';
import { DEFAULT_ENV } from '../../src/core/validate.js';
import { resolveSpec } from '../../src/core/resolve.js';
import { layerPeriods, commonPeriod, fmt } from '../../src/render/svg.js';
import { planSpec, buildInstructions, drawInstructions } from '../../src/render/canvas.js';
import { pixelSize, withinPixelLimits } from '../../src/render/png.js';

/**
 * Preset values that cannot be drawn as they stand. Stage 2 changes no preset value; these go to the
 * verification stage. Each must fail with exactly this GeometryError, so a fix shows up as a test failure
 * here (remove the entry then).
 */
const KNOWN_VALUE_ISSUES = {};

const HEX = /#[0-9a-fA-F]{6}\b/g;

/** Colours written into an SVG string. */
function colorsIn(svg) {
  return new Set((svg.match(HEX) ?? []).map((c) => c.toLowerCase()));
}

function checkSvg(svg, { ink, paper, region }, label) {
  assert.ok(!/NaN|Infinity/.test(svg), `${label}: NaN/Infinity in SVG`);
  assert.ok(!/rgba?\(|hsla?\(|opacity|gradient|transparent/i.test(svg), `${label}: a forbidden colour form appears`);
  for (const c of colorsIn(svg)) assert.ok(c === ink || c === paper, `${label}: colour ${c} is neither ink ${ink} nor paper ${paper}`);
  const vb = svg.match(/^<svg [^>]*viewBox="([^"]+)"/);
  assert.ok(vb, `${label}: no viewBox`);
  const [x, y, w, h] = vb[1].split(' ').map(Number);
  assert.ok(x === 0 && y === 0 && w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h), `${label}: bad viewBox ${vb[1]}`);
  if (region) assert.equal(vb[1], `0 0 ${fmt(region.width)} ${fmt(region.height)}`, `${label}: viewBox is not the region`);
}

/** No primitive is written twice inside one layer group (the period-tile double-copy regression). */
function checkNoDuplicates(markup, label) {
  for (const g of markup.matchAll(/<g data-layer="([^"]+)"[^>]*>(.*?)<\/g>/g)) {
    const items = g[2].match(/<[a-z]+ [^>]*\/>/g) ?? [];
    const seen = new Set();
    for (const it of items) {
      assert.ok(!seen.has(it), `${label}: layer ${g[1]} draws ${it} twice`);
      seen.add(it);
    }
  }
}

/** Instruction list (Canvas/PNG path): finite numbers, only ink/paper, alpha 1. */
function checkInstructions(list, { ink, paper }, label) {
  for (const ins of list) {
    for (const [k, v] of Object.entries(ins)) {
      if (typeof v === 'number') assert.ok(Number.isFinite(v), `${label}: ${ins.op}.${k} = ${v}`);
      if (Array.isArray(v)) v.forEach((n) => assert.ok(Number.isFinite(n), `${label}: ${ins.op}.${k} has ${n}`));
    }
    if (ins.op === 'setStrokeStyle' || ins.op === 'setFillStyle') {
      assert.ok(ins.v === ink || ins.v === paper, `${label}: ${ins.op} ${ins.v}`);
    }
    if (ins.op === 'setGlobalAlpha') assert.equal(ins.v, 1, `${label}: globalAlpha ${ins.v}`);
  }
}

/** A 2D context stand-in that records calls, and an OffscreenCanvas stand-in for renderPNG in Node. */
function recorderContext() {
  const ctx = { calls: 0, styles: new Set() };
  const names = ['save', 'restore', 'transform', 'beginPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo',
    'closePath', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'setLineDash'];
  for (const n of names) {
    ctx[n] = (...args) => {
      for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) throw new Error(`${n} got ${a}`);
      ctx.calls++;
    };
  }
  return new Proxy(ctx, {
    set(t, k, v) {
      if (k === 'strokeStyle' || k === 'fillStyle') t.styles.add(v);
      if (k === 'globalAlpha' && v !== 1) throw new Error(`globalAlpha ${v}`);
      t[k] = v;
      return true;
    },
  });
}

class FakeOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.ctx = recorderContext();
  }
  getContext(kind) {
    return kind === '2d' ? this.ctx : null;
  }
  async convertToBlob({ type }) {
    return new Blob([`${this.width}x${this.height}:${this.ctx.calls}`], { type });
  }
}

test('the default registry holds every preset file, every alias resolves, nothing failed', () => {
  const rep = presetReport();
  const expected = Object.values(PRESET_FILES).reduce((n, l) => n + l.length, 0);
  assert.equal(rep.total.processed, expected);
  assert.equal(rep.total.failed, 0);
  assert.equal(rep.total.skipped, 0);
  assert.equal(rep.aliases.failed, 0);
  assert.equal(rep.aliases.processed, expected);
  const rows = listPresets();
  assert.equal(rows.length, expected);
  for (const t of ['3-1', '3-2', '3-3', '3-4', '3-5', '3-7', '3-8', '3-9', '4-1', '4-2', '4-3', '5-1', '5-2', '5-3']) {
    assert.ok(rows.some((r) => r.table === t), `table ${t} has no preset`);
  }
  console.log(`[smoke] registry: ${rep.total.processed} presets (${rows.filter((r) => r.aliasOf).length} aliases) from ${Object.keys(rep.files).length} files; failed ${rep.total.failed}`);
});

test('names, symbols and codes do not become ambiguous through table 5 aliases', () => {
  assert.equal(resolveId('盛土'), 'zc:599200001');
  assert.equal(resolveId('礫質'), 'zc:t4-3:G');
  assert.equal(resolveId('粗礫'), 'zc:531111100');
  assert.equal(resolveId('巨礫岩'), 'zc:111111002');
  assert.throws(() => resolveId('sym:Pt'), /ambiguous/);
  // every Japanese name that table 4 and table 5 share resolves to the table 4 entry
  for (const r of listPresets({ table: '5-1' })) {
    const id = resolveId(r.names.ja);
    assert.ok(!id.startsWith('zc:t5-'), `${r.names.ja} resolved to the table 5 row ${id}`);
  }
});

test('every preset renders to SVG, <pattern> and PNG through the public API', async (t) => {
  const prevOffscreen = globalThis.OffscreenCanvas;
  globalThis.OffscreenCanvas = FakeOffscreenCanvas;
  const counts = { processed: 0, skipped: 0, failed: 0 };
  const skips = [];
  const failures = [];
  const fit = { processed: 0, skipped: 0, failed: 0, reasons: {} };
  try {
    const rows = listPresets();
    for (const row of rows) {
      const label = row.id;
      const drawId = row.aliasOf ? null : row.id;
      if (!drawId) {
        // aliases: resolvable and drawing the same spec as their target; rendered once via the target
        const a = getPreset(row.id);
        assert.ok(Array.isArray(a.layers) && a.layers.length > 0, `${label}: alias does not resolve to a drawing`);
        counts.processed++;
        continue;
      }
      const known = KNOWN_VALUE_ISSUES[drawId];
      try {
        const spec = getPreset(drawId);
        const region = resolveSpec(spec, {}).render.region;

        const a = await renderSVG(drawId);
        checkSvg(a.svg, { ink: '#000000', paper: '#ffffff', region }, `${label} svg`);
        assert.ok(a.meta.counts.layers.failed === 0 && a.meta.counts.layers.processed === spec.layers.length, `${label}: layer counts`);

        const colors = { ink: '#1a2b3c', paper: '#f0e0d0' };
        const b = await renderSVG(drawId, { ...colors, tileMode: 'period', size: { width: 40, height: 30, unit: 'mm' } });
        checkSvg(b.svg, colors, `${label} svg period custom colours`);
        checkNoDuplicates(b.svg, `${label} svg period`);

        const pat = await renderSVGPattern(drawId);
        checkSvg(`<svg viewBox="0 0 ${fmt(pat.tile.w)} ${fmt(pat.tile.h)}">${pat.defs}</svg>`, { ink: '#000000', paper: '#ffffff' }, `${label} pattern`);
        checkNoDuplicates(pat.defs, `${label} pattern`);

        const blob = await renderPNG(drawId, { dpi: 300 });
        assert.equal(blob.type, 'image/png', `${label}: PNG blob type`);
        const plan = planSpec(spec, { dpi: 300 });
        const px = pixelSize(plan.region, 300);
        assert.ok(withinPixelLimits(px) && px.width > 0 && px.height > 0, `${label}: pixel size ${px.width}x${px.height}`);
        const ins = buildInstructions(plan, { x: 0, y: 0, scale: 300 / 72 });
        checkInstructions(ins, plan.colors, `${label} png`);
        drawInstructions(recorderContext(), ins);

        // reproducibility: toSpec() of the preset draws the same picture
        const again = await renderSVG(toSpec(drawId));
        assert.equal(again.svg, a.svg, `${label}: toSpec() does not reproduce the picture`);

        // tileMode 'fit': only where a common period exists; target = about 3 periods + 2 %
        const r = resolveSpec(spec, {});
        const per = layerPeriods(r.drawSpec, DEFAULT_ENV, r.render);
        const missing = per.filter((p) => p.period === null);
        const T = missing.length ? null : commonPeriod(per.map((p) => p.period));
        if (!T) {
          const why = missing.length ? 'no period' : 'no common period';
          fit.skipped++;
          fit.reasons[why] = (fit.reasons[why] ?? 0) + 1;
        } else {
          const nx = Math.max(1, Math.round(r.render.region.width / T.w));
          const ny = Math.max(1, Math.round(r.render.region.height / T.h));
          const size = { width: nx * T.w * 1.02, height: ny * T.h * 1.02, unit: 'pt' };
          try {
            const f = await renderSVG(drawId, { tileMode: 'fit', size });
            assert.equal(f.meta.tiling.mode, 'fit');
            checkSvg(f.svg, { ink: '#000000', paper: '#ffffff' }, `${label} fit`);
            checkNoDuplicates(f.svg, `${label} fit`);
            fit.processed++;
          } catch (e) {
            fit.failed++;
            failures.push(`${label} fit: ${e.name}: ${e.message}`);
          }
        }

        if (known) failures.push(`${label}: listed in KNOWN_VALUE_ISSUES but rendered; remove the entry`);
        counts.processed++;
      } catch (e) {
        if (known && e instanceof GeometryError && known.test(e.message)) {
          counts.skipped++;
          skips.push(`${label} (${row.names.ja}): ${e.message}`);
        } else {
          counts.failed++;
          failures.push(`${label} (${row.names.ja}): ${e.name}: ${e.message}`);
        }
      }
    }
  } finally {
    if (prevOffscreen === undefined) delete globalThis.OffscreenCanvas;
    else globalThis.OffscreenCanvas = prevOffscreen;
  }
  console.log(`[smoke] presets: processed ${counts.processed}, skipped ${counts.skipped}, failed ${counts.failed}`);
  for (const s of skips) console.log(`[smoke]   skipped ${s}`);
  console.log(`[smoke] tileMode fit: processed ${fit.processed}, skipped ${fit.skipped} ${JSON.stringify(fit.reasons)}, failed ${fit.failed}`);
  t.diagnostic(`processed ${counts.processed}, skipped ${counts.skipped}, failed ${counts.failed}`);
  assert.deepEqual(failures, []);
  assert.equal(counts.skipped, Object.keys(KNOWN_VALUE_ISSUES).length);
});
