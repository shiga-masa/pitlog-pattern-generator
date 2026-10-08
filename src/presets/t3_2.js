/**
 * Presets for R1 §2 (table 3-2).
 * Owner: preset-1 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Names and codes come from the source table (index.csv txt_* columns); no coordinates are copied.
 * Section numbers in provenance.notes give the source of each value (R1 = 024-025 pt report).
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:111000000', table: '3-2', code: '111000000', symbol: 'Tl',
    names: { ja: '崖錐堆積物' },
    provenance: { doc: 'R1', section: '2.1', measured: true, notes: '底辺 5.63 (5.46〜5.70 の平均)、高さ 4.57 (§2.1)。px 14.05 / py 5.70 / 千鳥 0.5 / 4 行 (§2.1)。白抜き (paper) (§2.1)。offset y -0.54 は行 cy = 5.18〜22.27 (§2.1) の中央が枠の中心より上にある量 (原本 prim で最小二乗)。' },
    layers: [
      { id: 'talus', archetype: 'grid', params: { pitchX: 14.05, pitchY: 5.70, rowOffset: 0.5, rows: 4 }, offset: { x: 0, y: -0.54 }, motif: { kind: 'triangle', base: 5.63, height: 4.57, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:121000000', table: '3-2', code: '121000000', symbol: 'Afd',
    names: { ja: '扇状地堆積物' },
    provenance: {
      doc: 'R1', section: '2.2', measured: true,
      notes: '点と白丸が同じ行で交互、行ごとに入れ替わる (§2.2)。点と白丸で行ピッチが違う (点 8.55、白丸 7.95, §2.2) ので 1 つの格子の cycle では表せず、図形ごとに 2 層の千鳥格子 (3 行 × 3 列、奇数行のずらしは rowOffset の pt 値) に分けた。px は同種間隔 (点 22.04、白丸 22.12, §2.2)。点 1.3 (幅 1.36 と高さ 1.23 の平均)、白丸 7.0 (§2.2)。列間隔が 10.0〜11.4 と不揃い (手置き, §2.2 ランダム性) なので不等間隔格子で表す。px / py は公称ピッチとして残す。rowPitches は原本 prim の行 y の差、colPitches は偶数行・奇数行ごとの同位置の列間の平均、rowShifts は行ごとの残差の平均、offset は 1 行目 1 列目に合わせた逆算値 (原本 prim で実測, analysis/fix_phase1/grid.md)。rowOffset は奇数行の x ずらしの実測値 (pt)。導出値 (実測値でなく、偶数行・奇数行の列間リストの幅を揃えて周期を閉じるために足した値。原本では枠の外に当たる): 点の colPitches 奇数行の 21.485、白丸の colPitches 偶数行の 21.129。',
    },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 22.04, pitchY: 8.55, rowOffset: { pt: 11.394 }, rows: 3, cols: 3, rowPitches: [8.729, 8.368], colPitches: [[22.79, 21.01], [22.315, 21.485]] }, offset: { x: -0.417, y: 0.002 }, motif: { kind: 'dot', d: 1.3 } },
      { id: 'circles', archetype: 'grid', params: { pitchX: 22.12, pitchY: 7.95, rowOffset: { pt: -11.157 }, rows: 3, cols: 3, colPitches: [[22.315, 21.129], [22.79, 20.654]], rowShifts: [0, 0, -0.237] }, offset: { x: 11.156, y: 0.002 }, motif: { kind: 'circle', d: 7.0, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:126100000', table: '3-2', code: '126100000', symbol: 'Rd',
    names: { ja: '河床堆積物' },
    provenance: {
      doc: 'R1', section: '2.3', measured: true,
      notes: '扇状地 (§2.2) と同じ部品で丸と点の位置が逆 (§2.3)。扇状地と同じく図形ごとに 2 層の千鳥格子 (3 行 × 3 列、奇数行のずらしは rowOffset の pt 値)。px は同種間隔 (丸 21.29、点 21.09, §2.3)。py は行 y (丸 6.26, 14.21, 22.15 → 7.95、点 5.66, 14.37, 22.75 → 8.55, §2.3)。±1 pt の不揃い (手置き, §2.3) を不等間隔格子で表す。px / py は公称ピッチとして残す。rowPitches は原本 prim の行 y の差、colPitches は偶数行・奇数行ごとの同位置の列間の平均、rowShifts は行ごとの残差の平均、offset は 1 行目 1 列目に合わせた逆算値 (原本 prim で実測, analysis/fix_phase1/grid.md)。rowOffset は奇数行の x ずらしの実測値 (pt)。導出値 (実測値でなく、偶数行・奇数行の列間リストの幅を揃えて周期を閉じるために足した値。原本では枠の外に当たる): 丸の colPitches 奇数行の 22.552、点の colPitches 偶数行の 22.078。',
    },
    layers: [
      { id: 'circles', archetype: 'grid', params: { pitchX: 21.29, pitchY: 7.95, rowOffset: { pt: 11.632 }, rows: 3, cols: 3, colPitches: [[22.315, 20.891], [20.654, 22.552]], rowShifts: [0, 0, -0.237] }, offset: { x: 0.829, y: 0.002 }, motif: { kind: 'circle', d: 7.0, fill: 'paper' } },
      { id: 'dots', archetype: 'grid', params: { pitchX: 21.09, pitchY: 8.55, rowOffset: { pt: -11.395 }, rows: 3, cols: 3, rowPitches: [8.709, 8.388], colPitches: [[20.89, 22.078], [22.078, 20.89]] }, offset: { x: 11.749, y: 0.002 }, motif: { kind: 'dot', d: 1.3 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:126200000', table: '3-2', code: '126200000',
    names: { ja: '自然堤防堆積物' },
    provenance: { doc: 'R1', section: '2.4', measured: true, notes: '模様なし、文字記号なし、備考なし (§2.4)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:126300000', table: '3-2', code: '126300000', symbol: 'Fpd',
    names: { ja: '氾濫原堆積物' },
    provenance: {
      doc: 'R1', section: '2.5', measured: true,
      notes: '点と水平短線が同じ行で交互、行ごとに入れ替わる (§2.5)。図形ごとに 2 層の千鳥格子 (3 行 × 3 列、奇数行のずらしは rowOffset の pt 値)。px は同種間隔 (点 21.92、線 22.26, §2.5)。py は行 y (点 5.90, 14.51, 22.75 → 8.43、線 5.78, 14.21, 22.88 → 8.55, §2.5)。線長 8.44 = 8.31〜8.55 の平均 (§2.5)。間隔 21.0〜22.6 の不揃い (§2.5) を不等間隔格子で表す。px / py は公称ピッチとして残す。rowPitches は原本 prim の行 y の差、colPitches は偶数行・奇数行ごとの同位置の列間の平均、rowShifts は行ごとの残差の平均、offset は 1 行目 1 列目に合わせた逆算値 (原本 prim で実測, analysis/fix_phase1/grid.md)。rowOffset は奇数行の x ずらしの実測値 (pt)。導出値 (実測値でなく、偶数行・奇数行の列間リストの幅を揃えて周期を閉じるために足した値。原本では枠の外に当たる): 点の colPitches 奇数行の 21.367、線の colPitches 偶数行の 21.364。',
    },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 21.92, pitchY: 8.43, rowOffset: { pt: 11.276 }, rows: 3, cols: 3, rowPitches: [8.608, 8.247], colPitches: [[22.553, 21.01], [22.196, 21.367]] }, offset: { x: 0.889, y: 0.122 }, motif: { kind: 'dot', d: 1.3 } },
      { id: 'lines', archetype: 'grid', params: { pitchX: 22.26, pitchY: 8.55, rowOffset: { pt: -11.276 }, rows: 3, cols: 3, rowPitches: [8.427, 8.669], colPitches: [[22.435, 21.364], [22.553, 21.246]] }, offset: { x: 12.283, y: 0.122 }, motif: { kind: 'hline', length: 8.44 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:127000000', table: '3-2', code: '127000000',
    names: { ja: '砂丘堆積物' },
    provenance: { doc: 'R1', section: '2.6', measured: true, notes: '模様なし、文字記号なし、備考なし (§2.6)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:128000000', table: '3-2', code: '128000000', symbol: 'Ld',
    names: { ja: '湖沼堆積物' },
    provenance: {
      doc: 'R1', section: '2.7', measured: true,
      notes: '氾濫原 (§2.5) と同じ部品で点と線の位置が逆 (§2.7)。図形ごとに 2 層の千鳥格子 (3 行 × 3 列、奇数行のずらしは rowOffset の pt 値)。px は同種間隔 (点 21.09、線 21.13, §2.7)。py: 点は河床の小点と座標まで同じ (§2.7) なので 8.55 (§2.3)、線は行 y 5.78, 14.21, 22.63 から 8.43 (§2.7)。線長 8.37 (8.31〜8.55 の平均, §2.7)。線の間隔が 19.59〜22.43 と揺れる (§2.7) ので不等間隔格子で表す。点の配置は河床 (zc:126100000) の点と同じ値。px / py は公称ピッチとして残す。rowPitches は原本 prim の行 y の差、colPitches は偶数行・奇数行ごとの同位置の列間の平均、rowShifts は行ごとの残差の平均、offset は 1 行目 1 列目に合わせた逆算値 (原本 prim で実測, analysis/fix_phase1/grid.md)。rowOffset は奇数行の x ずらしの実測値 (pt)。導出値 (実測値でなく、偶数行・奇数行の列間リストの幅を揃えて周期を閉じるために足した値。原本では枠の外に当たる): 点の colPitches 偶数行の 22.078、線の colPitches 奇数行の 20.653。',
    },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 21.09, pitchY: 8.55, rowOffset: { pt: -11.395 }, rows: 3, cols: 3, rowPitches: [8.709, 8.388], colPitches: [[20.89, 22.078], [22.078, 20.89]] }, offset: { x: 11.749, y: 0.002 }, motif: { kind: 'dot', d: 1.3 } },
      { id: 'lines', archetype: 'grid', params: { pitchX: 21.13, pitchY: 8.43, rowOffset: { pt: 11.157 }, rows: 3, cols: 3, colPitches: [[22.434, 19.585], [21.366, 20.653]] }, offset: { x: -0.002, y: 0.001 }, motif: { kind: 'hline', length: 8.37 } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100061000', table: '3-2', code: '100061000',
    names: { ja: '地すべり堆積物' },
    provenance: { doc: 'R1', section: '2.8', measured: true, notes: '模様なし、文字記号なし、備考なし (§2.8)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100063000', table: '3-2', code: '100063000', symbol: 'Df',
    names: { ja: '土石流堆積物' },
    provenance: { doc: 'R1', section: '2.9', measured: true, notes: '底辺 8.43 (8.31〜8.55 の平均)、高さ 4.17 (4.09〜4.33 の平均) (§2.9)。px 25.28 / py 7.10 / 千鳥 0.5 / 3 行 (§2.9)。白抜き (§2.9)。offset (7.02, -0.72) は 1 行目 cx = 9.73, 35.02、行 cy = 6.38, 13.48, 20.59 (§2.9) に中心配置の格子を合わせる量 (原本 prim で最小二乗)。' },
    layers: [
      { id: 'debris', archetype: 'grid', params: { pitchX: 25.28, pitchY: 7.10, rowOffset: 0.5, rows: 3 }, offset: { x: 7.02, y: -0.72 }, motif: { kind: 'triangle', base: 8.43, height: 4.17, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100064000', table: '3-2', code: '100064000', symbol: 'Mf',
    names: { ja: '泥流堆積物' },
    provenance: {
      doc: 'R1', section: '2.10', measured: true,
      notes: '点の層 px 9.66 / py 4.30 / 千鳥 0.5 / 6 行 (§2.10)。三角形の層 px 19.70 (点の 2.04 倍) / py 8.55 (7.71 と 9.39 の平均) / 千鳥 0.5 / 3 行、底辺 4.27 高さ 3.37 白抜き (§2.10)。三角形は点の格子の空き位置に置く (avoid, §2.10, 設計表 §1.5)。点の offset (-0.42, -0.07) は原本 prim の中心座標に最小二乗で合わせた値。三角形の行間隔は 7.71 / 9.39 と不等 (行 y 2.89, 10.60, 19.99, §2.10) で、等間隔 8.55 の 1 層では中央の行に約 0.55 pt の誤差が出るため、1・3 行目 (py 17.10 = 7.71 + 9.39、2 行) と 2 行目 (同じ py で 1 行、半ピッチずらし) の 2 層に分けた。offset: 1・3 行目 (0, -2.77)、2 行目 (0.12, -3.61) (2 行目 cx 18.28, 37.98 を原本 prim で実測)。周期は両層とも 19.70 × 17.10。',
    },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 9.66, pitchY: 4.30, rowOffset: 0.5, rows: 6 }, offset: { x: -0.42, y: -0.07 }, motif: { kind: 'dot', d: 1.3 } },
      { id: 'trianglesOuter', archetype: 'grid', params: { pitchX: 19.70, pitchY: 17.10, rowOffset: 0, rows: 2, avoid: 'dots' }, offset: { x: 0, y: -2.77 }, motif: { kind: 'triangle', base: 4.27, height: 3.37, fill: 'paper' } },
      { id: 'trianglesMiddle', archetype: 'grid', params: { pitchX: 19.70, pitchY: 17.10, rowOffset: 0, rows: 1, cols: 2, avoid: 'dots' }, offset: { x: 0.12, y: -3.61 }, motif: { kind: 'triangle', base: 4.27, height: 3.37, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100067000', table: '3-2', code: '100067000',
    names: { ja: 'タービダイト' },
    provenance: { doc: 'R1', section: '2.11', measured: true, notes: '模様なし、文字記号なし、備考なし (§2.11)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100000400', table: '3-2', code: '100000400', symbol: 'Tr',
    names: { ja: '段丘堆積物' },
    provenance: { doc: 'R1', section: '2.12', measured: true, notes: '白丸の直径 7.0 (§2.12, 礫岩 §1.1 と同じ)。px 11.22 / py 9.27 / 千鳥なし (ro 0) / 3 行 (§2.12)。offset x 0.74 は cx = 6.29〜51.16 (§2.12) の中央が枠の中心より右にある量 (原本 prim で最小二乗)。' },
    layers: [
      { id: 'terrace', archetype: 'grid', params: { pitchX: 11.22, pitchY: 9.27, rowOffset: 0, rows: 3 }, offset: { x: 0.74, y: 0 }, motif: { kind: 'circle', d: 7.0, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100000003', table: '3-2', code: '100000003',
    names: { ja: '付加コンプレックス' },
    provenance: { doc: 'R1', section: '2.13', measured: true, notes: '模様なし、文字記号なし、備考なし (§2.13)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
];
