/**
 * Presets for R3 §4 (table 4-3: auxiliary symbols for mixed / quality, 補助記号).
 * Owner: preset-5 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Source: analysis/pattern_params_t4_1-2.md §4 (provenance.section "4"; the item heading is in notes).
 * Table 4-3 has no 9-digit code: ids are zc:t4-3:<symbol>, a leading "-" marks 混じり.
 * The cell is the drawing area (56.52 x 28.30 pt, 0.239 pt lines, no frame): table default.
 * Diagonal bands run at atan(28.30 / 56.52) = 26.57 deg (angle: null = the table default).
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    // R3 §4 礫質: white small circles on 3 bands.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:G',
    table: '4-3',
    symbol: 'G',
    names: { ja: '礫質' },
    layers: [{
      id: 'circles',
      archetype: 'diagonalBand',
      motif: { kind: 'circle', d: 2.83, fill: 'paper' },
      params: { bands: 3, bandSpacing: 3.16, alongPitch: 4.74, bandPhase: 1 / 3 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '礫質 (t4_3_p058_h0_r00): 36 個、径 2.83、帯 3 本 (n = -2.51, 0.65, 3.81)、帯間隔 3.16、帯方向ピッチ 4.74、隣の帯との位相差 1/3 ピッチ (1.58 pt)',
    },
  },
  {
    // R3 §4 砂質: black dots on 3 bands.
    // The band-to-band phase is not stated as a value in R3 (only "x が同じで y が 3.85 離れる"),
    // so bandPhase is omitted (schema default 0) and the preset is flagged measured:false.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:S',
    table: '4-3',
    symbol: 'S',
    names: { ja: '砂質' },
    layers: [{
      id: 'dots',
      archetype: 'diagonalBand',
      motif: { kind: 'dot', d: 1.42 },
      params: { bands: 3, bandSpacing: 3.5, alongPitch: 3.13 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: false,
      notes: '砂質 (t4_3_p058_h0_r01): 53 個、点径 1.42、帯 3 本 (n = -3.62, -0.01, 3.43)、間隔 約 3.5、帯方向ピッチ 3.07-3.17 (平均 3.13)。未測定: 帯間の位相 (隣の帯の点は x が同じで y が 3.85 離れる、と記載のみ。位相量への換算は要確認、bandPhase 省略)',
    },
  },
  {
    // R3 §4 シルト質: short diagonal dashes parallel to the band, 3 bands, staggered.
    // The stagger amount is not measured in R3 ("帯ごとに始点がずれ、千鳥になる"), so bandPhase is omitted.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:M',
    table: '4-3',
    symbol: 'M',
    names: { ja: 'シルト質' },
    layers: [{
      id: 'dashes',
      archetype: 'diagonalBand',
      motif: { kind: 'seg', length: 9.69 },
      params: { bands: 3, bandSpacing: 2.53, alongPitch: 12.6, elementAngle: 'band' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: false,
      notes: 'シルト質 (t4_3_p058_h0_r02): 15 本、L 9.69 (端の切れた線 8.43, 4.88, 7.67)、角度 26.6 度 (帯に平行)、帯 3 本 (n = -2.52, 0.02, 2.55)、間隔 2.53、帯方向ピッチ 12.2-13.0 (平均 12.6)。未測定: 帯ごとの始点のずれ量 (千鳥の位相。bandPhase 省略)',
    },
  },
  {
    // R3 §4 粘土質: three continuous diagonal lines at 2.53 pt spacing (centre line through the cell centre).
    // Modelled as one full-length segment per band (L 63.22 = cell diagonal), clipped by the layer.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:C',
    table: '4-3',
    symbol: 'C',
    names: { ja: '粘土質' },
    layers: [{
      id: 'lines',
      archetype: 'diagonalBand',
      motif: { kind: 'seg', length: 63.22 },
      params: { bands: 3, bandSpacing: 2.53, alongPitch: 63.22, elementAngle: 'band' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '粘土質 (t4_3_p058_h0_r03): 3 本の実線。主線 (0,28.30)-(56.52,0)、副線 (0,25.47)-(50.87,0)、(5.65,28.30)-(56.52,2.82)。直交間隔 2.53。alongPitch は帯長 63.22 とし 1 本/帯として扱う (要確認)',
    },
  },
  {
    // R3 §4 有機質: pairs of vertical short lines on 2 staggered bands.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:O',
    table: '4-3',
    symbol: 'O',
    names: { ja: '有機質' },
    layers: [{
      id: 'pairs',
      archetype: 'diagonalBand',
      motif: { kind: 'pairVline', length: 2.8, gap: 1.8 },
      params: { bands: 2, step: { x: 5.65, y: -2.83 }, bandShift: { x: 2.83, y: 2.85 }, elementAngle: 0 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '有機質 (t4_3_p058_h0_r04): 36 本 (18 組)、線長 2.64-2.93 (2.8)、組内間隔 1.76-1.91 (1.8)、帯方向の格子ベクトル (5.65, -2.83)、第 2 帯は (+2.83, +2.85) ずれる。帯間の法線方向間隔は bandShift が与えるため bandSpacing を省略 (要確認)',
    },
  },
  {
    // R3 §4 火山灰質: "~" wave units on 3 bands.
    // bandSpacing 5.06 is derived (not stated): the three band start points (R3 §4: (2.82,19.81), (5.08,24.34),
    // (14.13,25.47)) projected on the band normal (0.447, 0.894) differ by 5.06 and 5.06.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:V',
    table: '4-3',
    symbol: 'V',
    names: { ja: '火山灰質' },
    layers: [{
      id: 'waves',
      archetype: 'diagonalBand',
      motif: { kind: 'waveUnit', halfWidth: 2.83, height: 1.03 },
      params: { bands: 3, bandSpacing: 5.06, step: { x: 7.07, y: -2.83 }, elementAngle: 0 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '火山灰質 (t4_3_p058_h0_r05): 20 単位 (40 区間)、半波の幅 2.83、実高 約 1.03、単位幅 5.65、単位間隔 (7.07, -2.83) (傾き 21.8 度、セル対角とは異なる)。bandSpacing 5.06 は帯起点 3 点の法線投影から算出 (報告の直接値ではない、要確認)',
    },
  },
  {
    // R3 §4 玉石混じり: one black-outlined white ellipse per band, rotated 22.5 deg.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-B',
    table: '4-3',
    symbol: '-B',
    names: { ja: '玉石混じり' },
    layers: [{
      id: 'ellipses',
      archetype: 'diagonalBand',
      motif: { kind: 'ellipse', w: 5.65, h: 2.83, fill: 'paper' },
      params: { bands: 1, alongPitch: 6.7, elementAngle: 22.5 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '玉石混じり (t4_3_p058_h1_r00): 9 個、半軸 2.83 x 1.42 (径 5.65 x 2.83)、長軸 22.5-22.6 度、1 本の帯、帯方向ピッチ 6.48-6.90 (不等、設計書の値 6.7 を採用)',
    },
  },
  {
    // R3 §4 礫混じり: black circles on one band.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-G',
    table: '4-3',
    symbol: '-G',
    names: { ja: '礫混じり' },
    layers: [{
      id: 'circles',
      archetype: 'diagonalBand',
      motif: { kind: 'circle', d: 3.11, fill: 'ink' },
      params: { bands: 1, alongPitch: 6.2 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '礫混じり (t4_3_p058_h1_r01): 10 個、径 3.11、1 本の帯、ピッチ 5.85-6.52 (不等、平均 6.2)。最後の 1 個は帯から外れる (54.98, 1.48)',
    },
  },
  {
    // R3 §4 砂混じり: black dots on one band.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-S',
    table: '4-3',
    symbol: '-S',
    names: { ja: '砂混じり' },
    layers: [{
      id: 'dots',
      archetype: 'diagonalBand',
      motif: { kind: 'dot', d: 1.42 },
      params: { bands: 1, step: { x: 2.83, y: -1.41 } },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '砂混じり (t4_3_p058_h1_r02): 19 個、径 1.42、1 本の帯、ピッチ 3.10-3.17、格子ベクトル (2.83, -1.41)',
    },
  },
  {
    // R3 §4 シルト混じり: one band of short diagonal dashes.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-M',
    table: '4-3',
    symbol: '-M',
    names: { ja: 'シルト混じり' },
    layers: [{
      id: 'dashes',
      archetype: 'diagonalBand',
      motif: { kind: 'seg', length: 9.69 },
      params: { bands: 1, alongPitch: 12.6, elementAngle: 'band' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: 'シルト混じり (t4_3_p058_h1_r03): 5 本、L 9.69-9.70、角度 26.6 度、ピッチ 12.2-13.0 (平均 12.6)、始点 (1.36,27.62), (12.59,21.99), (24.20,16.18), (35.58,10.49), (46.50,5.02)',
    },
  },
  {
    // R3 §4 粘土混じり: one diagonal line through the cell (same form as the table 4-2 表土 line, width 0.239).
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-C',
    table: '4-3',
    symbol: '-C',
    names: { ja: '粘土混じり' },
    layers: [{
      id: 'diagonal',
      archetype: 'frameDiagonal',
      params: { direction: '/', count: 1 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '粘土混じり (t4_3_p058_h1_r04): (0,28.29)-(56.53,0)、L 63.22、角度 26.6 度',
    },
  },
  {
    // R3 §4 腐植物混じり: pairs of vertical short lines on one band.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-O',
    table: '4-3',
    symbol: '-O',
    names: { ja: '腐植物混じり' },
    layers: [{
      id: 'pairs',
      archetype: 'diagonalBand',
      motif: { kind: 'pairVline', length: 2.8, gap: 1.8 },
      params: { bands: 1, step: { x: 5.65, y: -2.75 }, elementAngle: 0 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '腐植物混じり (t4_3_p058_h1_r05): 18 本 (9 組)、線長 2.64-2.92、組内間隔 1.76-1.91、帯方向の格子ベクトル (5.65, -2.75)',
    },
  },
  {
    // R3 §4 火山灰混じり: "~" wave units on one band, irregular step.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-V',
    table: '4-3',
    symbol: '-V',
    names: { ja: '火山灰混じり' },
    layers: [{
      id: 'waves',
      archetype: 'diagonalBand',
      motif: { kind: 'waveUnit', halfWidth: 2.83, height: 1.03 },
      params: { bands: 1, step: { x: 7.07, y: -3.68 }, elementAngle: 0 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '火山灰混じり (t4_3_p058_h1_r06): 8 単位 (16 区間)、半波の幅 2.83、実高 約 1.03。単位間隔 (7.07, -3.40) と (7.07, -3.96) が混じる (不等、平均 (7.07, -3.68))',
    },
  },
  {
    // R3 §4 貝殻混じり: white tall ellipse + black lower ellipse, one band, irregular step.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-Sh',
    table: '4-3',
    symbol: '-Sh',
    names: { ja: '貝殻混じり' },
    layers: [{
      id: 'shells',
      archetype: 'diagonalBand',
      motif: {
        kind: 'shell',
        paperW: 3.92, paperH: 6.25,
        inkW: 3.92, inkH: 3.42,
        inkOffset: { x: 0, y: 1.12 },
      },
      params: { bands: 1, step: { x: 9.45, y: -4.8 }, elementAngle: 0 },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '貝殻混じり (t4_3_p058_h1_r07): 5 組。白楕円 半軸 1.96 x 3.12 (径 3.92 x 6.25)、黒楕円 半軸 1.96 x 1.71 (径 3.92 x 3.42)、黒は白の中心より 1.12 下。描画順は白が先。間隔 dx 9.45 (9.34-9.58)、dy 4.8 (4.55-5.09) は不等',
    },
  },
  {
    // R3 §4 サンゴ混じり: blank in the source (prim 0, PNG blank). Empty layer.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:-Co',
    table: '4-3',
    symbol: '-Co',
    names: { ja: 'サンゴ混じり' },
    layers: [
      { id: 'none', archetype: 'empty' },
    ],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '模様なし。原典の模様欄が空白 (prim 0 件、PNG 空白、R3 §4 t4_3_p058_h1_r08)',
    },
  },
];
