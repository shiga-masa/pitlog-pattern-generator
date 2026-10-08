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
 * Positions (layer.offset, step, bandShift) were fitted to the motif centres of the extracted
 * original cells (s01 prim, verified with codes/s02_verify_patterns.mjs in the analysis repo);
 * the fitted values are stated in each provenance.notes ("prim 実測").
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    // R3 §4 礫質: white small circles on 3 bands (exact lattice: step (3u, -1.5u), band shift (u, -3u), u ~ 1.413 pt).
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:G',
    table: '4-3',
    symbol: 'G',
    names: { ja: '礫質' },
    layers: [{
      id: 'circles',
      archetype: 'diagonalBand',
      offset: { x: -1.41, y: 0 },
      motif: { kind: 'circle', d: 2.82, fill: 'paper' },
      params: { bands: 3, step: { x: 4.239, y: -2.122 }, bandShift: { x: 1.414, y: -4.245 } },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '礫質 (t4_3_p058_h0_r00): 36 個、径 2.83 (外接 2.821-2.832)、帯 3 本 (n = -2.51, 0.65, 3.81)、帯間隔 3.16、帯方向ピッチ 4.74、隣の帯との位相差 1/3 ピッチ (1.58 pt)。prim 実測: 格子 step (4.2395, -2.1223)、帯間ベクトル (1.4133, -4.2446)、中央帯の円 (26.848, 14.150) (残差 0.003 以下)。径は 2.82 を採用: セル 56.524 に対し領域は 56.52 で、左端 (x 1.411) と右端 (x 55.113) の円を edgeMode whole で両方残すには r 1.41 が必要。同じ理由で step x 4.239、bandShift x 1.414、offset x -1.41 は実測範囲内で 13 ピッチの幅が 53.70 以下に収まる値を選んだ',
    },
  },
  {
    // R3 §4 砂質: black dots on 3 bands. The lowest band is not on the lattice of the upper two
    // (prim: the upper two share x, y differs by 3.853; the lowest is offset along the band), so it is a second layer.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:S',
    table: '4-3',
    symbol: 'S',
    names: { ja: '砂質' },
    layers: [
      {
        id: 'dots',
        archetype: 'diagonalBand',
        offset: { x: -0.706, y: -1.525 },
        motif: { kind: 'dot', d: 1.42 },
        params: { bands: 2, step: { x: 2.8264, y: -1.4022 }, bandShift: { x: 0, y: -3.853 } },
      },
      {
        id: 'dotsLower',
        archetype: 'diagonalBand',
        offset: { x: 3.674, y: 2.215 },
        motif: { kind: 'dot', d: 1.42 },
        params: { bands: 1, step: { x: 2.8264, y: -1.4022 } },
      },
    ],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '砂質 (t4_3_p058_h0_r01): 53 個、点径 1.42、帯 3 本 (n = -3.62, -0.01, 3.43、不等)、帯方向ピッチ 3.07-3.17 (平均 3.13)、隣の帯の点は x が同じで y が 3.85 離れる。prim 実測: 帯ごとの step (2.8263-2.8264, -1.3992 to -1.4051) の平均 (2.8264, -1.4022)。上 2 帯は bandShift (0, -3.853)、2 帯の中点 (27.554, 12.625)。下の帯は 2 層目、中心 (31.934, 16.365)。帯内に y 0.13-0.21 の段差 (手置き) が 1-2 か所あり、等ピッチでは表せない',
    },
  },
  {
    // R3 §4 シルト質: short diagonal dashes parallel to the band, 3 bands, staggered (stagger from the prim).
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:M',
    table: '4-3',
    symbol: 'M',
    names: { ja: 'シルト質' },
    layers: [{
      id: 'dashes',
      archetype: 'diagonalBand',
      offset: { x: -1.243, y: 0.624 },
      motif: { kind: 'seg', length: 9.69 },
      params: { bands: 3, step: { x: 11.329, y: -5.671 }, bandShift: { x: 1.241, y: 2.209 }, elementAngle: 'band', edgeMode: 'trim' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: 'シルト質 (t4_3_p058_h0_r02): 15 本、L 9.69 (端の切れた線 8.43, 4.88, 7.67)、角度 26.6 度 (帯に平行)、帯 3 本 (n = -2.52, 0.02, 2.55)、間隔 2.53、帯方向ピッチ 12.2-13.0 (平均 12.6)。prim 実測: 中央帯の線中心 (4.332,26.130), (15.559,20.510), (27.165,14.700), (38.552,8.999), (49.479,3.529) の最小二乗で step (11.329, -5.671)、中心 (27.017, 14.774)。隣の帯は中央帯から (1.356, 2.151) と (-1.126, -2.266) (千鳥。非対称なので平均 (1.241, 2.209) を bandShift に採用)。帯内の線間隔は不揃い (手置き)。原本は端のダッシュを短く描く (8.43, 4.88, 7.67) ので edgeMode trim で境界で切る (clip では切れた部分を含めて中心を測り、中心誤差最大 2.50)',
    },
  },
  {
    // R3 §4 粘土質: three continuous diagonal lines at 2.53 pt spacing (centre line through the cell centre).
    // Modelled as one full-length segment per band (L 63.22 = cell diagonal), clipped by the layer.
    // bandShift is the centre of the clipped side line relative to the main line, so the visible parts coincide.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:C',
    table: '4-3',
    symbol: 'C',
    names: { ja: '粘土質' },
    layers: [{
      id: 'lines',
      archetype: 'diagonalBand',
      motif: { kind: 'seg', length: 63.22 },
      params: { bands: 3, alongPitch: 63.22, bandShift: { x: 2.827, y: 1.412 }, elementAngle: 'band' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '粘土質 (t4_3_p058_h0_r03): 3 本の実線。主線 (0,28.30)-(56.52,0)、副線 (0,25.47)-(50.87,0)、(5.65,28.30)-(56.52,2.82)。直交間隔 2.53。alongPitch は帯長 63.22 とし 1 本/帯として扱う。prim 実測: 副線の中心 (31.089, 15.563), (25.435, 12.733) は主線中心から ±(2.827, 1.412) (bandShift)',
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
      offset: { x: 1.903, y: 0.015 },
      motif: { kind: 'pairVline', length: 2.8, gap: 1.8 },
      params: { bands: 2, step: { x: 5.648, y: -2.824 }, bandShift: { x: 2.828, y: 2.83 }, elementAngle: 0, edgeMode: 'whole' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '有機質 (t4_3_p058_h0_r04): 36 本 (18 組)、線長 2.64-2.93 (2.8)、組内間隔 1.76-1.91 (1.8)、帯方向の格子ベクトル (5.65, -2.83)、第 2 帯は (+2.83, +2.85) ずれる。帯間の法線方向間隔は bandShift が与えるため bandSpacing を省略。prim 実測: 組の中心の step (5.648, -2.824)、第 2 帯へ (2.828, 2.83)、2 帯の中点 (30.163, 14.165)。端の組がセル辺に接するので edgeMode whole (clip ではセル外の組が加わる)',
    },
  },
  {
    // R3 §4 火山灰質: "~" wave units on 3 bands. The band shifts are unequal in the prim ((2.263, 4.529) and
    // (1.977, 3.962) modulo the step), so the lowest band is a second layer.
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t4-3:V',
    table: '4-3',
    symbol: 'V',
    names: { ja: '火山灰質' },
    layers: [
      {
        id: 'waves',
        archetype: 'diagonalBand',
        offset: { x: -0.282, y: -0.564 },
        motif: { kind: 'waveUnit', halfWidth: 2.83, height: 2.06 },
        params: { bands: 2, step: { x: 7.066, y: -2.83 }, bandShift: { x: 2.263, y: 4.529 }, elementAngle: 0, edgeMode: 'whole' },
      },
      {
        id: 'wavesLower',
        archetype: 'diagonalBand',
        offset: { x: 2.827, y: 5.662 },
        motif: { kind: 'waveUnit', halfWidth: 2.83, height: 2.06 },
        params: { bands: 1, step: { x: 7.066, y: -2.83 }, elementAngle: 0, edgeMode: 'whole' },
      },
    ],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '火山灰質 (t4_3_p058_h0_r05): 20 単位 (40 区間)、半波の幅 2.83、制御点の高さ 1.38 (山・谷の実高 約 1.03、山から谷まで 2.06 = height)、単位幅 5.65、単位間隔 (7.07, -2.83) (傾き 21.8 度、セル対角とは異なる)。prim 実測: 単位中心の step (7.066, -2.83)。上 2 帯 (7+7 単位) は bandShift (2.263, 4.529)、中点 (27.978, 13.586)。下の帯 (6 単位) は 2 層目、中心 (31.087, 19.812)。報告の bandSpacing 5.06 は step の帯直交成分を含む値で、帯間は等間隔でない。端の単位がセル外へはみ出さないので edgeMode whole',
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
      offset: { x: -23.733, y: 11.885 },
      motif: { kind: 'ellipse', w: 5.65, h: 2.83, fill: 'paper' },
      params: {
        bands: 1,
        steps: [[
          { x: 6.217, y: -2.83 }, { x: 5.972, y: -2.829 }, { x: 6.057, y: -3.395 }, { x: 6.3, y: -2.83 },
          { x: 5.894, y: -3.398 }, { x: 5.972, y: -2.546 }, { x: 6.062, y: -2.828 }, { x: 6.296, y: -3.397 },
        ]],
        elementAngle: 22.5,
      },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '玉石混じり (t4_3_p058_h1_r00): 9 個、半軸 2.83 x 1.42 (径 5.65 x 2.83)、長軸 22.5-22.6 度、1 本の帯、帯方向ピッチ 6.48-6.90 (不等)。prim 実測: 中心 9 点の最小二乗で step (6.075, -3.004)、中心 (28.893, 14.119)。残差 平均 0.20、最大 0.36 (手置きの不等ピッチ)。等ピッチでは細い輪郭線の IoU が 0.72 に下がるため、prim 実測の中心 9 点の隣接差 8 個を steps に置き、先頭の楕円を offset (-23.733, 11.885) (セル中心基準) に置いた',
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
      offset: { x: -1.241, y: 0.82 },
      motif: { kind: 'circle', d: 3.11, fill: 'ink' },
      params: { bands: 1, step: { x: 5.588, y: -2.682 } },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '礫混じり (t4_3_p058_h1_r01): 10 個、径 3.11、1 本の帯、ピッチ 5.85-6.52 (不等、平均 6.2)。最後の 1 個は帯から外れる (54.98, 1.48)。prim 実測: 右上の円を (54.96, 1.56) に固定した最小二乗で step (5.588, -2.682)、中心 (27.019, 14.970)。右上の円は原本でセル 56.534 の右辺まで達するので、領域 56.52 内に収まる位置へ 0.02 寄せた',
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
      offset: { x: 0.003, y: 0.021 },
      motif: { kind: 'pairVline', length: 2.8, gap: 1.8 },
      params: { bands: 1, step: { x: 5.648, y: -2.824 }, elementAngle: 0, edgeMode: 'whole' },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '腐植物混じり (t4_3_p058_h1_r05): 18 本 (9 組)、線長 2.64-2.92、組内間隔 1.76-1.91、帯方向の格子ベクトル (5.65, -2.75)。prim 実測: 組の中心の step (5.648, -2.824) (y の段差は -2.77 と -2.89 が混じり、平均 -2.824)、中心 (28.263, 14.171)。edgeMode whole (clip ではセル外の組が加わる)',
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
      offset: { x: -24.725, y: 12.449 },
      motif: { kind: 'waveUnit', halfWidth: 2.83, height: 2.06 },
      params: {
        bands: 1,
        steps: [[
          { x: 7.069, y: -3.396 }, { x: 7.06, y: -3.962 }, { x: 7.069, y: -3.396 }, { x: 7.07, y: -3.396 },
          { x: 7.059, y: -3.396 }, { x: 7.069, y: -3.962 }, { x: 7.07, y: -3.396 },
        ]],
        elementAngle: 0,
        edgeMode: 'whole',
      },
    }],
    provenance: {
      doc: 'R3',
      section: '4',
      measured: true,
      notes: '火山灰混じり (t4_3_p058_h1_r06): 8 単位 (16 区間)、半波の幅 2.83、実高 約 1.03 (山から谷まで 2.06 = height)。単位間隔 (7.07, -3.40) と (7.07, -3.96) が混じる (不等)。prim 実測: 7 間隔のうち 5 が -3.395、2 が -3.962 で、最小二乗の step (7.066, -3.557)、単位 4 の中心 (31.799, 12.370)。段差は手置きで等ピッチでは表せないため、prim 実測の単位中心 8 点の隣接差 7 個を steps に置き、先頭の単位を offset (-24.725, 12.449) (セル中心基準) に置いた',
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
