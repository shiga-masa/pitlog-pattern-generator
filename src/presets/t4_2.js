/**
 * Presets for R3 §3 (table 4-2: layer facies / 層相).
 * Owner: preset-5 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Source: analysis/pattern_params_t4_1-2.md §3 (provenance.section "3"; the item heading is in notes).
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    // R3 §3 盛土: two "/" lines, L 60.81, angle +28.1 deg, horizontal gap 2.78. Frame: table default (soil, ink 0.2).
    schema: 'zc-pattern/1.0.0',
    id: 'zc:599200001',
    table: '4-2',
    code: '599200001',
    symbol: 'BS',
    names: { ja: '盛土' },
    layers: [
      { id: 'diagonals', archetype: 'frameDiagonal', params: { direction: '/', count: 2, gap: 2.78 } },
    ],
    provenance: {
      doc: 'R3',
      section: '3',
      measured: true,
      notes: '盛土 (t4_2_p057_h1_r00): 2 本、(0,28.62)-(53.65,0) と (2.78,28.62)-(56.44,0)、角度 +28.1 度、水平間隔 2.78',
    },
  },
  {
    // R3 §3 埋土: all coordinates identical to 盛土 (R3 §3 "盛土と全座標が一致"). Alias.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:599200002',
    table: '4-2',
    code: '599200002',
    symbol: 'FI',
    names: { ja: '埋土' },
    aliasOf: 'zc:599200001',
    provenance: {
      doc: 'R3',
      section: '3',
      measured: true,
      notes: '埋土 (t4_2_p057_h1_r01): 盛土と全座標一致のため aliasOf',
    },
  },
  {
    // R3 §3 表土: one "/" line corner to corner, angle 26.9 deg. Frame: table default.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:599200003',
    table: '4-2',
    code: '599200003',
    symbol: 'SF',
    names: { ja: '表土' },
    layers: [
      { id: 'diagonal', archetype: 'frameDiagonal', params: { direction: '/', count: 1 } },
    ],
    provenance: {
      doc: 'R3',
      section: '3',
      measured: true,
      notes: '表土 (t4_2_p057_h1_r02): (0,28.62)-(56.44,0)、L 63.28、角度 26.9 度',
    },
  },
  {
    // R3 §3 崩積土: white (paper-filled) up-pointing triangles, 3-2-3 per row pattern, no visible frame,
    // line width 0.239 pt (the other 4-2 rows use 0.2). The rows are not equally spaced (bbox centres
    // y 6.139 / 14.207 / 23.236 from the frame top) and the middle-row triangles are lower (4.335 vs 4.575),
    // so the outer rows and the middle row are two grid layers (measured from prim t4_2_p057_h1_r03).
    schema: 'zc-pattern/1.0.0',
    id: 'zc:599200004',
    table: '4-2',
    code: '599200004',
    symbol: 'Dt',
    names: { ja: '崩積土' },
    frame: { width: 56.02, height: 28.41, show: 'none' },
    stroke: { width: 0.239 },
    layers: [
      {
        // rows 1 and 3: x 8.309 / 28.013 / 47.716, y 6.139 and 23.236 (mean 14.688 = frame centre 14.207 + 0.481)
        id: 'outerRows',
        archetype: 'grid',
        motif: { kind: 'triangle', base: 5.70, height: 4.575, fill: 'paper' },
        params: { pitchX: 19.70, pitchY: 17.097, rows: 2, cols: 3 },
        offset: { x: 0, y: 0.481 },
      },
      {
        // row 2: apex x 18.517 / 38.221 (pitch 19.704, mean 28.369 = frame centre 28.013 + 0.357), y 14.207
        id: 'middleRow',
        archetype: 'grid',
        motif: { kind: 'triangle', base: 5.58, height: 4.335, fill: 'paper' },
        params: { pitchX: 19.704, pitchY: 17.097, rows: 1, cols: 2 },
        offset: { x: 0.357, y: 0 },
      },
    ],
    provenance: {
      doc: 'R3',
      section: '3',
      measured: true,
      notes: '崩積土 (t4_2_p057_h1_r03): 8 個 (3-2-3)。枠 qu 56.02 x 28.41(白線で不可視)を枠寸法に採る。prim の外接中心(枠左上基準): 行 1 y 6.139・行 3 y 23.236(x 8.309 / 28.013 / 47.716、外接 5.70 x 4.575)、行 2 y 14.207(枠の中央、外接 5.696 / 5.460 x 4.335、頂点 x 18.517 / 38.221)。行間 8.068 と 9.030 が不等のため外側 2 行と中央行を別層にした(行 1-3 間 17.097)。報告の重心 y 6.90 / 14.93 / 24.00 は三角形の重心で、外接中心とは h/6 違う',
    },
  },
  {
    // R3 §1: 沖積層 has no drawing (prim 0, PNG blank). Empty layer.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:999200001',
    table: '4-2',
    code: '999200001',
    names: { ja: '沖積層' },
    layers: [
      { id: 'none', archetype: 'empty' },
    ],
    provenance: {
      doc: 'R3',
      section: '1',
      measured: true,
      notes: '模様なし (has_pattern=False、備考空欄。prim 0 件、PNG 空白)',
    },
  },
  {
    // R3 §1: 洪積層 has no drawing (prim 0, PNG blank). Empty layer.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:999200002',
    table: '4-2',
    code: '999200002',
    names: { ja: '洪積層' },
    layers: [
      { id: 'none', archetype: 'empty' },
    ],
    provenance: {
      doc: 'R3',
      section: '1',
      measured: true,
      notes: '模様なし (has_pattern=False、備考空欄。prim 0 件、PNG 空白)',
    },
  },
];
