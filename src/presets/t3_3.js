/**
 * Presets for R1 §3 (table 3-3).
 * Owner: preset-1 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Names and codes come from the source table (index.csv txt_* columns); no coordinates are copied.
 * Lattices G1-G5 are the table of R1 §3 (intro); every preset cites its section (R1 = 025-026 pt report).
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219111000', table: '3-3', code: '219111000', symbol: 'Pe',
    names: { ja: 'かんらん岩' },
    provenance: { doc: 'R1', section: '3.1', measured: true, notes: '格子 G1 (px 22.49 / py 8.55 / 千鳥 0.5 / 3 行, §3 冒頭表)。記号: 横線 2 本 (長さ 8.37, 間隔 2.65)、縦線 1 本 (長さ 8.49, 中央配置) (§3.1)。' },
    layers: [
      {
        id: 'glyph', archetype: 'grid', params: { pitchX: 22.49, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'lineGlyph', hLines: 2, hLen: 8.37, hGap: 2.65, vLines: 1, vLen: 8.49 },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219111100', table: '3-3', code: '219111100', symbol: 'Du',
    names: { ja: 'ダナイト' },
    provenance: { doc: 'R1', section: '3.2', measured: true, notes: 'かんらん岩 (§3.1) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:219111000',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219112000', table: '3-3', code: '219112000', symbol: 'Pyx',
    names: { ja: '輝石岩' },
    provenance: { doc: 'R1', section: '3.3', measured: true, notes: '格子 G1 (§3 冒頭表)。記号: 横線 2 本 (長さ 8.37, 間隔 2.65)、縦線 2 本 (長さ 8.49, 間隔 2.85) (§3.3)。' },
    layers: [
      {
        id: 'glyph', archetype: 'grid', params: { pitchX: 22.49, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'lineGlyph', hLines: 2, hLen: 8.37, hGap: 2.65, vLines: 2, vLen: 8.49, vGap: 2.85 },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219113000', table: '3-3', code: '219113000', symbol: 'Hnb',
    names: { ja: '角閃石岩' },
    provenance: { doc: 'R1', section: '3.4', measured: true, notes: '格子 G1 (§3 冒頭表)。記号: 横線 1 本 (長さ 8.37)、縦線 2 本 (長さ 5.60, 間隔 2.85, 中央配置) (§3.4)。' },
    layers: [
      {
        id: 'glyph', archetype: 'grid', params: { pitchX: 22.49, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'lineGlyph', hLines: 1, hLen: 8.37, vLines: 2, vLen: 5.60, vGap: 2.85 },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219122200', table: '3-3', code: '219122200', symbol: 'Gr',
    names: { ja: '花崗岩' },
    provenance: { doc: 'R1', section: '3.5', measured: true, notes: '格子 G1 (§3 冒頭表)。記号: 横線 1 本 (長さ 8.37)、縦線 1 本 (長さ 8.49)、交点は中央 (§3.5)。' },
    layers: [
      {
        id: 'glyph', archetype: 'grid', params: { pitchX: 22.49, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'lineGlyph', hLines: 1, hLen: 8.37, vLines: 1, vLen: 8.49 },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219122500', table: '3-3', code: '219122500', symbol: 'Gd',
    names: { ja: '花崗閃緑岩' },
    provenance: { doc: 'R1', section: '3.6', measured: true, notes: '花崗岩 (§3.5) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:219122200',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219122600', table: '3-3', code: '219122600', symbol: 'Tn',
    names: { ja: 'トーナル岩' },
    provenance: { doc: 'R1', section: '3.7', measured: true, notes: '格子 G2 (px 16.86 / py 8.55 / 千鳥 0.5 / 3 行, §3 冒頭表)。記号: 十字を 45° 回した × (腕の全長 9.97 = 9.81〜10.14 の平均, 回転 45°, §3.7)。' },
    layers: [
      {
        id: 'glyph', archetype: 'grid', params: { pitchX: 16.86, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'lineGlyph', hLines: 1, hLen: 9.97, vLines: 1, vLen: 9.97, rotation: 45 },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219123500', table: '3-3', code: '219123500', symbol: 'Sy',
    names: { ja: '閃長岩' },
    provenance: { doc: 'R1', section: '3.8', measured: true, notes: '花崗岩 (§3.5) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:219122200',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219124400', table: '3-3', code: '219124400', symbol: 'Qd',
    names: { ja: '石英閃緑岩' },
    provenance: { doc: 'R1', section: '3.9', measured: true, notes: 'トーナル岩 (§3.7) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:219122600',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219124500', table: '3-3', code: '219124500', symbol: 'Di',
    names: { ja: '閃緑岩' },
    provenance: { doc: 'R1', section: '3.10', measured: true, notes: 'トーナル岩 (§3.7) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:219122600',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219125500', table: '3-3', code: '219125500', symbol: 'Gb',
    names: { ja: '斑れい岩' },
    provenance: { doc: 'R1', section: '3.11', measured: true, notes: '輝石岩 (§3.3) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:219112000',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:219125503', table: '3-3', code: '219125503', symbol: 'Dl',
    names: { ja: 'ドレライト' },
    provenance: { doc: 'R1', section: '3.12', measured: true, notes: '格子 G1 (§3 冒頭表)。記号: 横線 1 本 (長さ 8.37) の下に縦線 1 本 (長さ 5.60) が立つ ⊥ 形 (vAnchor bottom, §3.12)。' },
    layers: [
      {
        id: 'glyph', archetype: 'grid', params: { pitchX: 22.49, pitchY: 8.55, rowOffset: 0.5, rows: 3 },
        motif: { kind: 'lineGlyph', hLines: 1, hLen: 8.37, vLines: 1, vLen: 5.60, vAnchor: 'bottom' },
      },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221112000', table: '3-3', code: '221112000', symbol: 'Ry',
    names: { ja: '流紋岩' },
    provenance: { doc: 'R1', section: '3.13', measured: true, notes: '格子 G3 (px 16.86 / py 7.14 / 千鳥 0.5 / 4 行, §3 冒頭表)。記号: L 字 (縦 5.77, 横 5.70, 角は左下) (§3.13)。' },
    layers: [
      { id: 'glyph', archetype: 'grid', params: { pitchX: 16.86, pitchY: 7.14, rowOffset: 0.5, rows: 4 }, motif: { kind: 'L', vLen: 5.77, hLen: 5.70, corner: 'bottomLeft' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221121000', table: '3-3', code: '221121000', symbol: 'Da',
    names: { ja: 'デイサイト' },
    provenance: { doc: 'R1', section: '3.14', measured: true, notes: '格子 G2 (§3 冒頭表)。記号: L 字 (縦 5.66 = 5.54〜5.78 の平均, 横 5.70, 角は左下) (§3.14)。' },
    layers: [
      { id: 'glyph', archetype: 'grid', params: { pitchX: 16.86, pitchY: 8.55, rowOffset: 0.5, rows: 3 }, motif: { kind: 'L', vLen: 5.66, hLen: 5.70, corner: 'bottomLeft' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221135000', table: '3-3', code: '221135000', symbol: 'Trc',
    names: { ja: '粗面岩' },
    provenance: { doc: 'R1', section: '3.15', measured: true, notes: 'デイサイト (§3.14) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:221121000',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221141000', table: '3-3', code: '221141000', symbol: 'An',
    names: { ja: '安山岩' },
    provenance: { doc: 'R1', section: '3.16', measured: true, notes: '格子 G4 (px 19.63 / py 8.55 / 千鳥 0.5 / 3 行, §3 冒頭表)。記号: V 字 (幅 11.22, 深さ 5.60, 開口上) (§3.16)。' },
    layers: [
      { id: 'glyph', archetype: 'grid', params: { pitchX: 19.63, pitchY: 8.55, rowOffset: 0.5, rows: 3 }, motif: { kind: 'chevron', width: 11.22, depth: 5.60, open: 'up' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221151000', table: '3-3', code: '221151000', symbol: 'Ba',
    names: { ja: '玄武岩' },
    provenance: { doc: 'R1', section: '3.17', measured: true, notes: '格子 G5 (px 22.49 / py 7.06 / 千鳥 0.5 / 4 行, §3 冒頭表)。記号: V 字 (幅 8.36 = 8.31〜8.55 の平均, 深さ 4.33, 開口上) (§3.17)。' },
    layers: [
      { id: 'glyph', archetype: 'grid', params: { pitchX: 22.49, pitchY: 7.06, rowOffset: 0.5, rows: 4 }, motif: { kind: 'chevron', width: 8.36, depth: 4.33, open: 'up' } },
    ],
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221161000', table: '3-3', code: '221161000', symbol: 'Pho',
    names: { ja: 'フォノライト' },
    provenance: { doc: 'R1', section: '3.18', measured: true, notes: 'デイサイト (§3.14) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:221121000',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221174000', table: '3-3', code: '221174000', symbol: 'Bn',
    names: { ja: 'ベイサナイト' },
    provenance: { doc: 'R1', section: '3.19', measured: true, notes: '玄武岩 (§3.17) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:221151000',
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:221225300', table: '3-3', code: '221225300', symbol: 'Trb',
    names: { ja: '粗面玄武岩' },
    provenance: { doc: 'R1', section: '3.20', measured: true, notes: '玄武岩 (§3.17) と同一の模様 (同一 XObject)。' },
    aliasOf: 'zc:221151000',
  },
];
