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
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.58, height: 4.58, fill: 'ink' },
      params: { pitchX: 14.07, pitchY: 5.70, rowOffset: 0.5, rows: 4 },
    }],
    provenance: { doc: 'R2', section: '1', measured: true, notes: 'x ピッチ 14.00–14.13 の平均。行間 5.54–5.78 の平均(不等)' },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221010500', table: '3-4', code: '221010500', symbol: 'Vbl',
    names: { ja: '火山岩塊' },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 8.43, height: 6.86, fill: 'ink' },
      params: { pitchX: 19.70, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
    }],
    provenance: { doc: 'R2', section: '2', measured: true },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221016500', table: '3-4', code: '221016500', symbol: 'Vbn',
    names: { ja: '火山弾' },
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.58, height: 4.45, fill: 'ink' },
      params: { pitchX: 19.65, pitchY: 8.55, rowOffset: { pt: 10.21 }, rows: 3 },
    }],
    provenance: {
      doc: 'R2', section: '3', measured: true,
      notes: '高さ 4.33–4.58 の平均(中段 2 個は 4.33)。行間 8.07/9.03 の平均(不等)。千鳥 10.21 pt は 1/2 ピッチ 9.85 より 0.36 大きい',
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
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.52, height: 4.64, fill: 'ink' },
      params: { pitchX: 13.91, pitchY: 5.77, rowOffset: 0.5, rows: 4 },
    }],
    provenance: {
      doc: 'R2', section: '5', measured: true,
      notes: '原本枠 55.38×28.79 pt は既定枠へ正規化(設計書 §0.3、要確認)。x ピッチ 13.84–13.97 の平均',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221020300', table: '3-4', code: '221020300', symbol: 'Tf',
    names: { ja: '凝灰岩' },
    layers: [{
      id: 'chevrons', archetype: 'grid',
      motif: { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'down' },
      params: { pitchX: 14.07, pitchY: 7.06, rowOffset: 0.5, rows: 4 },
    }],
    provenance: {
      doc: 'R2', section: '9', measured: true,
      notes: '脚長 5.06–5.19 の平均、脚角 56.7–58.9 の平均、頂部の隙間 1.42。脚の開き 6.88 は算出値と一致',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221024300', table: '3-4', code: '221024300', symbol: 'Ptf',
    names: { ja: '軽石質凝灰岩' },
    layers: [
      {
        id: 'chevrons', archetype: 'grid',
        motif: { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'down' },
        params: { pitchX: 14.07, pitchY: 7.06, rowOffset: 0.5, rows: 4 },
      },
      {
        id: 'triangles', archetype: 'grid',
        motif: { kind: 'triangle', base: 5.58, height: 4.58, fill: 'paper' },
        params: { pitchX: 13.89, pitchY: 6.78, rowOffset: { pt: 7.24 }, rows: 4 },
      },
    ],
    provenance: {
      doc: 'R2', section: '10', measured: true,
      notes: '三角形行の行間 7.10 / 7.58 / 5.42 は不等のため平均 6.78 で格子化。行内の段差 0.49 は再現しない。千鳥 7.24 は行先頭 x 13.41 と 6.17 の差',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221025300', table: '3-4', code: '221025300', symbol: 'Stf',
    names: { ja: 'スコリア質凝灰岩' },
    layers: [
      {
        id: 'chevrons', archetype: 'grid',
        motif: { kind: 'splitChevron', legLength: 5.12, legAngle: 57.8, apexGap: 1.42, open: 'down' },
        params: { pitchX: 14.07, pitchY: 7.06, rowOffset: 0.5, rows: 4 },
      },
      {
        id: 'triangles', archetype: 'grid',
        motif: { kind: 'triangle', base: 5.58, height: 4.58, fill: 'ink' },
        params: { pitchX: 13.89, pitchY: 6.78, rowOffset: { pt: 7.24 }, rows: 4 },
      },
    ],
    provenance: {
      doc: 'R2', section: '11', measured: true,
      notes: '三角形行の行間 7.10 / 7.58 / 5.42 は不等のため平均 6.78 で格子化。行内の段差 0.49 は再現しない。千鳥 7.24 は行先頭 x 13.41 と 6.17 の差',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221030300', table: '3-4', code: '221030300', symbol: 'Wtf',
    names: { ja: '溶結凝灰岩' },
    layers: [{
      id: 'chevrons', archetype: 'grid',
      params: {
        pitchX: 7.03, pitchY: 8.55, rowOffset: 0, rows: 3, assign: 'col',
        cycle: [
          { kind: 'splitChevron', legLength: 5.0, legAngle: 33.7, apexGap: 1.32, open: 'left' },
          { kind: 'splitChevron', legLength: 5.0, legAngle: 33.7, apexGap: 1.32, open: 'right' },
        ],
      },
    }],
    provenance: {
      doc: 'R2', section: '15', measured: true,
      notes: '＞と＜を列ごとに交互。同じ向きの間隔 14.00–14.13 の半分を px に使用。脚角 31.8–35.6 の平均、隙間 1.20–1.44 の平均',
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
    layers: [{
      id: 'triangles', archetype: 'grid',
      motif: { kind: 'triangle', base: 5.58, height: 4.45, fill: 'none' },
      params: { pitchX: 19.65, pitchY: 8.55, rowOffset: { pt: 10.21 }, rows: 3 },
    }],
    provenance: {
      doc: 'R2', section: '19', measured: true,
      notes: '輪郭のみ(塗りなし)。寸法・配置は火山弾(R2 §3)と同じ',
    },
  },

  {
    schema: 'zc-pattern/1.0.0', id: 'zc:240100010', table: '3-4', code: '240100010', symbol: 'Plv',
    names: { ja: 'パホイホイ溶岩' },
    layers: [{
      id: 'chevrons', archetype: 'grid',
      motif: { kind: 'chevron', width: 8.43, depth: 4.34, open: 'down' },
      params: { pitchX: 22.49, pitchY: 7.06, rowOffset: 0.5, rows: 4 },
    }],
    provenance: {
      doc: 'R2', section: '25', measured: true,
      notes: 'x ピッチ 22.43–22.55 の平均、行間 6.98–7.23 の平均(不等)。溶岩 7 種と模様なし溶岩の共通模様',
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
