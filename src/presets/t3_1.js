/**
 * Presets for R1 §1 (table 3-1).
 * Owner: preset-1 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Names and codes come from the source table (index.csv txt_* columns); no coordinates are copied.
 * Section numbers in provenance.notes give the source of each value (R1 = 023-024 pt report).
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111101002', table: '3-1', code: '111101002', symbol: 'Cg',
    names: { ja: '礫岩' },
    provenance: { doc: 'R1', section: '1.1', measured: true, notes: '直径 6.88 (幅) と 6.98〜7.22 (高さ) の平均付近の 7.0 (§1.1)。px 11.22 / py 9.27 / 千鳥 0.5 / 3 行 × 5 列 (行ごとに 5, 4, 5) (§1.1)。origin は 1 行目の最初の円の中心 (cx 6.29, cy 4.94) (§1.1)。円は真円で描く (13 角形近似の原本とは頂点単位で一致しない)。' },
    origin: { x: 6.29, y: 4.94 },
    layers: [
      { id: 'gravel', archetype: 'grid', params: { pitchX: 11.22, pitchY: 9.27, rowOffset: 0.5, rows: 3, cols: 5 }, motif: { kind: 'circle', d: 7.0, fill: 'ink' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111102002', table: '3-1', code: '111102002', symbol: 'Br',
    names: { ja: '角礫岩' },
    provenance: { doc: 'R1', section: '1.3', measured: false, notes: '行ピッチ 8.33 は 7.79 と 8.87 の平均 (行間不等、§1.3)。px 16.88 / 千鳥 0.48 / 3 行 (§1.3)。A 形状 5.22×4.21、B 形状 4.15×5.30 (幅・高さの平均)。行ごとに A, B, A (§1.3)。origin の x は 1 行目の最初の cx 6.65 (§1.3)、y は行 cy 6.26 / 14.05 / 22.92 (§1.3) をピッチ 8.33 の格子に最小二乗で当てた 6.08。irregularity と rotation は R1 に無く、検証段階で原本 prim (t3_1_p023_h0_r01、9 個の 17 角形) から測った: irregularity 0.3 は bbox 楕円に対する頂点半径の相対偏差 (最小 −0.38〜最大 +0.27、RMS 0.16〜0.18、一様乱数なら RMS×√3 ≈ 0.29)。rotation は頂点の 2 次モーメントの主軸の傾き (反時計回り) で、A は 5.0〜7.5° (6 個の平均 6.6)、B は長軸 (縦) から 4.2〜6.1° (3 個の平均 5.3)。輪郭の頂点列は同梱せず、乱数 (seed) で作るので原本とは形が一致しない。' },
    origin: { x: 6.65, y: 6.08 },
    layers: [
      {
        id: 'breccia', archetype: 'grid',
        params: {
          pitchX: 16.88, pitchY: 8.33, rowOffset: 0.48, rows: 3, assign: 'row',
          cycle: [
            { kind: 'blob', w: 5.22, h: 4.21, vertices: 17, irregularity: 0.3, rotation: 6.6, fill: 'paper' },
            { kind: 'blob', w: 4.15, h: 5.30, vertices: 17, irregularity: 0.3, rotation: 5.3, fill: 'paper' },
          ],
        },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111111002', table: '3-1', code: '111111002',
    names: { ja: '巨礫岩' },
    provenance: { doc: 'R1', section: '1.2', measured: true, notes: '備考「模様は礫岩を参考とする」(§1.2)。' },
    aliasOf: 'zc:111101002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111121002', table: '3-1', code: '111121002',
    names: { ja: '大礫岩' },
    provenance: { doc: 'R1', section: '1.2', measured: true, notes: '備考「同上」(礫岩を参考) (§1.2)。' },
    aliasOf: 'zc:111101002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111131002', table: '3-1', code: '111131002',
    names: { ja: '中礫岩' },
    provenance: { doc: 'R1', section: '1.2', measured: true, notes: '備考「同上」(礫岩を参考) (§1.2)。' },
    aliasOf: 'zc:111101002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111141002', table: '3-1', code: '111141002',
    names: { ja: '細礫岩' },
    provenance: { doc: 'R1', section: '1.2', measured: true, notes: '備考「同上」(礫岩を参考) (§1.2)。' },
    aliasOf: 'zc:111101002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111200002', table: '3-1', code: '111200002', symbol: 'Ss',
    names: { ja: '砂岩' },
    provenance: { doc: 'R1', section: '1.4', measured: true, notes: '点の直径 1.30 は幅 1.37 と高さ 1.23 の平均 (§1.4)。px 9.64 / py 4.26 / 千鳥 0.5 / 6 行 × 6 列 (行ごとに 6, 5) (§1.4)。origin (3.60, 3.60) は点の中心を格子に最小二乗で当てた 1 行目 1 列目の位置 (x: 偶数行の cx − 9.64·列番号 の平均、y: 行 cy 3.65 / 7.78 / 12.20 / 16.35 / 20.63 / 24.97 (§1.4) − 4.26·行番号 の平均)。1 行目の最初の点の実測 (3.56, 3.65) とは 0.05 pt 以内。点は真円で描く (原本は 6 角形)。' },
    origin: { x: 3.60, y: 3.60 },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 9.64, pitchY: 4.26, rowOffset: 0.5, rows: 6, cols: 6 }, motif: { kind: 'dot', d: 1.3 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111210002', table: '3-1', code: '111210002',
    names: { ja: '極粗粒砂岩' },
    provenance: { doc: 'R1', section: '1.5', measured: true, notes: '備考「模様は砂岩を参考とする」(§1.5)。' },
    aliasOf: 'zc:111200002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111220002', table: '3-1', code: '111220002',
    names: { ja: '粗粒砂岩' },
    provenance: { doc: 'R1', section: '1.5', measured: true, notes: '備考「同上」(砂岩を参考) (§1.5)。' },
    aliasOf: 'zc:111200002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111230002', table: '3-1', code: '111230002',
    names: { ja: '中粒砂岩' },
    provenance: { doc: 'R1', section: '1.5', measured: true, notes: '備考「同上」(砂岩を参考) (§1.5)。' },
    aliasOf: 'zc:111200002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111240002', table: '3-1', code: '111240002',
    names: { ja: '細粒砂岩' },
    provenance: { doc: 'R1', section: '1.5', measured: true, notes: '備考「同上」(砂岩を参考) (§1.5)。' },
    aliasOf: 'zc:111200002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111250002', table: '3-1', code: '111250002',
    names: { ja: '極細粒砂岩' },
    provenance: { doc: 'R1', section: '1.5', measured: true, notes: '備考「同上」(砂岩を参考) (§1.5)。' },
    aliasOf: 'zc:111200002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111300002', table: '3-1', code: '111300002', symbol: 'Ms',
    names: { ja: '泥岩' },
    provenance: { doc: 'R1', section: '1.6', measured: true, notes: 'ダッシュ長 5.60 は 5.46〜5.70 の平均 (§1.6)。px 8.43 / py 4.24 / 6 行 (§1.6)。千鳥の既定 0.5 は実測ずらし 4.15 pt (= 0.49 ピッチ) の近似 (§1.6)。6 行 × 6 列 (§1.6)。origin は 1 行目の最初のダッシュの中心 (cx 5.58, cy 2.89) (§1.6)。行間は 4.09 / 4.33 / 4.33 / 4.33 / 4.09 と不等 (量子化、§1.6) で、等間隔 4.24 の格子では 2・5 行目が 0.14〜0.15 pt ずれる。' },
    origin: { x: 5.58, y: 2.89 },
    layers: [
      { id: 'dashes', archetype: 'grid', params: { pitchX: 8.43, pitchY: 4.24, rowOffset: 0.5, rows: 6, cols: 6 }, motif: { kind: 'hline', length: 5.60 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111300012', table: '3-1', code: '111300012', symbol: 'Sh',
    names: { ja: '頁岩' },
    provenance: { doc: 'R1', section: '1.7', measured: true, notes: '行ピッチ 4.24 (§1.7)。破線 5.70 / 間隔 2.75 (= 8.45 − 5.70) と、破線・実線の交互 (§1.7)。余白 2.85 (§1.7)。origin は 1 本目の破線 (1 行目、y 2.89) の左端 x 4.04 (§1.7 の cx 6.88 − 長さの半分 2.85、prim t3_1_p024_h0_r01 の左端 4.04 と一致)。線 0 本目が破線になり、破線の位相は origin から測るので dashPhase 0。' },
    origin: { x: 4.04, y: 2.89 },
    layers: [
      { id: 'beds', archetype: 'hatch', params: { angle: 0, spacing: 4.24, cycle: ['dashed', 'solid'], dash: 5.70, gap: 2.75, dashPhase: 0, margin: 2.85 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111400002', table: '3-1', code: '111400002', symbol: 'Slt',
    names: { ja: 'シルト岩' },
    provenance: { doc: 'R1', section: '1.8', measured: true, notes: '泥岩 (§1.6) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:111300002',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111500002', table: '3-1', code: '111500002',
    names: { ja: '粘土岩' },
    provenance: { doc: 'R1', section: '1.9', measured: true, notes: '模様なし (PDF 上の図形 0 個、§1.9)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:112190002', table: '3-1', code: '112190002',
    names: { ja: '礫質砂岩' },
    provenance: { doc: 'R1', section: '1.9', measured: true, notes: '模様なし、指定なし (§1.9)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:112220002', table: '3-1', code: '112220002',
    names: { ja: '砂質泥岩' },
    provenance: { doc: 'R1', section: '1.9', measured: true, notes: '模様なし、指定なし (§1.9)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:112230002', table: '3-1', code: '112230002',
    names: { ja: '泥質砂岩' },
    provenance: { doc: 'R1', section: '1.9', measured: true, notes: '模様なし、指定なし (§1.9)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:113170002', table: '3-1', code: '113170002',
    names: { ja: '砂質シルト岩' },
    provenance: { doc: 'R1', section: '1.9', measured: true, notes: '模様なし、指定なし (§1.9)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:114200002', table: '3-1', code: '114200002', symbol: 'Wk',
    names: { ja: 'ワッケ' },
    provenance: {
      doc: 'R1', section: '1.10', measured: false,
      notes: '点の層は砂岩 (§1.4) と同じ値。斜線 6 本: 右上がり 3 本 (約 27°, 長さ 6.18〜6.39) と右下がり 3 本 (約 135°, 長さ 5.58〜5.75) (§1.10)。長さは 2 群の平均 6.0 を中心に ±0.4 の一様揺れで表す (§1.10 から算出)。点の origin は砂岩と同じ (3.60, 3.60、§1.4 の行・列から最小二乗)。散布層は origin を使わない。斜線の位置は原本が固定座標のため未測定 (シード付き散布で代替、§1.10, §1.4 a2)。',
    },
    origin: { x: 3.60, y: 3.60 },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 9.64, pitchY: 4.26, rowOffset: 0.5, rows: 6, cols: 6 }, motif: { kind: 'dot', d: 1.3 } },
      { id: 'segs', archetype: 'scatter', params: { count: 6, length: 6.0, lengthJitter: 0.4, angles: [{ deg: 27, weight: 0.5 }, { deg: 135, weight: 0.5 }] } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:121005002', table: '3-1', code: '121005002',
    names: { ja: '石灰質粘土岩' },
    provenance: { doc: 'R1', section: '1.11', measured: true, notes: '模様なし (PDF 上の図形 0 個、§1.11)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:121100002', table: '3-1', code: '121100002', symbol: 'Ls',
    names: { ja: '石灰岩' },
    provenance: { doc: 'R1', section: '1.12', measured: true, notes: 'レンガ高さ (courseHeight) 7.22、目地間隔 22.43 (§1.12)。目地角 90° (§1.12)。千鳥 0.5 (§1.12)。水平線は枠幅いっぱい (§1.12)。' },
    layers: [
      { id: 'brick', archetype: 'brick', params: { courseHeight: 7.22, brickLength: 22.43, jointAngle: 90, stagger: 0.5 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:121500002', table: '3-1', code: '121500002', symbol: 'Do',
    names: { ja: 'ドロマイト' },
    provenance: { doc: 'R1', section: '1.13', measured: true, notes: 'レンガは石灰岩 (§1.12) と同じ。斜線は pt での実測角 45.4° (§1.13、フォーム単位では 45°)。水平切片の間隔 21.72 (= 20.89 と 22.55 の平均、間隔は不等) を線に垂直な間隔 15.46 (= 21.72 × sin 45.4°) に換算 (§1.13, CONVENTIONS §2)。斜線の位相: y = 0 での x 切片 16.86 / 37.75 / 60.30 (§1.13) を間隔 21.72 の格子に最小二乗で当てると 16.58 / 38.30 / 60.02。中心アンカー (28.015, 14.205) を通る線の切片 42.02 を 38.30 に合わせるため、斜線層の offset x = −3.72。' },
    layers: [
      { id: 'brick', archetype: 'brick', params: { courseHeight: 7.22, brickLength: 22.43, jointAngle: 90, stagger: 0.5 } },
      { id: 'lines', archetype: 'hatch', offset: { x: -3.72, y: 0 }, params: { angle: 45.4, spacing: 15.46 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:131000002', table: '3-1', code: '131000002', symbol: 'Cht',
    names: { ja: 'チャート' },
    provenance: { doc: 'R1', section: '1.14', measured: true, notes: '目地角 52 (50.8〜52.9 の中央, 右上がり, §1.14)。目地の x ピッチ 22.37 (§1.14)。レンガ高さ 7.22、千鳥 0.5 は石灰岩と同じ (§1.14)。origin は 2 本目の水平線 (y 14.21) と、その下の段の目地の下端 x 25.17 (prim t3_1_p024_h0_r12 の目地 (30.86, 14.21)-(25.17, 21.43)) (§1.14)。' },
    origin: { x: 25.17, y: 14.21 },
    layers: [
      { id: 'brick', archetype: 'brick', params: { courseHeight: 7.22, brickLength: 22.37, jointAngle: 52, stagger: 0.5 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:171120002', table: '3-1', code: '171120002',
    names: { ja: '褐炭' },
    provenance: { doc: 'R1', section: '1.15', measured: true, notes: '模様なし (PDF 上の図形 0 個、§1.15)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:172300002', table: '3-1', code: '172300002', symbol: 'Co',
    names: { ja: '石炭' },
    provenance: { doc: 'R1', section: '1.16', measured: true, notes: '2 方向の線群を 1 層に持つ (§1.16)。角度は pt での実測 45.3〜45.9° / 134.1〜134.7° のうち 45.4° / 134.6° (左辺の y 切片の刻み 2.85 と水平の間隔 2.80 の比 tan θ = 1.014 に合う角度、§1.16)。線に垂直な間隔 1.995 は水平の間隔 2.802 (§1.16 の 2.80、枠幅 56.03 の 1/20) × sin 45.4° (§1.16 の「約 2.0」)。枠幅が水平間隔の 20 倍、枠高が左辺の y 切片間隔 (2.841) の 10 倍になり、両方向の線の端点が枠の 4 辺で一致する (原本と同じ網目の閉じ方)。両方向の線が枠の左上角を通る (左辺の y 切片 2.87 刻み・上辺の x 切片 2.80 刻みがともに 0 から始まる、§1.16) ので origin は topLeft。枠辺まで引いて切る (margin 0, §1.16)。' },
    origin: 'topLeft',
    layers: [
      { id: 'mesh', archetype: 'hatch', params: { angle: [45.4, 134.6], spacing: 1.995 } },
    ],
  },
];
