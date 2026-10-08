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
    provenance: { doc: 'R1', section: '2.1', measured: true, notes: '底辺 5.63 (5.46〜5.70 の平均)、高さ 4.57 (§2.1)。px 14.05 / py 5.70 / 千鳥 0.5 / 4 行 (§2.1)。白抜き (paper) (§2.1)。' },
    layers: [
      { id: 'talus', archetype: 'grid', params: { pitchX: 14.05, pitchY: 5.70, rowOffset: 0.5, rows: 4 }, motif: { kind: 'triangle', base: 5.63, height: 4.57, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:121000000', table: '3-2', code: '121000000', symbol: 'Afd',
    names: { ja: '扇状地堆積物' },
    provenance: {
      doc: 'R1', section: '2.2', measured: true,
      notes: '列ごとに点と白丸が交互、行ごとに位相反転 (§2.2)。白丸 22.12 と点 22.04 の同種間隔の平均 22.08 の半分を px 11.1 (設計表 §1.5 の値) (§2.2)。py: 白丸 7.95 と点 8.55 の行ピッチの平均 8.25 (設計表の 8.0 とは不一致のため報告値の平均を採った) (§2.2)。ro 0 (行の先頭 x が 0.6 pt 以内でそろう, §2.2)。点 1.3 (幅 1.36 と高さ 1.23 の平均)、白丸 7.0 (§2.2)。',
    },
    layers: [
      {
        id: 'mixed', archetype: 'grid',
        params: {
          pitchX: 11.1, pitchY: 8.25, rowOffset: 0, rows: 3, assign: 'col', phase: 0,
          cycle: [{ kind: 'dot', d: 1.3 }, { kind: 'circle', d: 7.0, fill: 'paper' }],
        },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:126100000', table: '3-2', code: '126100000', symbol: 'Rd',
    names: { ja: '河床堆積物' },
    provenance: {
      doc: 'R1', section: '2.3', measured: true,
      notes: '扇状地 (§2.2) と同じ部品で、列の位相が逆 (phase 1) (§2.3)。px 10.6 = (丸 21.29 と点 21.09 の平均) / 2 (§2.3)。py 8.25 は扇状地と同じく報告の行ピッチの平均 (§2.3, §2.2)。ro 0 (§2.2 と同様)。',
    },
    layers: [
      {
        id: 'mixed', archetype: 'grid',
        params: {
          pitchX: 10.6, pitchY: 8.25, rowOffset: 0, rows: 3, assign: 'col', phase: 1,
          cycle: [{ kind: 'dot', d: 1.3 }, { kind: 'circle', d: 7.0, fill: 'paper' }],
        },
      },
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
      notes: '点と水平短線が列ごとに交互、行ごとに位相反転 (§2.5)。px 11.05 = (点 21.92 と線 22.26 の平均) / 2 (§2.5)。py 8.5 = 点と線の行ピッチ (8.43 / 8.55) の平均付近 (§2.5)。線長 8.44 = 8.31〜8.55 の平均 (§2.5)。ro 0 (§2.5)。',
    },
    layers: [
      {
        id: 'mixed', archetype: 'grid',
        params: {
          pitchX: 11.05, pitchY: 8.5, rowOffset: 0, rows: 3, assign: 'col', phase: 0,
          cycle: [{ kind: 'dot', d: 1.3 }, { kind: 'hline', length: 8.44 }],
        },
      },
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
      notes: '氾濫原 (§2.5) と同じ部品で位相が逆 (phase 1) (§2.7)。px 10.55 = (点 21.09 と線 21.13 の平均) / 2 (§2.7)。py 8.5 は氾濫原と同じ (§2.7, §2.5)。線長 8.37 (8.31〜8.55 の平均, §2.7)。ro 0 (§2.7)。',
    },
    layers: [
      {
        id: 'mixed', archetype: 'grid',
        params: {
          pitchX: 10.55, pitchY: 8.5, rowOffset: 0, rows: 3, assign: 'col', phase: 1,
          cycle: [{ kind: 'dot', d: 1.3 }, { kind: 'hline', length: 8.37 }],
        },
      },
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
    provenance: { doc: 'R1', section: '2.9', measured: true, notes: '底辺 8.43 (8.31〜8.55 の平均)、高さ 4.17 (4.09〜4.33 の平均) (§2.9)。px 25.28 / py 7.10 / 千鳥 0.5 / 3 行 (§2.9)。白抜き (§2.9)。' },
    layers: [
      { id: 'debris', archetype: 'grid', params: { pitchX: 25.28, pitchY: 7.10, rowOffset: 0.5, rows: 3 }, motif: { kind: 'triangle', base: 8.43, height: 4.17, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100064000', table: '3-2', code: '100064000', symbol: 'Mf',
    names: { ja: '泥流堆積物' },
    provenance: {
      doc: 'R1', section: '2.10', measured: true,
      notes: '点の層 px 9.66 / py 4.30 / 千鳥 0.5 / 6 行 (§2.10)。三角形の層 px 19.70 (点の 2.04 倍) / py 8.55 (7.71 と 9.39 の平均) / 千鳥 0.5 / 3 行、底辺 4.27 高さ 3.37 白抜き (§2.10)。三角形は点の格子の空き位置に置く (avoid, §2.10, 設計表 §1.5)。',
    },
    layers: [
      { id: 'dots', archetype: 'grid', params: { pitchX: 9.66, pitchY: 4.30, rowOffset: 0.5, rows: 6 }, motif: { kind: 'dot', d: 1.3 } },
      { id: 'triangles', archetype: 'grid', params: { pitchX: 19.70, pitchY: 8.55, rowOffset: 0.5, rows: 3, avoid: 'dots' }, motif: { kind: 'triangle', base: 4.27, height: 3.37, fill: 'paper' } },
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
    provenance: { doc: 'R1', section: '2.12', measured: true, notes: '白丸の直径 7.0 (§2.12, 礫岩 §1.1 と同じ)。px 11.22 / py 9.27 / 千鳥なし (ro 0) / 3 行 (§2.12)。' },
    layers: [
      { id: 'terrace', archetype: 'grid', params: { pitchX: 11.22, pitchY: 9.27, rowOffset: 0, rows: 3 }, motif: { kind: 'circle', d: 7.0, fill: 'paper' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:100000003', table: '3-2', code: '100000003',
    names: { ja: '付加コンプレックス' },
    provenance: { doc: 'R1', section: '2.13', measured: true, notes: '模様なし、文字記号なし、備考なし (§2.13)。' },
    layers: [{ id: 'none', archetype: 'empty' }],
  },
];
