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
    // line width 0.239 pt (the other 4-2 rows use 0.2).
    schema: 'zc-pattern/1.0.0',
    id: 'zc:599200004',
    table: '4-2',
    code: '599200004',
    symbol: 'Dt',
    names: { ja: '崩積土' },
    frame: { show: 'none' },
    stroke: { width: 0.239 },
    layers: [
      {
        id: 'triangles',
        archetype: 'grid',
        motif: { kind: 'triangle', base: 5.58, height: 4.46, fill: 'paper' },
        params: { pitchX: 19.70, pitchY: 8.55, rowOffset: { pt: 10.21 }, rows: 3 },
      },
    ],
    provenance: {
      doc: 'R3',
      section: '3',
      measured: true,
      notes: '崩積土 (t4_2_p057_h1_r03): 8 個 (3-2-3)。外接 5.46-5.70 x 4.34-4.58 の中央値 5.58 x 4.46。行中心 y 6.90 / 14.93 / 24.00 の間隔 8.03 と 9.07 は不等のため平均 8.55 を採る(不等)。pitchX 19.70 は行内の中心間隔、行 2 のずれ 10.21 pt。外枠は白線で不可視',
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
