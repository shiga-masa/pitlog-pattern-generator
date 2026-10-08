/**
 * Presets for R2 §1–§32 (table 3-4, igneous rock facies).
 * Owner: preset-2 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section (provenance.section);
 * 2-value pitches are averaged, irregular row spacing is noted, unmeasured values are null + measured:false.
 * Aliases carry only the head fields + aliasOf (same drawing as the target, no copied values).
 *
 * Excluded (not registered, see the report):
 * - t3_4_p026_h1_r07 アグロメレート (zc:220006000): splitChevron.apexGap is not measured in R2 §8,
 *   and the schema requires a number there (no null allowed). Register it after the gap is measured.
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  // ---- drawings -----------------------------------------------------------

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221010400', table: '3-4', code: '221010400', symbol: 'Lp',
    names: { ja: '火山礫' },
    origin: { x: 6.91, y: 5.12 },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.58, height: 4.58, fill: 'ink' },
      params: { pitchX: 14.07, pitchY: 5.70, rowOffset: 0.5, rows: 4 },
    }],
    provenance: { doc: 'R2', section: '1', measured: true, notes: 'x ピッチ 14.00–14.13 の平均。行間 5.54–5.78 の平均(不等)。origin は 1 行目 1 列目の位置で、原本 prim(t3_4_p026_h1_r00)の三角形 bbox 中心を格子に最小二乗で当てた値(x: 各中心 − 14.07·列 − 千鳥 の平均、y: 行 cy 5.18 / 10.71 / 16.49 / 22.27 − 5.70·行 の平均)' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221010500', table: '3-4', code: '221010500', symbol: 'Vbl',
    names: { ja: '火山岩塊' },
    origin: { x: 8.31, y: 6.26 },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 8.43, height: 6.86, fill: 'ink' },
      params: { pitchX: 19.70, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
    }],
    provenance: {
      doc: 'R2', section: '2', measured: true,
      notes: 'origin は 1 行目 1 列目の位置で、原本 prim(t3_4_p026_h1_r01)の三角形 bbox 中心(行 cy 6.26 / 14.81 / 23.36、先頭 cx 8.31 / 18.16)を格子に最小二乗で当てた値',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221016500', table: '3-4', code: '221016500', symbol: 'Vbn',
    names: { ja: '火山弾' },
    origin: { x: 8.33, y: 5.98 },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.58, height: 4.45, fill: 'ink' },
      params: { pitchX: 19.65, pitchY: 8.55, rowOffset: { pt: 10.21 }, rows: 3 },
    }],
    provenance: {
      doc: 'R2', section: '3', measured: true,
      notes: '高さ 4.33–4.58 の平均(中段 2 個は 4.33)。行間 8.07/9.03 の平均(不等)。千鳥 10.21 pt は 1/2 ピッチ 9.85 より 0.36 大きい。origin は 1 行目 1 列目の位置で、原本 prim(t3_4_p026_h1_r02)の三角形 bbox 中心(行 cy 6.14 / 14.21 / 23.24)を格子に最小二乗で当てた値。行間不等のため中段は 0.32 pt、上下段は 0.16 pt ずれる',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:210020000', table: '3-4', code: '210020000', symbol: 'Vcr',
    names: { ja: '火山砕屑岩' },
    layers: [
      {
        id: 'shortLines', archetype: 'scatter',
        params: {
          count: 19, length: 6.18, lengthJitter: 0.49,
          angles: [
            { deg: 27, weight: 9 }, { deg: 15, weight: 1 },
            { deg: -27, weight: 7 }, { deg: -15, weight: 2 },
          ],
        },
      },
      {
        id: 'triangles', archetype: 'grid',
        motif: { kind: 'triangle', base: 5.58, height: 4.58, fill: 'paper' },
        params: { pitchX: 19.65, pitchY: 8.55, rowOffset: { pt: 10.21 }, rows: 3 },
      },
    ],
    provenance: {
      doc: 'R2', section: '4', measured: true,
      notes: '短線 19 本は固定座標ではなく seed 付き散布。角度は設計書 §1.5.4 の ±27°(上り 9・下り 7)・±15°(上り 1・下り 2)。長さ中央値 6.18、半幅 0.49 は範囲 5.42–6.39 から。三角形は白抜きで短線を隠す(描画順 短線→三角形)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:210020600', table: '3-4', code: '210020600', symbol: 'Vb',
    names: { ja: '火山角礫岩' },
    origin: { x: 6.83, y: 5.19 },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.52, height: 4.64, fill: 'ink' },
      params: { pitchX: 13.91, pitchY: 5.77, rowOffset: 0.5, rows: 4 },
    }],
    provenance: {
      doc: 'R2', section: '5', measured: true,
      notes: '原本枠 55.38×28.79 pt は既定枠へ正規化(設計書 §0.3、要確認)。x ピッチ 13.84–13.97 の平均。原本は 1 行目が 4 個・2 行目が 3 個(先頭 cx 6.81 / 13.85)。origin は 1 行目 1 列目の位置で、原本 prim(t3_4_p026_h1_r04)の三角形 bbox 中心(行 cy 5.25 / 10.86 / 16.71 / 22.57)を格子に最小二乗で当てた値(原本枠の左上基準、正規化前)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221020300', table: '3-4', code: '221020300', symbol: 'Tf',
    names: { ja: '凝灰岩' },
    origin: { x: 6.21, y: 3.62 },
    layers: [{
      id: 'chevrons', archetype: 'grid',
      motif: { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'down' },
      params: { pitchX: 14.07, pitchY: 7.06, rowOffset: 0.5, rows: 4 },
    }],
    provenance: {
      doc: 'R2', section: '9', measured: true,
      notes: '脚長 5.06–5.19 の平均、脚角 56.7–58.9 の平均、頂部の隙間 1.42。脚の開き 6.88 は算出値と一致。origin は 1 行目 1 列目の Λ の中心で、原本 prim(t3_4_p026_h1_r08)の左右の脚の中心の中点を格子に最小二乗で当てた値(x: 中点 6.23 / 20.30 / 34.36 / 48.43 と 13.29 / 27.30 / 41.31、y: 行 3.61 / 10.59 / 17.82 / 24.80)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221024300', table: '3-4', code: '221024300', symbol: 'Ptf',
    names: { ja: '軽石質凝灰岩' },
    origin: { x: 6.21, y: 3.62 },
    layers: [
      {
        id: 'chevrons', archetype: 'grid', offset: { x: 0.022, y: -0.009 },
        motif: { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'down' },
        params: {
          pitchX: 14.07, pitchY: 7.06, rowOffset: { pt: 7.062 }, rows: 4, cols: 4,
          rowPitches: [6.983, 7.224, 6.983],
          colPitches: [[14.065, 14.066, 14.066], [14.006, 14.006, 14.185]],
        },
      },
      {
        id: 'triangles', archetype: 'grid', offset: { x: 7.203, y: 0.914 },
        params: {
          cycle: [
            { kind: 'triangle', base: 5.46, height: 4.58, fill: 'paper' },
            { kind: 'triangle', base: 5.70, height: 4.58, fill: 'paper' },
          ],
          assign: 'row',
          pitchX: 13.89, pitchY: 6.78, rowOffset: { pt: -7.24 }, rows: 4, cols: 4,
          rowPitches: [7.264, 7.585, 5.418],
          colPitches: [[13.888, 13.888, 14.244], [14.007, 14.006, 14.007]],
          rowShifts: [-0.04, 0, 0.04, 0],
        },
      },
    ],
    provenance: {
      doc: 'R2', section: '10', measured: true,
      notes: '両層とも不等間隔格子(rowPitches / colPitches / rowShifts、docs/CONVENTIONS.md §7.3.1)。値は原本 prim(t3_4_p026_h1_r09 / r10)の図形中心を行ごとにまとめた実測: rowPitches は行の y の差、colPitches は偶数行・奇数行それぞれ同じ位置の列間の平均、rowShifts は各行の x 残差の平均、各層の offset は origin から見て 1 行目 1 列目が合うよう逆算した値(fix_phase1/grid.md)。colPitches の 14.185(Λ 奇数行)と 14.244(三角 偶数行)は導出値(実測値ではない): 偶数行と奇数行で個数が違うため、2 つの列間リストの周期幅を揃えるよう「長い方の和 − 短い方の和」として足した値で、原本では枠外に当たる。pitchX / pitchY は公称値(等間隔近似、不等間隔の配置には使われない)。Λ の千鳥 7.062 も同じ実測から(2 行目先頭と 1 行目先頭の差)。三角形の千鳥 −7.24 は行先頭 x 13.41(1 行目)と 6.17(2 行目)の差。三角の底辺は行ごとに交互で、三角形層の偶数行(原本 1・3 行目)が 5.46、奇数行(2・4 行目)が 5.70(原本 prim r09 / r10 の bbox 幅の実測。cycle を assign row で交互)。高さは 4.57–4.58 で 4.58 に揃える。行内で三角の y が列ごとに違う段差(奇数行は両端が中 2 個より 0.24 上、1 行目は右端が 0.48 上)は手置きの不揃い(許容する逸脱、再現しない)。origin は Λ 層の 1 行目 1 列目(凝灰岩と同じ)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221025300', table: '3-4', code: '221025300', symbol: 'Stf',
    names: { ja: 'スコリア質凝灰岩' },
    origin: { x: 6.21, y: 3.62 },
    layers: [
      {
        id: 'chevrons', archetype: 'grid', offset: { x: 0.022, y: -0.009 },
        motif: { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'down' },
        params: {
          pitchX: 14.07, pitchY: 7.06, rowOffset: { pt: 7.062 }, rows: 4, cols: 4,
          rowPitches: [6.983, 7.224, 6.983],
          colPitches: [[14.065, 14.066, 14.066], [14.006, 14.006, 14.185]],
        },
      },
      {
        id: 'triangles', archetype: 'grid', offset: { x: 7.203, y: 0.915 },
        params: {
          cycle: [
            { kind: 'triangle', base: 5.46, height: 4.58, fill: 'ink' },
            { kind: 'triangle', base: 5.70, height: 4.58, fill: 'ink' },
          ],
          assign: 'row',
          pitchX: 13.89, pitchY: 6.78, rowOffset: { pt: -7.24 }, rows: 4, cols: 4,
          rowPitches: [7.264, 7.585, 5.418],
          colPitches: [[13.888, 13.888, 14.244], [14.007, 14.006, 14.007]],
          rowShifts: [-0.04, 0, 0.04, 0],
        },
      },
    ],
    provenance: {
      doc: 'R2', section: '11', measured: true,
      notes: '両層とも不等間隔格子(rowPitches / colPitches / rowShifts、docs/CONVENTIONS.md §7.3.1)。値は原本 prim(t3_4_p026_h1_r09 / r10)の図形中心を行ごとにまとめた実測: rowPitches は行の y の差、colPitches は偶数行・奇数行それぞれ同じ位置の列間の平均、rowShifts は各行の x 残差の平均、各層の offset は origin から見て 1 行目 1 列目が合うよう逆算した値(fix_phase1/grid.md)。colPitches の 14.185(Λ 奇数行)と 14.244(三角 偶数行)は導出値(実測値ではない): 偶数行と奇数行で個数が違うため、2 つの列間リストの周期幅を揃えるよう「長い方の和 − 短い方の和」として足した値で、原本では枠外に当たる。pitchX / pitchY は公称値(等間隔近似、不等間隔の配置には使われない)。Λ の千鳥 7.062 も同じ実測から(2 行目先頭と 1 行目先頭の差)。三角形の千鳥 −7.24 は行先頭 x 13.41(1 行目)と 6.17(2 行目)の差。三角の底辺は行ごとに交互で、三角形層の偶数行(原本 1・3 行目)が 5.46、奇数行(2・4 行目)が 5.70(原本 prim r09 / r10 の bbox 幅の実測。cycle を assign row で交互)。高さは 4.57–4.58 で 4.58 に揃える。行内で三角の y が列ごとに違う段差(奇数行は両端が中 2 個より 0.24 上、1 行目は右端が 0.48 上)は手置きの不揃い(許容する逸脱、再現しない)。origin は Λ 層の 1 行目 1 列目(凝灰岩と同じ)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221030300', table: '3-4', code: '221030300', symbol: 'Wtf',
    names: { ja: '溶結凝灰岩' },
    origin: { x: 3.41, y: 6.38 },
    layers: [
      {
        id: 'chevronsLeft', archetype: 'grid',
        motif: { kind: 'splitChevron', legLength: 5.09, legAngle: 34.1, apexGap: 1.37, open: 'left' },
        params: { pitchX: 14.06, pitchY: 8.55, rowOffset: 0, rows: 3 },
      },
      {
        id: 'chevronsRight', archetype: 'grid', offset: { x: 7.03, y: 0 },
        motif: { kind: 'splitChevron', legLength: 5.09, legAngle: 34.1, apexGap: 1.37, open: 'right' },
        params: { pitchX: 14.06, pitchY: 8.55, rowOffset: 0, rows: 3 },
      },
    ],
    provenance: {
      doc: 'R2', section: '15', measured: true,
      notes: '＞と＜を列ごとに交互し、全行で同じ並び(＞＜＞＜…、行ごとに入れ替わらない。原本 prim t3_4_p026_h1_r14 で確認)。grid の cycle の assign はどれも列だけでの交互を表せない(col は市松になる)ため、＞の層と＜の層に分け、＜の層を 7.03 pt(同じ向きの間隔の半分)右へずらす。各層の px 14.06 は 7.03 の 2 倍(同じ向きの間隔 14.00–14.13 の範囲内)。脚長 5.09・脚角 34.1 は原本 prim(t3_4_p026_h1_r14)の脚 48 本の平均(範囲 4.83–5.16、31.8–35.6 の中央値 5.0・33.7 では脚が短く IoU が 0.83 に留まった)。隙間 1.37 は 3 行の実測 1.20 / 1.45 / 1.45 の平均。origin は 1 行目 1 列目の山形の中心で、原本 prim(t3_4_p026_h1_r14)の上下の脚の中心(x 3.44 / 10.45 / … / 52.58、行 y 6.38 / 14.93 / 23.48)を格子に最小二乗で当てた値',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:231020100', table: '3-4', code: '231020100',
    names: { ja: '凝灰質泥岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-4 模様なし行', measured: true, notes: '模様・文字記号とも空欄(PDF 描画で確認)' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:231020200', table: '3-4', code: '231020200',
    names: { ja: '凝灰質シルト岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-4 模様なし行', measured: true, notes: '模様・文字記号とも空欄(PDF 描画で確認)' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:231020300', table: '3-4', code: '231020300',
    names: { ja: '凝灰質砂岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-4 模様なし行', measured: true, notes: '模様・文字記号とも空欄(PDF 描画で確認)' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221100310', table: '3-4', code: '221100310', symbol: 'Afa',
    names: { ja: '火山灰降下堆積物' },
    layers: [{
      id: 'shortLines', archetype: 'scatter',
      params: {
        count: 19, length: 6.18, lengthJitter: 0.49,
        angles: [
          { deg: 27, weight: 9 }, { deg: 15, weight: 1 },
          { deg: -27, weight: 7 }, { deg: -15, weight: 2 },
        ],
      },
    }],
    provenance: {
      doc: 'R2', section: '18', measured: true,
      notes: '短線 19 本は固定座標ではなく seed 付き散布。角度と長さは R2 §4 と同じ統計(設計書 §1.5.4)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221104410', table: '3-4', code: '221104410', symbol: 'Pfa',
    names: { ja: '軽石降下堆積物' },
    origin: { x: 8.33, y: 5.98 },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.58, height: 4.45, fill: 'none' },
      offset: { x: -0.021, y: 0.16 },
      params: {
        pitchX: 19.65, pitchY: 8.55, rowOffset: { pt: 10.208 }, rows: 3, cols: 3,
        rowPitches: [8.067, 9.03],
        colPitches: [[19.704, 19.704], [19.585, 19.823]],
      },
    }],
    provenance: {
      doc: 'R2', section: '19', measured: true,
      notes: '輪郭のみ(塗りなし)。寸法と origin は火山弾(R2 §3)と同じ(原本 prim t3_4_p027_h0_r02 の中心座標は火山弾と一致)。配置は不等間隔格子(docs/CONVENTIONS.md §7.3.1): rowPitches 8.067 / 9.03 は行の y の差、colPitches は偶数行・奇数行それぞれの列間、千鳥 10.208 も同じ実測から(2 行目先頭と 1 行目先頭の差)、offset は origin から見て 1 行目 1 列目が合うよう逆算した値(fix_phase1/grid.md)。奇数行の 19.823 は導出値(実測値ではない): 偶数行 3 個・奇数行 2 個で周期幅を揃えるため「長い方の和 − 短い方の和」として足した値で、原本では枠外に当たる。pitchX / pitchY は公称値。中段 2 個の三角の高さ 4.33 は再現しない(全個体 4.45)',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100010', table: '3-4', code: '240100010', symbol: 'Plv',
    names: { ja: 'パホイホイ溶岩' },
    origin: { x: 16.77, y: 3.62 },
    layers: [{
      id: 'chevrons', archetype: 'grid',
      motif: { kind: 'chevron', width: 8.43, depth: 4.34, open: 'down' },
      params: { pitchX: 22.49, pitchY: 7.06, rowOffset: -0.5, rows: 4 },
    }],
    provenance: {
      doc: 'R2', section: '25', measured: true,
      notes: 'x ピッチ 22.43–22.55 の平均、行間 6.98–7.23 の平均(不等)。溶岩 7 種と模様なし溶岩の共通模様。原本は 1 行目が 2 個(先頭 16.74)、2 行目が 3 個(先頭 5.58)なので、千鳥は −1/2(2 行目が左へずれる)。origin は 1 行目 1 列目の位置で、原本 prim(t3_4_p027_h0_r09)の山形 bbox 中心を格子に最小二乗で当てた値(y: 行 3.61 / 10.59 / 17.82 / 24.80 − 7.06·行 の平均)',
    },
  },

  // ---- aliases (same drawing as the target; head fields only) -------------

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:220020000', table: '3-4', code: '220020000', symbol: 'Pcr',
    names: { ja: '火砕岩' }, aliasOf: 'zc:210020000',
    provenance: { doc: 'R2', section: '6', measured: true, notes: 'R2 §4 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:220035000', table: '3-4', code: '220035000', symbol: 'Agt',
    names: { ja: 'アグルチネート' }, aliasOf: 'zc:221010400',
    provenance: { doc: 'R2', section: '7', measured: true, notes: 'R2 §1 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:222020400', table: '3-4', code: '222020400', symbol: 'Lt',
    names: { ja: '火山礫凝灰岩' }, aliasOf: 'zc:221025300',
    provenance: { doc: 'R2', section: '12', measured: true, notes: 'R2 §11 と同一幾何・同一塗り' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221020400', table: '3-4', code: '221020400', symbol: 'Lp',
    names: { ja: '火山礫岩' }, aliasOf: 'zc:221025300',
    provenance: { doc: 'R2', section: '13', measured: true, notes: 'R2 §11 と同一幾何・同一塗り' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:222020600', table: '3-4', code: '222020600', symbol: 'Tb',
    names: { ja: '凝灰角礫岩' }, aliasOf: 'zc:221025300',
    provenance: { doc: 'R2', section: '14', measured: true, notes: 'R2 §11 と同一幾何・同一塗り' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:210000000', table: '3-4', code: '210000000', symbol: 'Vc',
    names: { ja: '火山砕屑物' }, aliasOf: 'zc:210020000',
    provenance: { doc: 'R2', section: '16', measured: true, notes: 'R2 §4 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221100010', table: '3-4', code: '221100010', symbol: 'Pyfa',
    names: { ja: '火砕降下堆積物' }, aliasOf: 'zc:210020000',
    provenance: { doc: 'R2', section: '17', measured: true, notes: 'R2 §4 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221105410', table: '3-4', code: '221105410', symbol: 'Sfa',
    names: { ja: 'スコリア降下堆積物' }, aliasOf: 'zc:221016500',
    provenance: { doc: 'R2', section: '20', measured: true, notes: 'R2 §3 と同一幾何・同一塗り' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:222100030', table: '3-4', code: '222100030', symbol: 'Pyf',
    names: { ja: '火砕流堆積物' }, aliasOf: 'zc:210020000',
    provenance: { doc: 'R2', section: '21', measured: true, notes: 'R2 §4 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:222100330', table: '3-4', code: '222100330', symbol: 'Afl',
    names: { ja: '火山灰流堆積物' }, aliasOf: 'zc:221100310',
    provenance: { doc: 'R2', section: '22', measured: true, notes: 'R2 §18 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:222104030', table: '3-4', code: '222104030', symbol: 'Pfl',
    names: { ja: '軽石流堆積物' }, aliasOf: 'zc:221104410',
    provenance: { doc: 'R2', section: '23', measured: true, notes: 'R2 §19 と同一幾何(輪郭のみ)' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:222105030', table: '3-4', code: '222105030', symbol: 'Sfl',
    names: { ja: 'スコリア流堆積物' }, aliasOf: 'zc:221016500',
    provenance: { doc: 'R2', section: '24', measured: true, notes: 'R2 §3 と同一幾何・同一塗り' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240000000', table: '3-4', code: '240000000',
    names: { ja: '溶岩' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '表3-4 模様なし行', measured: true, notes: '文字記号は空欄。模様は溶岩の共通模様(R2 §25)を使う' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100020', table: '3-4', code: '240100020', symbol: 'Alv',
    names: { ja: 'アア溶岩' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '26', measured: true, notes: 'R2 §25 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100025', table: '3-4', code: '240100025', symbol: 'Cln',
    names: { ja: 'クリンカー' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '27', measured: true, notes: 'R2 §25 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100030', table: '3-4', code: '240100030', symbol: 'Blv',
    names: { ja: 'ブロック溶岩' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '28', measured: true, notes: 'R2 §25 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100031', table: '3-4', code: '240100031',
    names: { ja: '塊状溶岩' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '表3-4 模様なし行', measured: true, notes: '文字記号は空欄。模様は溶岩の共通模様(R2 §25)を使う' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100034', table: '3-4', code: '240100034', symbol: 'Lvd',
    names: { ja: '溶岩ドーム' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '29', measured: true, notes: 'R2 §25 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100035', table: '3-4', code: '240100035', symbol: 'Fbr',
    names: { ja: '流動角礫岩' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '30', measured: true, notes: 'R2 §25 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240200013', table: '3-4', code: '240200013', symbol: 'Plv',
    names: { ja: '枕状溶岩' }, aliasOf: 'zc:240100010',
    provenance: { doc: 'R2', section: '31', measured: true, notes: 'R2 §25 と同一幾何' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240210035', table: '3-4', code: '240210035', symbol: 'Hyc',
    names: { ja: 'ハイアロクラスタイト' }, aliasOf: 'zc:221025300',
    provenance: { doc: 'R2', section: '32', measured: true, notes: 'R2 §11 と同一幾何・同一塗り' },
  },
];
