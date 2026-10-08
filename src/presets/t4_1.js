/**
 * Presets for R3 §2 (table 4-1).
 * Owner: preset-4 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 *
 * Source: analysis/pattern_params_t4_1-2.md §2 (row ids "t4_1_p0xx_h0_rNN"), design §1.5.7.
 * provenance.section = "2 / <row id>" (R3 §2 has no numbered sub-sections).
 *
 * Origin rule: spec.origin is the bbox centre of the first instance of the primary grid
 * (the report's first point). Other lattices in the same spec are shifted with layer.offset
 * relative to that origin. Triangles use the bbox centre (centroid y - h/6), not the centroid.
 */

/** Drawn presets (R3 §2). */
const PATTERN_PRESETS = [
  // ---- 玉石 B -------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:510000010',
    table: '4-1',
    code: '510000010',
    symbol: 'B',
    names: { ja: '玉石' },
    layers: [
      {
        id: 'boulders',
        archetype: 'symbol',
        params: { anchor: 'center', offsets: [{ x: 13.44, y: -4.30 }, { x: -13.44, y: 4.30 }] },
        motif: { kind: 'ellipse', w: 12.72, h: 8.47, rotation: 0, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p053_h0_r00', measured: true, notes: '2 点の中心は枠中心基準(設計 §1.4 c)。線幅 0.2' },
  },

  // ---- 礫質土 GF ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531100000',
    table: '4-1',
    code: '531100000',
    symbol: 'GF',
    names: { ja: '礫質土' },
    origin: { x: 6.36, y: 5.01 },
    layers: [
      {
        id: 'gravels',
        archetype: 'grid',
        params: { pitchX: 11.33, pitchY: 9.30, rowOffset: 0, rows: 3 },
        motif: { kind: 'circle', d: 7.1, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p053_h0_r02', measured: true, notes: 'x ピッチ 11.32–11.33 の報告値、千鳥なし' },
  },

  // ---- 礫 G ---------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531111000',
    table: '4-1',
    code: '531111000',
    symbol: 'G',
    names: { ja: '礫' },
    origin: { x: 7.35, y: 6.28 },
    layers: [
      {
        id: 'gravels',
        archetype: 'grid',
        params: { pitchX: 21.66, pitchY: 8.03, rowOffset: { pt: 11.53 }, rows: 3 },
        motif: { kind: 'circle', d: 7.1, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p053_h0_r03', measured: true, notes: 'x ピッチ 22.46/20.86 は不等で平均 21.66。行 2 のオフセット 11.53 は pt で保持。手置きのずれ(0.2–0.4)は格子化' },
  },

  // ---- 粗礫 CG = 礫 -------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531111100',
    table: '4-1',
    code: '531111100',
    symbol: 'CG',
    names: { ja: '粗礫' },
    aliasOf: 'zc:531111000',
    provenance: { doc: 'R3', section: '2 / t4_1_p053_h0_r04', measured: true, notes: '礫と全座標一致(R3 §2 粗礫)' },
  },

  // ---- 中礫 MG ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531111200',
    table: '4-1',
    code: '531111200',
    symbol: 'MG',
    names: { ja: '中礫' },
    origin: { x: 8.43, y: 5.69 },
    layers: [
      {
        id: 'gravels',
        archetype: 'grid',
        params: { pitchX: 16.95, pitchY: 8.62, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'circle', d: 5.7, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p053_h0_r05', measured: true, notes: 'x ピッチ 16.97/16.93 の平均 16.95' },
  },

  // ---- 細礫 FG ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531111300',
    table: '4-1',
    code: '531111300',
    symbol: 'FG',
    names: { ja: '細礫' },
    origin: { x: 4.90, y: 5.00 },
    layers: [
      {
        id: 'gravels',
        archetype: 'grid',
        params: { pitchX: 11.3, pitchY: 5.73, rowOffset: 0.5, rows: 4 },
        motif: { kind: 'circle', d: 4.3, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p053_h0_r06', measured: true, notes: 'y ピッチ 5.72/5.75/5.72 の平均 5.73' },
  },

  // ---- 砂礫 GS ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531120000',
    table: '4-1',
    code: '531120000',
    symbol: 'GS',
    names: { ja: '砂礫' },
    origin: { x: 7.35, y: 6.28 },
    layers: [
      {
        id: 'gravels',
        archetype: 'grid',
        params: { pitchX: 21.66, pitchY: 8.03, rowOffset: { pt: 11.53 }, rows: 3 },
        motif: { kind: 'circle', d: 7.1, fill: 'paper' },
      },
      {
        // Sand dots fill the gaps of the gravel lattice (R3 §2 砂礫: 7 dots).
        // Offset is measured from the spec origin (first gravel) to the first dot.
        id: 'sands',
        archetype: 'grid',
        offset: { x: 10.97, y: -0.43 },
        params: { pitchX: 21.66, pitchY: 8.57, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'dot', d: 1.4 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p054_h0_r18', measured: false, notes: '点の位置は礫格子の隙間に置いた近似(x 誤差 約 0.5 pt、y ピッチ 8.66/8.47 の平均 8.57)。礫層は礫と同一' },
  },

  // ---- 砂質土 SF ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531200000',
    table: '4-1',
    code: '531200000',
    symbol: 'SF',
    names: { ja: '砂質土' },
    origin: { x: 4.21, y: 5.64 },
    layers: [
      {
        id: 'sands',
        archetype: 'grid',
        params: { pitchX: 9.70, pitchY: 8.60, rowOffset: 0, rows: 3 },
        motif: { kind: 'dot', d: 1.4 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p054_h0_r45', measured: true, notes: 'x ピッチ平均 9.70、千鳥なし' },
  },

  // ---- 砂 S ---------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531211000',
    table: '4-1',
    code: '531211000',
    symbol: 'S',
    names: { ja: '砂' },
    origin: { x: 4.21, y: 5.85 },
    layers: [
      {
        id: 'sands',
        archetype: 'grid',
        params: { pitchX: 19.40, pitchY: 8.57, rowOffset: { pt: 9.2 }, rows: 3 },
        motif: { kind: 'dot', d: 1.4 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p055_h0_r00', measured: true, notes: 'y ピッチ 8.66/8.47 の平均 8.57。行 2 のオフセット 9.2 は pt で保持' },
  },

  // ---- 粗砂 CS ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531211100',
    table: '4-1',
    code: '531211100',
    symbol: 'CS',
    names: { ja: '粗砂' },
    origin: { x: 4.17, y: 4.26 },
    layers: [
      {
        id: 'sands',
        archetype: 'grid',
        params: { pitchX: 19.80, pitchY: 10.05, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'dot', d: 2.2 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p055_h0_r01', measured: true, notes: '' },
  },

  // ---- 中砂 MS ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531211200',
    table: '4-1',
    code: '531211200',
    symbol: 'MS',
    names: { ja: '中砂' },
    origin: { x: 4.21, y: 4.23 },
    layers: [
      {
        id: 'sands',
        archetype: 'grid',
        params: { pitchX: 14.14, pitchY: 7.19, rowOffset: 0.5, rows: 4 },
        motif: { kind: 'dot', d: 1.4 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p055_h0_r02', measured: true, notes: 'y ピッチ 7.26/7.05/7.26 の平均 7.19' },
  },

  // ---- 細砂 FS ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:531211300',
    table: '4-1',
    code: '531211300',
    symbol: 'FS',
    names: { ja: '細砂' },
    origin: { x: 2.86, y: 2.82 },
    layers: [
      {
        id: 'sands',
        archetype: 'grid',
        params: { pitchX: 11.3, pitchY: 5.75, rowOffset: 0.5, rows: 5 },
        motif: { kind: 'dot', d: 0.75 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p055_h0_r03', measured: true, notes: 'y ピッチ 5.75/5.74 の平均 5.75' },
  },

  // ---- 粘性土 Cs ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:532100000',
    table: '4-1',
    code: '532100000',
    symbol: 'Cs',
    names: { ja: '粘性土' },
    origin: { x: 4.77, y: 5.64 },
    layers: [
      {
        id: 'dashes',
        archetype: 'grid',
        params: { pitchX: 12.78, pitchY: 8.67, rowOffset: { pt: 4.77 }, rows: 3, edgeMode: 'clip' },
        motif: { kind: 'hline', length: 8.55 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r07', measured: true, notes: 'x ピッチ 12.92/12.51/12.92 の平均 12.78。行 2 のみ 4.77 pt ずれ。右端の 1 本は枠でクリップ' },
  },

  // ---- シルト M -----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:532110000',
    table: '4-1',
    code: '532110000',
    symbol: 'M',
    names: { ja: 'シルト' },
    origin: { x: 4.77, y: 5.64 },
    layers: [
      {
        id: 'dashes',
        archetype: 'grid',
        params: { pitchX: 12.78, pitchY: 8.67, rowOffset: 0, rows: 3 },
        motif: { kind: 'hline', length: 8.55 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r08', measured: true, notes: '粘性土と同じ短線、千鳥なし' },
  },

  // ---- 粘土 C -------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:532120000',
    table: '4-1',
    code: '532120000',
    symbol: 'C',
    names: { ja: '粘土' },
    layers: [
      {
        id: 'lines',
        archetype: 'hatch',
        params: { angle: 0, spacing: 8.67, margin: 2.78 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r21', measured: true, notes: '3 本の実線、線長は枠幅 - 2 × 余白' },
  },

  // ---- 有機質土 O ---------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:532200000',
    table: '4-1',
    code: '532200000',
    symbol: 'O',
    names: { ja: '有機質土' },
    origin: { x: 6.46, y: 5.75 },
    layers: [
      {
        id: 'pairs',
        archetype: 'grid',
        params: { pitchX: 14.12, pitchY: 8.57, rowOffset: 0, rows: 3 },
        motif: { kind: 'pairVline', length: 5.75, gap: 3.88 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r34', measured: true, notes: '組内間隔 3.78–3.97 の平均 3.88。千鳥なし' },
  },

  // ---- 火山灰質粘性土 V ---------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:532300000',
    table: '4-1',
    code: '532300000',
    symbol: 'V',
    names: { ja: '火山灰質粘性土' },
    layers: [
      {
        id: 'waves',
        archetype: 'wave',
        offset: { x: 0, y: -1.01 },
        params: { angle: 0, wavelength: 11.33, amplitude: 1.0, lineSpacing: 8.17, lines: 3, margin: 2.78, phase: 0 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r36', measured: true, notes: '行間は 7.66/8.67 の不等、平均 8.17。3 本の基線の平均位置に offset y -1.01。報告の 5 折れ線は正弦で近似' },
  },

  // ---- 高有機質土 Pt ------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:533100000',
    table: '4-1',
    code: '533100000',
    symbol: 'Pt',
    names: { ja: '高有機質土' },
    origin: { x: 5.56, y: 5.70 },
    layers: [
      {
        id: 'glyphs',
        archetype: 'grid',
        params: { pitchX: 11.33, pitchY: 8.57, rowOffset: 0, rows: 3 },
        motif: { kind: 'ptGlyph', stemLen: 5.75, armLen: 5.56 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r38', measured: false, notes: 'グリフは幹 5.75 + 右腕 5.56 の 2 部品で近似(原本の頂点列は使わない)。y ピッチ 8.67/8.47 の平均 8.57' },
  },

  // ---- 泥炭 Pt = 高有機質土 -----------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:533101000',
    table: '4-1',
    code: '533101000',
    symbol: 'Pt',
    names: { ja: '泥炭' },
    aliasOf: 'zc:533100000',
    provenance: { doc: 'R3', section: '2 / t4_1_p056_h0_r39', measured: true, notes: '高有機質土と全座標一致(R3 §2 泥炭)' },
  },

  // ---- 黒泥 Mk = 高有機質土 -----------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:533102000',
    table: '4-1',
    code: '533102000',
    symbol: 'Mk',
    names: { ja: '黒泥' },
    aliasOf: 'zc:533100000',
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r00', measured: true, notes: '高有機質土と全座標一致(R3 §2 黒泥)' },
  },

  // ---- 廃棄物 W -----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:534110100',
    table: '4-1',
    code: '534110100',
    symbol: 'W',
    names: { ja: '廃棄物' },
    layers: [
      {
        id: 'diagonals',
        archetype: 'frameDiagonal',
        params: { direction: 'x', count: 2, gap: 2.78 },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r01', measured: true, notes: '二重線の水平間隔 2.78(線に垂直には 1.31)' },
  },

  // ---- 瓦礫 BG = 廃棄物 ---------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:534110200',
    table: '4-1',
    code: '534110200',
    symbol: 'BG',
    names: { ja: '瓦礫' },
    aliasOf: 'zc:534110100',
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r02', measured: true, notes: '廃棄物と全座標一致(R3 §2 瓦礫)' },
  },

  // ---- 改良土 I = 廃棄物 --------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:534120100',
    table: '4-1',
    code: '534120100',
    symbol: 'I',
    names: { ja: '改良土' },
    aliasOf: 'zc:534110100',
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r03', measured: true, notes: '廃棄物と全座標一致(R3 §2 改良土)' },
  },

  // ---- まさ土 WG ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540111000',
    table: '4-1',
    code: '540111000',
    symbol: 'WG',
    names: { ja: 'まさ土' },
    origin: { x: 15.70, y: 5.64 },
    layers: [
      {
        id: 'segments',
        archetype: 'scatter',
        params: {
          count: 13,
          length: 6.33,
          lengthJitter: 0.14,
          angles: [{ deg: -27, weight: 7 }, { deg: 27, weight: 6 }],
        },
      },
      {
        // Crosses on the 2-1-2 quincunx: two grid rows (top, bottom) plus one symbol at the middle.
        // No coordinate table is used.
        id: 'crosses',
        archetype: 'grid',
        params: { pitchX: 25.83, pitchY: 17.34, rowOffset: 0, rows: 2 },
        motif: { kind: 'lineGlyph', hLines: 1, hLen: 5.66, vLines: 1, vLen: 5.75, vAnchor: 'center' },
      },
      {
        id: 'centerCross',
        archetype: 'symbol',
        params: { anchor: 'center', offsets: [{ x: 0.59, y: 0 }] },
        motif: { kind: 'lineGlyph', hLines: 1, hLen: 5.66, vLines: 1, vLen: 5.75, vAnchor: 'center' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r05', measured: false, notes: '短線は乱数配置(角度 ±27 は報告の 7:6 の比)。十字は上下 2 行の格子 + 中央 1 個で近似し、右側の y のずれ(約 0.4)は未再現' },
  },

  // ---- 火山灰 VA ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540120000',
    table: '4-1',
    code: '540120000',
    symbol: 'VA',
    names: { ja: '火山灰' },
    layers: [
      {
        id: 'segments',
        archetype: 'scatter',
        params: {
          count: 19,
          length: 6.21,
          lengthJitter: 0.3,
          angles: [
            { deg: -27, weight: 8 }, { deg: 27, weight: 8 },
            { deg: -15, weight: 2 }, { deg: 15, weight: 1 },
          ],
        },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r08', measured: false, notes: '±27° 16 本の内訳(−27 と +27 の本数)は未測定で 8:8 と仮定。±15° は −15 が 2 本、+15 が 1 本(報告 −15.6, −13.3, +16.7)。配置は乱数' },
  },

  // ---- 関東ローム Lm ------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540121000',
    table: '4-1',
    code: '540121000',
    symbol: 'Lm',
    names: { ja: '関東ローム' },
    origin: { x: 5.67, y: 5.74 },
    layers: [
      {
        id: 'chevrons',
        archetype: 'grid',
        params: { pitchX: 11.28, pitchY: 8.57, rowOffset: 0, rows: 3, flipRows: true },
        motif: { kind: 'splitChevron', legLength: 5.07, legAngle: 56.7, apexGap: 1.39, open: 'down' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r09', measured: true, notes: '列ピッチ 11.12/11.33/11.33/11.33 の平均 11.28。行ごとに上下反転' },
  },

  // ---- 黒ぼく Kb ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540122000',
    table: '4-1',
    code: '540122000',
    symbol: 'Kb',
    names: { ja: '黒ぼく' },
    origin: { x: 6.95, y: 8.57 },
    layers: [
      {
        id: 'pairs',
        archetype: 'grid',
        params: { pitchX: 17.00, pitchY: 11.50, rowOffset: 0.5, rows: 2 },
        motif: { kind: 'pairVline', length: 5.85, gap: 2.78 },
      },
      {
        id: 'segments',
        archetype: 'scatter',
        params: {
          count: 10,
          length: 6.0,
          lengthJitter: 0.45,
          angles: [{ deg: -14, weight: 5 }, { deg: 12, weight: 1 }, { deg: 26.5, weight: 4 }],
        },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r10', measured: false, notes: '短線 10 本は乱数配置(報告の座標表は使わない)。角度は報告の範囲の中央値' },
  },

  // ---- 軽石 Pm ------------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540130000',
    table: '4-1',
    code: '540130000',
    symbol: 'Pm',
    names: { ja: '軽石' },
    origin: { x: 8.41, y: 6.36 },
    layers: [
      {
        id: 'triangles',
        archetype: 'grid',
        params: { pitchX: 19.80, pitchY: 8.57, rowOffset: { pt: 10.2 }, rows: 3 },
        motif: { kind: 'triangle', base: 5.76, height: 4.54, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r12', measured: true, notes: 'y ピッチ 7.93/9.21 の平均 8.57(不等)。位置は外接の中心(重心 - h/6)。行 2 のオフセット 10.2 は pt' },
  },

  // ---- しらす Si ----------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540131000',
    table: '4-1',
    code: '540131000',
    symbol: 'Si',
    names: { ja: 'しらす' },
    origin: { x: 15.50, y: 5.75 },
    layers: [
      {
        id: 'segments',
        archetype: 'scatter',
        params: {
          count: 13,
          length: 6.33,
          lengthJitter: 0.14,
          angles: [{ deg: -27, weight: 7 }, { deg: 27, weight: 6 }],
        },
      },
      {
        id: 'triangles',
        archetype: 'grid',
        params: { pitchX: 25.70, pitchY: 17.13, rowOffset: 0, rows: 2 },
        motif: { kind: 'triangle', base: 5.66, height: 4.64, fill: 'paper' },
      },
      {
        id: 'centerTriangle',
        archetype: 'symbol',
        params: { anchor: 'center', offsets: [{ x: 0.26, y: -0.50 }] },
        motif: { kind: 'triangle', base: 5.66, height: 4.64, fill: 'paper' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r13', measured: false, notes: '短線は乱数配置(まさ土と同じ分布)。三角は上下 2 行の格子 + 中央 1 個。右側の y のずれ(約 0.6)は未再現' },
  },

  // ---- スコリア Sc --------------------------------------------------------
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:540140000',
    table: '4-1',
    code: '540140000',
    symbol: 'Sc',
    names: { ja: 'スコリア' },
    origin: { x: 8.74, y: 5.75 },
    layers: [
      {
        id: 'triangles',
        archetype: 'grid',
        params: { pitchX: 19.78, pitchY: 8.57, rowOffset: { pt: 10.14 }, rows: 3 },
        motif: { kind: 'triangle', base: 5.66, height: 4.64, fill: 'ink' },
      },
    ],
    provenance: { doc: 'R3', section: '2 / t4_1_p057_h0_r16', measured: true, notes: 'y ピッチ 8.06/9.07 の平均 8.57(不等)。外接 5.56–5.76 × 4.64 の中央値。軽石の配置とは 0.3–0.6 ずれるため個別の値を使う' },
  },
];

/**
 * Rows without a drawing in R3 §1 (135 rows: 128 with note 注1, 7 with an empty note).
 * CONVENTIONS §10 and design §1.5: a row with no pattern is an `empty` preset, so that
 * table 5-1 aliases of these rows resolve. Only the code and the Japanese name are taken
 * from the source index; the composition of 注1 rows (table 4-1 + table 4-3) is not modelled here.
 * @type {Array<[string, string, string, string]>} [code, ja name, R3 row id, note]
 */
const EMPTY_ROWS = [
  ["521111000", "玉石混じり礫", "t4_1_p053_h0_r01", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531112000", "砂混じり礫", "t4_1_p053_h0_r07", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531112100", "砂混じり粗礫", "t4_1_p053_h0_r08", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531112200", "砂混じり中礫", "t4_1_p053_h0_r09", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531112300", "砂混じり細礫", "t4_1_p053_h0_r10", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113003", "シルト混じり礫", "t4_1_p053_h0_r11", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113004", "粘土混じり礫", "t4_1_p053_h0_r12", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113005", "腐植物混じり礫", "t4_1_p053_h0_r13", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113006", "火山灰混じり礫", "t4_1_p053_h0_r14", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113007", "貝殻混じり礫", "t4_1_p053_h0_r15", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113008", "サンゴ混じり礫", "t4_1_p053_h0_r16", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113103", "シルト混じり粗礫", "t4_1_p054_h0_r00", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113104", "粘土混じり粗礫", "t4_1_p054_h0_r01", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113105", "腐植物混じり粗礫", "t4_1_p054_h0_r02", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113106", "火山灰混じり粗礫", "t4_1_p054_h0_r03", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113107", "貝殻混じり粗礫", "t4_1_p054_h0_r04", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113108", "サンゴ混じり粗礫", "t4_1_p054_h0_r05", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113203", "シルト混じり中礫", "t4_1_p054_h0_r06", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113204", "粘土混じり中礫", "t4_1_p054_h0_r07", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113205", "腐植物混じり中礫", "t4_1_p054_h0_r08", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113206", "火山灰混じり中礫", "t4_1_p054_h0_r09", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113207", "貝殻混じり中礫", "t4_1_p054_h0_r10", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113208", "サンゴ混じり中礫", "t4_1_p054_h0_r11", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113303", "シルト混じり細礫", "t4_1_p054_h0_r12", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113304", "粘土混じり細礫", "t4_1_p054_h0_r13", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113305", "腐植物混じり細礫", "t4_1_p054_h0_r14", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113306", "火山灰混じり細礫", "t4_1_p054_h0_r15", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113307", "貝殻混じり細礫", "t4_1_p054_h0_r16", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531113308", "サンゴ混じり細礫", "t4_1_p054_h0_r17", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531120003", "シルト混じり砂礫", "t4_1_p054_h0_r19", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531120004", "粘土混じり砂礫", "t4_1_p054_h0_r20", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531120005", "腐植物混じり砂礫", "t4_1_p054_h0_r21", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531120006", "火山灰混じり砂礫", "t4_1_p054_h0_r22", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531120007", "貝殻混じり砂礫", "t4_1_p054_h0_r23", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531120008", "サンゴ混じり砂礫", "t4_1_p054_h0_r24", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531121000", "砂質礫", "t4_1_p054_h0_r25", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531121100", "砂質粗礫", "t4_1_p054_h0_r26", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531121200", "砂質中礫", "t4_1_p054_h0_r27", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531121300", "砂質細礫", "t4_1_p054_h0_r28", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131030", "シルト質礫", "t4_1_p054_h0_r29", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131040", "粘土質礫", "t4_1_p054_h0_r30", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131050", "有機質礫", "t4_1_p054_h0_r31", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131060", "火山灰質礫", "t4_1_p054_h0_r32", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131130", "シルト質粗礫", "t4_1_p054_h0_r33", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131140", "粘土質粗礫", "t4_1_p054_h0_r34", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131150", "有機質粗礫", "t4_1_p054_h0_r35", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131160", "火山灰質粗礫", "t4_1_p054_h0_r36", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131230", "シルト質中礫", "t4_1_p054_h0_r37", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131240", "粘土質中礫", "t4_1_p054_h0_r38", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131250", "有機質中礫", "t4_1_p054_h0_r39", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131260", "火山灰質中礫", "t4_1_p054_h0_r40", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131330", "シルト質細礫", "t4_1_p054_h0_r41", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131340", "粘土質細礫", "t4_1_p054_h0_r42", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131350", "有機質細礫", "t4_1_p054_h0_r43", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531131360", "火山灰質細礫", "t4_1_p054_h0_r44", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531212000", "礫混じり砂", "t4_1_p055_h0_r04", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531212100", "礫混じり粗砂", "t4_1_p055_h0_r05", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531212200", "礫混じり中砂", "t4_1_p055_h0_r06", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531212300", "礫混じり細砂", "t4_1_p055_h0_r07", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213003", "シルト混じり砂", "t4_1_p055_h0_r08", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213004", "粘土混じり砂", "t4_1_p055_h0_r09", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213005", "腐植物混じり砂", "t4_1_p055_h0_r10", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213006", "火山灰混じり砂", "t4_1_p055_h0_r11", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213007", "貝殻混じり砂", "t4_1_p055_h0_r12", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213008", "サンゴ混じり砂", "t4_1_p055_h0_r13", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213103", "シルト混じり粗砂", "t4_1_p055_h0_r14", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213104", "粘土混じり粗砂", "t4_1_p055_h0_r15", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213105", "腐植物混じり粗砂", "t4_1_p055_h0_r16", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213106", "火山灰混じり粗砂", "t4_1_p055_h0_r17", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213107", "貝殻混じり粗砂", "t4_1_p055_h0_r18", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213108", "サンゴ混じり粗砂", "t4_1_p055_h0_r19", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213203", "シルト混じり中砂", "t4_1_p055_h0_r20", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213204", "粘土混じり中砂", "t4_1_p055_h0_r21", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213205", "腐植物混じり中砂", "t4_1_p055_h0_r22", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213206", "火山灰混じり中砂", "t4_1_p055_h0_r23", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213207", "貝殻混じり中砂", "t4_1_p055_h0_r24", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213208", "サンゴ混じり中砂", "t4_1_p055_h0_r25", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213303", "シルト混じり細砂", "t4_1_p055_h0_r26", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213304", "粘土混じり細砂", "t4_1_p055_h0_r27", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213305", "腐植物混じり細砂", "t4_1_p055_h0_r28", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213306", "火山灰混じり細砂", "t4_1_p055_h0_r29", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213307", "貝殻混じり細砂", "t4_1_p055_h0_r30", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531213308", "サンゴ混じり細砂", "t4_1_p055_h0_r31", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531221000", "礫質砂", "t4_1_p055_h0_r32", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531221100", "礫質粗砂", "t4_1_p055_h0_r33", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531221200", "礫質中砂", "t4_1_p055_h0_r34", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531221300", "礫質細砂", "t4_1_p055_h0_r35", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231030", "シルト質砂", "t4_1_p055_h0_r36", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231040", "粘土質砂", "t4_1_p055_h0_r37", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231050", "有機質砂", "t4_1_p055_h0_r38", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231060", "火山灰質砂", "t4_1_p055_h0_r39", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231130", "シルト質粗砂", "t4_1_p055_h0_r40", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231140", "粘土質粗砂", "t4_1_p055_h0_r41", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231150", "有機質粗砂", "t4_1_p055_h0_r42", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231160", "火山灰質粗砂", "t4_1_p055_h0_r43", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231230", "シルト質中砂", "t4_1_p055_h0_r44", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231240", "粘土質中砂", "t4_1_p056_h0_r00", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231250", "有機質中砂", "t4_1_p056_h0_r01", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231260", "火山灰質中砂", "t4_1_p056_h0_r02", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231330", "シルト質細砂", "t4_1_p056_h0_r03", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231340", "粘土質細砂", "t4_1_p056_h0_r04", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231350", "有機質細砂", "t4_1_p056_h0_r05", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["531231360", "火山灰質細砂", "t4_1_p056_h0_r06", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110010", "礫質シルト", "t4_1_p056_h0_r09", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110020", "砂質シルト", "t4_1_p056_h0_r10", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110040", "粘土質シルト", "t4_1_p056_h0_r11", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110050", "有機質シルト", "t4_1_p056_h0_r12", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110060", "火山灰質シルト", "t4_1_p056_h0_r13", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110001", "礫混じりシルト", "t4_1_p056_h0_r14", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110002", "砂混じりシルト", "t4_1_p056_h0_r15", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110004", "粘土混じりシルト", "t4_1_p056_h0_r16", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110005", "腐植物混じりシルト", "t4_1_p056_h0_r17", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110006", "火山灰混じりシルト", "t4_1_p056_h0_r18", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110007", "貝殻混じりシルト", "t4_1_p056_h0_r19", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532110008", "サンゴ混じりシルト", "t4_1_p056_h0_r20", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120010", "礫質粘土", "t4_1_p056_h0_r22", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120020", "砂質粘土", "t4_1_p056_h0_r23", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120030", "シルト質粘土", "t4_1_p056_h0_r24", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120050", "有機質粘土", "t4_1_p056_h0_r25", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120060", "火山灰質粘土", "t4_1_p056_h0_r26", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120001", "礫混じり粘土", "t4_1_p056_h0_r27", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120002", "砂混じり粘土", "t4_1_p056_h0_r28", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120003", "シルト混じり粘土", "t4_1_p056_h0_r29", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120005", "腐植物混じり粘土", "t4_1_p056_h0_r30", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120006", "火山灰混じり粘土", "t4_1_p056_h0_r31", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120007", "貝殻混じり粘土", "t4_1_p056_h0_r32", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532120008", "サンゴ混じり粘土", "t4_1_p056_h0_r33", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532200006", "火山灰混じり有機質土", "t4_1_p056_h0_r35", "注1: 表4-3 の補助記号と組み合わせて描く(R3 §1)"],
  ["532300050", "有機質火山灰", "t4_1_p056_h0_r37", "備考空欄。模様なし(R3 §1)"],
  ["540110000", "風化土", "t4_1_p057_h0_r04", "備考空欄。模様なし(R3 §1)"],
  ["540112000", "赤色土", "t4_1_p057_h0_r06", "備考空欄。模様なし(R3 §1)"],
  ["540113000", "くさり礫", "t4_1_p057_h0_r07", "備考空欄。模様なし(R3 §1)"],
  ["540123000", "あかほや", "t4_1_p057_h0_r11", "備考空欄。模様なし(R3 §1)"],
  ["540132000", "ぼら", "t4_1_p057_h0_r14", "備考空欄。模様なし(R3 §1)"],
  ["540133000", "鹿沼土", "t4_1_p057_h0_r15", "備考空欄。模様なし(R3 §1)"],
];

/** One `empty` preset per no-pattern row. */
function emptyPreset([code, ja, rowId, note]) {
  return {
    schema: 'zc-pattern/1.0.0',
    id: `zc:${code}`,
    table: '4-1',
    code,
    names: { ja },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R3', section: `1 / ${rowId}`, measured: true, notes: note },
  };
}

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [...PATTERN_PRESETS, ...EMPTY_ROWS.map(emptyPreset)];
