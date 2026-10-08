import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BULK_SETTINGS,
  safeNamePart,
  fileStemOf,
  assignFileStems,
  zipFileName,
  collectBulkEntries,
} from '../../site/app/ui/bulkExport.js';
import { buildCatalog } from '../../site/app/ui/catalog.js';
import { listPresets } from '../../src/index.js';
import { YOMI } from '../../src/presets/yomi.js';

test('safeNamePart replaces characters that file systems refuse', () => {
  assert.equal(safeNamePart('a/b\\c:d*e?f"g<h>i|j'), 'a_b_c_d_e_f_g_h_i_j');
  assert.equal(safeNamePart('tab\there'), 'tab_here');
  assert.equal(safeNamePart('末尾. '), '末尾');
  assert.equal(safeNamePart(''), '_');
  assert.equal(safeNamePart('...'), '_');
  assert.equal(safeNamePart('礫岩'), '礫岩');
});

test('fileStemOf joins the catalogue code (":" -> "-") and the Japanese name', () => {
  assert.equal(fileStemOf({ id: 'zc:111101002', names: { ja: '礫岩' } }), '111101002_礫岩');
  assert.equal(fileStemOf({ id: 'zc:t3-9:2', names: { ja: '帯' } }), 't3-9-2_帯');
  assert.equal(fileStemOf({ id: 'zc:t4-3:-Sh', names: { ja: '貝殻混じり' } }), '-Sh_貝殻混じり');
  assert.equal(fileStemOf({ id: 'zc:1', names: { ja: 'A/B?' } }), '1_A_B_');
  assert.equal(fileStemOf({ id: 'user:x' }), 'user-x_user_x');
});

test('assignFileStems never gives two rows the same name (case-insensitive)', () => {
  const rows = [
    { id: 'zc:1', names: { ja: 'Ab' } },
    { id: 'zc:1 ', names: { ja: 'Ab' } }, // different id, same stem after trimming
    { id: 'zc:1  ', names: { ja: 'aB' } },
    { id: 'zc:2', names: { ja: 'Ab' } },
  ];
  const { stems, renamed } = assignFileStems(rows);
  assert.deepEqual([...stems.values()], ['1_Ab', '1_Ab_2', '1_aB_3', '2_Ab']);
  const lower = [...stems.values()].map((s) => s.toLowerCase());
  assert.equal(new Set(lower).size, rows.length);
  assert.equal(renamed.length, 2);
  assert.ok(renamed.every((r) => r.stem !== r.base));
  assert.throws(() => assignFileStems([{ id: 'a' }, { id: 'a' }]), /duplicate row id/);
});

test('every catalogue tile gets a unique, safe file stem', () => {
  const { rows } = buildCatalog(listPresets(), YOMI);
  const { stems, renamed } = assignFileStems(rows);
  assert.equal(stems.size, rows.length);
  assert.equal(renamed.length, 0, `renamed: ${JSON.stringify(renamed)}`);
  for (const s of stems.values()) {
    assert.doesNotMatch(s, /[/\\:*?"<>|]/, s);
    assert.doesNotMatch(s, /[. ]$/, s);
  }
});

test('zipFileName uses the local date and time', () => {
  assert.equal(zipFileName(new Date(2026, 9, 9, 7, 5)), 'borehole-patterns_default_20261009-0705.zip');
});

const ROWS = [
  { id: 'zc:1', names: { ja: '一' } },
  { id: 'zc:2', names: { ja: '二' } },
  { id: 'zc:3', names: { ja: '三' } },
];

function fakeDeps(overrides = {}) {
  const calls = [];
  return {
    calls,
    renderSVG: async (id, options) => {
      calls.push(['svg', id, options]);
      return { svg: `<svg id="${id}"/>` };
    },
    renderPNG: async (id, options) => {
      calls.push(['png', id, options]);
      return { arrayBuffer: async () => new Uint8Array([137, 80, 78, 71, id.length]).buffer };
    },
    ...overrides,
  };
}

test('collectBulkEntries draws every row once per format with the default settings', async () => {
  const deps = fakeDeps();
  const progress = [];
  const out = await collectBulkEntries(ROWS, { ...deps, onProgress: (d, n) => progress.push(`${d}/${n}`) });
  assert.equal(out.cancelled, false);
  assert.deepEqual(out.counts, { processed: 3, skipped: 0, failed: 0 });
  assert.deepEqual(progress, ['1/3', '2/3', '3/3']);
  assert.deepEqual(out.entries.map((e) => e.name), [
    'svg/1_一.svg', 'svg/2_二.svg', 'svg/3_三.svg', 'png/1_一.png', 'png/2_二.png', 'png/3_三.png',
  ]);
  for (const [fmt, , options] of deps.calls) {
    if (fmt === 'svg') assert.deepEqual(options, { ink: '#000000', paper: '#ffffff' });
    else assert.deepEqual(options, { ink: '#000000', paper: '#ffffff', dpi: 300 });
  }
  assert.deepEqual(BULK_SETTINGS, { ink: '#000000', paper: '#ffffff', dpi: 300 });
  assert.ok(out.entries.slice(3).every((e) => e.data instanceof Uint8Array && e.data.length === 5));
});

test('the archive holds only svg/ and png/ files', async () => {
  const out = await collectBulkEntries(ROWS, fakeDeps());
  assert.ok(out.entries.every((e) => /^(svg\/[^/]+\.svg|png\/[^/]+\.png)$/.test(e.name)), out.entries.map((e) => e.name).join());
});

test('a failed pattern is counted and reported with its reason, never dropped silently', async () => {
  const deps = fakeDeps({
    renderPNG: async (id) => {
      if (id === 'zc:2') throw new RangeError('too big');
      return new Uint8Array([1]);
    },
  });
  const out = await collectBulkEntries(ROWS, deps);
  assert.deepEqual(out.counts, { processed: 2, skipped: 0, failed: 1 });
  assert.deepEqual(out.failures, [{ id: 'zc:2', format: 'png', message: 'RangeError: too big' }]);
  // the SVG that did succeed is still written; the failed PNG is not
  assert.ok(out.entries.some((e) => e.name === 'svg/2_二.svg'));
  assert.ok(!out.entries.some((e) => e.name === 'png/2_二.png'));
  assert.equal(out.svgFiles, 3);
  assert.equal(out.pngFiles, 2);
});

test('an empty SVG or PNG result is a failure', async () => {
  const deps = fakeDeps({
    renderSVG: async () => ({ svg: '' }),
    renderPNG: async () => new Uint8Array(0),
  });
  const out = await collectBulkEntries(ROWS.slice(0, 1), deps);
  assert.deepEqual(out.counts, { processed: 0, skipped: 0, failed: 1 });
  assert.deepEqual(out.failures.map((f) => f.format), ['svg', 'png']);
});

test('cancelling stops before the next row, counts the rest as skipped and builds no entries', async () => {
  const ctrl = new AbortController();
  const deps = fakeDeps();
  const out = await collectBulkEntries(ROWS, {
    ...deps,
    signal: ctrl.signal,
    onProgress: (done) => { if (done === 1) ctrl.abort(); },
  });
  assert.equal(out.cancelled, true);
  assert.deepEqual(out.counts, { processed: 1, skipped: 2, failed: 0 });
  assert.deepEqual(out.entries, []);
  assert.equal(deps.calls.length, 2);
});
